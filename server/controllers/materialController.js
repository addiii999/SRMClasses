const StudyMaterial = require('../models/StudyMaterial');
const mongoose = require('mongoose');
const { uploadFile, deleteFile } = require('../utils/ftpClient');

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, description, studentClass, subject, type } = req.body;
    
    let publicUrl = null;
    try {
      const fileName = Date.now() + '_' + req.file.originalname;
      publicUrl = await uploadFile(req.file.path, fileName);
      if (require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
    } catch (err) {
      if (require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'FTP upload failed' });
    }

    const material = await StudyMaterial.create({
      title,
      description,
      studentClass,
      subject,
      type,
      fileUrl: publicUrl,
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
      const fileName = require('path').basename(material.fileUrl);
      await deleteFile(fileName);
    }
    await StudyMaterial.findByIdAndDelete(id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadMaterial, getMaterials, deleteMaterial };
