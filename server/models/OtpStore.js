const mongoose = require('mongoose');

const otpStoreSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  // Captured at OTP request time for per-IP rate limiting (max 10/hour)
  ipAddress: {
    type: String,
    index: true,
    default: 'unknown',
  },
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  // TTL index: MongoDB auto-deletes this document exactly at expiresAt time.
  // expires: 0 means expireAfterSeconds=0, so deletion happens at the stored timestamp.
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('OtpStore', otpStoreSchema);
