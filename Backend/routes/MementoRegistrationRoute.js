const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { MementoRegistrationValidationSchema } = require('../validations/MementoRegistrationValidation');
const controller = require('../controllers/MementoRegistrationController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Photo must be a JPEG, PNG, WebP, GIF, or AVIF image.'));
    }
  },
});

const handlePhotoUpload = (req, res, next) => {
  upload.single('photo')(req, res, (error) => {
    if (error) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        success: false,
        message: tooLarge ? 'Photo must be 5 MB or smaller.' : error.message,
      });
    }
    next();
  });
};

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', registerLimiter, handlePhotoUpload, validate(MementoRegistrationValidationSchema), controller.registerMemento);

module.exports = router;
