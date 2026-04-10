const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  // For class-wide broadcasts (existing system)
  targetBatch: {
    type: String,
    enum: ['5', '6', '7', '8', '9', '10', '11', '12', 'all', null],
    default: null,
  },
  // For student-specific private notifications (NEW)
  targetStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  },
  type: {
    type: String,
    default: 'general',
    enum: [
      // Existing
      'test_result',
      'general',
      // New — student-specific
      'board_change_approved',
      'board_change_rejected',
      'batch_assigned',
      'registration_approved',
      'registration_rejected',
    ],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  // Array of student ObjectIds who have read this notification
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

notificationSchema.index({ targetBatch: 1, createdAt: -1 });
notificationSchema.index({ targetStudent: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
