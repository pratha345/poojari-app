# Security Guide — Pojjari Backend
## Complete Security Implementation Reference

> File: `backend/src/middleware/security.middleware.js`
> Applied in: `backend/src/app.js`, all route files

---

## Table of Contents

1. [Security Architecture Overview](#1-security-architecture-overview)
2. [Helmet — HTTP Security Headers](#2-helmet--http-security-headers)
3. [CORS — Cross-Origin Policy](#3-cors--cross-origin-policy)
4. [Rate Limiting — DDoS Protection](#4-rate-limiting--ddos-protection)
5. [Slow-Down Middleware](#5-slow-down-middleware)
6. [Account Lockout System](#6-account-lockout-system)
7. [Input Sanitization — XSS Prevention](#7-input-sanitization--xss-prevention)
8. [SQL Injection Protection](#8-sql-injection-protection)
9. [Suspicious Path Blocking](#9-suspicious-path-blocking)
10. [HPP — HTTP Parameter Pollution](#10-hpp--http-parameter-pollution)
11. [JWT Authentication Security](#11-jwt-authentication-security)
12. [File Upload Security](#12-file-upload-security)
13. [Security Logger](#13-security-logger)
14. [Request Pipeline Order](#14-request-pipeline-order)
15. [Security Checklist](#15-security-checklist)

---

## 1. Security Architecture Overview

```
Incoming Request
      │
      ▼
[1] securityLogger       → Log suspicious activity (401/403/429)
      │
      ▼
[2] blockSuspiciousRequests → Block /wp-admin, /.env, path traversal
      │
      ▼
[3] globalLimiter        → Max 200 requests/IP/15 min (DDoS)
      │
      ▼
[4] hpp()                → HTTP Parameter Pollution prevention
      │
      ▼
[5] sanitizeInput        → XSS strip + SQL injection detect
      │
      ▼
[6] Helmet               → Security HTTP headers (CSP, HSTS etc.)
      │
      ▼
[7] CORS                 → Whitelist origin check
      │
      ▼
[8] Route-specific limits → authLimiter, otpLimiter etc.
      │
      ▼
[9] authenticate()       → JWT verify
      │
      ▼
[10] authorize(role)     → Role-based access check
      │
      ▼
   Controller
```

---

## 2. Helmet — HTTP Security Headers

**File:** `backend/src/app.js`

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://accounts.google.com"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
      imgSrc:         ["'self'", "data:", "https:", "blob:"],
      connectSrc:     ["'self'", "https://api.razorpay.com", "https://accounts.google.com"],
      frameSrc:       ["https://checkout.razorpay.com", "https://accounts.google.com"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
```

**Headers Helmet Sets:**

```
X-Content-Type-Options: nosniff
  → Browser ला content type sniff करू देत नाही

X-Frame-Options: DENY
  → Clickjacking prevent — iframe मध्ये embed नाही होत

X-XSS-Protection: 1; mode=block
  → Old browsers साठी XSS filter

Strict-Transport-Security: max-age=15552000
  → HTTPS only (HSTS) — 6 months

Content-Security-Policy: (above directives)
  → कुठून scripts/styles/images येऊ शकतात ते restrict

Referrer-Policy: no-referrer
  → Referrer header leak prevent
```

---

## 3. CORS — Cross-Origin Policy

**What is CORS?**
```
Website A (attacker.com) → tries to call your API
CORS: "attacker.com is not allowed → blocked"

Without CORS protection:
  Any website → can call your API → steal user data!
```

**Implementation:**
```javascript
// app.js
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,            // https://pujari.mydashboard.site
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // No origin = curl/Postman/server-to-server = allow
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS: origin not allowed'));
  },
  credentials:     true,       // Allow cookies
  methods:         ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders:  ['Content-Type','Authorization','X-Tenant-ID'],
}));
```

**Uploads CORS (special):**
```javascript
// /uploads files — strict headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:5173');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent HTML/JS files from being served as executable
  if (['.html','.js','.php'].includes(path.extname(req.path).toLowerCase())) {
    return res.status(403).type('text/plain').send('Forbidden');
  }
  next();
});
```

---

## 4. Rate Limiting — DDoS Protection

**Package:** `express-rate-limit`

```javascript
// Global — সব endpoints
exports.globalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,  // 15 minutes window
  max:             200,              // Max 200 requests per IP
  standardHeaders: true,             // Return RateLimit-* headers
  legacyHeaders:   false,
  message: { success: false, message: 'खूप जास्त requests.' },
  skip: (req) =>
    req.path === '/api/health' || req.path.startsWith('/uploads'),
    // Health check + static files skip (always accessible)
});

// Auth — Login/Reset/Google
exports.authLimiter = rateLimit({
  windowMs:               15 * 60 * 1000,
  max:                    10,
  skipSuccessfulRequests: true,  // Successful logins count नाही होत
  message: { success: false, message: 'खूप जास्त login attempts.' },
});

// OTP — Phone-based key (IP नाही!)
exports.otpLimiter = rateLimit({
  windowMs:    10 * 60 * 1000,
  max:         5,
  keyGenerator: (req) => `otp_${req.body?.phone || 'unknown'}`,
  validate:    { ip: false },    // IP validation skip (phone is the key)
  message: { success: false, message: 'OTP खूप जास्त वेळा मागितला.' },
});

// Registration — 5 accounts per IP per hour
exports.registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      5,
});

// Contact/Ticket — 10 per hour
exports.contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      10,
});

// Booking — 20 per hour
exports.bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max:      20,
});

// Admin — 300 per 15 min (admin uses more endpoints)
exports.adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
});
```

**429 Response:**
```json
{
  "success": false,
  "message": "खूप जास्त requests. 15 मिनिटांनंतर पुन्हा प्रयत्न करा."
}
```

**Response Headers:**
```
RateLimit-Limit:     10
RateLimit-Remaining: 7
RateLimit-Reset:     2024-12-25T10:15:00.000Z
```

---

## 5. Slow-Down Middleware

**Package:** `express-slow-down`

**Difference from Rate Limit:**
```
Rate Limit: After 10 requests → BLOCKED (429 error)
Slow-Down:  After 5 requests → Progressively SLOWER

