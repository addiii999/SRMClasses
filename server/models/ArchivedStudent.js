const mongoose = require('mongoose');
const { BATCH_NAMES } = require('../utils/batchConstants');

// ─── Lifecycle Log Sub-schema ──────────────────────────────────────────────────
// Immutable audit trail embedded per record
const lifecycleLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['archived', 'restore_from_archive', 'soft_deleted', 'restored_from_delete', 'purged'],
  },
  performedBy: { type: String, required: true },   // admin email
  performedByRole: { type: String },               // ADMIN | SUPER_ADMIN
  performedAt: { type: Date, default: Date.now },
  note: { type: String, default: null },
  ipAddress: { type: String, default: null },
}, { _id: false });

// ─── Archived Student Schema ───────────────────────────────────────────────────
// Full snapshot of User at the time of archiving.
// Fields mirror User.js exactly — kept deliberately denormalized so restore is lossless.

const archivedStudentSchema = new mongoose.Schema({
  // ── Original User _id reference (for traceability) ─────────────────────────
  originalUserId: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null,
  },

  // ── Core Identity ──────────────────────────────────────────────────────────
  name: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true, index: true },
  mobile: { type: String, trim: true, index: true },
  mobileVerified: { type: Boolean, default: false },

  // ── Parent / School / Address ─────────────────────────────────────────────
  parentName: { type: String, trim: true, default: null },
  parentContact: { type: String, trim: true, default: null },
  schoolName: { type: String, trim: true, default: null },
  address: { type: String, trim: true, default: null },

  // ── Academic ──────────────────────────────────────────────────────────────
  studentClass: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', index: true },
  board: { type: String },
  batch: { type: String, default: null },
  boardChangeCount: { type: Number, default: 0 },

  // ── Auth & Identity (kept for audit; password hash harmless at rest) ──────
  role: { type: String, default: 'student' },
  studentId: { type: String, index: true },
  shouldChangePassword: { type: Boolean, default: false },
  createdByAdmin: { type: Boolean, default: false },

  // ── Registration & Status ─────────────────────────────────────────────────
  registrationStatus: { type: String, default: 'Active' },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isStudent: { type: Boolean, default: false },
  isEnrolled: { type: Boolean, default: false },
  verificationStatus: { type: String, default: 'approved' },
  rejectedAt: { type: Date, default: null },

  // ── Enrollment Logs ───────────────────────────────────────────────────────
  enrollmentLogs: [{ status: String, updatedBy: String, updatedAt: Date }],

  // ── Academic Promotion ────────────────────────────────────────────────────
  academicYear: { type: String, default: null },
  classHistory: [{
    _id: false,
    class: String,
    board: String,
    batch: { type: String, default: null },
    academicYear: { type: String, default: null },
    promotedAt: { type: Date, default: Date.now },
  }],

  // ── Fee Management ────────────────────────────────────────────────────────
  feeType: { type: String, default: 'None' },
  registrationFeeApplicable: { type: Boolean, default: true },
  feeSnapshot: {
    actualFee: { type: Number, default: 0 },
    satPercentage: { type: Number, default: 0 },
    installmentPlan: { type: Number, default: 1 },
    updatedBy: { type: String },
    updatedAt: { type: Date },
  },
  payments: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'] },
  }],
  paymentLogs: [{
    actionType: { type: String, enum: ['edit', 'delete'] },
    paymentId: mongoose.Schema.Types.ObjectId,
    oldValue: Object,
    newValue: Object,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now },
  }],

  // ── Profile / Audit History ───────────────────────────────────────────────
  profileHistory: { type: Array, default: [] },
  adminAuditLog: { type: Array, default: [] },

  // ── Photo (Cloudinary) — for cleanup during purge ─────────────────────────
  // Stored if the student ever had an uploaded photo; checked before Cloudinary delete
  photo: {
    url: { type: String, default: null },
    public_id: { type: String, default: null },
  },

  // ── Original document timestamps ──────────────────────────────────────────
  originalCreatedAt: { type: Date, default: null },
  originalUpdatedAt: { type: Date, default: null },

  // ── Lifecycle Control Fields ──────────────────────────────────────────────
  isArchived: { type: Boolean, default: true, index: true },
  archivedAt: { type: Date, default: null, index: true },
  archivedBy: { type: String, default: null },        // admin email
  archiveReason: { type: String, default: null },

  // Soft delete — 30-day recovery window before permanent purge
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: String, default: null },

  // Immutable lifecycle audit trail
  lifecycleLog: {
    type: [lifecycleLogSchema],
    default: [],
  },
}, { timestamps: true });

// ─── Compound indexes for common query patterns ────────────────────────────────
archivedStudentSchema.index({ isArchived: 1, isDeleted: 1, archivedAt: -1 });
archivedStudentSchema.index({ studentClass: 1, board: 1, batch: 1 });
archivedStudentSchema.index({ deletedAt: 1 }, { sparse: true });

module.exports = mongoose.model('ArchivedStudent', archivedStudentSchema);
