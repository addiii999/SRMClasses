const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const enquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  studentClass: { type: String, trim: true },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Converted'],
    default: 'New',
  },
  notes: { type: String, default: '' },
}, { timestamps: true });

enquirySchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Enquiry', enquirySchema);
