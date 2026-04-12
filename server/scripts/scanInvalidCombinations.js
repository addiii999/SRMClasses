const fs = require('fs');
const path = require('path');

async function run() {
  const exportToCsv = process.argv.includes('--csv');
  
  try {
    const mongoUri = process.env.SESSION_DB_URI || process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error('No MongoDB URI found in environment');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const students = await User.find({ role: 'student' })
      .select('name email mobile studentClass board registrationStatus studentId branch')
      .populate('branch', 'name')
      .lean();

    let invalidCount = 0;
    const results = [];
    
    console.log(`\n🔍 Scanning ${students.length} students for invalid board-class combinations...\n`);
    
    for (const student of students) {
      if (!isValidCombination(student.board, student.studentClass)) {
        const branchName = student.branch?.name || 'Unknown';
        console.log(`[INVALID] ${student.name.padEnd(20)} | ID: ${(student.studentId || 'N/A').padEnd(10)} | Branch: ${branchName}`);
        console.log(`          Board: ${student.board.padEnd(5)} | Class: ${student.studentClass.padEnd(2)} | Status: ${student.registrationStatus}`);
        
        results.push({
          Name: student.name,
          ID: student.studentId || 'N/A',
          Email: student.email || '',
          Mobile: student.mobile || '',
          Board: student.board,
          Class: student.studentClass,
          Status: student.registrationStatus,
          Branch: branchName
        });
        invalidCount++;
      }
    }
    
    if (exportToCsv && results.length > 0) {
      const csvPath = path.join(__dirname, 'invalid_combinations_report.csv');
      const headers = Object.keys(results[0]).join(',');
      const rows = results.map(r => Object.values(r).map(v => `"${v}"`).join(','));
      fs.writeFileSync(csvPath, [headers, ...rows].join('\n'));
      console.log(`\n📄 CSV Report generated at: ${csvPath}`);
    } else if (exportToCsv) {
      console.log('\nℹ️ No invalid combinations found; skipping CSV export.');
    }
    
    console.log(`\n✅ Scan complete. Found ${invalidCount} invalid configurations.`);

  } catch (err) {
    console.error('❌ Script Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
