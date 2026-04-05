const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const courseSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    enum: ['5', '6', '7', '8', '9', '10', '11', '12'],
  },
  subjects: [{ type: String }],
  duration: { type: String, required: true },
  batchTimings: [{ type: String }],
  fee: { type: Number },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

courseSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Course', courseSchema);
