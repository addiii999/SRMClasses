require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmins = async () => {
  try {
    console.log('\x1b[36m%s\x1b[0m', '🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminsToSeed = [
      {
        name: 'Super Admin',
        email: process.env.SUPER_ADMIN_EMAIL,
        password: process.env.SUPER_ADMIN_PASSWORD_HASH,
        role: 'SUPER_ADMIN',
        tag: 'SUPER'
      },
      {
        name: 'SRM Classes Admin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD_HASH,
        role: 'ADMIN',
        tag: 'NORMAL'
      }
    ];

    for (const a of adminsToSeed) {
      if (!a.email || !a.password) {
        console.log('\x1b[33m%s\x1b[0m', `⚠️ Skipping ${a.role}: Email or Hash missing in .env`);
        continue;
      }

      const existing = await Admin.findOne({ email: a.email.toLowerCase().trim() });
      
      if (existing) {
        console.log('\x1b[32m%s\x1b[0m', `✅ Admin ${a.email} already exists. Skipping password overwrite as per safety rules.`);
      } else {
        console.log('\x1b[35m%s\x1b[0m', `✨ Creating new ${a.role}: ${a.email}...`);
        await Admin.create({
          name: a.name,
          email: a.email,
          password: a.password,
          role: a.role
        });
        console.log('\x1b[32m%s\x1b[0m', `Successfully created ${a.role}.`);
      }
    }

    await mongoose.disconnect();
    console.log('\x1b[36m%s\x1b[0m', '✅ Admin seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', '❌ SEED ERROR:', err.message);
    process.exit(1);
  }
};

seedAdmins();
