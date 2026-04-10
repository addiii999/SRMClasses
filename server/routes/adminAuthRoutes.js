const express = require('express');
const router = express.Router();
const { adminLoginLimiter } = require('../middleware/rateLimits');
const { adminLogin, adminForgotPassword, adminResetPassword } = require('../controllers/adminAuthController');

router.post('/login', adminLoginLimiter, adminLogin);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);

module.exports = router;
