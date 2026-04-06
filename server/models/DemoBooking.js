const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const demoBookingSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  studentClass: { type: String, required: true },
  preferredDate: { type: Date },
  preferredTime: { type: String },
  subject: { type: String },
  status: {
    type: String,
    enum: ['pending', 'visited', 'converted', 'rejected'],
    default: 'pending',
  },
  confidenceStatus: {
    type: String,
    enum: ['High', 'Low'],
    default: 'High',
  },
  isConverted: { type: Boolean, default: false },
  convertedStudentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String, default: '' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
}, { timestamps: true });

demoBookingSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('DemoBooking', demoBookingSchema);
