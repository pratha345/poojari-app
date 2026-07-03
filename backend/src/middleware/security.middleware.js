// src/middleware/security.middleware.js
// Centralized security middleware — Rate Limiting, Account Lockout, Input Sanitization

const rateLimit  = require('express-rate-limit');
const slowDown   = require('express-slow-down');
const pool       = require('../config/db');

// ═══════════════════════════════════════════════════════════════════
// 1. RATE LIMITERS
// ═══════════════════════════════════════════════════════════════════

const IS_TEST = process.env.NODE_ENV !== 'production';
const skipInTest = () => IS_TEST;

// ── Global API limiter — DDoS protection
// Max 200 requests per IP per 15 minutes
exports.globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              200,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { success: false, message: 'खूप जास्त requests. 15 मिनिटांनंतर पुन्हा प्रयत्न करा.' },
  skip: (req) => {
    if (IS_TEST) return true;
    return req.path === '/api/health' || req.path.startsWith('/uploads');
  },
});

// ── Auth limiter — Login brute force protection
// Max 10 login attempts per IP per 15 minutes
exports.authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              10,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: { success: false, message: 'खूप जास्त login attempts. 15 मिनिटांनंतर पुन्हा प्रयत्न करा.' },
  skipSuccessfulRequests: true,
  skip: skipInTest,
});

// ── OTP limiter — OTP spam/enumeration protection
// Max 5 OTP requests per phone per 10 minutes (keyed by phone number, not IP)
exports.otpLimiter = rateLimit({
  windowMs:        10 * 60 * 1000,
  max:             5,
  keyGenerator:    (req) => `otp_${req.body?.phone || 'unknown'}`,
  validate:        { ip: false },
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'OTP खूप जास्त वेळा मागितला. 10 मिनिटांनंतर पुन्हा प्रयत्न करा.' },
  skip: skipInTest,
});

// ── Register limiter — Account creation spam
// Max 5 registrations per IP per hour
exports.registerLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'खूप जास्त registration attempts. 1 तासानंतर पुन्हा प्रयत्न करा.' },
  skip: skipInTest,
});

// ── Contact/Ticket limiter — Spam protection
// Max 10 submissions per IP per hour
exports.contactLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'खूप जास्त submissions. 1 तासानंतर पुन्हा प्रयत्न करा.' },
  skip: skipInTest,
});

// ── Booking limiter — Prevent booking spam
// Max 20 bookings per IP per hour
exports.bookingLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'खूप जास्त booking requests. नंतर पुन्हा प्रयत्न करा.' },
  skip: skipInTest,
});

// ── Admin API limiter — Stricter for admin endpoints
exports.adminLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'खूप जास्त requests. थोड्या वेळाने पुन्हा प्रयत्न करा.' },
  skip: skipInTest,
});

// ── Slow-down — Repeated failed requests slow down (not block)
// After 5 requests, each subsequent adds 500ms delay
exports.loginSlowDown = slowDown({
  windowMs:         15 * 60 * 1000,
  delayAfter:       IS_TEST ? 99999 : 5,
  delayMs:          (used) => (used - 5) * 500,
  maxDelayMs:       5000,
});

// ═══════════════════════════════════════════════════════════════════
// 2. ACCOUNT LOCKOUT
// ═══════════════════════════════════════════════════════════════════

// In-memory failed attempt tracker (Redis नसेल तरी काम करतो)
// { 'phone_ip': { count, lockedUntil } }
const failedAttempts = new Map();

const MAX_ATTEMPTS    = 5;   // 5 wrong passwords after lockout
const LOCKOUT_MINUTES = 30;  // 30 minute lockout

exports.checkAccountLock = (req, res, next) => {
  const phone = req.body?.phone;
  if (!phone) return next();

  const key     = `${phone}_${req.ip}`;
  const attempt = failedAttempts.get(key);

  if (attempt?.lockedUntil && new Date() < attempt.lockedUntil) {
    const remaining = Math.ceil((attempt.lockedUntil - new Date()) / 60000);
    return res.status(429).json({
      success: false,
      message: `Account ${LOCKOUT_MINUTES} मिनिटांसाठी lock झाले. ${remaining} मिनिटांनंतर पुन्हा प्रयत्न करा.`,
    });
  }
  next();
};

