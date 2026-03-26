const Result = require('../models/Result');
const mongoose = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');

const getResults = async (req, res) => {
  try {
    const results = await Result.find().sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createResult = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    let imageUrl = '';
    if (req.file) {
       imageUrl = await uploadToCloudinary(req.file.path, 'srmclasses/results');
    }
    const result = await Result.create({ title, description, category, imageUrl });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    await Result.findByIdAndDelete(id);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, createResult, deleteResult };
