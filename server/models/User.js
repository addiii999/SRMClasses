const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const softDeletePlugin = require('../utils/softDeletePlugin');
const { BATCH_NAMES } = require('../utils/batchConstants');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const profileHistorySchema = new mongoose.Schema({
  field: { type: String, required: true },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  changedBy: { type: String, enum: ['student', 'admin'], required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const adminAuditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'approve', 'reject', 'update_field', 'assign_batch', 'reset_board_count', 'AUDIT_LOG_DELETED'
  field: { type: String, default: null },
  oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
  newValue: { type: mongoose.Schema.Types.Mixed, default: null },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  adminName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  overrideReason: { type: String, default: null },
  // Soft Delete fields for auditing the auditors
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { _id: true });

// ─── Main Schema ──────────────────────────────────────────────────────────────

const userSchema = new mongoose.Schema({
  // ── Core Identity ──────────────────────────────────────────────────────────
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    sparse: true,
    trim: true,
    index: true,
  },
  mobileVerified: { type: Boolean, default: false },
  phoneOTP: String,
  phoneOTPExpiry: Date,
  phoneOTPAttempts: { type: Number, default: 0 },
  otpLastSentAt: Date,

  // ── New: Parent / School / Address ────────────────────────────────────────
  parentName: { type: String, trim: true, default: null },
  parentContact: {
    type: String,
    trim: true,
    default: null,
    // NEVER included in list/bulk APIs — projection enforced in queries
  },
  schoolName: { type: String, trim: true, default: null },
  address: { type: String, trim: true, default: null },

  // ── Academic ──────────────────────────────────────────────────────────────
  studentClass: {
    type: String,
    required: [true, 'Class is required'],
    enum: ['5', '6', '7', '8', '9', '10', '11', '12'],
    index: true,
  },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  board: {
    type: String,
    enum: ['CBSE', 'ICSE', 'JAC'],
    default: 'CBSE',
    index: true,
  },
  // Batch — admin-only assignment, read-only for student
  batch: {
    type: String,
    enum: [...BATCH_NAMES, null],
    default: null,
    index: true,
  },
  boardChangeCount: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
  },

  // ── Auth & Security ───────────────────────────────────────────────────────
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  passwordChangedAt: {
    type: Date,
    default: null,
  },
  role: { type: String, default: 'student' },
  resetOTP: String,
  resetOTPExpiry: Date,
  shouldChangePassword: { type: Boolean, default: false },
  createdByAdmin: { type: Boolean, default: false },

  // ── Registration & Approval Flow ──────────────────────────────────────────
  registrationStatus: {
    type: String,
    enum: ['Pending', 'Active', 'Rejected', 'Graduated'],
    default: 'Pending',
    index: true,
  },
  isApproved: {
    type: Boolean,
    default: false,
    index: true,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },

  // ── Student Status (existing, kept for backward compat) ───────────────────
  isActive: { type: Boolean, default: true },
  isStudent: { type: Boolean, default: false },
  isEnrolled: { type: Boolean, default: false },

  // ── Data Lifecycle — managed by Data Management system ───────────────────
  // Guard fields: prevent re-archiving; allow cross-collection queries
  isArchived: { type: Boolean, default: false, index: true },
  archivedAt: { type: Date, default: null },
  archivedBy: { type: String, default: null }, // admin email who archived
  studentId: { type: String, unique: true, sparse: true },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  // ── Enrollment Logs ───────────────────────────────────────────────────────
  enrollmentLogs: [{
    status: String,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now },
  }],

  // ── Academic Promotion ───────────────────────────────────────────────────
  academicYear: {
    type: String,
    default: null, // e.g. "2025-26"
  },
  classHistory: {
    type: [{
      _id: false,
      class: { type: String },
      board: { type: String },
      batch: { type: String, default: null },
      academicYear: { type: String, default: null },
      promotedAt: { type: Date, default: Date.now },
    }],
    default: [],
  },

  // ── Fee Management (existing, unchanged) ─────────────────────────────────
  feeType: {
    type: String,
    enum: ['Foundation', 'Advance', 'Math-Science', 'ICSE-Advance', 'Commerce Advance', 'None'],
    default: 'None',
  },
  registrationFeeApplicable: {
    type: Boolean,
    default: true,
  },
  feeSnapshot: {
    actualFee: { type: Number, default: 0 },
    satPercentage: { type: Number, default: 0 },
    installmentPlan: { type: Number, default: 1 },
    updatedBy: { type: String },
    updatedAt: { type: Date },
  },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'], required: true },
  }],
  paymentLogs: [{
    actionType: { type: String, enum: ['edit', 'delete'] },
    paymentId: mongoose.Schema.Types.ObjectId,
    oldValue: Object,
    newValue: Object,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now },
  }],

  // ── Profile History (last 100 entries) ───────────────────────────────────
  profileHistory: {
    type: [profileHistorySchema],
    default: [],
    validate: {
      validator: (arr) => arr.length <= 100,
      message: 'profileHistory capped at 100 entries',
    },
  },

  // ── Admin Audit Log (immutable — never delete/edit) ───────────────────────
  adminAuditLog: {
    type: [adminAuditLogSchema],
    default: [],
  },
}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ registrationStatus: 1, createdAt: -1 });
userSchema.index({ isApproved: 1, batch: 1 });
userSchema.index({ name: 'text', studentId: 'text' });
userSchema.index({ isArchived: 1, registrationStatus: 1 });

// ─── Pre-save hooks ───────────────────────────────────────────────────────────

// Hash password & track passwordChangedAt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // 1s lag to ensure JWT iat < passwordChangedAt
  }
  next();
});

// Cap profileHistory at 100 entries (trim oldest)
userSchema.pre('save', function (next) {
  if (this.profileHistory && this.profileHistory.length > 100) {
    this.profileHistory = this.profileHistory.slice(-100);
  }
  next();
});

// ─── Methods ─────────────────────────────────────────────────────────────────

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if JWT was issued before password change (token invalidation)
userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtIat < changedTimestamp;
  }
  return false;
};

// Helper: add to profileHistory safely (trims if needed)
userSchema.methods.addProfileHistory = function (entry) {
  this.profileHistory.push(entry);
  if (this.profileHistory.length > 100) {
    this.profileHistory = this.profileHistory.slice(-100);
  }
};

// Helper: add to adminAuditLog (always append, never remove)
userSchema.methods.addAdminAuditLog = function (entry) {
  this.adminAuditLog.push(entry);
};

userSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('User', userSchema);
