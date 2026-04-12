const express = require('express');
const router = express.Router();
const { 
  getPublicFaculty, getAdminFaculty, addFaculty, updateFaculty, deleteFaculty 
} = require('../controllers/facultyController');
const { adminProtect } = require('../middleware/adminAuth');
const { facultyUpload } = require('../middleware/upload');

// Public
router.get('/', getPublicFaculty);

// Admin Only
router.get('/admin', adminProtect, getAdminFaculty);
router.post('/', adminProtect, facultyUpload.single('photo'), addFaculty);
router.put('/:id', adminProtect, facultyUpload.single('photo'), updateFaculty);
router.delete('/:id', adminProtect, deleteFaculty);

module.exports = router;
