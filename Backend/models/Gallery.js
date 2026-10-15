const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  name: String,
  img_url: String,
  public_id: String, // added: needed to delete the image from Cloudinary later
  description: String,
  category: String
});

module.exports = mongoose.model('Gallery', gallerySchema);