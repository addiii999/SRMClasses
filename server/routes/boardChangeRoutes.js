const express = require('express');
const router = express.Router();
const { requestBoardChange, getMyBoardRequests } = require('../controllers/boardChangeController');
const { protect } = require('../middleware/auth');
const { boardRequestLimiter } = require('../middleware/rateLimits');

// Both routes must be protected so only authenticated students can access them
router.use(protect);

// Student submits a board change request
router.post('/request', boardRequestLimiter || ((req, res, next) => next()), requestBoardChange);

// Student views their own requests
router.get('/my-requests', getMyBoardRequests);

module.exports = router;
