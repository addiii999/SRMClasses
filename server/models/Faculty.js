const mongoose = require('mongoose');
const softDeletePlugin = require('../utils/softDeletePlugin');

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
  },
  qualification: {
    type: String,
    default: '',
  },
  experience: {
    type: Number,
    required: [true, 'Experience is required'],
    min: [0, 'Experience cannot be negative'],
  },
  speciality: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: 5.0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priorityOrder: {
    type: Number,
    default: null,
  },
  photo: {
    url: { type: String, default: null },
    public_id: { type: String, default: null },
  },
}, { timestamps: true });

facultySchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Faculty', facultySchema);
