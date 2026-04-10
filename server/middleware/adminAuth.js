const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// ─── Protect any admin route ──────────────────────────────────────────────────
const adminProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Admin access only' });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin not found' });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: 'Admin account has been deactivated' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

// ─── Restrict to SUPER_ADMIN only ────────────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'SUPER_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'This action requires SUPER_ADMIN privileges',
    });
  }
  next();
};

module.exports = { adminProtect, superAdminOnly };
