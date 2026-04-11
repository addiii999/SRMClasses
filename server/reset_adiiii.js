const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./models/User');
const DemoBooking = require('./models/DemoBooking');

async function resetAdiiii() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // 1. Find Adiiii's booking
    const mobile = '9798681777';
    const booking = await DemoBooking.findOne({ mobile });
    
    if (booking) {
      console.log('Found Adiiii - Resetting status...');
      booking.isConverted = false;
      booking.status = 'visited';
      booking.convertedStudentId = null;
      await booking.save();
      console.log('Adiiii booking reset to Visited.');
    } else {
      console.log('Adiiii booking not found.');
    }

    // 2. Clean up user record if exists
    await User.deleteOne({ mobile });
    console.log('Cleared user record for mobile 9798681777');

    await mongoose.disconnect();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
  }
}

resetAdiiii();
