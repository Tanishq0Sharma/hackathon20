const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const entrySchema = new mongoose.Schema({
  combined: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Entry = mongoose.model('Entry', entrySchema);

function encodeEntry(userData, content, type) {
  return `user:'${userData.name}' authId:'${userData.sub}' type:'${type}' createdAt:'${new Date().toISOString()}' content:'${content}'`;
}

function decodeEntry(entryString) {
  const parts = entryString.match(/(\w+):'([^']*)'/g);
  return parts.reduce((acc, part) => {
    const [key, value] = part.split(":'").map(s => s.replace(/'/g, ''));
    acc[key] = value;
    return acc;
  }, {});
}

module.exports = { Entry, encodeEntry, decodeEntry };