Attacker experience:
  Request 1-5: Normal (200ms)
  Request 6:   700ms delay
  Request 7:   1200ms delay
  Request 8:   1700ms delay
  Request 9:   2200ms delay
  Request 10+: 5000ms delay (max)

Result: Brute force attack takes 10x longer → gives up
        Real users: অনুভव होत नाही (5 attempts is enough)
```

**Implementation:**
```javascript
exports.loginSlowDown = slowDown({
  windowMs:   15 * 60 * 1000,
  delayAfter: 5,
  delayMs:    (used) => (used - 5) * 500,
  // attempt 6 → 500ms, attempt 7 → 1000ms, attempt 8 → 1500ms...
  maxDelayMs: 5000,
});

// Route — दोन्ही एकत्र
router.post('/login',
  authLimiter,     // Hard limit: 10 attempts max
  loginSlowDown,   // Soft limit: Progressive delay
  checkAccountLock,
  ctrl.login
);
```

---

## 6. Account Lockout System

**In-Memory Map** (Redis नसेल तरी काम करतो)

```javascript
const failedAttempts = new Map();
// { 'phone_ip': { count: 3, lockedUntil: Date } }

const MAX_ATTEMPTS    = 5;   // 5 wrong passwords
const LOCKOUT_MINUTES = 30;  // 30 minute lockout
```

**How it works:**

```
User: Wrong password attempt 1
  → failedAttempts.set('9876543210_192.168.1.1', { count: 1 })

User: Wrong password attempt 5
  → count reaches MAX_ATTEMPTS (5)
  → lockedUntil = now + 30 minutes
  → console.warn('🔒 Account locked: ...')

User: Next login attempt (within 30 min)
  → checkAccountLock middleware runs
  → lockedUntil > now → 429 response
  → "Account 30 मिनिटांसाठी lock झाले. 28 मिनिटांनंतर पुन्हा प्रयत्न करा."

User: Correct password (success)
  → clearFailedLogin() → Map entry delete
  → Fresh start
