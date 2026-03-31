const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const Syllabus = require('./server/models/Syllabus');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const syllabuses = await Syllabus.find({});
  console.log('--- SYLLABUS URL CHECK ---');
  syllabuses.slice(0, 5).forEach(s => {
    console.log(`Board: ${s.board}, Class: ${s.classLevel}`);
    console.log(`URL: ${s.pdfUrl}`);
    console.log('---');
  });
  await mongoose.disconnect();
}

check();
