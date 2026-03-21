const express = require('express');
const router = express.Router();
const { uploadMaterial, getMaterials, deleteMaterial } = require('../controllers/materialController');
const { protect } = require('../middleware/auth');
const { adminProtect } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

router.get('/', getMaterials);                          // public
router.post('/', adminProtect, upload.single('file'), uploadMaterial); // admin
router.delete('/:id', adminProtect, deleteMaterial);            // admin

module.exports = router;
