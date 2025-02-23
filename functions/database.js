const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Encoding function (compressor)
function encodeData(user, content, type) {
  const timestamp = new Date().toISOString();
  return `user:'${user.name}' authId:'${user.authId}' time:'${timestamp}' ${type}:'${content.replace(/'/g, "\\'")}'`;
}

// Decoding function (decompressor)
function decodeData(encodedString) {
  const pattern = /(\w+):'((?:\\'|[^'])*)'/g;
  const data = {};
  let match;
  
  while ((match = pattern.exec(encodedString)) !== null) {
    data[match[1]] = match[2].replace(/\\'/g, "'");
  }
  
  return data;
}

// Task Schema
const taskSchema = new mongoose.Schema({
  compressed: String
});
const Task = mongoose.model('Task', taskSchema);

// Note Schema
const noteSchema = new mongoose.Schema({
  compressed: String
});
const Note = mongoose.model('Note', noteSchema);

module.exports = { Task, Note, encodeData, decodeData };
