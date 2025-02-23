const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const noteSchema = new mongoose.Schema({
  combined: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Note = mongoose.model('Note', noteSchema);

function encodeNote(auth0Id, content) {
  return `authId:'${auth0Id}' createdAt:'${new Date().toISOString()}' content:'${content}'`;
}

function decodeNote(combined) {
  const parts = combined.match(/(\w+):'([^']*)'/g);
  return parts.reduce((acc, part) => {
    const [key, value] = part.split(":'").map(s => s.replace(/'/g, ''));
    acc[key] = value;
    return acc;
  }, {});
}

exports.handler = async (event) => {
  try {
    const { sub: auth0Id } = await verifyToken(event);

    switch (event.httpMethod) {
      case 'GET':
        const notes = await Note.find({ 
          combined: { $regex: `authId:'${auth0Id}'` } 
        });
        
        const decoded = notes.map(note => ({
          ...decodeNote(note.combined),
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
        
        const newNote = new Note({
          combined: encodeNote(auth0Id, note)
        });
        await newNote.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Note created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const noteId = event.path.split('/').pop();
        await Note.deleteOne({ 
          _id: noteId,
          combined: { $regex: `authId:'${auth0Id}'` } 
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
