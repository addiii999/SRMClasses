const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOTP, validatePhone, hashOTP, sendOTPviaEmail } = require('../utils/otpService');

// ─── Token Helpers ────────────────────────────────────────────────────────────

const generateToken = (id) => {
  return jwt.sign({ id, role: 'student' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const generateOtpVerifiedToken = (mobile) => {
  return jwt.sign({ mobile, otpVerified: true }, process.env.JWT_SECRET, {
    expiresIn: '10m',
  });
};

// ─── Validation Helpers ───────────────────────────────────────────────────────

// Indian mobile: 10 digits, starts with 6-9
const validateIndianMobile = (mobile) => /^[6-9]\d{9}$/.test(mobile);

// Name: min 3 chars, letters spaces and dots only
const validateName = (name) => {
  if (!name || name.trim().length < 3) return false;
  return /^[a-zA-Z\s.]+$/.test(name.trim());
};

// Student password: min 6 chars, at least 1 number
const validateStudentPassword = (password) => {
  return password && password.length >= 6 && /\d/.test(password);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Send OTP to phone/email (Step 1 of registration)
// @route   POST /api/auth/send-otp
// ─────────────────────────────────────────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { mobile, email } = req.body;

    // 1. Validate phone format
    if (!validateIndianMobile(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (starts with 6-9)',
      });
    }

    // 2. Check if mobile belongs to a rejected student within 7-day cooldown
    const existingUser = await User.findOne({ mobile }).lean();
    if (existingUser) {
      if (existingUser.registrationStatus === 'Active' || existingUser.registrationStatus === 'Pending') {
        return res.status(400).json({
          success: false,
          message: 'This number is already registered. Please login instead.',
        });
      }
      if (existingUser.registrationStatus === 'Rejected') {
        const rejectedAt = existingUser.rejectedAt ? new Date(existingUser.rejectedAt) : null;
        if (rejectedAt) {
          const daysSinceRejection = (Date.now() - rejectedAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysSinceRejection < 7) {
            const remainingDays = Math.ceil(7 - daysSinceRejection);
            return res.status(400).json({
              success: false,
              message: `Your previous registration was rejected. You can re-register after ${remainingDays} day${remainingDays === 1 ? '' : 's'}.`,
              code: 'REJECTION_COOLDOWN',
              remainingDays,
            });
          }
        } else {
          // Rejected without rejectedAt timestamp — block
          return res.status(400).json({
            success: false,
            message: 'Your registration was previously rejected. Please contact admin.',
            code: 'REGISTRATION_REJECTED',
          });
        }
      }
    }

    // 3. Check if email already registered (if provided)
    if (email) {
      const existingByEmail = await User.findOne({ email: email.toLowerCase() }).lean();
      if (existingByEmail) {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please login instead.',
        });
      }
    }

    // 4. Rate limiting: max 5 OTPs per hour per mobile
    const now = Date.now();
    if (!global.otpRateLimit) global.otpRateLimit = {};
    const record = global.otpRateLimit[mobile] || { count: 0, windowStart: now, lastSentAt: 0 };

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
    const otpExpiry = new Date(now + 5 * 60 * 1000);

    global.otpStore = global.otpStore || {};
    global.otpStore[mobile] = { otpHash, expiry: otpExpiry, attempts: 0, email: email || null };

    record.count++;
    record.lastSentAt = now;
    global.otpRateLimit[mobile] = record;

    if (email) {
      await sendOTPviaEmail(email, mobile, otp);
    } else {
      console.log(`[DEV MODE] OTP for ${mobile}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: email
        ? `OTP sent to your email (${email.replace(/(.{2}).+(@.+)/, '$1***$2')})`
        : 'OTP generated (dev mode)',
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
      return res.status(400).json({ success: false, message: 'OTP not found. Please request a new one.' });
    }

    if (new Date() > new Date(stored.expiry)) {
      delete global.otpStore[mobile];
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.', expired: true });
    }

    if (stored.attempts >= 3) {
      delete global.otpStore[mobile];
      return res.status(400).json({ success: false, message: 'Too many failed attempts. Please request a new OTP.', blocked: true });
    }

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

    delete global.otpStore[mobile];
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
    const {
      name, email, studentClass, password, otpToken,
      branch, board, parentName, parentContact, schoolName, address,
    } = req.body;

    // 1. Validate OTP token
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

    // 2. Validate required fields
    if (!branch) return res.status(400).json({ success: false, message: 'Please select a branch' });
    if (!board) return res.status(400).json({ success: false, message: 'Please select a board' });
    if (!parentName) return res.status(400).json({ success: false, message: 'Parent name is required' });
    if (!parentContact) return res.status(400).json({ success: false, message: 'Parent contact number is required' });

    // 3. Name validation: min 3 chars, no numbers/special chars
    if (!validateName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters and contain only letters, spaces, and dots',
      });
    }

    // 4. Parent contact validation: valid Indian mobile
    if (!validateIndianMobile(parentContact)) {
      return res.status(400).json({
        success: false,
        message: 'Parent contact must be a valid 10-digit Indian mobile number',
      });
    }

    // 5. Student mobile ≠ Parent contact
    if (mobile === parentContact) {
      return res.status(400).json({
        success: false,
        message: 'Student mobile number and parent contact cannot be the same',
      });
    }

    // 6. Password validation
    if (!validateStudentPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters and contain at least 1 number',
      });
    }

    // 7. Final duplicate checks
    if (await User.findOne({ mobile })) {
      return res.status(400).json({ success: false, message: 'This number is already registered.' });
    }
    if (email && await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    // 8. Verify Branch
    const Branch = require('../models/Branch');
    const selectedBranch = await Branch.findById(branch);
    if (!selectedBranch || !selectedBranch.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive branch selected' });
    }

    // 9. Create account — status: Pending, isApproved: false, NO token returned
    const user = await User.create({
      name: name.trim(),
      email: email?.toLowerCase(),
      mobile,
      studentClass,
      password,
      branch: selectedBranch._id,
      board,
      parentName: parentName.trim(),
      parentContact,
      schoolName: schoolName?.trim() || null,
      address: address?.trim() || null,
      mobileVerified: true,
      registrationStatus: 'Pending',
      isApproved: false,
      // batch: NOT accepted from registration
    });

    // ✅ No token — student must wait for admin approval
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your account is pending admin approval. You will be able to login once approved.',
      code: 'REGISTRATION_PENDING',
      data: {
        name: user.name,
        email: user.email,
        registrationStatus: user.registrationStatus,
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

    if (typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 🚫 Approval gate — check registrationStatus BEFORE issuing token
    if (user.registrationStatus === 'Pending') {
      return res.status(403).json({
        success: false,
        message: 'Your registration is pending admin approval. Please wait.',
        registrationStatus: 'Pending',
        code: 'PENDING_APPROVAL',
      });
    }

    if (user.registrationStatus === 'Rejected') {
      return res.status(403).json({
        success: false,
        message: 'Your registration has been rejected. Please contact the admin for assistance.',
        registrationStatus: 'Rejected',
        code: 'REGISTRATION_REJECTED',
      });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Account not yet approved. Please contact admin.',
        code: 'NOT_APPROVED',
      });
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
        registrationStatus: user.registrationStatus,
        isApproved: user.isApproved,
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
  try {
    // Include notifications for this student
    const Notification = require('../models/Notification');
    const notifications = await Notification.find({
      targetStudent: req.user._id,
      readBy: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const BoardChangeRequest = require('../models/BoardChangeRequest');
    const pendingBoardRequest = await BoardChangeRequest.findOne({
      student: req.user._id,
      status: 'pending',
    }).lean();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        mobile: req.user.mobile,
        studentClass: req.user.studentClass,
        branch: req.user.branch,
        board: req.user.board,
        batch: req.user.batch,
        boardChangeCount: req.user.boardChangeCount,
        parentName: req.user.parentName,
        parentContact: req.user.parentContact, // Own profile — allowed
        schoolName: req.user.schoolName,
        address: req.user.address,
        studentId: req.user.studentId,
        registrationStatus: req.user.registrationStatus,
        isApproved: req.user.isApproved,
        shouldChangePassword: req.user.shouldChangePassword || false,
        profileHistory: req.user.profileHistory || [],
        pendingBoardRequest: pendingBoardRequest || null,
        unreadNotifications: notifications,
        unreadNotificationCount: notifications.length,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update student's own profile (schoolName, address only)
// @route   PUT /api/auth/update-profile
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const STUDENT_EDITABLE_FIELDS = ['schoolName', 'address'];
    const LOCKED_FIELDS = ['name', 'studentClass', 'board', 'branch', 'parentName', 'parentContact', 'batch', 'boardChangeCount', 'email', 'mobile', 'studentId'];

    // Check for locked field modification attempts
    for (const field of LOCKED_FIELDS) {
      if (req.body[field] !== undefined) {
        return res.status(403).json({
          success: false,
          message: `Field '${field}' is locked and cannot be edited by student. Contact admin.`,
          code: 'FIELD_LOCKED',
          field,
        });
      }
    }

    const user = await User.findById(req.user._id);
    const historyEntries = [];

    for (const field of STUDENT_EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        const oldValue = user[field];
        const newValue = req.body[field]?.trim() || null;

        if (oldValue !== newValue) {
          historyEntries.push({
            field,
            oldValue,
            newValue,
            changedBy: 'student',
            changedAt: new Date(),
          });
          user[field] = newValue;
        }
      }
    }

    if (historyEntries.length > 0) {
      historyEntries.forEach(entry => user.addProfileHistory(entry));
      await user.save();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      updatedFields: historyEntries.map(e => e.field),
      data: {
        schoolName: user.schoolName,
        address: user.address,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get student's profile history
// @route   GET /api/auth/profile-history
// ─────────────────────────────────────────────────────────────────────────────
const getProfileHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('profileHistory').lean();
    const history = (user.profileHistory || []).slice().reverse(); // newest first
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Mark notification as read
// @route   POST /api/auth/notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────
const markNotificationRead = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const notif = await Notification.findOne({
      _id: req.params.id,
      targetStudent: req.user._id,
    });

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (!notif.readBy.includes(req.user._id)) {
      notif.readBy.push(req.user._id);
      await notif.save();
    }

    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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
    const genericMessage = 'If an account exists for this email, you will receive an OTP shortly.';
    if (!user) return res.json({ success: true, message: genericMessage });

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

    if (!validateStudentPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters with at least 1 number',
      });
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

module.exports = {
  sendOTP, verifyOTP, register, login, getMe,
  updateProfile, getProfileHistory, markNotificationRead,
  forgotPassword, resetPassword,
};
