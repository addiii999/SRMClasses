require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      {}, 
      { $set: { isStudent: false, verificationStatus: 'pending' } }
    );

    console.log(`Successfully updated ${result.modifiedCount} users to isStudent: false`);
    console.log('Migration completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
