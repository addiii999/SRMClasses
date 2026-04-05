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

module.exports = mongoose.model('Announcement', announcementSchema);
