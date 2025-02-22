const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Note = mongoose.model('Note', {
    note: String,
    userId: String // Store user ID
});

exports.handler = async (event) => {
    try {
        // Verify JWT and get user ID
        const { sub: userId } = await verifyToken(event);

        switch (event.httpMethod) {
            case 'GET':
                const notes = await Note.find({ userId }).lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(notes),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                const { note } = JSON.parse(event.body);
                const newNote = new Note({ note, userId });
                const savedNote = await newNote.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedNote),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'DELETE':
                const noteId = event.path.split('/').pop();
                const note = await Note.findOne({ _id: noteId, userId });
                if (!note) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ message: 'Note not found' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                await Note.findByIdAndDelete(noteId);
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Note deleted' }),
                    headers: { 'Content-Type': 'application/json' }
                };

            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ message: 'Method Not Allowed' }),
                    headers: { 'Content-Type': 'application/json' }
                };
        }
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
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
