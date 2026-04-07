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
  targetBatch: {
    type: String,
    required: true,
    enum: ['5', '6', '7', '8', '9', '10', '11', '12', 'all'],
  },
  type: {
    type: String,
    default: 'test_result',
    enum: ['test_result', 'general'],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WeeklyTest',
    default: null,
  },
  // Array of student ObjectIds who have read this notification
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

notificationSchema.index({ targetBatch: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
