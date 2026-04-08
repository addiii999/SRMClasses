const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const WeeklyTest = require('./models/WeeklyTest');
const Branch = require('./models/Branch');

dotenv.config({ path: path.join(__dirname, '.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for migration...');

    // Find the default branch (RI)
    const defaultBranch = await Branch.findOne({ branchCode: 'RI' }) || await Branch.findOne();
    
    if (!defaultBranch) {
      console.log('No branches found. Please create a branch first.');
      process.exit(1);
    }

    console.log(`Using branch: ${defaultBranch.name} (${defaultBranch.branchCode}) as default.`);

    // Update all tests that don't have a branch
    const result = await WeeklyTest.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultBranch._id, isAllBranches: false } }
    );

    console.log(`Migration complete! Updated ${result.modifiedCount} tests.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
