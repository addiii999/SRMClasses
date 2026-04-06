const express = require('express');
const router = express.Router();
const { 
    bookDemo, 
    getDemoBookings, 
    updateDemoBooking, 
    deleteDemoBooking,
    markVisited,
    convertToStudent,
    rejectDemo
} = require('../controllers/demoController');
const { adminProtect } = require('../middleware/adminAuth');
const validateId = require('../middleware/validateId');

// Public route
router.post('/', bookDemo);

// Admin protected routes
router.get('/', adminProtect, getDemoBookings);
router.patch('/:id', adminProtect, validateId, updateDemoBooking);
router.delete('/:id', adminProtect, validateId, deleteDemoBooking);

// New Demo-to-Student Conversion Flow
router.patch('/:id/visited', adminProtect, validateId, markVisited);
router.post('/:id/convert', adminProtect, validateId, convertToStudent);
router.patch('/:id/reject', adminProtect, validateId, rejectDemo);

module.exports = router;
