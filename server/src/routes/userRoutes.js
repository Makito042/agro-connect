const express = require('express');
const router = express.Router();
const { register, login, uploadProfilePicture } = require('../controllers/userController');
const { getExperts } = require('../controllers/expertController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

// Upload profile picture
router.post('/profile-picture', auth, upload.single('profile_picture'), uploadProfilePicture);

// Get all experts
router.get('/experts', auth, getExperts);

module.exports = router;