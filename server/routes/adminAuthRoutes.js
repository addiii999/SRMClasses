const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { adminLogin, adminForgotPassword, adminResetPassword } = require('../controllers/adminAuthController');

const adminPasswordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', adminLogin);
router.post('/forgot-password', adminPasswordResetLimiter, adminForgotPassword);
router.post('/reset-password', adminPasswordResetLimiter, adminResetPassword);

module.exports = router;
