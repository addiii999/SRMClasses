const Course = require('../models/Course');
const mongoose = require('mongoose');

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ className: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().sort({ className: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { className, description, isActive } = req.body;
    const course = await Course.create({ className, description, isActive });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, description, isActive } = req.body;
    
    // Explicitly validate ID to satisfy static analysis
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const course = await Course.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id), 
      { 
        className: String(className), 
        description: description ? String(description) : undefined, 
        isActive: Boolean(isActive) 
      }, 
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    
    const adminEmail = req.user ? req.user.email : 'Admin';
    await course.softDelete(adminEmail);
    res.json({ success: true, message: 'Course moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCourses, getAllCourses, createCourse, updateCourse, deleteCourse };
