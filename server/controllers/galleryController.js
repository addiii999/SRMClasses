const Gallery = require('../models/Gallery');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const getGallery = async (req, res) => {
  try {
    const { category } = req.query;
    if (category && typeof category !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid category' });
    }
    let query = {};
    if (category && typeof category === 'string' && category !== 'all') {
      query.category = category;
    }
    const images = await Gallery.find(query).sort({ createdAt: -1 });
    res.json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const uploadGalleryImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const { title, category, description } = req.body;
    
    const rawName = (title || 'image').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    const ext = path.extname(req.file.originalname);
    const fileName = `gallery_${category || 'all'}_${rawName}_${Date.now()}${ext}`;
    
    const targetDir = path.join(__dirname, '..', 'public', 'uploads', 'images');
    const targetPath = path.join(targetDir, fileName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Move file to static directory
    fs.renameSync(req.file.path, targetPath);
    
    const finalUrl = `/uploads/images/${fileName}`;

    const image = await Gallery.create({
      title,
      category,
      description,
      imageUrl: finalUrl,
      fileName: req.file.originalname
    });
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    const image = await Gallery.findById(id);
    if (image && image.imageUrl) {
      const fileName = path.basename(image.imageUrl);
      const filePath = path.join(__dirname, '..', 'public', 'uploads', 'images', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await Gallery.findByIdAndDelete(id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGallery, uploadGalleryImage, deleteGalleryImage };
