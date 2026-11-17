const Joi = require('joi');

const MementoRegistrationValidationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  regNo: Joi.string().trim().min(1).max(50).required(),
  program: Joi.string().trim().min(1).max(120).required(),
}).unknown(false);

module.exports = { MementoRegistrationValidationSchema };
