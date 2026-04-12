const express = require('express');
const router = express.Router();
const { getResults, createResult, deleteResult } = require('../controllers/resultController');
const { adminProtect } = require('../middleware/adminAuth');
const validateId = require('../middleware/validateId');
const { upload } = require('../middleware/upload');

router.get('/', getResults);
router.post('/', adminProtect, upload.single('image'), createResult);
router.delete('/:id', adminProtect, validateId, deleteResult);

module.exports = router;
