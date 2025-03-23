const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  chatType: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  groupName: {
    type: String,
    required: function() { return this.chatType === 'group'; }
  },
  topic: {
    type: String,
    required: function() { return this.chatType === 'group'; }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: messageSchema
});

module.exports = mongoose.model('Chat', chatSchema);