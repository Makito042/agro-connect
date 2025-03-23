const mongoose = require('mongoose');

const weatherAlertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['rain', 'drought', 'frost', 'storm'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  description: String,
  startDate: Date,
  endDate: Date
});

const cropPriceSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: String,
  market: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const farmingTipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['pest_control', 'irrigation', 'fertilization', 'harvesting', 'general'],
    required: true
  },
  expert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const dashboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  weatherAlerts: [weatherAlertSchema],
  cropPrices: [cropPriceSchema],
  farmingTips: [farmingTipSchema],
  preferences: {
    cropsOfInterest: [String],
    alertNotifications: {
      type: Boolean,
      default: true
    },
    priceAlerts: {
      type: Boolean,
      default: true
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

dashboardSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Dashboard', dashboardSchema);