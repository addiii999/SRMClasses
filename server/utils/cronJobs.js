const cron = require('node-cron');
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('./cloudinary');
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

/**
 * Dynamic Model Retrieval to avoid circular dependencies during startup/import
 */
const getModel = (name) => {
  try {
    return mongoose.model(name);
  } catch (e) {
    // Fallback: require if not registered
    const modelPaths = {
      Student: '../models/User',
      Faculty: '../models/Faculty',
      Gallery: '../models/Gallery',
      Result: '../models/Result',
      Material: '../models/StudyMaterial',
      Announcement: '../models/Announcement',
      Booking: '../models/DemoBooking',
      Enquiry: '../models/Enquiry',
      Course: '../models/Course',
      WeeklyTest: '../models/WeeklyTest'
    };
    return require(modelPaths[name]);
  }
};

const MODEL_MAP = [
  'Student', 'Faculty', 'Gallery', 'Result', 
  'Material', 'Announcement', 'Booking', 'Enquiry', 'Course', 'WeeklyTest'
];

/**
 * Initialize all scheduled tasks
 */
const initCronJobs = () => {
  const cronEnabled = process.env.CRON_ENABLED !== 'false';
  if (!cronEnabled) {
    logger.info('Cron jobs disabled on this instance');
    return;
  }

  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('Running daily Recycle Bin cleanup');
    
    // Default retention is 30 days
    let retentionDays = 30;

    // Optional: Check storage usage (Cloudinary)
    try {
      const usage = await cloudinary.api.usage();
      const usagePercent = (usage.credits.used / usage.credits.limit) * 100;
      if (usagePercent > 80) {
        logger.warn('Storage usage high, reducing retention window', { usagePercent: usagePercent.toFixed(2) });
        retentionDays = 15;
      }
    } catch (e) {
      logger.warn('Skipping storage usage check (API restricted or not configured)');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const type of MODEL_MAP) {
      try {
        const Model = getModel(type);
        if (!Model) continue;

        // Find items to purge
        const itemsToPurge = await Model.find({
          isDeleted: true,
          deletedAt: { $lt: cutoffDate }
        });

        if (itemsToPurge.length > 0) {
          logger.info('Purging recycle-bin records', { type, count: itemsToPurge.length });
          
          for (const item of itemsToPurge) {
            // Storage Cleanup
            if (item.cloudinaryId) {
              const fileUrl = item.fileUrl || item.imageUrl || '';
              const isRaw = fileUrl.endsWith('.pdf') || fileUrl.includes('/raw/upload/');
              await deleteFromCloudinary(item.cloudinaryId, isRaw ? 'raw' : 'image');
            }
          }

          // Use deleteMany for performance after storage cleanup
          const idsToPurge = itemsToPurge.map(item => item._id);
          await Model.deleteMany({ _id: { $in: idsToPurge } });
          
          logger.info('Recycle-bin purge completed', { type, count: itemsToPurge.length });
        }
      } catch (error) {
        logger.error('Error purging recycle-bin records', { type, error: error.message });
      }
    }
    
  logger.info('Recycle Bin cleanup completed');
  });

  logger.info('Scheduled daily Recycle Bin cleanup (01:00 AM)');

  // ─── ArchivedStudent Purge — daily at 02:00 AM ───────────────────────────
  // Permanently deletes archived students soft-deleted for >30 days.
  // Cloudinary cleanup included. SUPER_ADMIN notified on failure.
  cron.schedule('0 2 * * *', async () => {
    try {
      const { purgeDeletedStudents } = require('../controllers/dataLifecycleController');
      await purgeDeletedStudents();
    } catch (err) {
      logger.error('Failed to invoke purgeDeletedStudents', { error: err.message });
    }
  });

  logger.info('Scheduled ArchivedStudent purge (02:00 AM)');
};

module.exports = initCronJobs;
