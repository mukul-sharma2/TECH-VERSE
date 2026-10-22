const mongoose = require("mongoose");

const LostCodeMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  regNo: { type: String, required: true },
  course: { type: String, required: true },
  year: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, default: "Explorer" },
});

const LostCodeRegistrationSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  teamSize: { type: Number, required: true },
  members: { type: [LostCodeMemberSchema], required: true },
  status: { type: String, default: "Registered" },
  createdAt: { type: Date, default: Date.now },
});

// Explicitly set collection name to 'lostcode_registrations'
module.exports = mongoose.model(
  "LostCodeRegistration", 
  LostCodeRegistrationSchema, 
  "lostcode_registrations"
);

