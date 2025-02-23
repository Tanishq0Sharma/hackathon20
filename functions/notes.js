const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Note = mongoose.model('Note', { 
    note: String,
    userId: String // Add user ID field
});

exports.handler = async (event) => {
    try {
        const { sub: userId } = await verifyToken(event);
        
        switch (event.httpMethod) {
            case 'GET':
                const notes = await Note.find({ userId }).lean();
                return { statusCode: 200, body: JSON.stringify(notes) };
                
            case 'POST':
                const { note } = JSON.parse(event.body);
                const newNote = new Note({ note, userId });
                // ... rest of POST handler ...
                
            case 'DELETE':
                const noteId = event.path.split('/').pop();
                const note = await Note.findOne({ _id: noteId, userId });
                if (!note) return { statusCode: 404, body: 'Not found' };
                // ... rest of DELETE handler ...
        }
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return { statusCode: 401, body: 'Unauthorized' };
        }
        // ... existing error handling ...
    }
};
