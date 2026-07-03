// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  authLimiter, otpLimiter, registerLimiter, loginSlowDown,
  checkAccountLock,
} = require('../middleware/security.middleware');

// Rate limiter + slow-down + account lockout on login
router.post('/login',            authLimiter, loginSlowDown, checkAccountLock, ctrl.login);

// Registration: max 5 per IP per hour
router.post('/register',         registerLimiter, ctrl.register);

// OTP: max 5 per phone per 10 minutes
router.post('/send-otp',         otpLimiter, ctrl.sendOtp);
router.post('/verify-otp',       otpLimiter, ctrl.verifyOtp);

// Google OAuth: auth limiter
router.post('/google',           authLimiter, ctrl.googleAuth);

// Password reset: auth limiter
router.post('/forgot-password',  authLimiter, ctrl.forgotPassword);
router.post('/reset-password',   authLimiter, ctrl.resetPassword);

// Authenticated endpoint
router.get('/me',                authenticate, ctrl.getMe);

module.exports = router;
