const mongoose = require('mongoose');
require('dotenv').config();
const Branch = require('../models/Branch');
const User = require('../models/User');
const Enquiry = require('../models/Enquiry');

const setup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI not found in .env');
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Seed Branches
    const branches = [
      {
        name: 'SRM Classes - Ravi Steel',
        branchCode: 'RAVI01',
        address: 'Ravi Steel, Ranchi, Jharkhand',
        googleMapsLink: 'https://maps.app.goo.gl/example1',
        phone: '9508266012',
        isActive: true
      },
      {
        name: 'SRM Classes - Mandar',
        branchCode: 'MANDAR01',
        address: 'Mandar, Ranchi, Jharkhand',
        googleMapsLink: 'https://maps.app.goo.gl/we1AwFnC6nxAqSf7A',
        phone: '9508266012',
        isActive: true
      }
    ];

    let defaultBranchId;

    for (const bData of branches) {
      let branch = await Branch.findOne({ branchCode: bData.branchCode });
      if (!branch) {
        branch = await Branch.create(bData);
        console.log(`✅ Created branch: ${bData.name}`);
      } else {
        console.log(`ℹ️ Branch exists: ${bData.name}`);
      }

      if (bData.branchCode === 'RAVI01') {
        defaultBranchId = branch._id;
      }
    }

    // 2. Migrate existing users
    console.log('⏳ Migrating existing users to default branch (RAVI01)...');
    const result = await User.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultBranchId } }
    );
    console.log(`✅ User migration complete. Updated ${result.modifiedCount} users.`);

    // 3. Migrate existing enquiries
    console.log('⏳ Migrating existing enquiries to default branch (RAVI01)...');
    const enqResult = await Enquiry.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultBranchId } }
    );
    console.log(`✅ Enquiry migration complete. Updated ${enqResult.modifiedCount} enquiries.`);

    // 4. Migrate existing demo bookings
    const DemoBooking = require('../models/DemoBooking');
    console.log('⏳ Migrating existing demo bookings to default branch (RAVI01)...');
    const demoResult = await DemoBooking.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultBranchId } }
    );
    console.log(`✅ Demo migration complete. Updated ${demoResult.modifiedCount} bookings.`);

    console.log('🎉 Setup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during setup:', err);
    process.exit(1);
  }
};

setup();
