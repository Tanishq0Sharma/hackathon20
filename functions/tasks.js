const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Task = mongoose.model('Task', { task: String });

exports.handler = async (event) => {
    try {
        switch (event.httpMethod) {
            case 'GET':
                const tasks = await Task.find();
                return { statusCode: 200, body: JSON.stringify(tasks) };
            
            case 'POST':
                const { task } = JSON.parse(event.body);
                const newTask = new Task({ task });
                await newTask.save();
                return { statusCode: 201, body: JSON.stringify(newTask) };
                
            default:
                return { statusCode: 405, body: 'Method Not Allowed' };
        }
    } catch (error) {
        return { statusCode: 500, body: error.toString() };
    }
};
