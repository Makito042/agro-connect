const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const messageRequestController = require('../controllers/messageRequestController');

// Get all message requests for the current user
router.get('/message-requests', auth, messageRequestController.getMessageRequests);

// Accept a message request
router.post('/message-requests/:requestId/accept', auth, messageRequestController.acceptMessageRequest);

// Reject a message request
router.post('/message-requests/:requestId/reject', auth, messageRequestController.rejectMessageRequest);

module.exports = router;