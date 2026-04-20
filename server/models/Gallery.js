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

// Performance index — GET /gallery?category=events
// Filters by category, excludes soft-deleted, newest first
gallerySchema.index({ category: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Gallery', gallerySchema);
