const express = require('express');
const router = express.Router();
const { submitEnquiry, getEnquiries, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');
const { adminProtect } = require('../middleware/adminAuth');
const validateId = require('../middleware/validateId');

router.post('/', submitEnquiry);                          // public
router.get('/', adminProtect, getEnquiries);             // admin
router.patch('/:id', adminProtect, validateId, updateEnquiry);       // admin
router.delete('/:id', adminProtect, validateId, deleteEnquiry);      // admin

module.exports = router;
