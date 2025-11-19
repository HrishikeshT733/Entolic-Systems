const Joi = require('joi');

// User registration validation
const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required().trim(),
    email: Joi.string().email().required().trim(),
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required(),
    enableWhatsApp: Joi.boolean().default(false),
    enableVoice: Joi.boolean().default(false)
  });

  return schema.validate(data);
};

// User login validation
const loginValidation = (data) => {
  const schema = Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/).required(),
    password: Joi.string().required()
  });

  return schema.validate(data);
};

// Forgot password validation
const forgotPasswordValidation = (data) => {
  const schema = Joi.object({
    phone: Joi.string().pattern(/^\d{10}$/).required()
  });

  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation
};