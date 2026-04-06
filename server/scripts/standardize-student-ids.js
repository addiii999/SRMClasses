const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const { generateStudentId } = require('../utils/studentIdGenerator');
const Branch = require('../models/Branch');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB. Starting ID standardization...');

  const students = await User.find({ 
    verificationStatus: 'approved',
    role: 'student'
  }).populate('branch');

  console.log(`Found ${students.length} approved students.`);

  for (const s of students) {
    const oldId = s.studentId;
    if (!s.branch) {
      console.warn(`⚠️ Student ${s.name} has no branch assigned. Skipping.`);
      continue;
    }

    // Extract sessionYear and class from oldId if possible, or use current data
    // SRM-2027-12-001 -> Year=2027, Class=12
    const parts = oldId.split('-');
    let sessionYear = parts[1];
    let studentClass = parts[parts.length - 2]; 

    // Regenerate ID using latest logic
    const newId = await generateStudentId(sessionYear, studentClass, s.branch);

    if (oldId !== newId) {
      s.studentId = newId;
      await s.save();
      console.log(`✅ Standardized ${s.name}: ${oldId} -> ${newId}`);
    } else {
      console.log(`ℹ️ ${s.name} already has a standard ID: ${oldId}`);
    }
  }

  console.log('ID Standardization complete!');
  await mongoose.disconnect();
}

fix().catch(console.error);
