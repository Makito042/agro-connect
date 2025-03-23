const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      user_type,
      first_name,
      last_name,
      phone,
      organization_name,
      organization_type,
      institution_name,
      field_of_study,
      expertise_area,
      custom_expertise_area,
      years_of_experience,
      qualification,
      farm_size,
      farming_type,
      custom_farming_type,
      github_url,
      twitter_url,
      linkedin_url,
      bio,
      registration_number
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Map user_type to role
    const role = user_type.toLowerCase();

    // Create new user
    const user = new User({
      email,
      password: hashedPassword,
      role,
      first_name,
      last_name,
      phone,
      organization_name,
      organization_type,
      institution_name,
      field_of_study,
      expertise_area: custom_expertise_area || expertise_area,
      years_of_experience,
      qualification,
      farm_size,
      farming_type: custom_farming_type || farming_type,
      github_url,
      twitter_url,
      linkedin_url,
      bio,
      registration_number
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    // Ensure uploads directory exists
    const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      // Delete the uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    // If user already has a profile picture, delete the old one
    if (user.profile_picture) {
      const oldPicturePath = path.join(__dirname, '../../uploads/profile-pictures', user.profile_picture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update user's profile picture path in database
    const filename = req.file.filename;
    user.profile_picture = filename;
    await user.save();

    // Return the complete URL for the profile picture
    const profilePicUrl = `/uploads/profile-pictures/${filename}`;
    res.json({
      message: 'Profile picture uploaded successfully',
      data: {
        profile_picture: filename,
        profile_picture_url: profilePicUrl
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    if (req.file) {
      // Delete the uploaded file if there was an error
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};