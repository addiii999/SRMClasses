const mongoose = require('mongoose');

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
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
