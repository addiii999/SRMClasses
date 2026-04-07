const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyTest',
    required: [true, 'Test reference is required'],
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required'],
  },
  // Allows Number (marks) or String ('AB' for absent)
  marksObtained: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Marks obtained is required'],
    validate: {
      validator: function (v) {
        if (v === 'AB' || v === 'ab') return true;
        return typeof v === 'number' && v >= 0;
      },
      message: 'Marks must be a non-negative number or "AB" for absent',
    },
  },
}, { timestamps: true });

// One result per student per test
testResultSchema.index({ testId: 1, studentId: 1 }, { unique: true });

// Virtual: isAbsent
testResultSchema.virtual('isAbsent').get(function () {
  return this.marksObtained === 'AB' || this.marksObtained === 'ab';
});

// Virtual: percentage (null if absent)
testResultSchema.virtual('percentage').get(function () {
  if (this.isAbsent) return null;
  // totalMarks must be populated from test — handled in controller
  return null;
});

testResultSchema.set('toJSON', { virtuals: true });
testResultSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TestResult', testResultSchema);
