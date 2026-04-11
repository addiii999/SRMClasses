const express = require('express');
const router = express.Router();
const { VALID_CLASS_BOARD_MAP } = require('../utils/boardConstraints');

// GET /api/config/board-constraints
// Publicly exposes the global mapping for allowed Board and Class combinations
router.get('/board-constraints', (req, res) => {
  res.json({
    success: true,
    data: VALID_CLASS_BOARD_MAP
  });
});

module.exports = router;
