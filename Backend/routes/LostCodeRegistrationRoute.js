const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { LostCodeValidationSchema } = require('../validations/LostCodeValidation');
const controller = require('../controllers/LostCodeRegistrationController');

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many registrations created from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerLimiter, validate(LostCodeValidationSchema), controller.registerLostCodeTeam);
router.get('/', controller.getLostCodeRegistrations);
router.get('/csv', controller.getLostCodeCSV);

module.exports = router;

