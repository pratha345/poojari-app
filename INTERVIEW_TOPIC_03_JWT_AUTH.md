# Topic 03: JWT Authentication + Security
> Stateless token-based auth — how Pojjari secures all 160+ API endpoints

---

## 3.1 Why JWT? Session vs Token

### Session-Based Auth (Traditional)
```
Client → Login → Server creates session in DB/memory → Sends session_id cookie
Next request → Client sends cookie → Server looks up session in DB → Validates

Problem: Every request hits DB to validate session. Doesn't scale horizontally.
```

### JWT Token-Based Auth (Pojjari uses this)
```
Client → Login → Server creates JWT (signs it) → Sends JWT to client
Next request → Client sends JWT in header → Server VERIFIES signature (no DB needed)

Advantage: Stateless — any server can validate without shared session store.
```

---

## 3.2 JWT Structure

A JWT looks like: `xxxxx.yyyyy.zzzzz`

Three parts, separated by dots, each Base64URL-encoded:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← HEADER
.
eyJ1c2VySWQiOjQyLCJyb2xlIjoiYWRtaW4ifQ   ← PAYLOAD
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← SIGNATURE
```

### Header
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### Payload (Claims)
```json
{
  "userId": 42,
  "role": "admin",
  "email": "prathamesh@example.com",
  "iat": 1700000000,
  "exp": 1700086400
}
```
- `iat` = issued at (timestamp)
- `exp` = expiry (timestamp)
- Everything here is **readable by anyone** (just Base64 decoded)
- Never put passwords or sensitive data in payload

### Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```
Only the server knows `JWT_SECRET`. If payload is tampered with, signature won't match → token rejected.

---

## 3.3 Auth Flow — Pojjari Implementation

```
REGISTRATION:
User submits email + password
  → validate input
  → check email not already taken
  → bcrypt.hash(password, 10)
  → INSERT into users table
  → return success

LOGIN:
User submits email + password
  → SELECT user WHERE email = ?
  → if not found → 401
  → bcrypt.compare(password, user.password_hash)
  → if mismatch → 401
  → jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' })
  → return { token, user }

PROTECTED ROUTE:
Request arrives with Authorization: Bearer <token>
  → auth middleware extracts token
  → jwt.verify(token, JWT_SECRET)
  → if invalid/expired → 401
  → decoded payload → req.user = { userId, role }
  → next() → controller runs
```

### Login Controller (Pojjari)
```js
// controllers/auth.controller.js
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

async function login(req, res) {
  const { email, password } = req.body;

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
}
```

---

## 3.4 Password Hashing — bcrypt

### Why NOT MD5/SHA256?
- MD5/SHA256 are **fast** — attacker can hash millions of guesses per second
- Rainbow tables exist for common passwords
- bcrypt is **deliberately slow** (work factor / cost = 10-12 rounds)

### How bcrypt works
```js
// REGISTRATION — hash before storing
const saltRounds = 10;  // 2^10 = 1024 hashing iterations
const hash = await bcrypt.hash(password, saltRounds);
// Store hash in DB: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpZgH60bXWu

// LOGIN — compare
const isMatch = await bcrypt.compare(plainPassword, storedHash);
// bcrypt extracts the salt from the hash automatically
// Returns true or false
```

bcrypt output format: `$2b$10$<22-char salt><31-char hash>`
- `$2b$` = bcrypt version
- `10` = cost factor
- Next 22 chars = salt (automatically generated, unique per hash)
- Last 31 chars = actual hash

**Key:** bcrypt includes the salt IN the hash string. You never store salt separately.

---

## 3.5 RBAC — Role-Based Access Control (Pojjari)

```js
// users table: role ENUM('user', 'pujari', 'admin')

// middleware/auth.middleware.js
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
}

function pujariOrAdmin(req, res, next) {
  if (!['pujari', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Pujari or admin only' });
  }
  next();
}

// Usage in routes
router.get('/admin/users',    auth, adminOnly,     ctrl.getAllUsers);
router.put('/pujari/profile', auth, pujariOrAdmin, ctrl.updateProfile);
router.get('/my-bookings',    auth,                ctrl.getMyBookings);
```

---

## 3.6 Forgot Password — Secure Reset Flow (Pojjari)

```js
// FORGOT PASSWORD — never reveal if email exists
async function forgotPassword(req, res) {
  const { email } = req.body;
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

  if (rows.length) {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?,?,?)',
      [rows[0].id, token, expiresAt]);

    await sendPasswordResetEmail(email, resetLink); // fire-and-forget
  }

  // ALWAYS return same response — never reveal if email registered
  res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
}

// RESET PASSWORD
async function resetPassword(req, res) {
  const { token, password } = req.body;
  const [tokens] = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW()',
    [token]
  );
  if (!tokens.length) return res.status(400).json({ message: 'Invalid or expired token' });

  const hash = await bcrypt.hash(password, 12);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, tokens[0].user_id]);
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token = ?', [token]);

  res.json({ success: true, message: 'Password updated successfully' });
}
```

