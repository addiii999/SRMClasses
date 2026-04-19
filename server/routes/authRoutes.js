const express = require('express');
const router = express.Router();
const {
  sendRegistrationOTP, verifyRegistrationOTP,
  register, login, getMe,
  updateProfile, getProfileHistory, markNotificationRead,
  forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { otpLimiter, registrationLimiter, loginLimiter, passwordResetLimiter } = require('../middleware/rateLimits');

// ── Email-based Registration Flow ──────────────────────────────────────────
router.post('/send-registration-otp', otpLimiter, sendRegistrationOTP);
router.post('/verify-registration-otp', registrationLimiter, verifyRegistrationOTP);
router.post('/register', registrationLimiter, register);

// ── Login & Profile ───────────────────────────────────────────────────────────
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);

// ── Student Profile Updates (locked-field enforced in controller) ─────────────
router.put('/update-profile', protect, updateProfile);
router.get('/profile-history', protect, getProfileHistory);

// ── Notifications ──────────────────────────────────────────────────────────────
router.post('/notifications/:id/read', protect, markNotificationRead);

// ── Password Reset ─────────────────────────────────────────────────────────────
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

module.exports = router;
