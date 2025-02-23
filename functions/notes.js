const mongoose = require('mongoose');

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the Note schema with auth0Id field
const Note = mongoose.model('Note', { 
    note: {
        type: String,
        required: true,
        trim: true
    },
    auth0Id: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Main handler function
exports.handler = async (event) => {
    const auth0Id = event.headers['Authorization']; // Assuming Auth0 ID is passed in headers

    if (!auth0Id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Auth0 ID is required' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        switch (event.httpMethod) {
            case 'GET':
                // Fetch notes for the specific user, sorted by creation date (newest first)
                const notes = await Note.find({ auth0Id })
                    .sort({ createdAt: -1 }) // Sort by newest first
                    .lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(notes),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                // Create a new note
                const { note } = JSON.parse(event.body);
                if (!note || !note.trim()) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ message: 'Note content is required' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                const newNote = new Note({ note, auth0Id });
                const savedNote = await newNote.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedNote),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'DELETE':
                // Delete a note by ID
                const noteId = event.path.split('/').pop();
                if (!mongoose.Types.ObjectId.isValid(noteId)) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ message: 'Invalid note ID' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                const deletedNote = await Note.findOneAndDelete({ _id: noteId, auth0Id });
                if (!deletedNote) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ message: 'Note not found' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
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