```

**Key = Phone + IP combination:**
```javascript
const key = `${phone}_${req.ip}`;
// 'phone_ip' — same phone, different IP → different lockout
// Prevents: shared IP issues (office wifi)
```

**Memory Cleanup (hourly):**
```javascript
setInterval(() => {
  const now = new Date();
  for (const [key, val] of failedAttempts.entries()) {
    if (!val.lockedUntil || now > val.lockedUntil) {
      failedAttempts.delete(key);
    }
  }
}, 60 * 60 * 1000);
// Expired locks automatically removed → no memory leak
```

**auth.controller.js integration:**
```javascript
// On wrong password/user not found:
recordFailedLogin(phone, req.ip);

// On successful login:
clearFailedLogin(phone, req.ip);
```

---

## 7. Input Sanitization — XSS Prevention

**XSS = Cross-Site Scripting**
```
Attacker submits: <script>document.cookie</script>
Without sanitization: Stored in DB → served to users → executes!
With sanitization:    Stripped → just empty string → safe
```

**Pattern:**
```javascript
const XSS_PATTERN = /<[^>]*>|javascript:|on\w+\s*=/gi;
// Matches:
//   <script>...</script>   → any HTML tags
//   javascript:            → javascript: protocol
//   onclick=, onload=      → event handlers
```

**Sanitize function:**
```javascript
function sanitizeValue(val) {
  if (typeof val === 'string') {
    return val.replace(XSS_PATTERN, '').trim();
  }
  if (typeof val === 'object' && val !== null) {
    return sanitizeObject(val);  // Recursively sanitize nested objects
  }
  return val;  // numbers, booleans — unchanged
}

function sanitizeObject(obj) {
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = sanitizeValue(obj[key]);
  }
  return result;
}
```

**Examples:**
```javascript
// Input:
{ name: "<script>alert('XSS')</script>राहुल", phone: "9876543210" }

// After sanitizeInput:
{ name: "राहुल", phone: "9876543210" }

// Input:
{ comment: "छान <b>पूजा</b> झाली onclick=alert(1)" }

// After sanitizeInput:
{ comment: "छान  झाली " }
```

**Applied to ALL requests:**
```javascript
exports.sanitizeInput = (req, res, next) => {
  if (req.body)  req.body  = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  next();
};
```

---

## 8. SQL Injection Protection

**Two layers:**

**Layer 1: mysql2 Parameterized Queries (Primary Defense)**
```javascript
// WRONG — SQL injection possible:
pool.query(`SELECT * FROM users WHERE phone = '${phone}'`);
// Attacker input: ' OR '1'='1
// Query: SELECT * FROM users WHERE phone = '' OR '1'='1'
// → Returns ALL users!

// RIGHT — Parameterized (your code does this):
pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
// Attacker input: ' OR '1'='1
// Query: SELECT * FROM users WHERE phone = '\' OR \'1\'=\'1\''
// → Treated as literal string → No injection!
```

**Layer 2: Pattern Detection (Alert Layer)**
```javascript
const SQL_PATTERN = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)|('|--|;|\*|\/\*)/gi;

exports.sanitizeInput = (req, res, next) => {
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);
    if (SQL_PATTERN.test(bodyStr) && req.path !== '/api/auth/register') {
      SQL_PATTERN.lastIndex = 0;
      console.warn(`⚠️ Possible SQL injection attempt from ${req.ip}: ${req.path}`);
      // Alert but DON'T block — parameterized queries already protect
      // Admin can review logs
    }
    SQL_PATTERN.lastIndex = 0;
    req.body = sanitizeObject(req.body);
  }
  next();
};
```

---

## 9. Suspicious Path Blocking

**Common attack vectors blocked:**

```javascript
const BLOCKED_PATHS = [
  '/wp-admin',   // WordPress admin (bots try this)
  '/wp-login',   // WordPress login
  '/phpmyadmin', // phpMyAdmin access
  '/.env',       // Environment file leak
  '/etc/passwd', // Linux password file
  '/config.php', // Config file leak
  '/.git',       // Git repository access
  '/admin.php',  // Generic admin file
  '/shell',      // Web shell
  '/cmd',        // Command execution
  '/xmlrpc.php', // WordPress XML-RPC
  '/cgi-bin',    // CGI scripts
];

