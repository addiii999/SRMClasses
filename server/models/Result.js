const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  studentClass: { type: String, required: true },
  subject: { type: String },
  score: { type: String },
  achievement: { type: String },
  rank: { type: Number },
  year: { type: String },
  imageUrl: { type: String },
  fileName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
