const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Note = mongoose.model('Note', new mongoose.Schema({
    note: String,
    userId: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
}));

exports.handler = async (event) => {
    try {
        const { sub: userId } = await verifyToken(event);

        switch (event.httpMethod) {
            case 'GET':
                const notes = await Note.find({ userId })
                    .sort({ createdAt: -1 })
                    .lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(notes),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                const { note } = JSON.parse(event.body);
                if (!note?.trim()) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Note content required' }),
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
                const noteId = event.path.split('/').pop();
                const note = await Note.findOneAndDelete({ 
                    _id: noteId, 
                    userId 
                });
                if (!note) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ error: 'Note not found' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Note deleted' }),
                    headers: { 'Content-Type': 'application/json' }
                };

            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ error: 'Method not allowed' }),
                    headers: { 'Content-Type': 'application/json' }
                };
        }
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('Unauthorized')) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
