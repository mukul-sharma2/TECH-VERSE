const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const multer = require('multer');
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

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for payment screenshot'), false);
    }
  },
});

const parseFormData = (req, res, next) => {
  if (req.body.members && typeof req.body.members === 'string') {
    try {
      req.body.members = JSON.parse(req.body.members);
    } catch (e) {
      console.error("Error parsing members JSON in Lost Code:", e);
    }
  }
  if (req.body.teamSize && typeof req.body.teamSize === 'string') {
    req.body.teamSize = parseInt(req.body.teamSize, 10);
  }
  if (req.body.qrViewed !== undefined) {
    req.body.qrViewed = req.body.qrViewed === 'true' || req.body.qrViewed === true;
  }
  next();
};

router.post(
  '/register',
  registerLimiter,
  upload.single('paymentScreenshot'),
  parseFormData,
  validate(LostCodeValidationSchema),
  controller.registerLostCodeTeam
);

router.get('/', controller.getLostCodeRegistrations);
router.get('/csv', controller.getLostCodeCSV);

module.exports = router;
