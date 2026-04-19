const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');

const identityKey = (req) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
  const mobile = typeof req.body?.mobile === 'string' ? req.body.mobile.trim() : '';
  return [req.ip, email || mobile || 'anonymous'].join(':');
};

let redisClient;
if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL, { enableOfflineQueue: false, lazyConnect: true });
    redisClient.connect().catch(() => {});
    logger.info('Using Redis rate-limit store');
  } catch (error) {
    logger.warn('Falling back to memory rate-limit store', { reason: error.message });
  }
}

const buildStore = (prefix) => {
  if (!redisClient) return undefined;
  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix,
  });
};

// ─── OTP Rate Limiter ─────────────────────────────────────────────────────────
// Max 5 OTP requests per IP per 15 min
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: identityKey,
  message: { success: false, message: 'Too many OTP requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient ? { store: buildStore('rl:otp:') } : {}),
});

// ─── Registration Rate Limiter ────────────────────────────────────────────────
// Max 3 registration attempts per IP per hour
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many registration attempts from this IP. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient ? { store: buildStore('rl:register:') } : {}),
});

// ─── Login Rate Limiter ───────────────────────────────────────────────────────
// Max 10 login attempts per IP per 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: identityKey,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient ? { store: buildStore('rl:login:') } : {}),
});

// ─── Password Reset Rate Limiter ──────────────────────────────────────────────
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: identityKey,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient ? { store: buildStore('rl:reset:') } : {}),
});

// ─── Board Change Request Rate Limiter ────────────────────────────────────────
// Max 5 board change requests per IP per day
const boardRequestLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many board change requests. Please try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient ? { store: buildStore('rl:board:') } : {}),
});

// ─── Admin Login Rate Limiter ─────────────────────────────────────────────────
// Strict: Max 5 attempts per 15 min to prevent brute-force
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many admin login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient ? { store: buildStore('rl:admin-login:') } : {}),
});

module.exports = {
  otpLimiter,
  registrationLimiter,
  loginLimiter,
  passwordResetLimiter,
  boardRequestLimiter,
  adminLoginLimiter,
};
