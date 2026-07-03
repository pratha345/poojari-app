# Topic 02: Express.js + Middleware
> Minimal Node.js web framework — handles routing, middleware, error handling for all Pojjari APIs

---

## 2.1 What is Express.js?

Express is a **lightweight web framework for Node.js** that provides:
- HTTP routing (`GET /pujaris`, `POST /booking`)
- Middleware pipeline (request → middleware chain → response)
- Error handling
- Static file serving

Pojjari has **160+ REST API endpoints** all built with Express.

---

## 2.2 Middleware — The Core Concept

A middleware is a **function with access to `req`, `res`, and `next`**.

```
Request
  ↓
[cors()]            ← CORS headers
  ↓
[express.json()]    ← parse JSON body
  ↓
[rateLimit()]       ← IP rate limiting
  ↓
[authMiddleware]    ← verify JWT token
  ↓
[routeHandler]      ← your actual controller logic
  ↓
[errorMiddleware]   ← catch any errors
  ↓
Response
```

Each middleware either:
1. **Calls `next()`** → passes to next middleware
2. **Sends a response** → chain stops here
3. **Calls `next(err)`** → jumps to error-handling middleware

### Simple Middleware Example
```js
function logRequests(req, res, next) {
  console.log(`${req.method} ${req.path} — ${new Date().toISOString()}`);
  next(); // continue to next middleware
}

app.use(logRequests);
```

---

## 2.3 Express App Setup — Pojjari Structure

```js
// backend/src/app.js
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Global Middleware ──────────────────────────────────────
app.use(cors({
  origin: ['https://pujari.mydashboard.site', 'http://localhost:5173'],
  credentials: true,
}));
app.use(helmet());                  // security headers
app.use(express.json());            // parse JSON body → req.body
app.use(express.urlencoded({ extended: true })); // parse form data

// ── Rate Limiting ─────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', limiter);

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth.routes'));
app.use('/api/pujari',  require('./routes/pujari.routes'));
app.use('/api/booking', require('./routes/booking.routes'));
app.use('/api/admin',   require('./routes/admin.routes'));

// ── Error Handler (MUST be last) ──────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

module.exports = app;
```

---

## 2.4 Error-Handling Middleware — Why 4 Parameters?

```js
// Normal middleware: 3 params
app.use((req, res, next) => { ... });

// Error-handling middleware: 4 params — (err, req, res, next)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});
```

Express identifies error-handling middleware by the **4-parameter signature**. You MUST have all 4, even if you don't use `next`.

Triggered by calling `next(err)` from any middleware or controller:
```js
async function getBooking(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      const err = new Error('Booking not found');
      err.status = 404;
      return next(err); // jumps to error handler
    }
    res.json(rows[0]);
  } catch (err) {
    next(err); // unexpected DB error → 500
  }
}
```

---

## 2.5 Routing

### Router Modules (Pojjari pattern)
```js
// routes/booking.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/booking.controller');
const { auth, adminOnly } = require('../middleware/auth.middleware');

router.post('/',        auth,            ctrl.createBooking);
router.get('/',         auth,            ctrl.getMyBookings);
router.get('/all',      auth, adminOnly, ctrl.getAllBookings);
router.put('/:id',      auth,            ctrl.updateBooking);
router.delete('/:id',   auth, adminOnly, ctrl.deleteBooking);

module.exports = router;
```

### Route Parameters + Query Strings
```js
// Route params: /pujaris/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;          // from URL path /pujaris/42
  const { category } = req.query;     // from ?category=ganesh
  const { name } = req.body;          // from POST body (JSON)
  const token = req.headers.authorization; // from header
});
```

---

## 2.6 Auth Middleware — JWT Verification (Pojjari)

```js
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

module.exports = { auth, adminOnly };
```

---

## 2.7 Serving Static Files — Image Uploads

```js
// Serve uploaded images at /uploads/filename.jpg
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// multer middleware for file upload
const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

router.post('/upload', auth, upload.single('image'), ctrl.uploadPhoto);
// req.file.path → where multer saved it
// req.file.filename → the generated filename
```

---

## 2.8 Request / Response Cheat Sheet

