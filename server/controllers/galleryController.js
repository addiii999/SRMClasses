const Gallery = require('../models/Gallery');
const { uploadFileToHostinger } = require('../utils/ftp');

const getGallery = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== 'all') query.category = category;
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
    
    // FTP Bridge upload to Hostinger
    const ftpUrl = await uploadFileToHostinger(req.file.path, req.file.filename);

    const image = await Gallery.create({
      title,
      category,
      description,
      imageUrl: ftpUrl,
    });
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteGalleryImage = async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getGallery, uploadGalleryImage, deleteGalleryImage };
