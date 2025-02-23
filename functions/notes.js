const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the Note schema with userId to associate notes with the creator
const Note = mongoose.model('Note', { 
    note: {
        type: String,
        required: true,
        trim: true
    },
    userId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auth0 JWT validation setup
const client = jwksClient({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

const getKey = (header, callback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            return callback(err);
        }
        callback(null, key.publicKey || key.rsaPublicKey);
    });
};

const verifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, getKey, {
            audience: process.env.AUTH0_API_IDENTIFIER,
            issuer: `https://${process.env.AUTH0_DOMAIN}/`
        }, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded);
            }
        });
    });
};

// Main handler function
exports.handler = async (event) => {
    try {
        const authHeader = event.headers['Authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);
        const userId = decoded.sub;  // Auth0 `sub` claim is the user ID

        switch (event.httpMethod) {
            case 'GET':
                // Fetch notes for the authenticated user
                const notes = await Note.find({ userId })
                    .sort({ createdAt: -1 }) // Sort by newest first
                    .lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(notes),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                // Create a new note for the authenticated user
                const { note } = JSON.parse(event.body);
                if (!note || !note.trim()) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ message: 'Note content is required' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }

                const newNote = new Note({ note, userId });
                const savedNote = await newNote.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedNote),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'DELETE':
                // Delete a note by ID, only if it belongs to the authenticated user
                const noteId = event.path.split('/').pop();
                if (!mongoose.Types.ObjectId.isValid(noteId)) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ message: 'Invalid note ID' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }

                const noteToDelete = await Note.findById(noteId);
                if (!noteToDelete) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ message: 'Note not found' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }

                if (noteToDelete.userId !== userId) {
                    return {
                        statusCode: 403,
                        body: JSON.stringify({ message: 'Forbidden: You do not have permission to delete this note' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }

                const deletedNote = await Note.findByIdAndDelete(noteId);
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Note deleted successfully' }),
                    headers: { 'Content-Type': 'application/json' }
                };

            default:
                // Handle unsupported HTTP methods
                return {
                    statusCode: 405,
                    body: JSON.stringify({ message: 'Method Not Allowed' }),
                    headers: { 'Content-Type': 'application/json' }
                };
        }
    } catch (error) {
        // Handle any unexpected errors
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Server Error',
                error: error.message
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
