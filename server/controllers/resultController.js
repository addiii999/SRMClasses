const Result = require('../models/Result');
const { uploadFileToHostinger } = require('../utils/ftp');

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
    let imageUrl = '';
    if (req.file) {
       imageUrl = await uploadFileToHostinger(req.file.path, req.file.filename);
    }
    const result = await Result.create({ ...req.body, imageUrl });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteResult = async (req, res) => {
  try {
    await Result.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getResults, createResult, deleteResult };
