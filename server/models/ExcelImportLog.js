const mongoose = require('mongoose');

const excelImportLogSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isDryRun: {
    type: Boolean,
    default: false,
  },
  totalRows: {
    type: Number,
    default: 0,
  },
  successCount: {
    type: Number,
    default: 0,
  },
  failedCount: {
    type: Number,
    default: 0,
  },
  // Summary of per-row errors
  errors: [{
    row: { type: Number },
    studentId: { type: String, default: null },
    studentName: { type: String, default: null },
    reason: { type: String },
    _id: false,
  }],
  // Which weekly test was targeted (optional reference)
  weeklyTestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyTest',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('ExcelImportLog', excelImportLogSchema);
