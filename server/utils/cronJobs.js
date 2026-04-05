const cron = require('node-cron');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Gallery = require('../models/Gallery');
const Result = require('../models/Result');
const StudyMaterial = require('../models/StudyMaterial');
const Announcement = require('../models/Announcement');
const DemoBooking = require('../models/DemoBooking');
const Enquiry = require('../models/Enquiry');
const Course = require('../models/Course');
const { deleteFromCloudinary } = require('./cloudinary');
const cloudinary = require('cloudinary').v2;

const MODEL_MAP = {
  Student: User,
  Faculty: Faculty,
  Gallery: Gallery,
  Result: Result,
  Material: StudyMaterial,
  Announcement: Announcement,
  Booking: DemoBooking,
  Enquiry: Enquiry,
  Course: Course
};

/**
 * Initialize all scheduled tasks
 */
const initCronJobs = () => {
  // Run every day at 1:00 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('🧹 Running daily Recycle Bin cleanup...');
    
    // Default retention is 30 days
    let retentionDays = 30;

    // Optional: Check storage usage (Cloudinary Example)
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

    for (const [type, Model] of Object.entries(MODEL_MAP)) {
      try {
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
              const isRaw = item.fileUrl && item.fileUrl.endsWith('.pdf');
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
