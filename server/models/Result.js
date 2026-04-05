const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const resultSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  studentClass: { type: String, required: true },
  subject: { type: String },
  score: { type: String },
  achievement: { type: String },
  rank: { type: Number },
  year: { type: String },
  imageUrl: { type: String },
  cloudinaryId: { type: String },
  fileName: { type: String },
}, { timestamps: true });

resultSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Result', resultSchema);
