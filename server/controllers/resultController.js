const Result = require('../models/Result');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
    if (req.file) {
      const { studentName, examName } = req.body;
      const rawName = (studentName || 'student').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const rawExam = (examName || 'exam').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const ext = path.extname(req.file.originalname);
      const fileName = `result_${rawExam}_${rawName}_${Date.now()}${ext}`;
      
      const targetDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
      const targetPath = path.join(targetDir, fileName);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.renameSync(req.file.path, targetPath);
      finalUrl = `/uploads/images/${fileName}`;
    }
    const result = await Result.create({
      ...req.body,
      imageUrl: finalUrl,
      fileName: req.file ? req.file.originalname : undefined
    });
    res.status(201).json({ success: true, data: result });
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
    if (result && result.imageUrl) {
      const fileName = path.basename(result.imageUrl);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'images', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Result.findByIdAndDelete(id);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, createResult, deleteResult };
