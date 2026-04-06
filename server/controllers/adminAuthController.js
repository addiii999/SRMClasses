const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const generateAdminToken = (id) => {
  return jwt.sign({ id, role: 'admin' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Admin login
// @route   POST /api/admin/auth/login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    // Normalize email - lowercase and trim to fix keyboard auto-capitalization issues
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail !== (process.env.ADMIN_EMAIL || '').toLowerCase().trim()) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    let admin = await Admin.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }).select('+password');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found. Please seed the database.' });
    }
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateAdminToken(admin._id);
    res.json({ success: true, token, admin: { id: admin._id, email: admin.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin forgot password - send OTP
// @route   POST /api/admin/auth/forgot-password
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ success: false, message: 'Invalid email' });
    const normalized = email.toLowerCase().trim();
    const envAdmin = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    if (!envAdmin || normalized !== envAdmin) {
      return res.status(400).json({ success: false, message: 'Invalid admin email' });
    }
    const admin = await Admin.findOne({ email: { $regex: new RegExp(`^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.otp = otp;
    admin.otpExpiry = Date.now() + 10 * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "SRM Classes", email: process.env.EMAIL_USER },
      to: [{ email: admin.email }],
      subject: 'Admin Password Reset OTP - SRM Classes',
      htmlContent: `<p>Your admin OTP is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    res.json({ success: true, message: 'OTP sent to admin email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/admin/auth/reset-password
const adminResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const normalized = email.toLowerCase().trim();
    const safe = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const admin = await Admin.findOne({
      email: { $regex: new RegExp(`^${safe}$`, 'i') },
      otp,
      otpExpiry: { $gt: Date.now() },
    });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    admin.password = newPassword;
    admin.otp = undefined;
    admin.otpExpiry = undefined;
    await admin.save();
    res.json({ success: true, message: 'Admin password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { adminLogin, adminForgotPassword, adminResetPassword };
