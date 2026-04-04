const Faculty = require('../models/Faculty');

// @desc Get all active faculty (Public)
exports.getPublicFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all faculty (Admin)
exports.getAdminFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Add new faculty
exports.addFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.create(req.body);
    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Update faculty
exports.updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, data: faculty });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc Soft delete faculty
exports.deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }
    res.json({ success: true, message: 'Faculty deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
