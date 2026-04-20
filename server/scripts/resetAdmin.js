require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const resetSuperAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = process.env.SUPER_ADMIN_EMAIL || 'aayushgupta.srm.540@gmail.com';
    const newPassword = process.env.ADMIN_PASSWORD_PLAIN; // Reads from .env (Safe from GitHub)

    let admin = await Admin.findOne({ email });
    
    if (admin) {
      console.log(`Found admin: ${email}. Resetting password...`);
      admin.password = newPassword;
      await admin.save();
      console.log('✅ Password updated successfully.');
    } else {
      console.log(`Admin ${email} not found. Creating new one...`);
      admin = await Admin.create({
        name: 'Super Admin',
        email,
        password: newPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      });
      console.log('✅ New Super Admin created.');
    }

    console.log('---------------------------------------------');
    console.log('CREDENTIALS FOR LOGIN:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log('---------------------------------------------');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

resetSuperAdmin();
