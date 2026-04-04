const express = require('express');
const router = express.Router();
const { 
  getPublicFaculty, getAdminFaculty, addFaculty, updateFaculty, deleteFaculty 
} = require('../controllers/facultyController');
const { adminProtect } = require('../middleware/authMiddleware');

// Public
router.get('/', getPublicFaculty);

// Admin Only
router.get('/admin', adminProtect, getAdminFaculty);
router.post('/', adminProtect, addFaculty);
router.put('/:id', adminProtect, updateFaculty);
router.delete('/:id', adminProtect, deleteFaculty);

module.exports = router;
