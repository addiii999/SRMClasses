const express = require('express');
const router = express.Router();
const { getGallery, uploadGalleryImage, deleteGalleryImage } = require('../controllers/galleryController');
const { adminProtect } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

router.get('/', getGallery);
router.post('/', adminProtect, upload.single('image'), uploadGalleryImage);
router.delete('/:id', adminProtect, deleteGalleryImage);

module.exports = router;
