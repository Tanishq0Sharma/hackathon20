const { verifyToken } = require('./authUtils');
const { Task, encodeData, decodeData } = require('./database');

exports.handler = async (event) => {
  try {
    const user = await verifyToken(event);
    
    switch (event.httpMethod) {
      case 'GET':
        const tasks = await Task.find();
        const userTasks = tasks
          .map(task => ({
            _id: task._id,
            ...decodeData(task.compressed)
          }))
          .filter(task => task.authId === user.authId);
        
        return {
          statusCode: 200,
          body: JSON.stringify(userTasks),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'POST':
        const { task } = JSON.parse(event.body);
        const newTask = new Task({
          compressed: encodeData(user, task, 'task')
        });
        await newTask.save();
        
        return {
          statusCode: 201,
          body: JSON.stringify({ message: 'Task created' }),
          headers: { 'Content-Type': 'application/json' }
        };

      case 'DELETE':
        const taskId = event.path.split('/').pop();
        await Task.deleteOne({ _id: taskId });
        
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
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
