const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGO_URI);
const dbName = "TaskSync"; 
const collectionName = "tasks";

exports.handler = async (event) => {
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        if (event.httpMethod === "POST") {
            const { task, user } = JSON.parse(event.body);
            await collection.insertOne({ task, user });
            return { statusCode: 200, body: JSON.stringify({ message: "Task added" }) };
        }

        if (event.httpMethod === "GET") {
            const tasks = await collection.find({}).toArray();
            return { statusCode: 200, body: JSON.stringify(tasks) };
        }

        if (event.httpMethod === "DELETE") {
            const { id } = JSON.parse(event.body);
            await collection.deleteOne({ _id: new ObjectId(id) });
            return { statusCode: 200, body: JSON.stringify({ message: "Task deleted" }) };
        }

        return { statusCode: 405, body: "Method Not Allowed" };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
