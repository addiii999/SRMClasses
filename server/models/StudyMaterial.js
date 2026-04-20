const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const studyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  studentClass: {
    type: String,
    required: true,
    enum: ['all', '5', '6', '7', '8', '9', '10', '11', '12'],
  },
  subject: { type: String },
  type: {
    type: String,
    enum: ['notes', 'test_paper', 'assignment', 'other'],
    default: 'notes',
  },
  fileUrl: { type: String, required: true },
  cloudinaryId: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }, // Optional: null means global
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

studyMaterialSchema.plugin(softDeletePlugin);

// Performance indexes — match exact query patterns used in API
// GET /materials?studentClass=X&type=Y — most frequent student dashboard query
studyMaterialSchema.index({ studentClass: 1, type: 1, isDeleted: 1 });
// Admin list — sorted by upload date
studyMaterialSchema.index({ uploadedAt: -1, isDeleted: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
