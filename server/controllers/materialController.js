const StudyMaterial = require('../models/StudyMaterial');
const path = require('path');

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, description, studentClass, subject, type } = req.body;
    const material = await StudyMaterial.create({
      title,
      description,
      studentClass,
      subject,
      type,
      fileUrl: `/uploads/${req.file.filename}`,
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
    let query = {};
    // Students can only see their class materials or 'all'
    if (studentClass) {
      query.$or = [{ studentClass }, { studentClass: 'all' }];
    }
    if (type) query.type = type;
    const materials = await StudyMaterial.find(query).sort({ uploadedAt: -1 });
    res.json({ success: true, data: materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    await StudyMaterial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadMaterial, getMaterials, deleteMaterial };
