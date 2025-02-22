const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Note = mongoose.model('Note', { note: String });

exports.handler = async (event) => {
    try {
        switch (event.httpMethod) {
            case 'GET':
                const notes = await Note.find();
                return { statusCode: 200, body: JSON.stringify(notes) };
            
            case 'POST':
                const { note } = JSON.parse(event.body);
                const newNote = new Note({ note });
                await newNote.save();
                return { statusCode: 201, body: JSON.stringify(newNote) };
                
            default:
                return { statusCode: 405, body: 'Method Not Allowed' };
        }
    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
};
