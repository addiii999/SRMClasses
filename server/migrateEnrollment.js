const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const migrateEnrollment = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Migrating enrollment status for students...');
    
    // Set isEnrolled: true ONLY for those where isStudent: true
    const result = await User.updateMany(
      { isStudent: true },
      { $set: { isEnrolled: true } }
    );

    console.log(`✅ Migration complete. Updated ${result.modifiedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateEnrollment();
