const express = require('express');
const router = express.Router();
const { bookDemo, getDemoBookings, updateDemoBooking, deleteDemoBooking } = require('../controllers/demoController');
const { adminProtect } = require('../middleware/adminAuth');
const validateId = require('../middleware/validateId');

router.post('/', bookDemo);
router.get('/', adminProtect, getDemoBookings);
router.patch('/:id', adminProtect, validateId, updateDemoBooking);
router.delete('/:id', adminProtect, validateId, deleteDemoBooking);

module.exports = router;
