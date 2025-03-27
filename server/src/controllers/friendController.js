const User = require('../models/User');

// Get all friends for the current user
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId)
      .populate('friends', 'first_name last_name email profile_picture user_type');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user.friends);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all friend requests for the current user
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get incoming friend requests (where current user is the recipient)
    const incomingRequests = await User.find({
      'friendRequests': {
        $elemMatch: {
          'to': userId,
          'status': 'pending'
        }
      }
    }).populate('friendRequests.from', 'first_name last_name email profile_picture user_type');
    
    // Get outgoing friend requests (where current user is the sender)
    const outgoingRequests = await User.find({
      'friendRequests': {
        $elemMatch: {
          'from': userId,
          'status': 'pending'
        }
      }
    }).populate('friendRequests.to', 'first_name last_name email profile_picture user_type');
    
    // Format the response
    const formattedIncoming = [];
    const formattedOutgoing = [];
    
    incomingRequests.forEach(user => {
      user.friendRequests.forEach(request => {
        if (request.to.toString() === userId && request.status === 'pending') {
          formattedIncoming.push({
            requestId: request._id,
            from: request.from,
            createdAt: request.createdAt
          });
        }
      });
    });
    
    outgoingRequests.forEach(user => {
      user.friendRequests.forEach(request => {
        if (request.from.toString() === userId && request.status === 'pending') {
          formattedOutgoing.push({
            requestId: request._id,
            to: request.to,
            createdAt: request.createdAt
          });
        }
      });
    });
    
    res.status(200).json({
      incoming: formattedIncoming,
      outgoing: formattedOutgoing
    });
  } catch (error) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send a friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.userId;
    
    // Check if users exist
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);
    
    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if users are already friends
    if (sender.friends.includes(recipientId)) {
      return res.status(400).json({ message: 'Users are already friends' });
    }
    
    // Check if a request already exists
    const existingRequest = sender.friendRequests.find(
      request => 
        (request.from.toString() === senderId && request.to.toString() === recipientId) ||
        (request.from.toString() === recipientId && request.to.toString() === senderId)
    );
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Friend request already exists' });
      } else if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'Users are already friends' });
      }
    }
    
    // Create a new friend request
    const newRequest = {
      from: senderId,
      to: recipientId,
      status: 'pending',
      createdAt: new Date()
    };
    
    sender.friendRequests.push(newRequest);
    await sender.save();
    
    // Get Socket.io instance to send real-time notification
    const io = req.app.get('io');
    if (io) {
      // Send notification to the recipient
      io.to(`user_${recipientId}`).emit('new_friend_request', {
        requestId: newRequest._id,
        from: {
          _id: sender._id,
          first_name: sender.first_name,
          last_name: sender.last_name,
          profile_picture: sender.profile_picture,
          user_type: sender.user_type
        },
        createdAt: newRequest.createdAt
      });
    }
    
    res.status(201).json({ message: 'Friend request sent successfully', request: newRequest });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Accept a friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    
    // Find the user with the friend request
    const user = await User.findOne({
      'friendRequests._id': requestId
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Find the specific request
    const request = user.friendRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Verify that the current user is the recipient of the request
    if (request.to.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }
    
    // Update request status
    request.status = 'accepted';
    await user.save();
    
    // Add users to each other's friends list
    await User.findByIdAndUpdate(
      request.from,
      { $addToSet: { friends: request.to } }
    );
    
    await User.findByIdAndUpdate(
      request.to,
      { $addToSet: { friends: request.from } }
    );
    
    // Get Socket.io instance to send real-time notification
    const io = req.app.get('io');
    if (io) {
      // Send notification to the sender of the friend request
      io.to(`user_${request.from}`).emit('friend_request_accepted', {
        requestId: request._id,
        userId: request.to,
        message: 'Your friend request has been accepted'
      });
    }
    
    res.status(200).json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject a friend request
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.userId;
    
    // Find the user with the friend request
    const user = await User.findOne({
      'friendRequests._id': requestId
    });
    
    if (!user) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Find the specific request
    const request = user.friendRequests.id(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Friend request not found' });
    }
    
    // Verify that the current user is the recipient of the request
    if (request.to.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }
    
    // Update request status
    request.status = 'rejected';
    await user.save();
    
    res.status(200).json({ message: 'Friend request rejected' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove a friend
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;
    
    // Remove friend from user's friends list
    await User.findByIdAndUpdate(
      userId,
      { $pull: { friends: friendId } }
    );
    
    // Remove user from friend's friends list
    await User.findByIdAndUpdate(
      friendId,
      { $pull: { friends: userId } }
    );
    
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search for users to add as friends
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.userId;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Search for users by name or email
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        {
          $or: [
            { first_name: { $regex: query, $options: 'i' } },
            { last_name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('_id first_name last_name email profile_picture user_type');
    
    // Get current user to check friend status
    const currentUser = await User.findById(userId).populate('friends');
    
    // Add friend status to each user
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      
      // Check if user is already a friend
      if (currentUser.friends.some(friend => friend._id.toString() === user._id.toString())) {
        userObj.friendStatus = 'friend';
      } else {
        // Check if there's a pending request
        const outgoingRequest = currentUser.friendRequests.find(
          req => req.to.toString() === user._id.toString() && req.status === 'pending'
        );
        
        const incomingRequest = currentUser.friendRequests.find(
          req => req.from.toString() === user._id.toString() && req.status === 'pending'
        );
        
        if (outgoingRequest) {
          userObj.friendStatus = 'request-sent';
        } else if (incomingRequest) {
          userObj.friendStatus = 'request-received';
        } else {
          userObj.friendStatus = 'none';
        }
      }
      
      return userObj;
    });
    
    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the user by ID
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};