const mongoose = require('mongoose');
const Gallery = require('../models/Gallery');
const cloudinary = require('../config/cloudinary');

/**
 * Upload an image buffer to Cloudinary using upload_stream.
 * Resolves the full Cloudinary result (secure_url, public_id, etc.).
 */
const uploadToCloudinary = (buffer, folder = 'techverse_gallery') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * GET /api/gallery
 * Public endpoint. Optional query params: category, page, limit
 */
const getGalleryImages = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = String(req.query.category); // prevents NoSQL injection
    }

    const images = await Gallery.find(filter)
      .sort({ _id: -1 })
      .lean();

    res.json(images);
  } catch (err) {
    console.error('Error fetching gallery images:', err);
    res.status(500).json({ error: 'Failed to fetch gallery images.' });
  }
};

/**
 * POST /api/gallery
 * Admin-protected. Uploads image to Cloudinary and saves metadata to MongoDB.
 */
const addGalleryImage = async (req, res) => {
  const { name, category, description } = req.body || {};
  const cleanCategory = category ? String(category).trim() : '';

  // 1. Validate category
  if (!cleanCategory) {
    return res.status(400).json({
      success: false,
      message: 'Category is required.',
    });
  }

  // 2. Validate file presence
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Image file is required.',
    });
  }

  // 3. Upload to Cloudinary
  const folderCategory = cleanCategory.replace(/[^\w-]+/g, '_') || 'uncategorized';
  let uploaded;
  try {
    uploaded = await uploadToCloudinary(
      req.file.buffer,
      `techverse_gallery/${folderCategory}`
    );
  } catch (uploadError) {
    console.error('Cloudinary upload error:', uploadError);
    return res.status(502).json({
      success: false,
      message: 'Failed to upload image to Cloudinary. Please try again later.',
    });
  }

  // 4. Save metadata to MongoDB
  try {
    const savedItem = await new Gallery({
      name: name ? String(name).trim() : '',
      img_url: uploaded.secure_url,
      public_id: uploaded.public_id,
      description: description ? String(description).trim() : '',
      category: cleanCategory,
    }).save();

    return res.status(201).json({
      success: true,
      message: 'Gallery image uploaded successfully.',
      item: savedItem,
    });
  } catch (err) {
    console.error('Error saving gallery image:', err);
    // Roll back the orphaned Cloudinary upload
    cloudinary.uploader.destroy(uploaded.public_id).catch((e) =>
      console.error('Failed to roll back Cloudinary upload:', e)
    );
    return res.status(500).json({
      success: false,
      message: 'Internal server error while saving gallery image.',
    });
  }
};

/**
 * DELETE /api/gallery/:id
 * Admin-protected. Removes the DB record and the Cloudinary asset.
 */
const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid image ID.' });
    }

    const item = await Gallery.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Image not found.' });
    }

    // Delete from Cloudinary first (older records may not have public_id)
    if (item.public_id) {
      try {
        await cloudinary.uploader.destroy(item.public_id);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
        return res.status(502).json({
          success: false,
          message: 'Failed to delete image from Cloudinary.',
        });
      }
    }

    await item.deleteOne();

    return res.json({ success: true, message: 'Gallery image deleted successfully.' });
  } catch (err) {
    console.error('Error deleting gallery image:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting gallery image.',
    });
  }
};

module.exports = {
  getGalleryImages,
  addGalleryImage,
  deleteGalleryImage,
  uploadToCloudinary,
};