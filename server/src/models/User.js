const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  user_type: {
    type: String,
    enum: ['farmer', 'student', 'expert', 'organization'],
    required: true
  },
  // Additional validation middleware will handle role-specific validations
  first_name: String,
  last_name: String,
  phone: String,
  organization_name: String,
  organization_type: String,
  institution_name: String,
  field_of_study: String,
  expertise_area: String,
  years_of_experience: String,
  qualification: String,
  farm_size: String,
  farming_type: String,
  github_url: String,
  twitter_url: String,
  linkedin_url: String,
  bio: String,
  registration_number: String,
  profile_picture: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  messageRequests: [{
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('User', userSchema);