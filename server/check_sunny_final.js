const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const User = require('./models/User');

async function checkSunny() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const mobile = '9798681756';
    const student = await User.findOne({ mobile });
    
    if (student) {
      console.log('Sunny Record:', {
        _id: student._id,
        name: student.name,
        role: student.role,
        registrationStatus: student.registrationStatus,
        verificationStatus: student.verificationStatus,
        branch: student.branch,
        studentId: student.studentId,
        isApproved: student.isApproved,
        isEnrolled: student.isEnrolled
      });
    } else {
      console.log('Sunny not found in User collection');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSunny();
