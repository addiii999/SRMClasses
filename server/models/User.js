const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const softDeletePlugin = require('../utils/softDeletePlugin');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
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
  },
  mobileVerified: {
    type: Boolean,
    default: false,
  },
  phoneOTP: String,
  phoneOTPExpiry: Date,
  phoneOTPAttempts: { type: Number, default: 0 },
  otpLastSentAt: Date,
  createdByAdmin: { type: Boolean, default: false },
  studentClass: {
    type: String,
    required: [true, 'Class is required'],
    enum: ['5', '6', '7', '8', '9', '10', '11', '12'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    default: 'student',
  },
  resetOTP: String,
  resetOTPExpiry: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  isStudent: {
    type: Boolean,
    default: false,
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isEnrolled: {
    type: Boolean,
    default: false
  },
  enrollmentLogs: [{
    status: String, // 'enrolled', 'removed'
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  // Fee Management Fields
  feeType: {
    type: String,
    enum: ['Foundation', 'Advance', 'Math-Science', 'ICSE-Advance', 'None'],
    default: 'None'
  },
  feeSnapshot: {
    actualFee: { type: Number, default: 0 },
    satPercentage: { type: Number, default: 0 },
    installmentPlan: { type: Number, default: 1 },
    updatedBy: { type: String },
    updatedAt: { type: Date }
  },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['cash', 'upi', 'bank', 'cheque'], required: true }
  }],
  paymentLogs: [{
    actionType: { type: String, enum: ['edit', 'delete'] },
    paymentId: mongoose.Schema.Types.ObjectId,
    oldValue: Object,
    newValue: Object,
    updatedBy: String,
    updatedAt: { type: Date, default: Date.now }
  }],
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  board: {
    type: String,
    enum: ['CBSE', 'ICSE', 'JAC'],
    default: 'CBSE',
    index: true,
  },
  shouldChangePassword: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('User', userSchema);
