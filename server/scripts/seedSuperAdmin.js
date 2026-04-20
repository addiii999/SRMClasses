require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.SUPER_ADMIN_EMAIL || 'aayushgupta.srm.540@gmail.com';
    // Password must be strong: 8 chars, 1 number, 1 special char
    const password = 'SuperAdmin@123'; 

    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log(`⚠️ Admin with email ${email} already exists.`);
      process.exit(0);
    }

    const superAdmin = await Admin.create({
      name: 'Super Admin',
      email: email,
      password: password,
      role: 'SUPER_ADMIN',
      isActive: true
    });

    console.log('---------------------------------------------');
    console.log('✅ SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Admin ID: ${superAdmin.adminId}`);
    console.log('---------------------------------------------');
    console.log('USE THESE CREDENTIALS TO LOGIN ON THE WEBSITE.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding super admin:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
