const mongoose = require('mongoose');

const MementoRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  regNo: { type: String, required: true, trim: true, maxlength: 50 },
  photo: { type: String, required: true },
  program: { type: String, required: true, trim: true, maxlength: 120 },
}, { timestamps: true, collection: 'memento_registrations' });

module.exports = mongoose.model('MementoRegistration', MementoRegistrationSchema);
