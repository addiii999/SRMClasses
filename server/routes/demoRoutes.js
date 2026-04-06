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

const rateLimit = require('express-rate-limit');

const demoIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { success: false, message: 'Too many demo requests from this IP. Please try again later.' }
});

// Public route with IP Rate Limiter
router.post('/', demoIpLimiter, bookDemo);

// Admin protected routes
router.get('/', adminProtect, getDemoBookings);
router.patch('/:id', adminProtect, validateId, updateDemoBooking);
router.delete('/:id', adminProtect, validateId, deleteDemoBooking);

// New Demo-to-Student Conversion Flow
router.patch('/:id/visited', adminProtect, validateId, markVisited);
router.post('/:id/convert', adminProtect, validateId, convertToStudent);
router.patch('/:id/reject', adminProtect, validateId, rejectDemo);

module.exports = router;
