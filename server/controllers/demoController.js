const DemoBooking = require('../models/DemoBooking');
const mongoose = require('mongoose');

const bookDemo = async (req, res) => {
  try {
    const { name, email, mobile, studentClass, message } = req.body;
    const booking = await DemoBooking.create({ name, email, mobile, studentClass, message });
    res.status(201).json({ success: true, message: 'Demo class booked successfully', data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDemoBookings = async (req, res) => {
  try {
    const { status } = req.query;
    if (status && typeof status !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid status parameter' });
    }
    let query = {};
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
    await DemoBooking.findByIdAndDelete(id);
    res.json({ success: true, message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { bookDemo, getDemoBookings, updateDemoBooking, deleteDemoBooking };
