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
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

demoBookingSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('DemoBooking', demoBookingSchema);