// Path traversal: ../../etc/passwd
if (path.includes('../') || path.includes('..\\')) {
  return res.status(400).json({ message: 'Invalid path.' });
}

// Null byte injection: file.php%00.txt
if (req.path.includes('\0')) {
  return res.status(400).json({ message: 'Invalid request.' });
}
```

**Real attackers constantly scan for these paths:**
```
Your logs without blocking:
  GET /wp-admin → 200 (serves React app) ← wasted processing
  GET /.env    → 200 (serves React app) ← information leak

With blocking:
  GET /wp-admin → 404 ← fast, logged
  GET /.env    → 404 ← fast, logged
  console: 🚫 Blocked suspicious path: 192.168.1.1 → /.env
```

---

## 10. HPP — HTTP Parameter Pollution

**Package:** `hpp`

**Attack example:**
```
URL: /api/pooja?category=ganesh&category=hack

Without HPP:
  req.query.category = ['ganesh', 'hack']  // Array!
  SQL: WHERE category IN ('ganesh', 'hack')  // Might work wrong

With HPP:
  req.query.category = 'ganesh'  // Last value kept
  SQL: WHERE category = 'ganesh'  // Safe
```

**Usage:**
```javascript
app.use(hpp());
// After this: arrays in query params → last value only
// Prevents parameter array injection attacks
```

---

## 11. JWT Authentication Security

**File:** `backend/src/middleware/auth.middleware.js`

**JWT Token Structure:**
```
Header.Payload.Signature

eyJhbGciOiJIUzI1NiJ9.eyJpZCI6NDIsInJvbGUiOiJ1c2VyIn0.SIGNATURE
         ↑                        ↑                          ↑
    Algorithm               User data (visible!)         Secret sign
    (HS256)

Payload (decoded):
{
  "id":    42,
  "role":  "user",
  "iat":   1703520000,  // Issued at
  "exp":   1704124800   // Expires at (7 days later)
}
```

**Verification:**
```javascript
exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  // "Bearer eyJ..." → "eyJ..."

  if (!token) return res.status(401).json({ message: 'Token आवश्यक आहे.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // If signature invalid → throws error → 401
    // If expired → throws TokenExpiredError → 401
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'अवैध token.' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'परवानगी नाही.' });
  }
  next();
};
```

**Security Concerns:**
```
⚠️  Current JWT_SECRET:
    pojjari_super_secret_key_change_this_2024_minimum32chars
                                    ^^^^^^^^^^^
    Still has "change_this" in it!

✅  Should be changed to something like:
    openssl rand -hex 64
    → a4b8c2d3e5f6... (128 char random hex)

⚠️  JWT expires in 7 days (no refresh token)
    If token leaked → valid for 7 days

✅  Improvement: Add refresh token system
    Access token: 15 min
    Refresh token: 30 days (DB stored, can revoke)
```

---

## 12. File Upload Security

**File:** `backend/src/middleware/webpConvert.middleware.js`

```javascript
// Allowed MIME types
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// File size limit: 5MB (multer config)
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Auto-convert to WebP (Sharp)
// → Strips EXIF data (GPS location, camera info)
// → Standardizes format (no PHP/JS hidden in image)
// → Reduces size (80% smaller than PNG)

// WebP conversion:
sharp(req.file.buffer)
  .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(outputPath);
```

**Upload path restrictions:**
```javascript
// /uploads serves files, but:
// 1. .html, .js, .php → 403 Forbidden
// 2. CORS restricted to CLIENT_URL only
// 3. X-Content-Type-Options: nosniff (browser can't sniff type)

