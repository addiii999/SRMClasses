const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const validateId = require('../middleware/validateId');

router.get('/', getAnnouncements);
router.post('/', adminProtect, createAnnouncement);
router.delete('/:id', adminProtect, validateId, deleteAnnouncement);

module.exports = router;
