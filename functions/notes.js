const { verifyToken } = require('./authUtils');
const { Entry, encodeEntry, decodeEntry } = require('./database');

exports.handler = async (event) => {
  try {
    const { sub: auth0Id, name } = await verifyToken(event);

    switch (event.httpMethod) {
      case 'GET':
        const notes = await Entry.find({ 
          combined: { $regex: `authId:'${auth0Id}' type:'note'` } 
        });
        
        const decoded = notes.map(note => ({
          ...decodeEntry(note.combined),
          _id: note._id
        }));
        
        return {
          statusCode: 200,
          body: JSON.stringify(decoded),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'POST':
        const { note } = JSON.parse(event.body);
        if (!note?.trim()) {
          throw new Error('Note content required');
        }
        
        const newNote = new Entry({
          combined: encodeEntry({ sub: auth0Id, name }, note, 'note')
        });
        await newNote.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Note created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const noteId = event.path.split('/').pop();
        await Entry.deleteOne({ 
          _id: noteId,
          combined: { $regex: `authId:'${auth0Id}' type:'note'` } 
        });
        
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
      statusCode: error.message.includes('Invalid token') ? 401 : 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
