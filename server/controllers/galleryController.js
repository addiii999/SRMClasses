const Gallery = require('../models/Gallery');
const mongoose = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');

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
    
    // Upload directly to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(req.file.path, 'srmclasses/gallery');

    const image = await Gallery.create({
      title,
      category,
      description,
      imageUrl: cloudinaryUrl,
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
    await Gallery.findByIdAndDelete(id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGallery, uploadGalleryImage, deleteGalleryImage };
