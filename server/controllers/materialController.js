const StudyMaterial = require('../models/StudyMaterial');
const { uploadToCloudinary } = require('../utils/cloudinary');

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, description, studentClass, subject, type } = req.body;
    
    // Cloudinary upload (PDFs/Images are auto-detected)
    const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'srmclasses/materials');

    const material = await StudyMaterial.create({
      title,
      description,
      studentClass,
      subject,
      type,
      fileUrl: cloudinaryUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
    });
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { studentClass, type } = req.query;
    if ((studentClass && typeof studentClass !== 'string') || (type && typeof type !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid query parameters' });
    }
    let query = {};
    if (studentClass && typeof studentClass === 'string') {
      query.$or = [{ studentClass }, { studentClass: 'all' }];
    }
    if (type && typeof type === 'string') query.type = type;
    const materials = await StudyMaterial.find(query).sort({ uploadedAt: -1 });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    await StudyMaterial.findByIdAndDelete(id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadMaterial, getMaterials, deleteMaterial };
