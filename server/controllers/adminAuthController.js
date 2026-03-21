const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    let admin = await Admin.findOne({ email }).select('+password');
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
    if (email !== process.env.ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Invalid admin email' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.otp = otp;
    admin.otpExpiry = Date.now() + 10 * 60 * 1000;
    await admin.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `SRM Classes <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Admin Password Reset OTP - SRM Classes',
      html: `<p>Your admin OTP is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>`,
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
    const admin = await Admin.findOne({ email, otp, otpExpiry: { $gt: Date.now() } });
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
