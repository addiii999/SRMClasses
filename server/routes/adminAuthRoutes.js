const express = require('express');
const router = express.Router();
const { adminLoginLimiter, passwordResetLimiter } = require('../middleware/rateLimits');
const { adminLogin, adminForgotPassword, adminResetPassword } = require('../controllers/adminAuthController');

router.post('/login', adminLoginLimiter, adminLogin);
router.post('/forgot-password', passwordResetLimiter, adminForgotPassword);
router.post('/reset-password', passwordResetLimiter, adminResetPassword);

module.exports = router;
