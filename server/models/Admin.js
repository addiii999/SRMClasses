const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Admin name is required'],
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false,
    // min 8 chars, 1 number, 1 special char — validated in controller/pre-save
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN'],
    default: 'ADMIN',
  },
  adminId: {
    type: String,
    unique: true,
    sparse: true, // auto-generated
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null, // null for SUPER_ADMIN seeded from script
  },
  // OTP for forgot password (hashed)
  otpHash: String,
  otpExpiry: Date,
}, { timestamps: true });

// Password strength validation helper
const isStrongPassword = (password) => {
  // min 8 chars, at least 1 number, 1 special char
  return /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
};

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (!isStrongPassword(this.password)) {
    const err = new Error('Admin password must be at least 8 characters with at least 1 number and 1 special character');
    err.name = 'ValidationError';
    return next(err);
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Auto-generate adminId before first save if not set
adminSchema.pre('save', async function (next) {
  if (this.adminId) return next();
  try {
    const count = await this.constructor.countDocuments();
    this.adminId = `ADM-${String(count + 1).padStart(3, '0')}`;
  } catch (e) {
    this.adminId = `ADM-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
