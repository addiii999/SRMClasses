const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./models/User');
const DemoBooking = require('./models/DemoBooking');

async function fixTestingData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Update Adityaaa's mobile to ...55
    const oldMobile = '9798681756';
    const newMobile = '9798681755';
    
    const user = await User.findOneAndUpdate(
      { mobile: oldMobile },
      { mobile: newMobile },
      { new: true }
    );
    
    if (user) {
      console.log(`Updated User ${user.name} mobile to ${newMobile}`);
    } else {
      console.log('User Adityaaa not found with old mobile.');
    }

    // 2. Reset Sunny's booking to Visited so it can be converted again with the old (...56) number
    const booking = await DemoBooking.findOneAndUpdate(
      { name: /Sunny/i },
      { 
        mobile: oldMobile, 
        isConverted: false, 
        status: 'visited', 
        convertedStudentId: null 
      },
      { new: true }
    );

    if (booking) {
      console.log(`Reset Sunny's booking with mobile ${oldMobile}`);
    } else {
      console.log('Sunny booking not found.');
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
}

fixTestingData();
