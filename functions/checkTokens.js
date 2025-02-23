// checkTokens.js
const mongoose = require('mongoose');

// Your MongoDB URI
const mongoURI = "your-mongodb-uri-here";

async function checkMongoDBConnection() {
    try {
        // Try to connect to MongoDB
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("MongoDB connection successful!");
        return { success: true };
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        return { success: false, message: error.message };
    }
}

checkMongoDBConnection()
    .then(result => {
        if (result.success) {
            console.log("Connection is active.");
        } else {
            console.log("Failed to connect to MongoDB.");
        }
    })
    .catch(err => {
        console.error("Unexpected error:", err);
    });
