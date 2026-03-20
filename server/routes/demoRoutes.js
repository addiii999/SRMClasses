const express = require('express');
const router = express.Router();
const { bookDemo, getDemoBookings, updateDemoBooking, deleteDemoBooking } = require('../controllers/demoController');
const { adminProtect } = require('../middleware/adminAuth');

router.post('/', bookDemo);
router.get('/', adminProtect, getDemoBookings);
router.patch('/:id', adminProtect, updateDemoBooking);
router.delete('/:id', adminProtect, deleteDemoBooking);

module.exports = router;
