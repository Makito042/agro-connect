const { Availability, Consultation } = require('../models/Consultation');
const User = require('../models/User');
const Chat = require('../models/Chat');

// Get expert's availability
exports.getExpertAvailability = async (req, res) => {
  try {
    const expertId = req.params.expertId;
    const availability = await Availability.find({ expert: expertId });
    res.json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Set expert's availability
exports.setAvailability = async (req, res) => {
  try {
    const expertId = req.user.userId;
    const { availabilitySlots } = req.body;

    // Verify user is an expert
    const user = await User.findById(expertId);
    if (user.user_type !== 'expert') {
      return res.status(403).json({ message: 'Only experts can set availability' });
    }

    // Delete existing availability
    await Availability.deleteMany({ expert: expertId });

    // Create new availability slots
    const availability = await Availability.insertMany(
      availabilitySlots.map(slot => ({
        ...slot,
        expert: expertId
      }))
    );

    res.status(201).json(availability);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Book a consultation
exports.bookConsultation = async (req, res) => {
  try {
    const farmerId = req.user.userId;
    const { expertId, startTime, endTime, topic, description } = req.body;

    // Create a new chat for the consultation
    const chat = new Chat({
      participants: [farmerId, expertId],
      type: 'consultation'
    });
    await chat.save();

    const consultation = new Consultation({
      expert: expertId,
      farmer: farmerId,
      startTime,
      endTime,
      topic,
      description,
      chatId: chat._id
    });

    await consultation.save();

    // Get Socket.io instance to send real-time notification
    const io = req.app.get('io');
    
    // Send notification to the expert
    const farmer = await User.findById(farmerId);
    io.to(`user_${expertId}`).emit('consultation_request', {
      consultationId: consultation._id,
      farmer: {
        id: farmer._id,
        name: `${farmer.first_name} ${farmer.last_name}`,
        type: farmer.user_type
      },
      topic,
      startTime,
      endTime
    });

    res.status(201).json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's consultations
exports.getUserConsultations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    let consultations;
    if (user.user_type === 'expert') {
      consultations = await Consultation.find({ expert: userId })
        .populate('farmer', 'first_name last_name')
        .sort({ startTime: -1 });
    } else {
      consultations = await Consultation.find({ farmer: userId })
        .populate('expert', 'first_name last_name expertise_area')
        .sort({ startTime: -1 });
    }

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update consultation status
exports.updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status } = req.body;
    const userId = req.user.userId;

    const consultation = await Consultation.findById(consultationId)
      .populate('expert', 'first_name last_name')
      .populate('farmer', 'first_name last_name');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user is the expert for this consultation
    if (consultation.expert._id.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    consultation.status = status;
    await consultation.save();

    // Get Socket.io instance to send real-time notification
    const io = req.app.get('io');
    
    // Send notification to the farmer
    io.to(`user_${consultation.farmer._id}`).emit('consultation_status_update', {
      consultationId: consultation._id,
      expert: {
        id: consultation.expert._id,
        name: `${consultation.expert.first_name} ${consultation.expert.last_name}`
      },
      status,
      topic: consultation.topic,
      startTime: consultation.startTime,
      endTime: consultation.endTime
    });

    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};