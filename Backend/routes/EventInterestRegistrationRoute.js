const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const requireAdmin = require('../middlewares/adminAuth');
const { EventInterestRegistrationValidationSchema } = require('../validations/EventInterestRegistrationValidation');
const controller = require('../controllers/EventInterestRegistrationController');

const router = express.Router();
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', registerLimiter, validate(EventInterestRegistrationValidationSchema), controller.registerInterest);
router.get('/stats', requireAdmin, controller.getRegistrationStats);
router.get('/', requireAdmin, controller.getRegistrations);
router.delete('/:id', requireAdmin, controller.deleteRegistration);

module.exports = router;
