const Gallery = require('../models/Gallery');
const mongoose = require('mongoose');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/cloudinary');

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
    const publicId = `gallery_${category || 'all'}_${rawName}_${Date.now()}`;

    const result = await uploadToCloudinary(req.file.buffer, 'gallery', publicId, 'image');

    const image = await Gallery.create({
      title,
      category,
      description,
      imageUrl: result.url,
      cloudinaryId: result.publicId,
      fileName: req.file.originalname,
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
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    if (image.cloudinaryId) {
      await deleteFromCloudinary(image.cloudinaryId, 'image');
    }
    await Gallery.findByIdAndDelete(id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGallery, uploadGalleryImage, deleteGalleryImage };
