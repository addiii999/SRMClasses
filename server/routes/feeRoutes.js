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
  restoreStudentToFees
} = require('../controllers/feeController');
const { adminProtect } = require('../middleware/adminAuth');
const { protect } = require('../middleware/auth');

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
