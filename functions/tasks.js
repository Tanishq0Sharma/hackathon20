const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Task = mongoose.model('Task', { 
    task: String,
    userId: String // Add user ID field
});

exports.handler = async (event) => {
    try {
        // Verify JWT and get user ID
        const { sub: userId } = await verifyToken(event);
        
        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find({ userId }).lean();
                return { statusCode: 200, body: JSON.stringify(tasks) };
                
            case 'POST':
                const { task } = JSON.parse(event.body);
                const newTask = new Task({ task, userId });
                // ... rest of POST handler ...
                
            case 'DELETE':
                const taskId = event.path.split('/').pop();
                const task = await Task.findOne({ _id: taskId, userId });
                if (!task) return { statusCode: 404, body: 'Not found' };
                // ... rest of DELETE handler ...
        }
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return { statusCode: 401, body: 'Unauthorized' };
        }
        // ... existing error handling ...
    }
};
