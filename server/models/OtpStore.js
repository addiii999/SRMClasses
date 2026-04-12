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
  otpHash: {
    type: String,
    required: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index
  }
}, { timestamps: true });

module.exports = mongoose.model('OtpStore', otpStoreSchema);
