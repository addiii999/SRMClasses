const Result = require('../models/Result');
const mongoose = require('mongoose');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const getResults = async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createResult = async (req, res) => {
  try {
    let finalUrl = '';
    let cloudinaryId = '';

    if (req.file) {
      const { studentName, examName } = req.body;
      const rawName = (studentName || 'student').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const rawExam = (examName || 'exam').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const publicId = `result_${rawExam}_${rawName}_${Date.now()}`;

      const result = await uploadToCloudinary(req.file.buffer, 'results', publicId, 'image');
      finalUrl = result.url;
      cloudinaryId = result.publicId;
    }

    const resultDoc = await Result.create({
      ...req.body,
      imageUrl: finalUrl,
      cloudinaryId,
      fileName: req.file ? req.file.originalname : undefined,
    });
    res.status(201).json({ success: true, data: resultDoc });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    if (result.cloudinaryId) {
      await deleteFromCloudinary(result.cloudinaryId, 'image');
    }
    await Result.findByIdAndDelete(id);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, createResult, deleteResult };
