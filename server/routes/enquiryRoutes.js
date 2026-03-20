const express = require('express');
const router = express.Router();
const { submitEnquiry, getEnquiries, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');
const { adminProtect } = require('../middleware/adminAuth');

router.post('/', submitEnquiry);                          // public
router.get('/', adminProtect, getEnquiries);             // admin
router.patch('/:id', adminProtect, updateEnquiry);       // admin
router.delete('/:id', adminProtect, deleteEnquiry);      // admin

module.exports = router;
