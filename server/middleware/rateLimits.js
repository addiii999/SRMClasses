const rateLimit = require('express-rate-limit');

// ─── OTP Rate Limiter ─────────────────────────────────────────────────────────
// Max 5 OTP requests per IP per 15 min
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Registration Rate Limiter ────────────────────────────────────────────────
// Max 3 registration attempts per IP per hour
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many registration attempts from this IP. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Login Rate Limiter ───────────────────────────────────────────────────────
// Max 10 login attempts per IP per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Password Reset Rate Limiter ──────────────────────────────────────────────
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Board Change Request Rate Limiter ────────────────────────────────────────
// Max 5 board change requests per IP per day
const boardRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many board change requests. Please try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Admin Login Rate Limiter ─────────────────────────────────────────────────
// Strict: Max 5 attempts per 15 min to prevent brute-force
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many admin login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpLimiter,
  registrationLimiter,
  loginLimiter,
  passwordResetLimiter,
  boardRequestLimiter,
  adminLoginLimiter,
};
