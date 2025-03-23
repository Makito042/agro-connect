const Chat = require('../models/Chat');
const User = require('../models/User');

// Create a new private chat or get existing one
exports.createOrGetPrivateChat = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.userId;

    // Check if chat already exists
    let chat = await Chat.findOne({
      chatType: 'private',
      participants: { $all: [senderId, recipientId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [senderId, recipientId],
        chatType: 'private'
      });
      await chat.save();
    }

    await chat.populate('participants', 'username');
    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a group chat
exports.createGroupChat = async (req, res) => {
  try {
    const { groupName, topic, participantIds } = req.body;
    const creatorId = req.user.userId;

    // Ensure creator is included in participants
    if (!participantIds.includes(creatorId)) {
      participantIds.push(creatorId);
    }

    const chat = new Chat({
      participants: participantIds,
      chatType: 'group',
      groupName,
      topic
    });

    await chat.save();
    await chat.populate('participants', 'username');
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content } = req.body;
    const senderId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({ message: 'Not a participant in this chat' });
    }

    const message = {
      sender: senderId,
      content
    };

    chat.messages.push(message);
    chat.lastMessage = message;
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'username')
      .populate('lastMessage')
      .sort({ 'lastMessage.timestamp': -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get chat messages
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ message: 'Not a participant in this chat' });
    }

    res.json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};