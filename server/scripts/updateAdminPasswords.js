require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const updateAdminPasswords = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB.');

    const superAdminEmail = 'aayushgupta.srm.540@gmail.com';
    const adminEmail = 'srmclasses01@gmail.com';

    const superAdminPlain = process.env.SUPER_ADMIN_PLAIN;
    const adminPlain = process.env.ADMIN_PLAIN;

    if (!superAdminPlain || !adminPlain) {
      console.error('Error: Please provide SUPER_ADMIN_PLAIN and ADMIN_PLAIN environment variables.');
      process.exit(1);
    }

    console.log('Hashing passwords...');
    const superAdminHash = await bcrypt.hash(superAdminPlain, 12);
    const adminHash = await bcrypt.hash(adminPlain, 12);

    console.log('Upserting Super Admin...');
    await Admin.findOneAndUpdate(
      { email: superAdminEmail },
      {
        name: 'Super Admin',
        password: superAdminHash,
        role: 'SUPER_ADMIN',
        isActive: true
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Upserting Normal Admin...');
    await Admin.findOneAndUpdate(
      { email: adminEmail },
      {
        name: 'Admin',
        password: adminHash,
        role: 'ADMIN',
        isActive: true
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log('Successfully updated Admin and Super Admin passwords.');
    process.exit(0);
  } catch (error) {
    console.error('Error updating passwords:', error);
    process.exit(1);
  }
};

updateAdminPasswords();
