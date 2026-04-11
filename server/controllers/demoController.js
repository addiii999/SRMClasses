const DemoBooking = require('../models/DemoBooking');
const User = require('../models/User');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');
const { generateStudentId } = require('../utils/studentIdGenerator');
const { sendAdmissionNotification } = require('../utils/messageService');

const bookDemo = async (req, res) => {
  try {
    let { name, email, mobile, studentClass, preferredDate, preferredTime, subject, branch } = req.body;

    // --- 1. BASIC CLEANUP ---
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    
    // Clean mobile: Remove everything except numbers
    mobile = (mobile || '').replace(/\D/g, '');
    // If user typed 919876543210 (12 digits) or starting with 0
    if (mobile.startsWith('91') && mobile.length === 12) {
      mobile = mobile.substring(2);
    } else if (mobile.startsWith('0') && mobile.length === 11) {
      mobile = mobile.substring(1);
    }

    // --- 2. ADVANCED VALIDATION ---
    // Phone length and starting digit
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' });
    }

    // Block completely fake phone patterns
    if (mobile === '1234567890' || mobile === '0987654321' || /(.)\1{6,}/.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid phone number pattern detected.' });
    }

    // Name Validation
    if (name.length < 3) {
      return res.status(400).json({ success: false, message: 'Name must be at least 3 characters long.' });
    }
    if (/\d/.test(name)) {
      return res.status(400).json({ success: false, message: 'Name cannot contain numbers.' });
    }
    
    const fakeNames = ['test', 'demo', 'asdf', 'qwer', 'zxcv', 'abcd', '1234'];
    if (fakeNames.includes(name.toLowerCase()) || /^(.)\1+$/.test(name.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Please enter a genuine name.' });
    }

    // --- 3. DUPLICATE CHECK ---
    const existingDemos = await DemoBooking.find({ mobile }).sort({ createdAt: -1 });
    
    // Max 2 bookings per day generic protection
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const demosToday = existingDemos.filter(d => new Date(d.createdAt) >= today);
    if (demosToday.length >= 2) {
      return res.status(429).json({ success: false, message: 'Maximum booking limit reached for this number today.' });
    }

    // Status based duplicate protection
    const activeDemo = existingDemos.find(d => ['pending', 'visited', 'converted'].includes(d.status));
    if (activeDemo) {
      return res.status(400).json({ success: false, message: 'You have already booked a demo. Our team will contact you.' });
    }

    // --- 4. SMART FLAGGING (Low Confidence) ---
    let confidenceStatus = 'High';
    
    // Flag if 5 repeating digits (but not 7, otherwise it'd be blocked above)
    if (/(.)\1{4,}/.test(mobile)) {
      confidenceStatus = 'Low';
    }
    
    // Flag fake-looking emails
    const fakeEmailPatterns = ['test@', 'fake@', 'abc@', 'dummy@'];
    if (fakeEmailPatterns.some(pattern => email.startsWith(pattern))) {
      confidenceStatus = 'Low';
    }

    // --- 5. FINALIZE ---
    if (preferredDate) {
      const selectedDate = new Date(preferredDate);
      const todayDate = new Date();
      selectedDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < todayDate) {
        return res.status(400).json({ success: false, message: 'Past date selection is not allowed' });
      }
    }

    let branchId = branch;
    if (!branchId) {
      const defaultBranch = await Branch.findOne({ branchCode: 'RI', isActive: true });
      branchId = defaultBranch ? defaultBranch._id : null;
    }

    const booking = await DemoBooking.create({ 
      name, email, mobile, studentClass, preferredDate, preferredTime, subject, 
      branch: branchId,
      confidenceStatus
    });
    
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
    if (booking.isConverted && booking.convertedStudentId) {
      const existingUser = await User.findById(booking.convertedStudentId);
      if (existingUser) {
        return res.json({ 
          success: true, 
          message: 'This booking is already converted to a student.', 
          data: { user: existingUser, booking } 
        });
      }
    }

    // --- QUICK CONVERT (NOW ENABLED FOR ADMIN) ---
    if (req.body.isQuickConvert) {
      const { feeType, satPercentage, installmentPlan, board } = req.body;
      const { FEE_STRUCTURE } = require('../utils/feeUtils');
      
      let user = await User.findOne({ $or: [{ mobile: booking.mobile }, { email: booking.email }] });
      const sessionYear = new Date().getFullYear().toString();
      const adminName = req.admin ? req.admin.email : 'Admin';
      
      let studentId;
      if (!user || (!user.isStudent && !user.studentId)) {
         studentId = await generateStudentId(sessionYear, booking.studentClass, booking.branch);
      } else {
         studentId = user.studentId || await generateStudentId(sessionYear, booking.studentClass, booking.branch);
      }

      const verifiedBoard = board || 'CBSE';

      let actualFee = 0;
      if (feeType && feeType !== 'None' && FEE_STRUCTURE[feeType]) {
        actualFee = FEE_STRUCTURE[feeType][booking.studentClass] || 0;
      }

      const feeSnapshot = {
        actualFee,
        satPercentage: parseInt(satPercentage) || 0,
        installmentPlan: parseInt(installmentPlan) || 1,
        updatedBy: adminName,
        updatedAt: Date.now()
      };

      if (user) {
        user.isStudent = true;
        user.isEnrolled = true;
        user.verificationStatus = 'approved';
        user.registrationStatus = 'Active';
        user.isApproved = true;
        user.studentClass = booking.studentClass;
        user.board = verifiedBoard;
        user.branch = booking.branch._id;
        user.studentId = studentId;
        user.feeType = feeType || 'None';
        user.feeSnapshot = feeSnapshot;
        user.shouldChangePassword = true;
        user.enrollmentLogs.push({ status: 'enrolled', updatedBy: adminName, updatedAt: Date.now() });
        await user.save();
      } else {
        user = await User.create({
          name: booking.name,
          email: booking.email,
          mobile: booking.mobile,
          studentClass: booking.studentClass,
          board: verifiedBoard,
          password: booking.mobile,
          role: 'student',
          isStudent: true,
          isEnrolled: true,
          isEnrolled: true,
          isApproved: true,
          registrationStatus: 'Active',
          verificationStatus: 'approved',
          shouldChangePassword: true,
          branch: booking.branch._id,
          studentId,
          feeType: feeType || 'None',
          feeSnapshot,
          createdByAdmin: true,
          enrollmentLogs: [{ status: 'enrolled', updatedBy: adminName, updatedAt: Date.now() }]
        });
      }

      booking.isConverted = true;
      booking.convertedStudentId = user._id;
      booking.status = 'converted';
      await booking.save();

      return res.json({ success: true, message: 'Test Convert Success! Student created and fee assigned.', data: { user, booking } });
    }

    // --- EXISTING FLOW ---
    // 1. Check for duplicates (mobile or email)
    let user = await User.findOne({ $or: [{ mobile: booking.mobile }, { email: booking.email }] });

    const sessionYear = new Date().getFullYear().toString();

    if (user) {
      // 2a. Update existing user (mark as pending student for manual verification)
      user.name = booking.name;
      user.isStudent = true;
      user.isEnrolled = false;
      user.registrationStatus = 'Pending';
      user.verificationStatus = 'pending';
      user.board = booking.board || user.board || 'CBSE';
      user.shouldChangePassword = true;
      await user.save();
    } else {
      // 2b. Create new user as pending student
      user = await User.create({
        name: booking.name,
        email: booking.email,
        mobile: booking.mobile,
        studentClass: booking.studentClass,
        password: booking.mobile, // Mobile as default password
        role: 'student',
        isStudent: true,
        isEnrolled: false,
        registrationStatus: 'Pending',
        verificationStatus: 'pending',
        shouldChangePassword: true,
        board: booking.board || 'CBSE',
        branch: booking.branch._id
      });
    }

    // 3. Update demo booking
    booking.isConverted = true;
    booking.convertedStudentId = user._id;
    booking.status = 'converted';
    await booking.save();

    res.json({ success: true, message: 'Demo converted! Please approve the student in Verification tab.', data: { user, booking } });

  } catch (error) {
    if (error.code === 11000) {
       return res.status(500).json({ success: false, message: 'ID Generation Conflict or Duplicate Email/Mobile.' });
    }
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
