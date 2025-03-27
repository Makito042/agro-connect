const User = require('../models/User');
const Chat = require('../models/Chat');

// Get all message requests for the current user
exports.getMessageRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId)
      .populate('messageRequests.from', 'first_name last_name email profile_picture user_type');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Format the response to include only pending requests
    const pendingRequests = user.messageRequests.filter(request => request.status === 'pending');
    
    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('Error getting message requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Accept a message request
exports.acceptMessageRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the specific request
    const request = user.messageRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Message request not found' });
    }
    
    // Update request status
    request.status = 'accepted';
    await user.save();
    
    // Optionally add users to each other's friends list
    // This is a design decision - you might want to auto-add as friends or keep separate
    
    res.status(200).json({ message: 'Message request accepted' });
  } catch (error) {
    console.error('Error accepting message request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject a message request
exports.rejectMessageRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Find the specific request
    const request = user.messageRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Message request not found' });
    }
    
    // Update request status
    request.status = 'rejected';
    await user.save();
    
    res.status(200).json({ message: 'Message request rejected' });
  } catch (error) {
    console.error('Error rejecting message request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};