const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  targetClass: {
    type: String,
    default: 'all',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

announcementSchema.plugin(softDeletePlugin);

// Performance index — student dashboard: GET /announcements?studentClass=X
// Filters active, non-deleted announcements for a class, sorted by newest
announcementSchema.index({ targetClass: 1, isActive: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
