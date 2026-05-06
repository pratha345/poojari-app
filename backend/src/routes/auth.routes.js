// src/routes/auth.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register',         ctrl.register);
router.post('/login',            ctrl.login);
router.post('/send-otp',         ctrl.sendOtp);
router.post('/verify-otp',       ctrl.verifyOtp);
router.post('/forgot-password',  ctrl.forgotPassword);
router.post('/reset-password',   ctrl.resetPassword);
router.get('/me',                authenticate, ctrl.getMe);

module.exports = router;