---

## 3.7 JWT Storage — Where?

| Storage | XSS Risk | CSRF Risk | Pojjari choice |
|---------|----------|-----------|---------------|
| localStorage | HIGH — JS can read it | None | ❌ Not used |
| sessionStorage | HIGH — JS can read it | None | ❌ Not used |
| HttpOnly Cookie | None — JS cannot read | Yes (need CSRF token) | ✅ Preferred for production |
| Memory (React state) | None | None | ✅ Pojjari uses this |

Pojjari frontend stores JWT in **React state + localStorage** for persistence across page refreshes. For production-grade security, HttpOnly cookies are better.

---

## 3.8 JWT Security Issues

**How to revoke JWT before expiry?**
Options:
1. **Token blacklist in Redis** — store invalid tokens until expiry
2. **Short expiry + Refresh tokens** — access token 15 min, refresh token 7 days in HttpOnly cookie
3. **User-specific token version** — store `token_version` in DB, increment on logout, check in middleware

Pojjari uses 7-day expiry + logout clears client-side token.

---

## Interview Q&A

**Q: JWT structure explain करा — 3 parts**
> JWT = Header.Payload.Signature — तिन्ही Base64URL encoded, dot separated. Header: algorithm आणि type. Payload: userId, role, expiry — हे readable असतं, sensitive data नको. Signature: server JWT_SECRET वापरून header + payload sign करतो. कोणी payload बदवलं तर signature match होत नाही → rejected.

**Q: Session-based vs Token-based auth**
> Session: Server DB/memory मध्ये state ठेवतो, client ला session_id देतो. Every request ला DB lookup. Scale करणं कठीण — multiple servers असतील तर shared session store लागतो.
> JWT: Stateless. Server कुठलीही state ठेवत नाही. Token मध्येच सगळी info. Any server can validate — just verify signature. Horizontal scaling easy.

**Q: bcrypt vs MD5**
> MD5 fast आहे — attacker 1 billion hashes/sec calculate करू शकतो. bcrypt deliberately slow आहे (10 rounds = 1024 iterations), attack करणं impractical. bcrypt मध्ये automatic salt आहे — same password दोन वेळा hash केलं तर different output. MD5 मध्ये नाही.

**Q: 401 vs 403**
> 401 = token नाही / invalid → "please login first". 403 = valid token, पण insufficient permissions → "you don't have access to this". Pojjari: no token → 401, non-admin admin route hit करेल → 403.

**Q: JWT कुठे store करतो? localStorage का नाही?**
> localStorage मध्ये XSS vulnerability आहे — कोणताही JS script localStorage read करू शकतो. Ideal: HttpOnly cookie मध्ये — JS ला accessible नाही, automatic with requests. Pojjari frontend React state + localStorage uses करतो (simpler), production grade साठी HttpOnly cookie migrate करणं better.

**Q: JWT revoke कसं करतो? (Token invalidation)**
> JWT stateless आहे — DB ला call न करता valid आहे. Revoke करायला: 1) Redis blacklist — logout वर token blacklist मध्ये add करतो, middleware check करतो. 2) Short expiry + refresh tokens — 15-min access token, server-side refresh token. 3) Token version in DB — user logout वर version increment, middleware version check करतो.

---

## Pojjari Project Connection

| Feature | JWT Concept |
|---------|------------|
| User login | `jwt.sign()` with userId + role |
| Protected routes | `auth` middleware: `jwt.verify()` |
| Admin panel | `adminOnly` middleware: role check |
| Pujari dashboard | `pujariOrAdmin` middleware |
| Password reset | `crypto.randomBytes(32)` token, DB-stored with expiry |
| Registration | `bcrypt.hash()` before INSERT |
| Login | `bcrypt.compare()` then jwt.sign() |

---

## Summary Table

| Concept | Key Point |
|---------|-----------|
| JWT | Header.Payload.Signature — stateless auth |
| Payload | Readable — never store passwords |
| Signature | Prevents tampering — HMAC with secret |
| bcrypt | Slow hashing + auto-salt — safe password storage |
| `jwt.sign()` | Create token — set expiry |
| `jwt.verify()` | Validate + decode token |
| 401 | No/invalid token — authentication |
| 403 | Valid token, no permission — authorization |
| RBAC | Role stored in JWT payload, checked in middleware |
| Forgot password | Crypto token in DB with expiry + used_at |
