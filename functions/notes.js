const { verifyToken } = require('./authUtils');
const { Note, encodeData, decodeData } = require('./database');

exports.handler = async (event) => {
  try {
    const user = await verifyToken(event);
    
    switch (event.httpMethod) {
      case 'GET':
        const notes = await Note.find();
        const userNotes = notes
          .map(note => ({
            _id: note._id,
            ...decodeData(note.compressed)
          }))
          .filter(note => note.authId === user.authId);
        
        return {
          statusCode: 200,
          body: JSON.stringify(userNotes),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'POST':
        const { note } = JSON.parse(event.body);
        const newNote = new Note({
          compressed: encodeData(user, note, 'note')
        });
        await newNote.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Note created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const noteId = event.path.split('/').pop();
        await Note.deleteOne({ _id: noteId });
        
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
