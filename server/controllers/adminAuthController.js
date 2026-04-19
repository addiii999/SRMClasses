const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { setAdminAuthCookie } = require('../utils/authCookies');

const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';

const generateAdminToken = (admin) => {
  return jwt.sign(
    { id: admin._id, role: admin.role, adminId: admin.adminId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin login (works for both SUPER_ADMIN and ADMIN)
// @route   POST /api/admin/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const admin = await Admin.findOne({ email: normalizedEmail }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact Super Admin.' });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateAdminToken(admin);
    setAdminAuthCookie(res, token);

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        adminId: admin.adminId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin forgot password — send OTP
// @route   POST /api/admin/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ success: false, message: 'Invalid email' });

    const normalized = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalized });

    if (!admin) {
      // Generic message to prevent email enumeration
      return res.json({ success: true, message: 'If this email is registered, an OTP will be sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    admin.otpHash = await bcrypt.hash(otp, salt);
    admin.otpExpiry = Date.now() + 10 * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'SRM Classes Admin', email: process.env.EMAIL_USER },
      to: [{ email: admin.email }],
      subject: 'Admin Password Reset OTP - SRM Classes',
      htmlContent: `<p>Your admin OTP is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`,
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    res.json({ success: true, message: 'If this email is registered, an OTP will be sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP and reset admin password
// @route   POST /api/admin/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
const adminResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (typeof email !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }

    const normalized = email.toLowerCase().trim();
    const admin = await Admin.findOne({
      email: normalized,
      otpExpiry: { $gt: Date.now() },
    }).select('+otpHash');

    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const isOtpMatch = await bcrypt.compare(otp.toString(), admin.otpHash);
    if (!isOtpMatch) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    admin.password = newPassword;
    admin.otpHash = undefined;
    admin.otpExpiry = undefined;
    await admin.save();

    res.json({ success: true, message: 'Admin password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

module.exports = { adminLogin, adminForgotPassword, adminResetPassword };
