/**
 * Migration Script: Assign current academic year to all existing students
 * 
 * Usage:
 *   node server/scripts/migrateAcademicYear.js
 *   node server/scripts/migrateAcademicYear.js --dry-run   # preview only
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const isDryRun = process.argv.includes('--dry-run');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[DB] Connected to MongoDB');

  const now = new Date();
  // In India: New Academic Year starts April. 
  // If current month >= April (month 3 in 0-indexed), use currentYear-nextYear
  // e.g., April 2025 → "2025-26"
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const currentAcademicYear = `${startYear}-${String(startYear + 1).slice(-2)}`;

  console.log(`[INFO] Assigning academic year: "${currentAcademicYear}" to all students without it.`);

  const filter = {
    role: 'student',
    $or: [
      { academicYear: null },
      { academicYear: { $exists: false } }
    ]
  };

  const count = await User.countDocuments(filter);
  console.log(`[INFO] Students to update: ${count}`);

  if (isDryRun) {
    const sample = await User.find(filter).select('name studentId studentClass').limit(10);
    console.log('[DRY RUN] Sample students:');
    sample.forEach(s => console.log(`  - ${s.name} (${s.studentId}) — Class ${s.studentClass}`));
    console.log('[DRY RUN] No changes made.');
    process.exit(0);
  }

  const result = await User.updateMany(filter, {
    $set: { academicYear: currentAcademicYear }
  });

  console.log(`[SUCCESS] Updated ${result.modifiedCount} students with academic year "${currentAcademicYear}"`);
  process.exit(0);
}

run().catch(err => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
