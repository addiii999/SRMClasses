require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const migrateUserFields = async () => {
  await connectDB();

  try {
    console.log('🔄 Starting user migration process...');

    // 1. Approve users
    const approvedRes = await User.updateMany(
      { verificationStatus: 'approved', registrationStatus: { $ne: 'Active' } },
      { $set: { registrationStatus: 'Active', isApproved: true, boardChangeCount: 0, batch: null } }
    );
    console.log(`✅ Migrated ${approvedRes.modifiedCount} approved users.`);

    // 2. Pending users
    const pendingRes = await User.updateMany(
      { verificationStatus: 'pending', registrationStatus: { $ne: 'Pending' } },
      { $set: { registrationStatus: 'Pending', isApproved: false, boardChangeCount: 0, batch: null } }
    );
    console.log(`✅ Migrated ${pendingRes.modifiedCount} pending users.`);

    // 3. Rejected users
    const rejectedRes = await User.updateMany(
      { verificationStatus: 'rejected', registrationStatus: { $ne: 'Rejected' } },
      { $set: { registrationStatus: 'Rejected', isApproved: false, boardChangeCount: 0, batch: null, rejectedAt: Date.now() } }
    );
    console.log(`✅ Migrated ${rejectedRes.modifiedCount} rejected users.`);

    console.log('🎉 Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateUserFields();
