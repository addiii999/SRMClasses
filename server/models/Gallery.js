const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  imageUrl: { type: String, required: true },
  category: {
    type: String,
    enum: ['events', 'results', 'campus', 'activities', 'other'],
    default: 'other',
  },
  description: { type: String },
  cloudinaryId: { type: String },
  fileName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
