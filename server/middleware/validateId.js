const mongoose = require('mongoose');

/**
 * Middleware to validate MongoDB ObjectId in req.params.id
 */
const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  next();
};

module.exports = validateId;
