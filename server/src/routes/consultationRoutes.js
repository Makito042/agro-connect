const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const consultationController = require('../controllers/consultationController');

// Expert availability routes
router.get('/availability/:expertId', consultationController.getExpertAvailability);
router.post('/availability', auth, consultationController.setAvailability);

// Consultation booking routes
router.post('/book', auth, consultationController.bookConsultation);
router.get('/consultations', auth, consultationController.getUserConsultations);
router.patch('/consultations/:consultationId/status', auth, consultationController.updateConsultationStatus);

module.exports = router;