const express = require('express');
const router = express.Router();
const { getPendingStudents, approveStudent, rejectStudent } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth');

// All routes are protected by adminProtect
router.use(adminProtect);

router.get('/students/pending', getPendingStudents);
router.put('/students/approve/:id', approveStudent);
router.delete('/students/reject/:id', rejectStudent);

module.exports = router;
