const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB. Resetting Sameera and Sameer...');

  const mobiles = ['9798681756', '9304458541'];
  const result = await User.updateMany(
    { mobile: { $in: mobiles } },
    { $set: { verificationStatus: 'pending', isEnrolled: false } }
  );

  console.log(`Reset complete: ${result.modifiedCount} users updated.`);
  await mongoose.disconnect();
}

reset().catch(console.error);