// Naming: timestamp-based → no path traversal possible
filename: `pooja-${Date.now()}.webp`
// → Never uses user-provided filename!
```

**Body size limit:**
```javascript
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
// Reduced from 10mb → 2mb
// Prevents large JSON payload attacks
```

---

## 13. Security Logger

**Logs suspicious activity in production:**

```javascript
exports.securityLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
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
```

**Sample Log Output:**
```
[2024-12-25T10:30:00.000Z] POST /api/auth/login 401 45ms IP:192.168.1.1 UA:Mozilla/5.0 (Windows NT 10.0)
[2024-12-25T10:30:05.000Z] POST /api/auth/login 401 48ms IP:192.168.1.1 UA:curl/7.64.1
[2024-12-25T10:30:10.000Z] POST /api/auth/login 429 5ms IP:192.168.1.1 UA:curl/7.64.1
```

**PM2 Logs location:** `/var/log/pm2/` or `pm2 logs pojjari-backend`

---

## 14. Request Pipeline Order

**`app.js` middleware chain:**

```javascript
// 1. Security monitoring
app.use(securityLogger);

// 2. Block known attack paths
app.use(blockSuspiciousRequests);

// 3. Global rate limit
app.use(globalLimiter);

// 4. HTTP Parameter Pollution
app.use(hpp());

// 5. Strip XSS + detect SQL injection
app.use(sanitizeInput);

// 6. Security headers
app.use(helmet({ ... }));

// 7. CORS
app.use(cors({ ... }));

// 8. Body parser (2MB limit)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 9. Tenant resolution
app.use(resolveTenant);

// 10. Routes (with their own rate limiters)
app.use('/api/auth',    authRoutes);      // + authLimiter, loginSlowDown
app.use('/api/booking', bookingRoutes);   // + bookingLimiter
app.use('/api/admin',   adminRoutes);     // + adminLimiter
```

---

## 15. Security Checklist

```
✅ IMPLEMENTED:

Rate Limiting
  ✅ Global: 200 req/IP/15 min
  ✅ Login: 10 req/IP/15 min (skip success)
  ✅ OTP: 5 req/phone/10 min
  ✅ Register: 5 req/IP/hour
  ✅ Booking: 20 req/IP/hour
  ✅ Contact: 10 req/IP/hour
  ✅ Admin: 300 req/IP/15 min

Brute Force
  ✅ Login slow-down (progressive delay)
  ✅ Account lockout (5 attempts = 30 min)

Input Protection
  ✅ XSS sanitization (all req.body, req.query)
  ✅ SQL injection detection + logging
  ✅ mysql2 parameterized queries
  ✅ HPP (parameter pollution)
  ✅ Body size limit (2MB)

Path Security
  ✅ Suspicious path blocking (wp-admin etc.)
  ✅ Path traversal blocking (../)
  ✅ Null byte injection blocking

HTTP Security
  ✅ Helmet (CSP, HSTS, X-Frame-Options etc.)
  ✅ CORS whitelist (not *)
  ✅ Uploads CORS restricted
  ✅ X-Content-Type-Options: nosniff

File Upload
  ✅ MIME type validation
  ✅ File size limit (5MB)
  ✅ Auto WebP conversion (strips EXIF)
  ✅ Timestamp-based filenames
  ✅ .html/.js/php uploads blocked

Authentication
  ✅ bcrypt password hashing (cost 10)
  ✅ JWT tokens (HS256)
  ✅ Role-based authorization
  ✅ OTP-based phone verification

Debug Endpoints
  ✅ Gated behind NODE_ENV !== 'production'

⚠️  RECOMMENDED IMPROVEMENTS:

JWT
  ⚠️  JWT_SECRET still has "change_this" → rotate it
  ⚠️  No refresh token → 7-day window if leaked
  → Fix: openssl rand -hex 64

Database
  ⚠️  MySQL on 159.89.167.218 — accessible remotely
  → Fix: GRANT ... TO 'pojjari_user'@'64.227.152.85' (restrict to app server IP)
  ⚠️  No connection SSL (ssl: false)
  → Fix: Add SSL certificate for DB connection

SSH
  ⚠️  Server uses password authentication
  → Fix: SSH key-only login, disable PasswordAuthentication

Redis
  ⚠️  Redis may run without password (local)
  → Fix: requirepass in redis.conf (if publicly accessible)

Monitoring
  ⚠️  No alerting on repeated 401/403
  → Fix: UptimeRobot + Fail2ban on server
```
