/**
 * Migration Script: Upgrade existing Admin to SUPER_ADMIN
 * =====================================================================
 * Run this ONCE to migrate the existing single-admin document
 * to the new multi-admin schema as SUPER_ADMIN.
 *
 * Usage:
 *   node migrateAdminToSuperAdmin.js
 * =====================================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const Admin = require('./models/Admin');

    const admins = await Admin.find({});
    console.log(`📦 Found ${admins.length} admin(s)`);

    for (const admin of admins) {
      const update = {};

      if (!admin.role) update.role = 'SUPER_ADMIN';
      if (!admin.adminId) update.adminId = `ADM-001`;
      if (!admin.name) update.name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
      if (admin.isActive === undefined) update.isActive = true;

      if (Object.keys(update).length > 0) {
        await Admin.updateOne({ _id: admin._id }, { $set: update });
        console.log(`✅ Migrated admin: ${admin.email} → role: SUPER_ADMIN`);
      } else {
        console.log(`⏭️  Admin already migrated: ${admin.email}`);
      }
    }

    if (admins.length === 0) {
      console.log('⚠️  No admin found. Run scripts/seedSuperAdmin.js to create one.');
    }

    console.log('');
    console.log('✅ Admin migration complete!');
    console.log('   Add SUPER_ADMIN_NAME to your .env if the name shows as "Super Admin"');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

run();
