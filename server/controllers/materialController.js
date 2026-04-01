const StudyMaterial = require('../models/StudyMaterial');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, description, studentClass, subject, type } = req.body;
    
    const rawClass = (studentClass || 'all').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const rawSubject = (subject || 'general').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const ext = path.extname(req.file.originalname);
    const fileName = `material_${rawClass}_${rawSubject}_${Date.now()}${ext}`;
    
    const targetDir = path.join(__dirname, '..', 'public', 'uploads', 'materials');
    const targetPath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    fs.renameSync(req.file.path, targetPath);
    
    const finalUrl = `/uploads/materials/${fileName}`;

    const material = await StudyMaterial.create({
      title,
      description,
      studentClass,
      subject,
      type,
      fileUrl: finalUrl,
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const material = await StudyMaterial.findById(id);
    if (material && material.fileUrl) {
      const fileName = path.basename(material.fileUrl);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'materials', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await StudyMaterial.findByIdAndDelete(id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadMaterial, getMaterials, deleteMaterial };
