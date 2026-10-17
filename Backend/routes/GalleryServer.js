const express = require('express');
const multer = require('multer');
const galleryController = require('../controllers/GalleryController');
const requireAdmin = require('../middlewares/adminAuth');

const router = express.Router();

// Multer in-memory storage for Cloudinary streaming
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/avif',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, SVG, and AVIF image files are allowed.');
      err.code = 'INVALID_FILE_TYPE';
      cb(err, false);
    }
  },
});

// Middleware to handle multer validation errors smoothly
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image size exceeds 5MB limit. Please choose an image smaller than 5MB.',
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || 'Error uploading file.',
      });
    }
    next();
  });
};

// GET /api/gallery (Public - retrieve gallery images)
router.get('/', galleryController.getGalleryImages);

// POST /api/gallery (Admin-only - upload image to Cloudinary and save to MongoDB)
router.post('/', requireAdmin, handleUpload, galleryController.addGalleryImage);

module.exports = router;