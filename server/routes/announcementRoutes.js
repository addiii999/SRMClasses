const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');

router.get('/', protect, getAnnouncements);
router.post('/', adminProtect, createAnnouncement);
router.delete('/:id', adminProtect, deleteAnnouncement);

module.exports = router;
