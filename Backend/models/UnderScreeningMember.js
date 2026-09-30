const mongoose = require('mongoose');

const UnderScreeningMemberSchema = new mongoose.Schema({
  serialNumber: { type: Number, index: true },
  memberId: { type: String, default: '' },
  name: { type: String, required: true },
  regNumber: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  specialization: { type: String, default: '' },
  batch: { type: String, required: true },
  residenceType: { type: String, enum: ['Hosteller', 'Day Scholar'], default: 'Day Scholar' },
  photo: { type: String, default: '' },
  interests: { type: [String], default: [] },
  otherInterest: { type: String, default: '' },
  designation: { type: String, default: '' },
  roleAssignee: { type: String, default: '' },
  role: { type: String, default: 'Member' },
  status: { type: String, default: 'Under Screening' },
  screeningEmailSent: { type: Boolean, default: false },
  consentGiven: { type: Boolean, default: false },
  consentTimestamp: { type: Date },
  createdAt: { type: Date, default: Date.now },
}, { strict: false, collection: 'underscreeningmembers' });

module.exports = mongoose.model('UnderScreeningMember', UnderScreeningMemberSchema);
