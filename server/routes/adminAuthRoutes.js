const express = require('express');
const router = express.Router();
const { adminLogin, adminForgotPassword, adminResetPassword } = require('../controllers/adminAuthController');

router.post('/login', adminLogin);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);

module.exports = router;
