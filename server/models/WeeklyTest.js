const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const weeklyTestSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  date: {
    type: Date,
    required: [true, 'Test date is required'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1'],
  },
  batch: {
    type: String,
    required: [true, 'Batch (class) is required'],
    enum: ['5', '6', '7', '8', '9', '10', '11', '12'],
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

weeklyTestSchema.index({ batch: 1, subject: 1, date: -1 });

weeklyTestSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('WeeklyTest', weeklyTestSchema);
