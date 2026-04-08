require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');
const Branch = require('./models/Branch');

/**
 * MIGRATION SCRIPT:
 * 1. Assigns any student who doesn't have a branch to the default 'RI' branch.
 * 2. This ensures all legacy students work seamlessly with the new branch-aware system.
 */
const migrate = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is missing in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const defaultBranch = await Branch.findOne({ branchCode: 'RI' });
    
    if (!defaultBranch) {
      console.error('❌ Default branch (RI) not found. Please create it first.');
      process.exit(1);
    }

    const { modifiedCount } = await User.updateMany(
      { role: 'student', branch: { $exists: false } },
      { $set: { branch: defaultBranch._id } }
    );

    console.log(`🎉 Migration Complete!`);
    console.log(`👉 Fixed ${modifiedCount} legacy students by assigning them to: ${defaultBranch.name}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Failed:', error);
    process.exit(1);
  }
};

migrate();
