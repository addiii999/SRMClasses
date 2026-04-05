const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Branch = require('../models/Branch');

const update = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('⏳ Updating branch codes...');

    // Update Ravi Steel
    await Branch.findOneAndUpdate(
      { branchCode: 'RAVI01' },
      { branchCode: 'RAVI' }
    );
    console.log('✅ Updated Ravi Steel code to RAVI (ID prefix: RI)');

    // Update Mandar
    await Branch.findOneAndUpdate(
      { branchCode: 'MANDAR01' },
      { branchCode: 'MANDAR' }
    );
    console.log('✅ Updated Mandar code to MANDAR (ID prefix: MR)');

    console.log('🎉 Branch codes updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating branch codes:', err);
    process.exit(1);
  }
};

update();
