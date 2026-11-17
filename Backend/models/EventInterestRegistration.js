const mongoose = require('mongoose');

const EventInterestRegistrationSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  batch: { type: String, required: true, trim: true, maxlength: 40 },
  program: { type: String, required: true, trim: true, maxlength: 120 },
  section: { type: String, required: true, trim: true, maxlength: 40 },
  registrationNumber: { type: String, required: true, trim: true, unique: true, maxlength: 50 },
  interested: {
    type: String,
    required: true,
    enum: ["Yes, I'm interested.", "No, I'm not interested.", "Maybe, I need more information."],
  },
}, { timestamps: true, collection: 'fairwall_interest_registrations' });

module.exports = mongoose.model('EventInterestRegistration', EventInterestRegistrationSchema);
