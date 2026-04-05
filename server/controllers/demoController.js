const DemoBooking = require('../models/DemoBooking');
const mongoose = require('mongoose');

const bookDemo = async (req, res) => {
  try {
    const { name, email, mobile, studentClass, preferredDate, preferredTime, subject } = req.body;

    // Backend Validation: Prevent selection of past dates
    if (preferredDate) {
      const selectedDate = new Date(preferredDate);
      const today = new Date();
      // Set both to start of day for accurate comparison
      selectedDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        return res.status(400).json({ success: false, message: 'Past date selection is not allowed' });
      }
    }

    // Assign branch: try from body, then default (RAVI01)
    let branchId = req.body.branch;
    if (!branchId) {
      const Branch = require('../models/Branch');
      const defaultBranch = await Branch.findOne({ branchCode: 'RAVI01', isActive: true });
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
    if (status && typeof status !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid status parameter' });
    }
    let query = {};
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.branch = branch;
    }
    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }
    const bookings = await DemoBooking.find(query).sort({ createdAt: -1 });
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
      { status: typeof status === 'string' ? status : undefined }, // Only allow status update
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDemoBooking = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const booking = await DemoBooking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await booking.softDelete(adminEmail);
    res.json({ success: true, message: 'Booking moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bookDemo, getDemoBookings, updateDemoBooking, deleteDemoBooking };
