const express = require('express');
const router = express.Router();
const { adminProtect, superAdminOnly } = require('../middleware/adminAuth');
const {
  getPendingStudents, getStudentList, getStudentDetail,
  approveStudent, rejectStudent, createUser,
  updateStudentByAdmin, assignBatch, resetBoardChangeCount,
  createAdminAccount, getAdmins, deactivateAdmin, deleteAdmin,
  getAdminAuditLogs, getStudentStats,
} = require('../controllers/adminController');
const {
  getBoardChangeRequests, approveBoardChange, rejectBoardChange,
} = require('../controllers/boardChangeController');
const { importMarksExcel, getImportLogs } = require('../controllers/excelImportController');
const excelUpload = require('../middleware/excelUpload');

// All routes protected by adminProtect
router.use(adminProtect);

// ── Student Management ────────────────────────────────────────────────────────
router.get('/students', getStudentList);
router.get('/students/pending', getPendingStudents);       // legacy route kept
router.get('/student-stats', getStudentStats);
router.get('/students/:id', getStudentDetail);
router.put('/students/:id', updateStudentByAdmin);
router.put('/students/approve/:id', approveStudent);
router.put('/students/reject/:id', rejectStudent);         // changed from DELETE to PUT
router.delete('/students/reject/:id', rejectStudent);      // keep old route for backward compat
router.post('/students/:id/assign-batch', assignBatch);
router.post('/students/:id/reset-board-count', superAdminOnly, resetBoardChangeCount);

// ── Manual Student Creation ───────────────────────────────────────────────────
router.post('/users/create', createUser);

// ── Board Change Requests ─────────────────────────────────────────────────────
router.get('/board-change-requests', getBoardChangeRequests);
router.put('/board-change-requests/:id/approve', approveBoardChange);
router.put('/board-change-requests/:id/reject', rejectBoardChange);

// ── Excel Import (marks only) ─────────────────────────────────────────────────
router.post('/import/excel', excelUpload.single('file'), importMarksExcel);
router.get('/import/logs', getImportLogs);

// ── Audit Logs ────────────────────────────────────────────────────────────────
router.get('/audit-logs', getAdminAuditLogs);

// ── Admin Management (SUPER_ADMIN only) ──────────────────────────────────────
router.get('/admins', superAdminOnly, getAdmins);
router.post('/create-admin', superAdminOnly, createAdminAccount);
router.put('/admins/:id/toggle-active', superAdminOnly, deactivateAdmin);
router.delete('/admins/:id', superAdminOnly, deleteAdmin);

module.exports = router;
