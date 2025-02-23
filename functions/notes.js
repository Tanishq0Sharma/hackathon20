const mongoose = require('mongoose');

// Connect to MongoDB
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const client = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    cachedDb = client;
    return client;
}

// Note Schema
const Note = mongoose.model('Note', {
    note: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Main Handler
exports.handler = async (event) => {
    await connectToDatabase();
    const userId = event.headers['x-user-id']; // Extract user ID from token

    try {
        switch (event.httpMethod) {
            case 'GET':
                const notes = await Note.find({ userId }).lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(notes),
                    headers: { 'Content-Type': 'application/json' },
                };

            case 'POST':
                const { note } = JSON.parse(event.body);
                const newNote = new Note({ note, userId });
                const savedNote = await newNote.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedNote),
                    headers: { 'Content-Type': 'application/json' },
                };

            case 'DELETE':
                const noteId = event.path.split('/').pop();
                const deletedNote = await Note.findByIdAndDelete(noteId);
                if (!deletedNote) {
                    return { statusCode: 404, body: 'Note not found' };
                }
                return { statusCode: 200, body: 'Note deleted' };

            default:
                return { statusCode: 405, body: 'Method Not Allowed' };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Server Error',
                error: error.message,
            }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};
