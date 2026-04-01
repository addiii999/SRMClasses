const path = require('path');
const fs = require('fs');
const Syllabus = require('../models/Syllabus');
const { uploadFile, deleteFile } = require('../utils/ftpClient');

// Custom upload wrapper for returning publicId or we can just use secure_url
// uploadToCloudinary only returns secure_url, so if we want to delete later we can just rely on Cloudinary's auto cleanup or not worry for now.
// For full control, we can do a direct upload here or just save the URL since the free tier is large.
// The user doesn't require deletion logic specifically, just overwrite logic which upsert handles.
// But Cloudinary's uploadToCloudinary allows passing folder.

exports.uploadSyllabus = async (req, res) => {
  try {
    const { board, classLevel } = req.body;

    if (!board || !classLevel) {
      // if we fail early, we should clean up the multer file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Board and classLevel are required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    // Ensure it's a PDF
    if (req.file.mimetype !== 'application/pdf') {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Only PDF files are allowed.' });
    }

    // Delete old Cloudinary file if it exists (storage cleanup)
    const existing = await Syllabus.findOne({ board, classLevel });
    if (existing && existing.pdfUrl) {
      const oldFileName = require('path').basename(existing.pdfUrl);
      await deleteFile(oldFileName);
    }

    let finalUrl = null;
    let fileName = null;
    try {
      fileName = Date.now() + '_' + req.file.originalname;
      const ftpResult = await uploadFile(req.file.path, fileName);

      // Use the internal streaming URL
      finalUrl = `${process.env.BACKEND_URL}/api/uploads/${fileName}`;

      // Clean up local temp file after upload
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (err) {
      console.error('FTP syllabus upload failed:', err);
      // Clean up local temp file on error too
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ success: false, message: 'Failed to upload file to FTP server.' });
    }

    // Upsert into MongoDB
    const syllabus = await Syllabus.findOneAndUpdate(
      { board, classLevel },
      {
        board,
        classLevel,
        pdfUrl: finalUrl,
        publicId: fileName, // Storage identifier for deletion
        fileName: req.file.originalname // Original filename for display
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Syllabus updated successfully.',
      data: syllabus
    });

  } catch (error) {
    console.error('Error in uploadSyllabus:', error);
    // clean up local file if error and file still exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

exports.deleteSyllabus = async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        message: 'Syllabus not found'
      });
    }

    // Delete file from FTP server
    if (syllabus.publicId) {
      await deleteFile(syllabus.publicId);
    }

    // Delete database entry
    await Syllabus.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Syllabus deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting syllabus:', err);

    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid syllabus ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

exports.getAllSyllabus = async (req, res) => {
  try {
    // Return all distinct syllabus entries (for the Courses page lookup)
    const syllabuses = await Syllabus.find({}).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      data: syllabuses
    });
  } catch (error) {
    console.error('Error in getAllSyllabus:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};
