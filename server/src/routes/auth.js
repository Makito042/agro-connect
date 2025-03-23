const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { register, login } = require('../controllers/authController');
const { uploadProfilePicture } = require('../controllers/userController');
const upload = require('../middleware/upload');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Register route
router.post('/register', register);

// Login route
router.post('/login', login);

// Upload profile picture
router.post('/profile-picture', auth, upload.single('profile_picture'), uploadProfilePicture);

// Get profile picture
router.get('/profile-picture/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../../uploads/profile-pictures', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving profile picture:', error);
    res.status(500).json({ message: 'Error serving profile picture' });
  }
});

module.exports = router;