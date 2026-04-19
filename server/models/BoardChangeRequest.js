const mongoose = require('mongoose');

const boardChangeRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  currentBoard: {
    type: String,
    enum: ['CBSE', 'ICSE', 'JAC'],
    required: true,
  },
  requestedBoard: {
    type: String,
    enum: ['CBSE', 'ICSE', 'JAC'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null,
  },
  adminNote: {
    type: String,
    default: null,
    trim: true,
  },
  notified: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Compound index: enforce one pending request per student
boardChangeRequestSchema.index(
  { student: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('BoardChangeRequest', boardChangeRequestSchema);
