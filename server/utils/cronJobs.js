const cron = require('node-cron');
const mongoose = require('mongoose');
const { deleteFromCloudinary } = require('./cloudinary');
const cloudinary = require('cloudinary').v2;

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
  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('🧹 Running daily Recycle Bin cleanup...');
    
    // Default retention is 30 days
    let retentionDays = 30;

    // Optional: Check storage usage (Cloudinary)
    try {
      const usage = await cloudinary.api.usage();
      const usagePercent = (usage.credits.used / usage.credits.limit) * 100;
      if (usagePercent > 80) {
        console.warn(`⚠️ Storage usage is high (${usagePercent.toFixed(2)}%). Reducing retention to 15 days.`);
        retentionDays = 15;
      }
    } catch (e) {
      console.log('Skipping storage usage check (API restricted or not configured).');
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
          console.log(`🗑️ Purging ${itemsToPurge.length} old ${type} records...`);
          
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
          
          console.log(`✅ Successfully purged ${itemsToPurge.length} ${type} records.`);
        }
      } catch (error) {
        console.error(`❌ Error purging ${type} records:`, error.message);
      }
    }
    
    console.log('✨ Recycle Bin cleanup completed.');
  });

  console.log('🗓️ Scheduled daily Recycle Bin cleanup (01:00 AM)');
};

module.exports = initCronJobs;
