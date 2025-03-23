const Dashboard = require('../models/Dashboard');
const User = require('../models/User');

// Create or update dashboard
exports.createOrUpdateDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { location, preferences } = req.body;

    let dashboard = await Dashboard.findOne({ user: userId });

    if (!dashboard) {
      dashboard = new Dashboard({
        user: userId,
        location,
        preferences
      });
    } else {
      dashboard.location = location;
      dashboard.preferences = { ...dashboard.preferences, ...preferences };
    }

    await dashboard.save();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's dashboard
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const dashboard = await Dashboard.findOne({ user: userId })
      .populate('farmingTips.expert', 'username');

    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add weather alert
exports.addWeatherAlert = async (req, res) => {
  try {
    const { type, severity, description, startDate, endDate } = req.body;
    const userId = req.user.userId;

    const dashboard = await Dashboard.findOne({ user: userId });
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    dashboard.weatherAlerts.push({
      type,
      severity,
      description,
      startDate,
      endDate
    });

    await dashboard.save();
    res.status(201).json(dashboard.weatherAlerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update crop prices
exports.updateCropPrices = async (req, res) => {
  try {
    const { cropPrices } = req.body;
    const userId = req.user.userId;

    const dashboard = await Dashboard.findOne({ user: userId });
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    dashboard.cropPrices = cropPrices;
    dashboard.lastUpdated = Date.now();

    await dashboard.save();
    res.json(dashboard.cropPrices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add farming tip
exports.addFarmingTip = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const expertId = req.user.userId;

    // Verify user is an expert
    const user = await User.findById(expertId);
    if (user.role !== 'expert') {
      return res.status(403).json({ message: 'Only experts can add farming tips' });
    }

    const tip = {
      title,
      content,
      category,
      expert: expertId
    };

    // Add tip to all relevant dashboards based on preferences
    await Dashboard.updateMany(
      { 'preferences.cropsOfInterest': category },
      { $push: { farmingTips: tip } }
    );

    res.status(201).json(tip);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};