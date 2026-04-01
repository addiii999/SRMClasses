const path = require('path');
const fs = require('fs');
const Syllabus = require('../models/Syllabus');

exports.uploadSyllabus = async (req, res) => {
  try {
    const { board, classLevel } = req.body;

    if (!board || !classLevel) {
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

    // Strict naming logic: board_class_syllabus.pdf
    const fileName = `${board.toLowerCase().trim().replace(/[^a-z0-9]/g, '')}_class${String(classLevel).toLowerCase().trim().replace(/[^a-z0-9]/g, '')}_syllabus.pdf`;
    
    const targetDir = path.join(__dirname, '..', 'public', 'uploads', 'syllabus');
    const targetPath = path.join(targetDir, fileName);

    // Ensure directory exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Delete old file if it exists (consistent with the strict naming, it would be the same file)
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }

    // Move file from temp upload dir to public syllabus dir
    fs.renameSync(req.file.path, targetPath);
    console.log("Saved file:", fileName);

    const finalUrl = `/uploads/syllabus/${fileName}`;

    // Upsert into MongoDB
    const syllabus = await Syllabus.findOneAndUpdate(
      { board, classLevel },
      {
        board,
        classLevel,
        pdfUrl: finalUrl,
        publicId: fileName, // Using filename as identifier
        fileName: req.file.originalname 
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

    // Delete from local filesystem
    const fileName = syllabus.publicId;
    const filePath = path.join(__dirname, '..', 'public', 'uploads', 'syllabus', fileName);

    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete local file: ${filePath}`, err);
        else console.log(`Deleted file: ${fileName}`);
      });
    }

    // Delete database entry
    await Syllabus.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Syllabus deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting syllabus:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
};

exports.getAllSyllabus = async (req, res) => {
  try {
    const syllabuses = await Syllabus.find({}).sort({ updatedAt: -1 });
    
    // Log "fetching" for each syllabus found (as requested in Fix 5)
    syllabuses.forEach(s => {
      console.log("Fetching file:", s.publicId);
    });

    res.status(200).json({
      success: true,
      data: syllabuses
    });
  } catch (error) {
    console.error('Error in getAllSyllabus:', error);
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
};

