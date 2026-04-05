const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

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

gallerySchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Gallery', gallerySchema);
