const Chat = require('../models/Chat');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

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

    await chat.populate('participants', 'first_name last_name email profile_picture user_type');
    res.json(chat);
  } catch (error) {
    console.error('Error creating or getting private chat:', error);
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
    await chat.populate('participants', 'first_name last_name email profile_picture user_type');
    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, mediaUrl, mediaType } = req.body;
    const senderId = req.user.userId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({ message: 'Not a participant in this chat' });
    }
    
    // Get the Socket.io instance from the request
    const io = req.app.get('io');

    // Check if users are friends (for private chats only)
    if (chat.chatType === 'private') {
      const recipientId = chat.participants.find(id => id && id.toString() !== senderId);
      
      if (recipientId) {
        try {
          const sender = await User.findById(senderId);
          if (!sender) {
            console.error('Sender not found, but continuing with message');
            // Don't return error, continue with message sending
          } else {
            // Populate friends if not already populated
            if (!sender.populated('friends')) {
              await sender.populate('friends');
            }
            
            // Safely check if users are friends
            const isFriend = sender.friends && Array.isArray(sender.friends) && 
                            sender.friends.some(friend => friend && friend._id && friend._id.toString() === recipientId.toString());
            
            // If not friends, create a message request
            if (!isFriend) {
              try {
                // Check if there's already a pending message request
                const recipient = await User.findById(recipientId);
                if (!recipient) {
                  console.error('Recipient not found, but continuing with message');
                  // Don't return error, continue with message sending
                } else {
                  // Ensure messageRequests array exists
                  if (!recipient.messageRequests) {
                    recipient.messageRequests = [];
                  }
                  
                  // Safely check for existing requests
                  const existingRequest = recipient.messageRequests && recipient.messageRequests.find(
                    req => req && req.chatId && req.chatId.toString() === chatId && 
                          req.from && req.from.toString() === senderId && 
                          req.status === 'pending'
                  );
                  
                  if (!existingRequest) {
                    // Create a new message request
                    recipient.messageRequests.push({
                      chatId,
                      from: senderId,
                      status: 'pending',
                      createdAt: new Date()
                    });
                    
                    await recipient.save();
                  }
                }
              } catch (recipientError) {
                console.error('Error processing recipient:', recipientError);
                // Continue with message sending even if recipient processing fails
              }
            }
          }
        } catch (friendCheckError) {
          console.error('Error checking friendship status:', friendCheckError);
          // Continue with message sending even if friend check fails
        }
      }
    }

    const message = {
      sender: senderId,
      content
    };

    // Add media information if provided
    if (mediaUrl) {
      message.mediaUrl = mediaUrl;
    }
    
    if (mediaType) {
      message.mediaType = mediaType;
    }

    chat.messages.push(message);
    chat.lastMessage = message;
    await chat.save();
    
    // Populate sender information for the real-time message
    const populatedChat = await Chat.findById(chatId)
      .populate('participants', 'first_name last_name email profile_picture')
      .populate({
        path: 'messages',
        options: { sort: { 'timestamp': -1 }, limit: 1 },
        populate: { path: 'sender', select: 'first_name last_name profile_picture' }
      });
    
    const latestMessage = populatedChat.messages[0];
    
    // Emit the message to all participants in the chat room
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(chatId).emit('receive_message', {
        chatId,
        message: latestMessage
      });
      
      // Also emit an event to update chat list for all participants
      chat.participants.forEach(participantId => {
        io.to(`user_${participantId}`).emit('update_chat_list');
      });
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user.userId;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'first_name last_name email profile_picture user_type')
      .populate('lastMessage')
      .sort({ 'lastMessage.timestamp': -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching user chats:', error);
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

// Get chat by ID
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'first_name last_name email profile_picture');
      
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.participants.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ message: 'Not a participant in this chat' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload media for chat
exports.uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create path if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/chat-media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const mediaUrl = `uploads/chat-media/${req.file.filename}`;
    
    res.status(200).json({ 
      mediaUrl,
      message: 'Media uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ message: 'Error uploading media', error: error.message });
  }
};