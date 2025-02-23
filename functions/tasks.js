const mongoose = require('mongoose');

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define the Task schema with auth0Id field
const Task = mongoose.model('Task', { 
    task: String,
    auth0Id: {
        type: String,
        required: true
    }
});

exports.handler = async (event) => {
    const auth0Id = event.headers['Authorization']; // Assuming Auth0 ID is passed in headers

    if (!auth0Id) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Auth0 ID is required' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }

    try {
        switch (event.httpMethod) {
            case 'GET':
                // Fetch tasks for the specific user
                const tasks = await Task.find({ auth0Id }).lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(tasks),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'POST':
                const { task } = JSON.parse(event.body);
                const newTask = new Task({ task, auth0Id });
                const savedTask = await newTask.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedTask),
                    headers: { 'Content-Type': 'application/json' }
                };

            case 'DELETE':
                const taskId = event.path.split('/').pop();
                const deletedTask = await Task.findOneAndDelete({ _id: taskId, auth0Id });
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
