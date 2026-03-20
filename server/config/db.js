const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error (${error.message})`);
    console.log('🔄 Your current network or firewall is blocking MongoDB Atlas connections.');
    console.log('🚀 Automatically starting an In-Memory Database for local testing instead!');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
      console.log(`✅ Local In-Memory Database Connected. You are good to go!`);
      
      // Seed automatically since memory server is fresh
      const Admin = require('../models/Admin');
      const Course = require('../models/Course');
      if (await Admin.countDocuments() === 0) {
        await Admin.create({ email: 'srmclasses01@gmail.com', password: 'SRMAdmin@2026' });
      }
      if (await Course.countDocuments() === 0) {
        await Course.insertMany([
          { className: '5', subjects: ['Mathematics', 'Science', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['7:00 AM - 8:30 AM'] },
          { className: '6', subjects: ['Mathematics', 'Science', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['7:00 AM - 8:30 AM'] },
          { className: '7', subjects: ['Mathematics', 'Science', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['8:30 AM - 10:00 AM'] },
          { className: '8', subjects: ['Mathematics', 'Science', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['8:30 AM - 10:00 AM'] },
          { className: '9', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'], duration: '1 Year', batchTimings: ['6:00 AM - 8:00 AM'] },
          { className: '10', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology'], duration: '1 Year', batchTimings: ['6:00 AM - 8:00 AM'] },
          { className: '11', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], duration: '1 Year', batchTimings: ['6:00 AM - 8:30 AM'] },
          { className: '12', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology'], duration: '1 Year', batchTimings: ['6:00 AM - 8:30 AM'] }
        ]);
        console.log('✅ Admin and Courses seeded automatically into Memory DB!');
      }
    } catch (fallbackError) {
      console.error(`❌ Fallback memory server failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
