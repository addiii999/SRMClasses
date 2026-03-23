/**
 * Admin Seed Script
 * Run once to create the admin account in MongoDB.
 * Usage: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Course = require('./models/Course');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ MongoDB Connected');
};

const seedAdmin = async () => {
  const existing = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log('⚠️  Admin already exists. Skipping.');
    return;
  }
  await Admin.create({
    email: process.env.ADMIN_EMAIL || 'srmclasses01@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'SRMAdmin@2026',
  });
  console.log('✅ Admin created:', process.env.ADMIN_EMAIL);
};

const seedCourses = async () => {
  const count = await Course.countDocuments();
  if (count > 0) {
    console.log('⚠️  Courses already seeded. Skipping.');
    return;
  }

  const courses = [
    { className: '5', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['7:00 AM - 8:30 AM', '4:00 PM - 5:30 PM'] },
    { className: '6', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['7:00 AM - 8:30 AM', '4:00 PM - 5:30 PM'] },
    { className: '7', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['8:30 AM - 10:00 AM', '5:30 PM - 7:00 PM'] },
    { className: '8', subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'], duration: '1 Year', batchTimings: ['8:30 AM - 10:00 AM', '5:30 PM - 7:00 PM'] },
    { className: '9', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['6:00 AM - 8:00 AM', '3:00 PM - 5:00 PM'] },
    { className: '10', subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi'], duration: '1 Year', batchTimings: ['6:00 AM - 8:00 AM', '3:00 PM - 5:00 PM'] },
    { className: '11', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English'], duration: '1 Year', batchTimings: ['6:00 AM - 8:30 AM', '5:00 PM - 7:30 PM'] },
    { className: '12', subjects: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'English'], duration: '1 Year', batchTimings: ['6:00 AM - 8:30 AM', '5:00 PM - 7:30 PM'] },
  ];

  await Course.insertMany(courses);
  console.log('✅ Courses seeded for Class 5 to 12');
};

const seed = async () => {
  try {
    await connectDB();
    await seedAdmin();
    await seedCourses();
    console.log('\n🎉 Seeding complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seed();
