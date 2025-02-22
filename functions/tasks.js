const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true 
});

const Task = mongoose.model('Task', new mongoose.Schema({
  task: String,
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}));

exports.handler = async (event) => {
  try {
    // Get user ID from verified token
    const { sub: userId } = await verifyToken(event);

    switch (event.httpMethod) {
      case 'GET':
        const tasks = await Task.find({ userId })
          .sort({ createdAt: -1 })
          .lean();
        return {
          statusCode: 200,
          body: JSON.stringify(tasks),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'POST':
        const { task } = JSON.parse(event.body);
        const newTask = new Task({ task, userId });
        const savedTask = await newTask.save();
        return {
          statusCode: 201,
          body: JSON.stringify(savedTask),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const taskId = event.path.split('/').pop();
        const task = await Task.findOneAndDelete({ 
          _id: taskId, 
          userId // Ensure user owns the task
        });
        
        if (!task) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Task not found' }),
            headers: { 'Content-Type': 'application/json' }
          };
        }
        
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
    if (error.message.includes('Invalid token')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
