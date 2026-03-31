const Result = require('../models/Result');
const mongoose = require('mongoose');
const { uploadFile, deleteFile } = require('../utils/ftpClient');

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
    let finalUrl = '';
    if (req.file) {
       try {
         const fileName = Date.now() + '_' + req.file.originalname;
         const ftpResult = await uploadFile(req.file.path, fileName);
         
         // Use the internal streaming URL
         finalUrl = `${process.env.BACKEND_URL}/api/uploads/${fileName}`;

         if (require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
       } catch (err) {
         if (require('fs').existsSync(req.file.path)) require('fs').unlinkSync(req.file.path);
         return res.status(500).json({ success: false, message: 'FTP upload failed' });
       }
    }
    const result = await Result.create({
      ...req.body,
      imageUrl: finalUrl,
      fileName: req.file ? req.file.originalname : undefined
    });
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
    const result = await Result.findById(id);
    if (result && result.imageUrl) {
      const fileName = require('path').basename(result.imageUrl);
      await deleteFile(fileName);
    }
    await Result.findByIdAndDelete(id);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, createResult, deleteResult };
