const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOTP, sendOTPviaEmail } = require('../utils/otpService');
const { isValidCombination } = require('../utils/boardConstraints');
const { setStudentAuthCookie } = require('../utils/authCookies');

const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';
const hashResetOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');

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
// @desc    Send OTP to email for registration
// @route   POST /api/auth/send-registration-otp
// ─────────────────────────────────────────────────────────────────────────────
const sendRegistrationOTP = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email || !mobile) {
      return res.status(400).json({ success: false, message: 'Email and mobile are required' });
    }

    if (!validateIndianMobile(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid 10-digit mobile number' });
    }

    // Check if either exists
    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase() }, { mobile }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Mobile number already registered' 
      });
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    // Create a stateless hash: HMAC(email + mobile + otp + expiresAt)
    const dataToHash = `${email.toLowerCase()}|${mobile}|${otp}|${expiresAt}`;
    const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(dataToHash).digest('hex');

    await sendOTPviaEmail(email.toLowerCase(), mobile, otp);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      hash,
      expiresAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify OTP for registration
// @route   POST /api/auth/verify-registration-otp
// ─────────────────────────────────────────────────────────────────────────────
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, mobile, otp, hash, expiresAt } = req.body;

    if (!email || !mobile || !otp || !hash || !expiresAt) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (Date.now() > expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    // Verify hash
    const dataToHash = `${email.toLowerCase()}|${mobile}|${otp}|${expiresAt}`;
    const expectedHash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(dataToHash).digest('hex');

    if (hash !== expectedHash) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Generate a temporary signed token for the registration step
    const registrationToken = jwt.sign(
      { email: email.toLowerCase(), mobile, verified: true },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      message: 'Verified successfully',
      registrationToken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register student (Token based)
// @route   POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const {
      name, email, studentClass, password, registrationToken,
      branch, board, parentName, parentContact, schoolName, address,
    } = req.body;

    // 1. Verify Registration Token (Stateless)
    if (!registrationToken) {
      return res.status(401).json({ success: false, message: 'Registration session expired. Please verify again.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(registrationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
    }

    // Security check: Ensure the submitted email/mobile matches the verified token
    if (decoded.email !== email?.toLowerCase() || decoded.mobile !== req.body.mobile) {
      return res.status(401).json({
        success: false,
        message: 'Registration session mismatch. Please verify OTP again.',
      });
    }
    const mobile = decoded.mobile;

    // 2. Validate required fields
    if (!branch) return res.status(400).json({ success: false, message: 'Please select a branch' });
    if (!board) return res.status(400).json({ success: false, message: 'Please select a board' });
    if (!parentName) return res.status(400).json({ success: false, message: 'Parent name is required' });
    if (!parentContact) return res.status(400).json({ success: false, message: 'Parent contact number is required' });

    // 2.5 Strict Class-Board Validation
    if (!isValidCombination(board, studentClass)) {
      return res.status(400).json({ 
        success: false, 
        message: `Board '${board}' is not valid for Class '${studentClass}'.`
      });
    }

    // 3. Name validation
    if (!validateName(name)) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 3 characters and contain only letters, spaces, and dots',
      });
    }

    // 4. Parent contact validation
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

    // 7. Verification that user didn't register between OTP and this call
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

    // 9. Create account
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
      emailVerified: true, 
      registrationStatus: 'Pending',
      isApproved: false,
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully! Your account is pending admin approval.',
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
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
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

    // Fetch user — separate from password check so we can track lockout
    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

    // Generic message — don't reveal if the email exists or not
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 🔒 Account lockout check (brute-force protection)
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked due to too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        code: 'ACCOUNT_LOCKED',
        minutesRemaining: minutes,
      });
    }

    // 🔐 Verification gates — check BEFORE password to give clear errors
    if (!user.mobileVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your phone number is not verified. Please complete the registration process.',
        code: 'MOBILE_NOT_VERIFIED',
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your email address has not been verified. Please check your inbox for a verification link.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    // ✅ Password check
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Increment failed attempt counter
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
        await user.save({ validateBeforeSave: false });
        return res.status(423).json({
          success: false,
          message: 'Too many failed login attempts. Account locked for 15 minutes.',
          code: 'ACCOUNT_LOCKED',
        });
      }

      await user.save({ validateBeforeSave: false });
      const remaining = 5 - user.loginAttempts;
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lock.`,
        remainingAttempts: remaining,
      });
    }

    // 🚫 Approval gates — check registrationStatus BEFORE issuing token
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

    // ✅ Success — reset lockout counters
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      await user.save({ validateBeforeSave: false });
    }

    const token = generateToken(user._id);
    setStudentAuthCookie(res, token);

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
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
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
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
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
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
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

    if (user.resetOtpLockedUntil && user.resetOtpLockedUntil > Date.now()) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed OTP attempts. Please try again later.',
      });
    }

    const otp = generateOTP();
    user.resetOTP = hashResetOtp(otp);
    user.resetOTPExpiry = Date.now() + 10 * 60 * 1000;
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = null;
    await user.save({ validateBeforeSave: false });

    await sendOTPviaEmail(normalized, user.mobile, otp);
    res.json({ success: true, message: genericMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.' });
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
      resetOTPExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    if (user.resetOtpLockedUntil && user.resetOtpLockedUntil > Date.now()) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed OTP attempts. Please try again later.',
      });
    }

    const isOtpValid = user.resetOTP === hashResetOtp(otp);
    if (!isOtpValid) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      if (user.resetOtpAttempts >= 5) {
        user.resetOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

module.exports = {
  sendRegistrationOTP, verifyRegistrationOTP,
  register, login, getMe,
  updateProfile, getProfileHistory, markNotificationRead,
  forgotPassword, resetPassword,
};
