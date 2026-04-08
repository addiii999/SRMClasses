const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const { generateOTP, validatePhone, hashOTP, sendOTPviaEmail } = require('../utils/otpService');

const generateToken = (id) => {
  return jwt.sign({ id, role: 'student' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate a short-lived token to prove OTP was verified (10 min)
const generateOtpVerifiedToken = (mobile) => {
  return jwt.sign({ mobile, otpVerified: true }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP to phone (Step 1 of registration)
// @route   POST /api/auth/send-otp
// ─────────────────────────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { mobile, email } = req.body;

    // 1. Validate phone format
    if (!validatePhone(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number',
      });
    }

    // 2. Check if mobile already registered
    const existingByMobile = await User.findOne({ mobile });
    if (existingByMobile) {
      return res.status(400).json({
        success: false,
        message: 'This number is already registered. Please login instead.',
      });
    }

    // 3. Check if email already registered (if provided)
    if (email) {
      const existingByEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please login instead.',
        });
      }
    }

    // 4. Rate limiting: max 5 OTPs per hour (using a temp marker stored in-memory)
    // We use a simple in-process store; for production, use Redis
    const now = Date.now();
    if (!global.otpRateLimit) global.otpRateLimit = {};
    const record = global.otpRateLimit[mobile] || { count: 0, windowStart: now, lastSentAt: 0 };

    // Reset window after 1 hour
    if (now - record.windowStart > 60 * 60 * 1000) {
      record.count = 0;
      record.windowStart = now;
    }

    if (record.count >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again after 1 hour.',
      });
    }

    // 5. Cooldown: 60 seconds between resends
    if (now - record.lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - record.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        waitSeconds,
      });
    }

    // 6. Generate and hash OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiry = new Date(now + 5 * 60 * 1000); // 5 minutes

    // 7. Store OTP data in temp store (keyed by mobile)
    global.otpStore = global.otpStore || {};
    global.otpStore[mobile] = {
      otpHash,
      expiry: otpExpiry,
      attempts: 0,
      email: email || null,
    };

    // 8. Update rate limit record
    record.count++;
    record.lastSentAt = now;
    global.otpRateLimit[mobile] = record;

    // 9. Send OTP via email (requires email for email-based OTP)
    if (!email) {
      // Return OTP in dev mode if no email
      console.log(`[DEV MODE] OTP for ${mobile}: ${otp}`);
    } else {
      await sendOTPviaEmail(email, mobile, otp);
    }

    res.status(200).json({
      success: true,
      message: email
        ? `OTP sent to your email (${email.replace(/(.{2}).+(@.+)/, '$1***$2')})`
        : 'OTP generated (dev mode)',
      // Only include otp in dev/no-email mode for testing
      ...(process.env.NODE_ENV !== 'production' && !email ? { otp } : {}),
    });
  } catch (error) {
    console.error('[SEND OTP]', error.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP. ' + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP (Step 2 of registration)
// @route   POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
    }

    const stored = global.otpStore?.[mobile];

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'OTP not found. Please request a new one.',
      });
    }

    // Check expiry
    if (new Date() > new Date(stored.expiry)) {
      delete global.otpStore[mobile];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
        expired: true,
      });
    }

    // Check attempts
    if (stored.attempts >= 3) {
      delete global.otpStore[mobile];
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
        blocked: true,
      });
    }

    // Verify hash
    const inputHash = hashOTP(otp.toString().trim());
    if (inputHash !== stored.otpHash) {
      stored.attempts++;
      const remaining = 3 - stored.attempts;
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Invalid OTP. No attempts remaining.',
        remainingAttempts: remaining,
      });
    }

    // ✅ OTP Verified — issue a short-lived token
    delete global.otpStore[mobile]; // cleanup
    const otpToken = generateOtpVerifiedToken(mobile);

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully!',
      otpToken,
    });
  } catch (error) {
    console.error('[VERIFY OTP]', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register student (Step 3 — requires valid otpToken)
// @route   POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, studentClass, password, otpToken, branch, board } = req.body;

    if (!branch) {
      return res.status(400).json({ success: false, message: 'Please select a branch' });
    }
    if (!board) {
      return res.status(400).json({ success: false, message: 'Please select a board' });
    }
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Phone verification expired or invalid. Please verify your OTP again.',
      });
    }

    if (!decoded.otpVerified) {
      return res.status(401).json({ success: false, message: 'Phone not verified' });
    }

    const mobile = decoded.mobile;

    // 2. Final duplicate checks
    if (await User.findOne({ mobile })) {
      return res.status(400).json({ success: false, message: 'This number is already registered.' });
    }
    if (email && await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    // 3. Verify Branch
    const Branch = require('../models/Branch');
    const selectedBranch = await Branch.findById(branch);
    if (!selectedBranch || !selectedBranch.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive branch selected' });
    }

    // 4. Create account
    const user = await User.create({
      name,
      email: email?.toLowerCase(),
      mobile,
      studentClass,
      password,
      branch: selectedBranch._id,
      board,
      mobileVerified: true,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to SRM Classes.',
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        studentClass: user.studentClass,
        branch: user.branch,
        board: user.board
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: field === 'mobile'
          ? 'This number is already registered.'
          : 'This email is already registered.',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login student
// @route   POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ success: false, message: 'Invalid email' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        studentClass: user.studentClass,
        shouldChangePassword: user.shouldChangePassword || false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user profile
// @route   GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ success: false, message: 'Invalid email' });
    const normalized = email.toLowerCase().trim();
    if (!normalized.includes('@')) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }
    const user = await User.findOne({ email: normalized });
    const genericMessage =
      'If an account exists for this email, you will receive an OTP shortly.';
    if (!user) {
      return res.json({ success: true, message: genericMessage });
    }
    const otp = generateOTP();
    user.resetOTP = otp;
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await sendOTPviaEmail(normalized, user.mobile, otp);

    res.json({ success: true, message: genericMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP. ' + error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (typeof email !== 'string' || typeof otp !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input' });
    }
    const normalized = email.toLowerCase().trim();
    const user = await User.findOne({
      email: normalized,
      resetOTP: otp,
      resetOTPExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendOTP, verifyOTP, register, login, getMe, forgotPassword, resetPassword };
