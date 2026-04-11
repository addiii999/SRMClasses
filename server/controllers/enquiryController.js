const Enquiry = require('../models/Enquiry');
const mongoose = require('mongoose');

// @desc    Submit enquiry (public)
// @route   POST /api/enquiries
const submitEnquiry = async (req, res) => {
  try {
    let { name, email, mobile, studentClass, schoolName, message } = req.body;

    // 1. Strict Validation
    if (!name || !email || !mobile || !schoolName) {
      return res.status(400).json({ success: false, message: 'All fields expect message are required' });
    }

    // Trim all inputs
    name = name.trim();
    email = email.trim();
    mobile = mobile.trim();
    schoolName = schoolName.trim();
    message = message?.trim() || null;

    // School Name: min 3 chars, letters/spaces only
    const schoolRegex = /^[a-zA-Z\s]{3,}$/;
    if (!schoolRegex.test(schoolName)) {
      return res.status(400).json({ success: false, message: 'Invalid School Name. Must be at least 3 characters and contain only letters/spaces.' });
    }

    // Mobile: 10 digits, starts with 6-9
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({ success: false, message: 'Invalid Mobile Number. Must be 10 digits and start with 6-9.' });
    }

    // 2. Prevent Duplicate (same mobile within 10 min)
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingEnquiry = await Enquiry.findOne({
      mobile,
      createdAt: { $gte: tenMinsAgo },
    });

    if (existingEnquiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already submitted an enquiry recently. Please wait a few minutes before trying again.' 
      });
    }

    // Find default branch (RAVI01) for public enquiries
    const Branch = require('../models/Branch');
    const defaultBranch = await Branch.findOne({ branchCode: 'RI', isActive: true });
    const branchId = defaultBranch ? defaultBranch._id : null;

    const enquiry = await Enquiry.create({ 
      name, 
      email, 
      mobile, 
      studentClass, 
      schoolName,
      message: message || null, 
      branch: branchId 
    });

    res.status(201).json({ success: true, message: 'Your enquiry has been submitted successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all enquiries (admin)
// @route   GET /api/enquiries
const getEnquiries = async (req, res) => {
  try {
    const { status, search, branch, sortBy } = req.query;
    let query = {};
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.branch = branch;
    }
    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex special chars
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { mobile: { $regex: safeSearch, $options: 'i' } },
        { schoolName: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    // Sorting Logic
    let sortOptions = { createdAt: -1 }; // Default
    if (sortBy === 'school') sortOptions = { schoolName: 1 };
    else if (sortBy === 'class') sortOptions = { studentClass: 1 };
    else if (sortBy === 'date') sortOptions = { createdAt: -1 };

    const enquiries = await Enquiry.find(query).sort(sortOptions);
    res.json({ success: true, count: enquiries.length, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update enquiry status (admin)
// @route   PATCH /api/enquiries/:id
const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    // Explicitly validate ID to satisfy static analysis
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const ALLOWED_STATUSES = ['New', 'Contacted', 'Converted'];

    // Validate status if provided
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` 
      });
    }

    // Validate notes if provided to prevent NoSQL injection via operator objects
    if (notes !== undefined && typeof notes !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid notes. Notes must be a string.'
      });
    }

    const updateData = {};
    if (status) updateData.status = String(status);
    if (notes !== undefined) updateData.notes = String(notes);

    const enquiry = await Enquiry.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id), 
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete enquiry (admin)
// @route   DELETE /api/enquiries/:id
const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    
    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await enquiry.softDelete(adminEmail);
    res.json({ success: true, message: 'Enquiry moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { submitEnquiry, getEnquiries, updateEnquiry, deleteEnquiry };
