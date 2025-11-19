// // 

// const express = require('express');
// const User = require('../models/user');
// const { registerValidation, loginValidation, forgotPasswordValidation } = require('../utils/validation');
// const { authMiddleware, generateTokens } = require('../middleware/auth');
// const router = express.Router();

// // 1.1 User Registration
// router.post('/register', async (req, res) => {
//   try {
//     // Validate request body
//     const { error } = registerValidation(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message
//       });
//     }

//     const { name, email, phone, password, enableWhatsApp, enableVoice } = req.body;

//     // Check if user already exists
//     const existingUser = await User.findOne({
//       $or: [{ email }, { phone }]
//     });

//     if (existingUser) {
//       const errors = {};
//       if (existingUser.email === email) errors.email = 'Email already exists';
//       if (existingUser.phone === phone) errors.phone = 'Phone number already registered';
      
//       return res.status(400).json({
//         success: false,
//         message: 'Registration failed',
//         errors
//       });
//     }

//     // Create new user
//     const user = new User({
//       name,
//       email,
//       phone,
//       password,
//       enableWhatsApp,
//       enableVoice
//     });

//     await user.save();

//     res.status(201).json({
//       success: true,
//       message: 'Registration successful',
//       data: {
//         userId: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone
//       }
//     });

//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });

// // 1.2 User Login
// router.post('/login', async (req, res) => {
//   try {
//     // Validate request body
//     const { error } = loginValidation(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message
//       });
//     }

//     const { phone, password } = req.body;

//     // Find user by phone
//     const user = await User.findOne({ phone });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid phone number or password'
//       });
//     }

//     // Check password
//     const isPasswordValid = await user.comparePassword(password);
//     if (!isPasswordValid) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid phone number or password'
//       });
//     }

//     // Generate tokens
//     const { token, refreshToken } = generateTokens(user._id);

//     // Save refresh token to user
//     user.refreshToken = refreshToken;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Login successful',
//       data: {
//         userId: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         token,
//         refreshToken,
//         campaignPreferences: {
//           whatsappEnabled: user.enableWhatsApp,
//           voiceEnabled: user.enableVoice
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });

// // 1.3 Logout
// router.post('/logout', authMiddleware, async (req, res) => {
//   try {
//     // Clear refresh token
//     await User.findByIdAndUpdate(req.user._id, { refreshToken: null });

//     res.json({
//       success: true,
//       message: 'Logged out successfully'
//     });

//   } catch (error) {
//     console.error('Logout error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });

// // 1.4 Forgot Password (Now requires authentication)
// router.post('/forgot-password', authMiddleware, async (req, res) => {
//   try {
//     // Validate request body
//     const { error } = forgotPasswordValidation(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details[0].message
//       });
//     }

//     const { phone } = req.body;

//     // Check if the phone number belongs to the authenticated user
//     if (req.user.phone !== phone) {
//       return res.status(400).json({
//         success: false,
//         message: 'Phone number does not match your account'
//       });
//     }

//     // Check if user exists (should always exist since user is authenticated)
//     const user = await User.findOne({ phone });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Phone number not registered'
//       });
//     }

//     // In a real application, you would:
//     // 1. Generate OTP
//     // 2. Send OTP via SMS/Email
//     // 3. Store OTP hash in database with expiration

//     const otpId = `otp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//     res.json({
//       success: true,
//       message: 'Password reset OTP sent',
//       data: {
//         otpId,
//         phone: user.phone, // Return masked phone for confirmation
//         email: user.email  // Return email for confirmation
//       }
//     });

//   } catch (error) {
//     console.error('Forgot password error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// });

// module.exports = router;