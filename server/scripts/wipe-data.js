const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const DemoBooking = require('../models/DemoBooking');
const Enquiry = require('../models/Enquiry');
const Result = require('../models/Result');

async function wipe() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB. Starting Full Student Data Wipe...');

    // 1. Delete all students (preserving admins)
    const userResult = await User.deleteMany({ role: 'student' });
    console.log(`- Deleted ${userResult.deletedCount} Student accounts.`);

    // 2. Delete all demo bookings
    const demoResult = await DemoBooking.deleteMany({});
    console.log(`- Deleted ${demoResult.deletedCount} Demo Bookings.`);

    // 3. Delete all enquiries (CRM)
    const enquiryResult = await Enquiry.deleteMany({});
    console.log(`- Deleted ${enquiryResult.deletedCount} Enquiries.`);

    // 4. Delete all results
    const resultCount = await Result.deleteMany({});
    console.log(`- Deleted ${resultCount.deletedCount} Student Results.`);

    console.log('\n✅ DATABASE RESET COMPLETE! You now have a clean slate.');
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Wipe failed:', error.message);
    process.exit(1);
  }
}

wipe();
