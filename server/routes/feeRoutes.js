const express = require('express');
const router = express.Router();
const {
  getStudentsFeeStats,
  updateStudentFeeSettings,
  addPayment,
  editPayment,
  deletePayment,
  getMyFeeStats,
  removeStudentFromFees,
  restoreStudentToFees,
  calculateFeePublic // Added public method
} = require('../controllers/feeController');
const { adminProtect } = require('../middleware/adminAuth');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for public calculation endpoint (max 30 requests per hour)
const calculateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: { success: false, message: 'Too many calculation requests from this IP, please try again after an hour.' }
});

// Public Route
router.post('/calculate', calculateLimiter, calculateFeePublic);

// Student Route
router.get('/my-fee', protect, getMyFeeStats);

// Admin Routes (Protected)
router.get('/students', adminProtect, getStudentsFeeStats);
router.put('/settings/:id', adminProtect, updateStudentFeeSettings);
router.post('/payment/:id', adminProtect, addPayment);
router.put('/payment/:id/:paymentId', adminProtect, editPayment);
router.delete('/payment/:id/:paymentId', adminProtect, deletePayment);
router.patch('/remove/:id', adminProtect, removeStudentFromFees);
router.patch('/restore/:id', adminProtect, restoreStudentToFees);

module.exports = router;
