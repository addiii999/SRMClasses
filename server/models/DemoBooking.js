const mongoose = require('mongoose');

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

module.exports = mongoose.model('DemoBooking', demoBookingSchema);
