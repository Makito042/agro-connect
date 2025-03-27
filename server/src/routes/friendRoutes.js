const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const auth = require('../middleware/auth');

// Get all friends
router.get('/friends', auth, friendController.getFriends);

// Get friend requests
router.get('/friend-requests', auth, friendController.getFriendRequests);

// Send friend request
router.post('/friend-request', auth, friendController.sendFriendRequest);

// Accept friend request
router.put('/friend-request/:requestId/accept', auth, friendController.acceptFriendRequest);

// Reject friend request
router.put('/friend-request/:requestId/reject', auth, friendController.rejectFriendRequest);

// Remove friend
router.delete('/friends/:friendId', auth, friendController.removeFriend);

// Search users
router.get('/search', auth, friendController.searchUsers);

// Get user profile by ID
router.get('/:id/profile', auth, friendController.getUserProfile);

module.exports = router;