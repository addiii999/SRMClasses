const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'student' || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // 🔐 Token invalidation: reject tokens issued before password change
    if (user.changedPasswordAfter && user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Session expired due to password change. Please login again.',
        code: 'TOKEN_INVALIDATED',
      });
    }

    // 🚫 Block access if not approved
    if (!user.isApproved || user.registrationStatus !== 'Active') {
      let message = 'Your account is not active.';
      if (user.registrationStatus === 'Pending') {
        message = 'Your registration is pending admin approval.';
      } else if (user.registrationStatus === 'Rejected') {
        message = 'Your registration has been rejected. Please contact admin.';
      }
      return res.status(403).json({
        success: false,
        message,
        registrationStatus: user.registrationStatus,
        code: 'ACCOUNT_NOT_ACTIVE',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
  }
};

module.exports = { protect };
