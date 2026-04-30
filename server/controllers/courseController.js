const Course = require('../models/Course');
const mongoose = require('mongoose');
const GENERIC_SERVER_ERROR = 'Something went wrong. Please try again.';
const parseBooleanInput = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return Boolean(value);
};

const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true, isDeleted: false }).sort({ className: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isDeleted: false }).sort({ className: 1 });
    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

const createCourse = async (req, res) => {
  try {
    const { className, board, subjects, duration, batchTimings, fee, description, isActive } = req.body;
    const course = await Course.create({
      className,
      board,
      subjects,
      duration,
      batchTimings,
      fee,
      description,
      ...(isActive !== undefined ? { isActive: parseBooleanInput(isActive) } : {}),
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, board, subjects, duration, batchTimings, fee, description, isActive } = req.body;
    
    // Explicitly validate ID to satisfy static analysis
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const updates = {
      className: className !== undefined ? String(className) : undefined,
      board: board !== undefined ? String(board) : undefined,
      subjects: subjects !== undefined ? subjects : undefined,
      duration: duration !== undefined ? String(duration) : undefined,
      batchTimings: batchTimings !== undefined ? batchTimings : undefined,
      fee: fee !== undefined ? Number(fee) : undefined,
      description: description !== undefined ? String(description) : undefined,
    };
    if (isActive !== undefined) {
      updates.isActive = parseBooleanInput(isActive);
    }

    const course = await Course.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id), 
      updates, 
      { new: true }
    );
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
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
    
    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await course.softDelete(adminEmail);
    res.json({ success: true, message: 'Course moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: GENERIC_SERVER_ERROR });
  }
};

module.exports = { getCourses, getAllCourses, createCourse, updateCourse, deleteCourse };
