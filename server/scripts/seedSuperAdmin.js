require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const seedSuperAdmin = async () => {
  await connectDB();

  try {
    const existingSuperAdmin = await Admin.findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      console.log('✅ A SUPER_ADMIN already exists.');
      process.exit(0);
    }

    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@srmclasses.in';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@1234!';

    await Admin.create({
      name: 'Super Admin',
      email: email,
      password: password,
      role: 'SUPER_ADMIN',
      adminId: 'ADM-000',
    });

    console.log(`✅ Default SUPER_ADMIN created successfully.`);
    console.log(`Email: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating SUPER_ADMIN:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
