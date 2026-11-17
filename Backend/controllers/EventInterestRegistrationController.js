const EventInterestRegistration = require('../models/EventInterestRegistration');
const mongoose = require('mongoose');

const registerInterest = async (req, res) => {
  const registrationNumber = String(req.body.registrationNumber).trim().toUpperCase();

  try {
    const existingRegistration = await EventInterestRegistration.findOne({ registrationNumber }).select('_id').lean();
    if (existingRegistration) {
      return res.status(409).json({
        success: false,
        message: 'A response has already been submitted for this registration number.',
      });
    }

    const registration = await EventInterestRegistration.create({
      fullName: req.body.fullName.trim(),
      batch: req.body.batch.trim(),
      program: req.body.program.trim(),
      section: req.body.section.trim(),
      registrationNumber,
      interested: req.body.interested,
    });

    return res.status(201).json({
      success: true,
      message: 'Your event interest response has been registered.',
      data: registration,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A response has already been submitted for this registration number.',
      });
    }

    console.error('Error creating event interest registration:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save your event interest response.',
    });
  }
};

const getRegistrations = async (req, res) => {
  try {
    const registrations = await EventInterestRegistration.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: registrations });
  } catch (error) {
    console.error('Error fetching event interest registrations:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event registrations.' });
  }
};

const getRegistrationStats = async (req, res) => {
  try {
    const [totalRegistrations, interested, notInterested, maybe] = await Promise.all([
      EventInterestRegistration.countDocuments(),
      EventInterestRegistration.countDocuments({ interested: "Yes, I'm interested." }),
      EventInterestRegistration.countDocuments({ interested: "No, I'm not interested." }),
      EventInterestRegistration.countDocuments({ interested: "Maybe, I need more information." }),
    ]);

    return res.status(200).json({
      success: true,
      totalRegistrations,
      interested,
      notInterested,
      maybe,
    });
  } catch (error) {
    console.error('Error fetching event interest statistics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch event registration statistics.' });
  }
};

const deleteRegistration = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid registration ID.' });
  }

  try {
    const registration = await EventInterestRegistration.findByIdAndDelete(req.params.id);
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found.' });
    }

    return res.status(200).json({ success: true, message: 'Registration deleted.' });
  } catch (error) {
    console.error('Error deleting event interest registration:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete event registration.' });
  }
};

module.exports = {
  registerInterest,
  getRegistrations,
  getRegistrationStats,
  deleteRegistration,
};
