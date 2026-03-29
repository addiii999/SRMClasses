const express = require('express');
const router = express.Router();
const { uploadSyllabus, getAllSyllabus } = require('../controllers/syllabusController');
const { adminProtect } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Public route to fetch all syllabi
router.get('/', getAllSyllabus);

// Admin route to upload/update a syllabus
// Uses Multer for parsing the file, and admin middleware for security
router.post('/', adminProtect, upload.single('pdfFile'), uploadSyllabus);

module.exports = router;