exports.recordFailedLogin = (phone, ip) => {
  const key     = `${phone}_${ip}`;
  const attempt = failedAttempts.get(key) || { count: 0, lockedUntil: null };
  attempt.count++;

  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    attempt.count       = 0; // Reset for next lockout cycle
    console.warn(`🔒 Account locked: ${phone} from IP ${ip} — too many failed attempts`);
  }
  failedAttempts.set(key, attempt);
};

exports.clearFailedLogin = (phone, ip) => {
  failedAttempts.delete(`${phone}_${ip}`);
};

// Cleanup old entries every hour (memory leak टाळणे)
setInterval(() => {
  const now = new Date();
  for (const [key, val] of failedAttempts.entries()) {
    if (!val.lockedUntil || now > val.lockedUntil) {
      failedAttempts.delete(key);
    }
  }
}, 60 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════
// 3. INPUT SANITIZATION
// ═══════════════════════════════════════════════════════════════════

// XSS — HTML tags strip करणे
const XSS_PATTERN = /<[^>]*>|javascript:|on\w+\s*=/gi;

function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val.replace(XSS_PATTERN, '').trim();
  }
  if (typeof val === 'object' && val !== null) {
    return sanitizeObject(val);
  }
  return val;
}

function sanitizeObject(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = sanitizeValue(obj[key]);
  }
  return result;
}

// SQL Injection patterns detect करणे (extra layer — mysql2 parameterized queries already protect)
const SQL_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|('|--|;|\*|\/\*)/gi;

exports.sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    // Check for SQL injection attempts in any string field
    const bodyStr = JSON.stringify(req.body);
    if (SQL_PATTERN.test(bodyStr) && req.path !== '/api/auth/register') {
      // Reset pattern state (global regex)
      SQL_PATTERN.lastIndex = 0;
      // Log the attempt
      console.warn(`⚠️  Possible SQL injection attempt from ${req.ip}: ${req.path}`);
    }
    SQL_PATTERN.lastIndex = 0;

    // Strip XSS from all string fields
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
};

// ═══════════════════════════════════════════════════════════════════
// 4. SUSPICIOUS REQUEST DETECTOR
// ═══════════════════════════════════════════════════════════════════

// Common hacking paths block करणे
const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/phpmyadmin', '/.env',
  '/etc/passwd', '/config.php', '/.git', '/admin.php',
  '/shell', '/cmd', '/xmlrpc.php', '/cgi-bin',
];

exports.blockSuspiciousRequests = (req, res, next) => {
  const path = req.path.toLowerCase();

  // Known attack paths
  for (const blocked of BLOCKED_PATHS) {
    if (path.includes(blocked)) {
      console.warn(`🚫 Blocked suspicious path: ${req.ip} → ${req.path}`);
      return res.status(404).json({ success: false, message: 'मार्ग सापडला नाही.' });
    }
  }

  // Path traversal attack — ../../etc/passwd
  if (path.includes('../') || path.includes('..\\')) {
    console.warn(`🚫 Path traversal attempt: ${req.ip} → ${req.path}`);
    return res.status(400).json({ success: false, message: 'Invalid path.' });
  }

  // Null byte injection
  if (req.path.includes('\0')) {
    return res.status(400).json({ success: false, message: 'Invalid request.' });
  }

  next();
};

// ═══════════════════════════════════════════════════════════════════
// 5. SECURITY LOGGER
// ═══════════════════════════════════════════════════════════════════

exports.securityLogger = (req, res, next) => {
  // Production मध्ये API calls log करणे
  if (process.env.NODE_ENV === 'production') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      // Log only errors and security-sensitive endpoints
      if (res.statusCode >= 400 || req.path.includes('/auth/')) {
        console.log(
          `[${new Date().toISOString()}] ${req.method} ${req.path} ` +
          `${res.statusCode} ${duration}ms IP:${req.ip} UA:${req.headers['user-agent']?.substring(0, 50)}`
        );
      }
    });
  }
  next();
};
