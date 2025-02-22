const mongoose = require('mongoose');

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

// Define Note schema
const noteSchema = new mongoose.Schema({
    note: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create Note model
const Note = mongoose.model('Note', noteSchema);

// Main handler function
exports.handler = async (event) => {
    try {
        // Handle different HTTP methods
        switch (event.httpMethod) {
            case 'GET':
                return handleGetRequest();
                
            case 'POST':
                return handlePostRequest(event);
                
            case 'DELETE':
                return handleDeleteRequest(event);
                
            default:
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

// GET - Fetch all notes
async function handleGetRequest() {
    try {
        const notes = await Note.find()
            .sort({ createdAt: -1 }) // Sort by newest first
            .lean();
            
        return {
            statusCode: 200,
            body: JSON.stringify(notes),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw new Error('Failed to fetch notes');
    }
}

// POST - Create new note
async function handlePostRequest(event) {
    try {
        const { note } = JSON.parse(event.body);
        
        if (!note || !note.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Note content is required' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const newNote = new Note({ note });
        const savedNote = await newNote.save();
        
        return {
            statusCode: 201,
            body: JSON.stringify(savedNote),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw new Error('Failed to create note');
    }
}

// DELETE - Remove a note
async function handleDeleteRequest(event) {
    try {
        const noteId = event.path.split('/').pop();
        
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid note ID' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const deletedNote = await Note.findByIdAndDelete(noteId);
        
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
    } catch (error) {
        throw new Error('Failed to delete note');
    }
}
