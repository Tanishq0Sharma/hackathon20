const { verifyToken } = require('./authUtils');
const { Entry, encodeEntry, decodeEntry } = require('./database');

exports.handler = async (event) => {
  try {
    const { sub: auth0Id, name } = await verifyToken(event);

    switch (event.httpMethod) {
      case 'GET':
        const entries = await Entry.find({ 
          combined: { $regex: `authId:'${auth0Id}'` } 
        });
        
        const decoded = entries.map(entry => ({
          ...decodeEntry(entry.combined),
          _id: entry._id
        }));
        
        return {
          statusCode: 200,
          body: JSON.stringify(decoded),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'POST':
        const { content, type } = JSON.parse(event.body);
        if (!content?.trim() || !['task', 'note'].includes(type)) {
          throw new Error('Invalid request');
        }
        
        const newEntry = new Entry({
          combined: encodeEntry({ sub: auth0Id, name }, content, type)
        });
        await newEntry.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Entry created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const entryId = event.path.split('/').pop();
        await Entry.deleteOne({ 
          _id: entryId,
          combined: { $regex: `authId:'${auth0Id}'` } 
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Entry deleted' }),
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