```js
// Request object
req.params.id          // URL parameter /users/:id
req.query.page         // query string ?page=2
req.body.email         // JSON body (requires express.json())
req.headers.authorization  // header value
req.method             // GET, POST, PUT, DELETE
req.path               // /api/bookings/42
req.user               // set by auth middleware

// Response object
res.status(200).json({ data: rows })    // JSON response
res.status(201).json({ id: result.insertId }) // created
res.status(404).json({ message: 'Not found' })
res.status(401).json({ message: 'Unauthorized' })
res.status(403).json({ message: 'Forbidden' })
res.status(500).json({ message: 'Server error' })
res.sendFile(path.join(__dirname, 'index.html'))
```

---

## Interview Q&A

**Q: Middleware म्हणजे काय? `next()` काय करतो?**
> Middleware म्हणजे `(req, res, next)` signature असलेला function जो request-response cycle मध्ये येतो. Request येतो → middleware execute होतो → `next()` call केलं तर पुढचा middleware → `res.json()` / `res.send()` call केलं तर chain थांबतो. Chain हे एका pipe सारखं आहे.

**Q: Error-handling middleware मध्ये 4 parameters का असतात?**
> Express ने ते असं design केलं — जर पहिला parameter `err` असेल (4 params) तर Express ला कळतं हे error handler आहे. तो फक्त `next(err)` call झाल्यावर invoke होतो. 3-param middleware normal request flow साठी. हे Express चं internal convention आहे.

**Q: `req.body` undefined का येतो?**
> `express.json()` middleware add केलं नसेल तर. Express by default JSON body parse करत नाही. `app.use(express.json())` असायलाच हवं — हे Content-Type: application/json असलेले requests parse करतं आणि `req.body` set करतं.

**Q: 401 vs 403 — नक्की फरक?**
> 401 Unauthorized = "कोण आहेस ते सांग" — token नाही, token invalid. Authentication problem.
> 403 Forbidden = "कोण आहेस ते कळलं, पण permission नाही" — valid token पण admin नाही. Authorization problem.
> Pojjari मध्ये: Token नसेल → 401. Valid token पण non-admin admin route hit करेल → 403.

**Q: CORS म्हणजे काय? Pojjari मध्ये कसं configure केलं?**
> CORS = Cross-Origin Resource Sharing. Browser ने impose केलेली security policy — different origin (domain/port) वरून आलेल्या requests block करतो unless server explicitly allow करतो. Pojjari मध्ये `cors()` middleware वापरतो, specific origins whitelist करतो: production URL आणि localhost:5173 (Vite dev server). `credentials: true` cookies/authorization headers allow करतो.

**Q: Router मध्ये middleware chain कसं लिहितो?**
> `router.post('/', auth, adminOnly, ctrl.create)` — Express left-to-right execute करतो. `auth` run होतो, `next()` call करतो, `adminOnly` run होतो, `next()` call करतो, `ctrl.create` run होतो. कुठलाही `next(err)` call केला की error handler ला jump होतो.

---

## Pojjari Project Connection

| Feature | Express Concept |
|---------|----------------|
| 160+ API endpoints | Express Router (modular routing) |
| JWT protection | `auth` middleware on every protected route |
| Admin-only routes | `adminOnly` middleware |
| File upload | `multer` middleware |
| Rate limiting | `express-rate-limit` middleware |
| Error handling | Global 4-param error middleware |
| CORS | `cors()` with whitelist |
| Security headers | `helmet()` |

---

## Summary Table

| Concept | Key Point | Interview Answer |
|---------|-----------|-----------------|
| Middleware | (req, res, next) function | "pipeline pattern, each step can stop or continue" |
| `next()` | Pass to next middleware | "calling next() continues the chain" |
| `next(err)` | Jump to error handler | "any async error → wrap in try/catch → next(err)" |
| Error middleware | 4 params `(err, req, res, next)` | "Express identifies it by 4 params" |
| `express.json()` | Parse JSON body | "must add before routes or req.body is undefined" |
| Router | Modular route groups | "separation of concerns by feature" |
| 401 vs 403 | Auth vs Authorization | "who are you vs do you have permission" |
| `req.params` vs `req.query` | `:id` vs `?key=val` | "URL path segment vs query string" |
