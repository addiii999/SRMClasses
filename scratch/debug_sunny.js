const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const User = require('../server/models/User');
const DemoBooking = require('../server/models/DemoBooking');

async function debugSunny() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const demo = await DemoBooking.findOne({ mobile: '9798681756' }).populate('convertedStudentId');
    if (!demo) {
      console.log('Demo not found for mobile 9798681756');
      return;
    }

    console.log('Demo Found:', {
      _id: demo._id,
      name: demo.name,
      status: demo.status,
      isConverted: demo.isConverted,
      convertedStudentId: demo.convertedStudentId ? demo.convertedStudentId._id : 'NULL'
    });

    if (demo.convertedStudentId) {
      const student = demo.convertedStudentId;
      console.log('Student Record Found:', {
        _id: student._id,
        name: student.name,
        role: student.role,
        registrationStatus: student.registrationStatus,
        verificationStatus: student.verificationStatus,
        branch: student.branch,
        isDeleted: student.isDeleted
      });
    } else {
      // Search for user by mobile
      const user = await User.findOne({ mobile: '9798681756' }).select('+isDeleted').lean();
      if (user) {
        console.log('User found by mobile but not linked to Demo:', {
          _id: user._id,
          name: user.name,
          role: user.role,
          registrationStatus: user.registrationStatus,
          isDeleted: user.isDeleted
        });
      } else {
        console.log('No user found with mobile 9798681756');
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

debugSunny();
