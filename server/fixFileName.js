const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/srmclasses';

async function fixMissingFileName() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const Syllabus = require('./models/Syllabus');
    const syllabuses = await Syllabus.find({});

    let updatedCount = 0;
    for (const s of syllabuses) {
      // If fileName is missing, empty, or equals publicId (timestamped)
      if (!s.fileName || s.fileName.trim() === '' || s.fileName === s.publicId) {
        let newFileName = s.fileName;
        // Determine original filename from publicId (if it contains timestamp prefix)
        if (s.publicId && s.publicId.match(/^\d+_/)) {
          // Remove timestamp prefix (numbers + underscore)
          newFileName = s.publicId.replace(/^\d+_/, '');
          console.log(`Extracted filename from publicId: ${s.publicId} -> ${newFileName}`);
        } else if (s.pdfUrl) {
          // Extract basename from URL
          const basename = path.basename(s.pdfUrl);
          // If basename contains timestamp prefix, remove it
          if (basename.match(/^\d+_/)) {
            newFileName = basename.replace(/^\d+_/, '');
          } else {
            newFileName = basename;
          }
          console.log(`Extracted filename from pdfUrl: ${basename} -> ${newFileName}`);
        } else {
          console.log(`Cannot determine filename for ${s._id}, skipping`);
          continue;
        }
        // Update the document
        s.fileName = newFileName;
        await s.save();
        updatedCount++;
        console.log(`Updated ${s._id} with fileName: ${newFileName}`);
      }
    }

    console.log(`Total updated: ${updatedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixMissingFileName();