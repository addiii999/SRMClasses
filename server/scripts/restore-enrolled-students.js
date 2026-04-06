const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const res = await User.updateMany(
    { verificationStatus: 'approved' },
    { $set: { isStudent: true, isEnrolled: true } }
  );
  console.log(`✅ Updated ${res.modifiedCount} approved students to Active Enrollment.`);
  await mongoose.disconnect();
}

fix().catch(console.error);
