require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { isValidCombination } = require('../utils/boardConstraints');

async function run() {
  try {
    await mongoose.connect(process.env.SESSION_DB_URI || process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to DB');

    const students = await User.find({ role: 'student' }).select('name email mobile studentClass board registrationStatus');
    let invalidCount = 0;
    
    console.log(`Scanning ${students.length} students for invalid board-class combinations...\n`);
    
    for (const student of students) {
      if (!isValidCombination(student.board, student.studentClass)) {
        console.log(`[INVALID] ${student.name} (${student.email || student.mobile})`);
        console.log(`   Board: ${student.board} | Class: ${student.studentClass} | Status: ${student.registrationStatus}`);
        invalidCount++;
      }
    }
    
    console.log(`\nScan complete. Found ${invalidCount} invalid configurations.`);

  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    mongoose.disconnect();
  }
}

run();
