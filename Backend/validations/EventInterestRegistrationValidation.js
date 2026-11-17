const Joi = require('joi');

const EventInterestRegistrationValidationSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required(),
  batch: Joi.string().trim().min(1).max(40).required(),
  program: Joi.string().trim().min(1).max(120).required(),
  section: Joi.string().trim().min(1).max(40).required(),
  registrationNumber: Joi.string().trim().min(1).max(50).required(),
  interested: Joi.string().valid(
    "Yes, I'm interested.",
    "No, I'm not interested.",
    "Maybe, I need more information."
  ).required(),
}).unknown(false);

module.exports = { EventInterestRegistrationValidationSchema };
