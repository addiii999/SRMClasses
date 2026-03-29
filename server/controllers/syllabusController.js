const path = require('path');
const fs = require('fs');
const Syllabus = require('../models/Syllabus');
const { uploadToCloudinary } = require('../utils/cloudinary');
const cloudinary = require('cloudinary').v2;

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

    // Upload to Cloudinary
    let fileUrl = '';
    try {
      fileUrl = await uploadToCloudinary(req.file.path, 'srmclasses/syllabus');
    } catch (err) {
      console.error('Cloudinary syllabus upload failed:', err);
      return res.status(500).json({ success: false, message: 'Failed to upload file to Cloudinary.' });
    }

    // Upsert into MongoDB
    const filter = { board, classLevel };
    const update = {
      board,
      classLevel,
      pdfUrl: fileUrl,
      fileName: req.file.originalname,
      publicId: 'N/A' // Not tracking publicId currently as uploadToCloudinary doesn't return it
    };

    const syllabus = await Syllabus.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true
    });

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
