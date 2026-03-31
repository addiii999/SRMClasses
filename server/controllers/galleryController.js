const Gallery = require('../models/Gallery');
const mongoose = require('mongoose');
const { uploadFile, deleteFile } = require('../utils/ftpClient');

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
    
    let finalUrl = null;
    let fileName = null;
    try {
      fileName = Date.now() + '_' + req.file.originalname;
      const ftpResult = await uploadFile(req.file.path, fileName);
      
      // Use the internal streaming URL
      finalUrl = `${process.env.BACKEND_URL}/api/uploads/${fileName}`;

      if (require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
    } catch (err) {
      if (require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
      return res.status(500).json({ success: false, message: 'FTP upload failed' });
    }

    const image = await Gallery.create({
      title,
      category,
      description,
      imageUrl: finalUrl,
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
      const fileName = require('path').basename(image.imageUrl);
      await deleteFile(fileName);
    }
    await Gallery.findByIdAndDelete(id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGallery, uploadGalleryImage, deleteGalleryImage };
