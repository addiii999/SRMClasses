const Branch = require('../models/Branch');
const mongoose = require('mongoose');
const { adminProtect } = require('../middleware/adminAuth');
const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';

// @desc Get all active branches
// @route GET /api/branches
// @access Private/Admin (or public for listing)
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).select('-__v');
    res.json({ success: true, data: branches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc Create a new branch
// @route POST /api/branches
// @access Private/Admin
exports.createBranch = async (req, res) => {
  try {
    const { name, address, googleMapsLink, phone, branchCode } = req.body;
    const existing = await Branch.findOne({ branchCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Branch code already exists' });
    }
    const branch = await Branch.create({ name, address, googleMapsLink, phone, branchCode });
    res.status(201).json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc Update a branch (including soft delete toggle)
// @route PUT /api/branches/:id
// @access Private/Admin
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid branch ID' });
    }
    const allowedFields = ['name', 'address', 'googleMapsLink', 'phone', 'branchCode', 'isActive'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const branch = await Branch.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (err) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

// @desc Soft delete (deactivate) a branch
// @route DELETE /api/branches/:id
// @access Private/Admin
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid branch ID' });
    }
    const branch = await Branch.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, message: 'Branch deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};
