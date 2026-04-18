const express = require('express');
const router = express.Router();
const { adminProtect, superAdminOnly } = require('../middleware/adminAuth');
const {
  getArchivePreview,
  archiveStudents,
  getArchivedStudents,
  restoreFromArchive,
  exportStudents,
  softDeleteArchived,
  getDeletedArchivedStudents,
  restoreDeletedArchived,
  getLifecycleLogs,
} = require('../controllers/dataLifecycleController');

// All routes require admin authentication
router.use(adminProtect);

// ── Archive System ────────────────────────────────────────────────────────────
router.get('/archive/preview', getArchivePreview);        // Preview filter results
router.get('/archive', getArchivedStudents);              // List archived students
router.post('/archive', archiveStudents);                 // Bulk archive (ADMIN+)
router.post('/archive/restore', restoreFromArchive);      // Restore archived → active

// ── Export (SUPER_ADMIN only — enforced in controller + middleware) ────────────
router.post('/export', superAdminOnly, exportStudents);

// ── Deletion System (SUPER_ADMIN only) ───────────────────────────────────────
router.get('/deleted', getDeletedArchivedStudents);               // 30-day window list
router.post('/delete', superAdminOnly, softDeleteArchived);        // Mark for deletion
router.post('/deleted/restore', superAdminOnly, restoreDeletedArchived); // Un-delete

// ── Lifecycle Audit Logs ──────────────────────────────────────────────────────
router.get('/logs', getLifecycleLogs);

module.exports = router;
