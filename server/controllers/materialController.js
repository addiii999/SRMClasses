const StudyMaterial = require('../models/StudyMaterial');
const mongoose = require('mongoose');
const path = require('path');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

const uploadMaterial = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, description, studentClass, subject, type } = req.body;

    const rawClass = (studentClass || 'all').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const rawSubject = (subject || 'general').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isPdf = ext === '.pdf';
    
    // Append extension to publicId if it's a PDF so Cloudinary preserves it
    const publicId = `material_${rawClass}_${rawSubject}_${Date.now()}${isPdf ? '.pdf' : ''}`;
    const resourceType = isPdf ? 'raw' : 'image';

    const result = await uploadToCloudinary(req.file.buffer, 'materials', publicId, resourceType);

    const material = await StudyMaterial.create({
      title,
      description,
      studentClass,
      subject,
      type,
      fileUrl: result.url,
      cloudinaryId: result.publicId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      branch: req.body.branch || null, // Optional: can be null for global
    });
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMaterials = async (req, res) => {
  try {
    const { studentClass, type, branch } = req.query;
    if ((studentClass && typeof studentClass !== 'string') || (type && typeof type !== 'string')) {
      return res.status(400).json({ success: false, message: 'Invalid query parameters' });
    }
    let query = {};
    if (branch && mongoose.Types.ObjectId.isValid(branch)) {
      query.$or = [{ branch: branch }, { branch: null }]; // Show branch-specific + global
    } else if (branch === 'all') {
      // Don't filter by branch, show all
    } else {
      // Default: show everything or filter if needed
    }
    if (studentClass && typeof studentClass === 'string' && studentClass !== 'all') {
      query.$and = (query.$and || []).concat([{ $or: [{ studentClass }, { studentClass: 'all' }] }]);
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
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }
    const adminEmail = req.admin ? req.admin.email : 'Admin';
    await material.softDelete(adminEmail);

    res.json({ success: true, message: 'Material moved to Recycle Bin' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadMaterial, getMaterials, deleteMaterial };
