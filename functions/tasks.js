const { verifyToken } = require('./authUtils');
const { Entry, encodeEntry, decodeEntry } = require('./database');

exports.handler = async (event) => {
  try {
    const { sub: auth0Id, name } = await verifyToken(event);

    switch (event.httpMethod) {
      case 'GET':
        const tasks = await Entry.find({ 
          combined: { $regex: `authId:'${auth0Id}' type:'task'` } 
        });
        
        const decoded = tasks.map(task => ({
          ...decodeEntry(task.combined),
          _id: task._id
        }));
        
        return {
          statusCode: 200,
          body: JSON.stringify(decoded),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'POST':
        const { task } = JSON.parse(event.body);
        if (!task?.trim()) {
          throw new Error('Task content required');
        }
        
        const newTask = new Entry({
          combined: encodeEntry({ sub: auth0Id, name }, task, 'task')
        });
        await newTask.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Task created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const taskId = event.path.split('/').pop();
        await Entry.deleteOne({ 
          _id: taskId,
          combined: { $regex: `authId:'${auth0Id}' type:'task'` } 
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Task deleted' }),
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
