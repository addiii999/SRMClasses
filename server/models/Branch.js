const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  googleMapsLink: { type: String, required: true },
  phone: { type: String, required: true },
  branchCode: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

branchSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Branch', branchSchema);
