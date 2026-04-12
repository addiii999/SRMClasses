require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

async function debugAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const admins = await Admin.find({}).select('+password');
    console.log('--- Current Admins in DB ---');
    admins.forEach(a => {
      console.log(`Email: ${a.email}`);
      console.log(`Role: ${a.role}`);
      console.log(`Password Hash starts with: ${a.password?.substring(0, 10)}...`);
      console.log('---------------------------');
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugAdmins();
