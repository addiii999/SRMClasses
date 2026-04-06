const DemoBooking = require('../models/DemoBooking');
const User = require('../models/User');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');
const { generateStudentId } = require('../utils/studentIdGenerator');
const { sendAdmissionNotification } = require('../utils/messageService');

const bookDemo = async (req, res) => {
  try {
    const { name, email, mobile, studentClass, preferredDate, preferredTime, subject } = req.body;

    if (preferredDate) {
      const selectedDate = new Date(preferredDate);
      const today = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return res.status(400).json({ success: false, message: 'Past date selection is not allowed' });
      }
    }

    let branchId = req.body.branch;
    if (!branchId) {
      const defaultBranch = await Branch.findOne({ branchCode: 'RI', isActive: true });
      branchId = defaultBranch ? defaultBranch._id : null;
    }

    const booking = await DemoBooking.create({ name, email, mobile, studentClass, preferredDate, preferredTime, subject, branch: branchId });
    res.status(201).json({ success: true, message: 'Demo class booked successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDemoBookings = async (req, res) => {
  try {
    const { status, branch } = req.query;
    let query = {};
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.branch = branch;
    }
    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }
    const bookings = await DemoBooking.find(query).sort({ createdAt: -1 }).populate('branch', 'name branchCode').populate('convertedStudentId', 'name studentId');
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDemoBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const booking = await DemoBooking.findByIdAndUpdate(
      id, 
      { status: typeof status === 'string' ? status.toLowerCase() : undefined },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markVisited = async (req, res) => {
  try {
    const booking = await DemoBooking.findByIdAndUpdate(req.params.id, { status: 'visited' }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const convertToStudent = async (req, res) => {
  try {
    const booking = await DemoBooking.findById(req.params.id).populate('branch');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.isConverted) return res.status(400).json({ success: false, message: 'Already converted' });

    // 1. Check for duplicates (mobile or email)
    let user = await User.findOne({ $or: [{ mobile: booking.mobile }, { email: booking.email }] });

    const sessionYear = new Date().getFullYear().toString();

    if (user) {
      // 2a. Update existing user
      user.isStudent = true;
      user.isEnrolled = true;
      user.verificationStatus = 'approved';
      user.shouldChangePassword = true;
      if (!user.studentId) {
        user.studentId = await generateStudentId(sessionYear, booking.studentClass, booking.branch);
      }
      await user.save();
    } else {
      // 2b. Create new user
      const studentId = await generateStudentId(sessionYear, booking.studentClass, booking.branch);
      user = await User.create({
        name: booking.name,
        email: booking.email,
        mobile: booking.mobile,
        studentClass: booking.studentClass,
        password: booking.mobile, // Mobile as default password
        role: 'student',
        isStudent: true,
        isEnrolled: true,
        verificationStatus: 'approved',
        shouldChangePassword: true,
        studentId,
        branch: booking.branch._id
      });
    }

    // 3. Update demo booking
    booking.isConverted = true;
    booking.convertedStudentId = user._id;
    booking.status = 'converted';
    await booking.save();

    // 4. Send Message (Placeholder)
    await sendAdmissionNotification(user, booking.branch.name);

    res.json({ success: true, message: 'Demo converted to student successfully', data: { user, booking } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectDemo = async (req, res) => {
  try {
    const booking = await DemoBooking.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDemoBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid ID format' });
    const booking = await DemoBooking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await booking.softDelete(adminEmail);
    res.json({ success: true, message: 'Booking moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bookDemo, getDemoBookings, updateDemoBooking, deleteDemoBooking, markVisited, convertToStudent, rejectDemo };
