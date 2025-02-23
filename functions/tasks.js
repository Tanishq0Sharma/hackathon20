const mongoose = require('mongoose');

// Connect to MongoDB
let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const client = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    cachedDb = client;
    return client;
}

// Task Schema
const Task = mongoose.model('Task', {
    task: {
        type: String,
        required: true,
        trim: true,
    },
    userId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Main Handler
exports.handler = async (event) => {
    await connectToDatabase();
    const userId = event.headers['x-user-id']; // Extract user ID from token

    try {
        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find({ userId }).lean();
                return {
                    statusCode: 200,
                    body: JSON.stringify(tasks),
                    headers: { 'Content-Type': 'application/json' },
                };

            case 'POST':
                const { task } = JSON.parse(event.body);
                const newTask = new Task({ task, userId });
                const savedTask = await newTask.save();
                return {
                    statusCode: 201,
                    body: JSON.stringify(savedTask),
                    headers: { 'Content-Type': 'application/json' },
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
                error: error.message,
            }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};
