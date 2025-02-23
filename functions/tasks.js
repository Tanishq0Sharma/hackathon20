const mongoose = require('mongoose');
const { verifyToken } = require('./authUtils');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Task = mongoose.model('Task', { 
    task: String,
    userId: String
});

exports.handler = async (event) => {
    try {
        const { sub: userId } = await verifyToken(event);
        
        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find({ userId }).lean();
                return { statusCode: 200, body: JSON.stringify(tasks) };
                
            case 'POST':
                const { task } = JSON.parse(event.body);
                const newTask = new Task({ task, userId });
                await newTask.save(); // Save the new task
                return { statusCode: 201, body: JSON.stringify(newTask) }; // Return the created task
                
            case 'DELETE':
                const taskId = event.path.split('/').pop();
                const taskToDelete = await Task.findOne({ _id: taskId, userId });
                if (!taskToDelete) return { statusCode: 404, body: 'Not found' };
                await taskToDelete.remove(); // Delete the task
                return { statusCode: 200, body: 'Deleted successfully' }; // Return success message
        }
    } catch (error) {
        if (error.name === 'UnauthorizedError') {
            return { statusCode: 401, body: 'Unauthorized' };
        }
        return { statusCode: 500, body: 'Internal server error' }; // Handle general errors
    }
};
