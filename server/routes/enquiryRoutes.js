const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { submitEnquiry, getEnquiries, updateEnquiry, deleteEnquiry } = require('../controllers/enquiryController');
const { adminProtect } = require('../middleware/adminAuth');
const validateId = require('../middleware/validateId');

const enquirySubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 enquiry requests per windowMs
  message: { success: false, message: 'Too many enquiries from this IP. Please try again after 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', enquirySubmitLimiter, submitEnquiry); // public
router.get('/', adminProtect, getEnquiries);             // admin
router.patch('/:id', adminProtect, validateId, updateEnquiry);       // admin
router.delete('/:id', adminProtect, validateId, deleteEnquiry);      // admin

module.exports = router;
