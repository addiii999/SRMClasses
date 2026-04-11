const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');
const DemoBooking = require('../server/models/DemoBooking');

async function resetSunny() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // 1. Find Sunny's booking
    const mobile = '9798681756';
    const booking = await DemoBooking.findOne({ mobile });
    
    if (booking) {
      console.log('Found Sunny - Resetting status...');
      booking.isConverted = false;
      booking.status = 'visited';
      booking.convertedStudentId = null;
      await booking.save();
      console.log('Sunny booking reset to Visited.');
    } else {
      console.log('Sunny booking not found.');
    }

    // 2. Clean up broken user record if any exists
    const user = await User.findOne({ mobile });
    if (user && !user.studentId) { // Only delete if it doesn't have a student ID (not a real student yet)
      console.log('Removing broken user record...');
      await User.deleteOne({ _id: user._id });
      console.log('Broken user record removed.');
    }

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
}

resetSunny();
