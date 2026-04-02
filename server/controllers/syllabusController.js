const path = require('path');
const Syllabus = require('../models/Syllabus');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

exports.uploadSyllabus = async (req, res) => {
  try {
    const { board, classLevel } = req.body;

    if (!board || !classLevel) {
      return res.status(400).json({ success: false, message: 'Board and classLevel are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
    }

    const publicId = `${board.toLowerCase().trim().replace(/[^a-z0-9]/g, '')}_class${String(classLevel).toLowerCase().trim().replace(/[^a-z0-9]/g, '')}_syllabus`;

    // Delete old Cloudinary file if updating
    const existing = await Syllabus.findOne({ board, classLevel });
    if (existing && existing.cloudinaryId) {
      await deleteFromCloudinary(existing.cloudinaryId, 'raw');
    }

    const result = await uploadToCloudinary(req.file.buffer, 'syllabus', publicId, 'raw');

    const syllabus = await Syllabus.findOneAndUpdate(
      { board, classLevel },
      {
        board,
        classLevel,
        pdfUrl: result.url,
        cloudinaryId: result.publicId,
        fileName: req.file.originalname,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, data: syllabus });
  } catch (error) {
    console.error('Syllabus upload error:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    if (!syllabus) {
      return res.status(404).json({ success: false, message: 'Syllabus not found' });
    }

    if (syllabus.cloudinaryId) {
      await deleteFromCloudinary(syllabus.cloudinaryId, 'raw');
    }

    await Syllabus.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Syllabus deleted successfully' });
  } catch (err) {
    console.error('Error deleting syllabus:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getAllSyllabus = async (req, res) => {
  try {
    const syllabuses = await Syllabus.find({}).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: syllabuses });
  } catch (error) {
    console.error('Error in getAllSyllabus:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
