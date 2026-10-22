const Joi = require('joi');

const MemberSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Member name is required.',
  }),
  regNo: Joi.string().trim().required().messages({
    'string.empty': 'Registration number is required.',
  }),
  course: Joi.string().trim().required().messages({
    'string.empty': 'Course is required.',
  }),
  year: Joi.string().trim().required().messages({
    'string.empty': 'Year is required.',
  }),
  phone: Joi.string().trim().required().messages({
    'string.empty': 'Phone number is required.',
  }),
  email: Joi.string().email().trim().required().messages({
    'string.email': 'Valid email is required.',
    'string.empty': 'Email is required.',
  }),
  role: Joi.string().optional().allow(''),
});

const LostCodeValidationSchema = Joi.object({
  teamName: Joi.string().trim().optional().allow(''),
  teamSize: Joi.number().integer().min(3).max(4).required().messages({
    'any.required': 'Team size (3 or 4) is required.',
  }),
  members: Joi.array().items(MemberSchema).min(3).max(4).required().messages({
    'array.min': 'At least 3 members are required.',
    'array.max': 'At most 4 members are allowed.',
  }),
});

module.exports = {
  LostCodeValidationSchema,
};

