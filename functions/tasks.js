const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Task Schema
const taskSchema = new mongoose.Schema({
    task: { type: String, required: true },
    user: { type: String, required: true },
    auth0Id: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', taskSchema);

exports.handler = async (event) => {
    try {
        const { sub: auth0Id, name } = await verifyToken(event);

        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find({ auth0Id }).lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(tasks),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                const { task } = JSON.parse(event.body);
                if (!task?.trim()) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Task content required' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                const newTask = new Task({ task, user: name, auth0Id });
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
                    auth0Id 
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
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
