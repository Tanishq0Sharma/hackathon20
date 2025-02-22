const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Task = mongoose.model('Task', {
    task: String,
    userId: String // Store user ID
});

exports.handler = async (event) => {
    try {
        // Verify JWT and get user ID
        const { sub: userId } = await verifyToken(event);

        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find({ userId }).lean();
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
                const task = await Task.findOne({ _id: taskId, userId });
                if (!task) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ message: 'Task not found' }),
                        headers: { 'Content-Type': 'application/json' }
                    };
                }
                await Task.findByIdAndDelete(taskId);
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Task deleted' }),
                    headers: { 'Content-Type': 'application/json' }
                };

            default:
                return {
                    statusCode: 405,
                    body: JSON.stringify({ message: 'Method Not Allowed' }),
                    headers: { 'Content-Type': 'application/json' }
                };
        }
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Server Error',
                error: error.message
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
