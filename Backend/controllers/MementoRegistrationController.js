const MementoRegistration = require('../models/MementoRegistration');
const cloudinary = require('../config/cloudinary');
const { uploadToCloudinary } = require('./GalleryController');

const registerMemento = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'A photo is required.' });
  }

  let uploaded;
  try {
    uploaded = await uploadToCloudinary(req.file.buffer, 'techverse_mementos');
  } catch (error) {
    console.error('Cloudinary upload error for memento registration:', error);
    return res.status(502).json({
      success: false,
      message: 'Could not upload the photo. Please try again later.',
    });
  }

  try {
    const registration = await MementoRegistration.create({
      name: req.body.name.trim(),
      regNo: req.body.regNo.trim(),
      program: req.body.program.trim(),
      photo: uploaded.secure_url,
    });

    return res.status(201).json({
      success: true,
      message: 'Memento details submitted successfully.',
      data: registration,
    });
  } catch (error) {
    console.error('Error saving memento registration:', error);
    if (uploaded?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploaded.public_id);
      } catch (cleanupError) {
        console.error('Failed to remove photo after memento save error:', cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Could not save your memento details. Please try again.',
    });
  }
};

module.exports = { registerMemento };
