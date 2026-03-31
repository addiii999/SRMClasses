const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  board: {
    type: String,
    required: true,
    enum: ['CBSE', 'ICSE']
  },
  classLevel: {
    type: String,
    required: true,
    enum: ['5', '6', '7', '8', '9', '10', '11', '12']
  },
  pdfUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  }
}, { timestamps: true });

// Create a compound unique index so each board/class combo has only 1 syllabus
syllabusSchema.index({ board: 1, classLevel: 1 }, { unique: true });

module.exports = mongoose.model('Syllabus', syllabusSchema);
