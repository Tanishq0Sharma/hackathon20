const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the Note schema
const Task = mongoose.model('Task', { 
    task: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

exports.handler = async (event) => {
    try {
        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find().lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(tasks),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                const { task } = JSON.parse(event.body);
                const newTask = new Task({ task });
                const savedTask = await newTask.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedTask),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'DELETE':
                const taskId = event.path.split('/').pop();
                const deletedTask = await Task.findByIdAndDelete(taskId);
                if (!deletedTask) {
                    return { statusCode: 404, body: 'Task not found' };
                }
                return { statusCode: 200, body: 'Task deleted' };

            default:
                return { statusCode: 405, body: 'Method Not Allowed' };
        }
    } catch (error) {
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
