const express = require('express');
const router = express.Router();
const {
  createTest,
  getAllTests,
  getTestById,
  toggleLock,
  deleteTest,
  enterMarks,
  bulkImportMarks,
  downloadTemplate,
  publishResults,
  getMyResults,
  getMyNotifications,
  markNotificationRead,
} = require('../controllers/weeklyTestController');
const { adminProtect } = require('../middleware/adminAuth');
const { protect } = require('../middleware/auth');
const excelUpload = require('../middleware/excelUpload');

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ROUTES — MUST be registered BEFORE /:id param routes
// so Express doesn't confuse "my-results" as a MongoDB ObjectId
// ─────────────────────────────────────────────────────────────────────────────
router.get('/my-results', protect, getMyResults);
router.get('/my-notifications', protect, getMyNotifications);
router.patch('/notifications/:nid/read', protect, markNotificationRead);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES — protected with adminProtect middleware
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', adminProtect, createTest);
router.get('/', adminProtect, getAllTests);

// Param routes — AFTER student literal routes
router.get('/:id', adminProtect, getTestById);
router.patch('/:id/lock', adminProtect, toggleLock);
router.delete('/:id', adminProtect, deleteTest);
router.post('/:id/marks', adminProtect, enterMarks);
router.post('/:id/import', adminProtect, excelUpload.single('file'), bulkImportMarks);
router.get('/:id/template', adminProtect, downloadTemplate);
router.post('/:id/publish', adminProtect, publishResults);

module.exports = router;
