/**
 * Migration Script: Populate new User fields
 * =====================================================================
 * Run this ONCE to migrate existing User documents to the new schema.
 *
 * What it does:
 * - Maps verificationStatus → registrationStatus + isApproved
 * - Sets boardChangeCount = 0 if not already set
 * - Sets batch = null if not already set
 * - Sets parentName/parentContact/schoolName/address = null if unset
 * - Sets rejectedAt for rejected users (if not already set — uses updatedAt)
 *
 * Usage:
 *   node migrateUserFields.js
 * =====================================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const User = require('./models/User');

    // Get all users (bypass soft delete filter)
    const users = await User.find({ isDeleted: { $ne: true } }).lean();
    console.log(`📦 Found ${users.length} user(s) to migrate`);

    let updated = 0;
    let skipped = 0;

    for (const u of users) {
      const update = {};

      // Only migrate if registrationStatus not already set
      if (!u.registrationStatus) {
        if (u.verificationStatus === 'approved') {
          update.registrationStatus = 'Active';
          update.isApproved = true;
        } else if (u.verificationStatus === 'rejected') {
          update.registrationStatus = 'Rejected';
          update.isApproved = false;
          // Set rejectedAt to updatedAt as best approximation
          if (!u.rejectedAt) {
            update.rejectedAt = u.updatedAt || new Date();
          }
        } else {
          update.registrationStatus = 'Pending';
          update.isApproved = false;
        }
      }

      if (u.boardChangeCount === undefined || u.boardChangeCount === null) {
        update.boardChangeCount = 0;
      }

      if (u.batch === undefined) {
        update.batch = null;
      }

      if (u.parentName === undefined) update.parentName = null;
      if (u.parentContact === undefined) update.parentContact = null;
      if (u.schoolName === undefined) update.schoolName = null;
      if (u.address === undefined) update.address = null;
      if (!u.profileHistory) update.profileHistory = [];
      if (!u.adminAuditLog) update.adminAuditLog = [];

      if (Object.keys(update).length > 0) {
        await User.updateOne({ _id: u._id }, { $set: update });
        updated++;
        process.stdout.write(`\r✏️  Migrated: ${updated}/${users.length}`);
      } else {
        skipped++;
      }
    }

    console.log('');
    console.log('');
    console.log('✅ Migration complete!');
    console.log(`   Updated : ${updated}`);
    console.log(`   Skipped : ${skipped} (already up to date)`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

run();
