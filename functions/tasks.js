const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const taskSchema = new mongoose.Schema({
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

const Task = mongoose.model('Task', taskSchema);

function encodeTask(auth0Id, content) {
  return `authId:'${auth0Id}' createdAt:'${new Date().toISOString()}' content:'${content}'`;
}

function decodeTask(combined) {
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
        const tasks = await Task.find({ 
          combined: { $regex: `authId:'${auth0Id}'` } 
        });
        
        const decoded = tasks.map(task => ({
          ...decodeTask(task.combined),
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
        
        const newTask = new Task({
          combined: encodeTask(auth0Id, task)
        });
        await newTask.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Task created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const taskId = event.path.split('/').pop();
        await Task.deleteOne({ 
          _id: taskId,
          combined: { $regex: `authId:'${auth0Id}'` } 
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
