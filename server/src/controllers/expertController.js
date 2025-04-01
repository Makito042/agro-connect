const User = require('../models/User');

const getExperts = async (req, res) => {
  try {
    const experts = await User.find({ user_type: 'expert' })
      .select('first_name last_name expertise_area years_of_experience qualification');
    
    if (!experts.length) {
      return res.status(404).json({ message: 'No experts found' });
    }

    res.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    res.status(500).json({ message: 'Error fetching experts' });
  }
};

module.exports = {
  getExperts
};