const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Note = mongoose.model('Note', { 
    note: String,
    userId: String
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
                await newNote.save(); // Save the new note to the database
                return { statusCode: 201, body: JSON.stringify(newNote) }; // Return response
                
            case 'DELETE':
                const noteId = event.path.split('/').pop();
                const noteToDelete = await Note.findOne({ _id: noteId, userId });
                if (!noteToDelete) return { statusCode: 404, body: 'Not found' };
                await noteToDelete.remove(); // Remove the note from the database
                return { statusCode: 200, body: 'Deleted successfully' }; // Return success message
        }
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return { statusCode: 401, body: 'Unauthorized' };
        }
        return { statusCode: 500, body: 'Internal server error' }; // Generic error handling
    }
};
