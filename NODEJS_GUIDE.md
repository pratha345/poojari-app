# Pojjari Backend — Node.js Professional Guide
### तुमच्याच website च्या code मधून शिका

> **हा document तुमच्या स्वतःच्या pojjari backend च्या actual code वर based आहे.**
> प्रत्येक concept चा real example तुमच्याच project मधून घेतला आहे.

---

## 📚 Index (काय काय शिकणार)

1. [Node.js म्हणजे काय?](#1-nodejs-म्हणजे-काय)
2. [Express.js — Web Server कसा बनवतात](#2-expressjs--web-server)
3. [Environment Variables (.env)](#3-environment-variables)
4. [MySQL Database — mysql2](#4-mysql-database)
5. [Middleware — Request Filter](#5-middleware)
6. [Routes — URL Mapping](#6-routes)
7. [Controllers — Business Logic](#7-controllers)
8. [Authentication — JWT + bcrypt](#8-authentication)
9. [File Upload — Multer + Sharp](#9-file-upload)
10. [Caching — Redis](#10-caching--redis)
11. [Email — Nodemailer](#11-email--nodemailer)
12. [SMS — Fast2SMS](#12-sms--fast2sms)
13. [Payment — Razorpay](#13-payment--razorpay)
14. [Real-time — Socket.IO](#14-real-time--socketio)
15. [Push Notifications — Web Push](#15-push-notifications)
16. [Multi-tenancy Architecture](#16-multi-tenancy)
17. [Error Handling Patterns](#17-error-handling)
18. [Async/Await — Proper Way](#18-asyncawait)
19. [Complete Middleware Chain Flow](#19-complete-flow)
20. [Project Start ते Deploy — Steps](#20-project-setup)

---

## 1. Node.js म्हणजे काय?

Node.js म्हणजे JavaScript को browser बाहेर (server वर) run करण्याचा runtime.

**Browser JavaScript** → form submit, button click, animation  
**Node.js JavaScript** → database query, file read/write, HTTP server

### तुमच्या project मधला entry point:

```javascript
// backend/src/app.js — हा file run केला की server start होतो
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**`require()`** = Node.js चा import (जसे React मध्ये `import` असतो)

---

## 2. Express.js — Web Server

Express म्हणजे Node.js वरचा lightweight framework जो HTTP requests handle करतो.

### Basic Flow:
```
Client Request → Express App → Middleware → Route → Controller → Response
```

### तुमच्या app.js मधला structure:

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app); // Express + Socket.IO एकत्र

// ── Security Middleware ──
app.use(helmet());  // HTTP headers secure करतो

// ── CORS — कोणत्या domain ला access द्यायचा ──
app.use(cors({
  origin: process.env.CLIENT_URL,  // 'http://localhost:5173'
  credentials: true                 // cookies allow करायच्या
}));

// ── Body Parser — JSON request body वाचायला ──
app.use(express.json({ limit: '10mb' }));

// ── Static Files — uploads folder public करायला ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'public, max-age=31536000'); // 1 year cache
  }
}));

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/poojas', poojaRoutes);
app.use('/api/bookings', bookingRoutes);

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});
```

### `app.use()` vs `app.get()` vs `app.post()`:

| Method | कधी वापरतो | Example |
|--------|------------|---------|
| `app.use()` | सगळ्या requests साठी (middleware) | CORS, body parser |
| `app.get()` | फक्त GET requests | Data fetch |
| `app.post()` | फक्त POST requests | Create/Login |
| `app.put()` | फक्त PUT requests | Update |
| `app.delete()` | फक्त DELETE requests | Delete |

---

## 3. Environment Variables

`.env` file मध्ये sensitive data ठेवतो — passwords, API keys, DB credentials.

### तुमचा `.env`:
```env
# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://pojjari.com

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=pojjari_db

# JWT (Authentication Token)
JWT_SECRET=super_secret_key_change_this
JWT_EXPIRES_IN=7d

# Redis (Cache)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=pojjari@gmail.com
EMAIL_PASS=gmail_app_password

# SMS
FAST2SMS_API_KEY=your_api_key

# Razorpay (Payment)
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=secret_xxx

# Web Push
VAPID_EMAIL=mailto:admin@pojjari.com
VAPID_PUBLIC_KEY=BAxxx...
VAPID_PRIVATE_KEY=xxx...

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Groq AI
GROQ_API_KEY=gsk_xxx
```

### Code मध्ये कसे वापरतो:

```javascript
// app.js च्या top ला एकदाच
require('dotenv').config();

// नंतर कुठेही:
const port = process.env.PORT;           // '5000'
const dbHost = process.env.DB_HOST;      // 'localhost'
const secret = process.env.JWT_SECRET;   // 'super_secret...'
```

**`.env` file कधीही GitHub वर push करू नये** — `.gitignore` मध्ये add करा.

---

## 4. MySQL Database

### Connection Pool Setup (तुमचा `config/db.js`):

```javascript
const mysql = require('mysql2/promise');

// Pool म्हणजे multiple connections ready ठेवतो
// प्रत्येक request साठी नवीन connection बनवत नाही
const pool = mysql.createPool({
  host:            process.env.DB_HOST,
  port:            process.env.DB_PORT || 3306,
  user:            process.env.DB_USER,
  password:        process.env.DB_PASSWORD,
  database:        process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,          // एकाच वेळी max 10 connections
  charset:         'utf8mb4',   // Marathi (Unicode) साठी जरुरी
});

module.exports = pool;
```

### Database Query करण्याचे 4 Patterns:

#### Pattern 1: Simple SELECT
```javascript
const db = require('../config/db');

// [rows, fields] — destructuring
// rows = array of objects (result)
const [rows] = await db.query('SELECT * FROM poojas WHERE is_active = 1');
console.log(rows); // [{ id: 1, name_mr: 'गणेश पूजा', ... }]
```

#### Pattern 2: Parameterized Query (SQL Injection पासून सुरक्षित)
```javascript
// ? = placeholder — mysql driver automatically escape करतो
const [rows] = await db.query(
  'SELECT * FROM poojas WHERE tenant_id = ? AND slug = ?',
  [tenantId, slug]  // values स्वतंत्र pass करतो — NEVER concatenate
);
```

#### Pattern 3: INSERT
```javascript
const [result] = await db.query(
  'INSERT INTO users (name, phone, password_hash, tenant_id) VALUES (?, ?, ?, ?)',
  [name, phone, hashedPassword, tenantId]
);

console.log(result.insertId);   // नव्याने insert झालेल्या row चा ID
console.log(result.affectedRows); // 1 (किती rows insert झाल्या)
```

#### Pattern 4: UPDATE
```javascript
const [result] = await db.query(
  'UPDATE bookings SET status = ?, updated_at = NOW() WHERE id = ?',
  ['completed', bookingId]
);

if (result.affectedRows === 0) {
  // कोणतीच row update झाली नाही — record नाहीये
  return res.status(404).json({ message: 'Booking not found' });
}
```

### Transaction — Multiple Queries एकत्र (All or Nothing):

तुमच्या `tenantRegister.controller.js` मधून:

```javascript
// Tenant बनवताना एकाच वेळी tenant + user + settings create करायचे
// एखादी fail झाली तर सगळं rollback

const connection = await db.getConnection(); // pool मधून एक connection घेतो
try {
  await connection.beginTransaction(); // Transaction start

  // Step 1: Tenant insert
  const [tenantResult] = await connection.query(
    'INSERT INTO tenants (name, slug, phone, city) VALUES (?, ?, ?, ?)',
    [name, slug, phone, city]
  );
  const tenantId = tenantResult.insertId;

  // Step 2: Admin user insert
  await connection.query(
    'INSERT INTO users (tenant_id, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [tenantId, contactName, phone, hashedPwd, 'admin']
  );

  // Step 3: Default settings insert
  await connection.query(
    'INSERT INTO site_settings (tenant_id, active_theme) VALUES (?, ?)',
    [tenantId, 'default']
  );

  await connection.commit(); // सगळं OK → save करा
  
} catch (err) {
  await connection.rollback(); // एरर आली → सगळं cancel करा
  throw err;
} finally {
  connection.release(); // connection pool ला परत द्या
}
```

### JOIN Queries (Multiple Tables):

तुमच्या `booking.controller.js` मधून:
```javascript
const [bookings] = await db.query(`
  SELECT 
    b.*,
    p.name_mr   AS pooja_name,
    p.image_url AS pooja_image,
    pp.full_name  AS pujari_name,
    pp.photo_url  AS pujari_photo,
    u.name        AS user_name,
    u.phone       AS user_phone
  FROM bookings b
  LEFT JOIN poojas p        ON b.pooja_id   = p.id
  LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.user_id
  LEFT JOIN users u         ON b.user_id    = u.id
  WHERE b.tenant_id = ?
  ORDER BY b.created_at DESC
  LIMIT ? OFFSET ?
`, [tenantId, limit, offset]);
```

**LEFT JOIN** = pooja/pujari नसली तरी booking दाखव (NULL येईल)  
**INNER JOIN** = दोन्ही असेल तरच दाखव

### Auto-Migration (startup वेळी columns add करणे):

```javascript
// db.js मधला auto-migration pattern
const runMigrations = async () => {
  // Column already exists का? — duplicate error टाळायला
  const migrations = [
    `ALTER TABLE halls ADD COLUMN IF NOT EXISTS district VARCHAR(100)`,
    `ALTER TABLE pujari_profiles ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7)`,
    `ALTER TABLE pujari_profiles ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7)`,
  ];

  for (const sql of migrations) {
    try {
      await pool.query(sql);
    } catch (e) {
      // Column already exists — ignore
      if (!e.message.includes('Duplicate column')) {
        console.error('Migration error:', e.message);
      }
    }
  }
};
```

---

## 5. Middleware

Middleware म्हणजे request आणि response च्या मध्ये येणारा function.

```
Request → [Middleware 1] → [Middleware 2] → [Route Handler] → Response
```

**`next()`** call केलं तर पुढच्या middleware ला जातो.  
**`next()`** call नाही केलं तर chain थांबतो.

### तुमचा Authentication Middleware:

```javascript
// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const db  = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    // 1. Header मधून token काढा
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token required' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer abc123" → "abc123"

    // 2. Token verify करा
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: 5, role: 'admin', tenant_id: 1 }

    // 3. DB मधून fresh user data घ्या
    const [users] = await db.query(
      'SELECT id, name, role, tenant_id, is_active FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users.length || !users[0].is_active) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }

    // 4. req ला user attach करा — पुढचे handlers वापरतील
    req.user = users[0];
    next(); // Authentication passed, continue

  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Authorization Middleware (Role Check):

```javascript
// authorize('admin', 'super_admin') → factory function returns middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    // super_admin ला सगळ्या permissions
    if (req.user.role === 'super_admin') return next();

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// वापर:
router.delete('/user/:id', authenticate, authorize('admin', 'super_admin'), deleteUser);
```

### Tenant Middleware (Multi-tenancy):

```javascript
// middleware/tenant.middleware.js
const attachTenant = async (req, res, next) => {
  let slug = null;

  // Priority 1: Header मधून (API calls साठी)
  if (req.headers['x-tenant-slug']) {
    slug = req.headers['x-tenant-slug'];

  // Priority 2: Subdomain मधून (nashik.pojjari.com → 'nashik')
  } else {
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'pojjari') {
      slug = subdomain;
    }
  }

  // Tenant DB मधून शोधा
  const [tenants] = slug
    ? await db.query('SELECT * FROM tenants WHERE slug = ?', [slug])
    : await db.query('SELECT * FROM tenants WHERE id = 1'); // Default

  if (!tenants.length) {
    return res.status(404).json({ message: 'Tenant not found' });
  }

  req.tenant = tenants[0];
  next();
};
```

### Custom Middleware बनवण्याचा Pattern:

```javascript
// कोणताही middleware याच structure मध्ये असतो
const myMiddleware = (req, res, next) => {
  // req — client ने काय पाठवलं
  // res — client ला काय पाठवायचं
  // next — पुढे जा

  if (/* काहीतरी चुकलं */) {
    return res.status(400).json({ message: 'Bad request' }); // chain थांब
  }

  // काहीतरी modify करा
  req.myData = 'extra info';
  
  next(); // पुढे जा
};
```

---

## 6. Routes

Routes म्हणजे URL → Function चा mapping.

### तुमचा Route Structure:

```javascript
// routes/booking.routes.js
const express  = require('express');
const router   = express.Router();

const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createBooking, getMyBookings, cancelBooking } = require('../controllers/booking.controller');

// Public route — login नाही लागत
router.get('/public-info', getPublicInfo);

// Protected route — login लागतो
router.post('/', authenticate, createBooking);

// Role-based route — फक्त user + authenticate
router.get('/my', authenticate, authorize('user', 'pujari'), getMyBookings);

// Admin route — फक्त admin
router.get('/all', authenticate, authorize('admin'), getAllBookings);

// URL params — :id, :code
router.get('/:code', authenticate, getBookingByCode);
router.put('/:id/cancel', authenticate, cancelBooking);

module.exports = router;
```

### app.js मध्ये Mount करणे:

```javascript
// सगळ्या booking routes आधी /api/bookings लागतो
app.use('/api/bookings', bookingRoutes);

// म्हणजे:
// POST /api/bookings/        → createBooking
// GET  /api/bookings/my      → getMyBookings
// GET  /api/bookings/:code   → getBookingByCode
// PUT  /api/bookings/:id/cancel → cancelBooking
```

### Route Parameters वाचणे:

```javascript
// URL: GET /api/bookings/POJ-ABC123
router.get('/:code', authenticate, async (req, res) => {
  const { code } = req.params; // 'POJ-ABC123'
});

// URL: GET /api/poojas?category=5&page=2&search=ganesh
router.get('/', async (req, res) => {
  const { category, page = 1, search } = req.query;
  // category = '5', page = '2', search = 'ganesh'
});

// POST body वाचणे
router.post('/', async (req, res) => {
  const { name, phone, date } = req.body;
});
```

---

## 7. Controllers

Controllers मध्ये actual business logic असतो — DB queries, calculations, response.

### तुमचा Booking Create Controller:

```javascript
// controllers/booking.controller.js
const db       = require('../config/db');
const { success, error } = require('../utils/response.util');
const { generateBookingCode, calculateFees } = require('../utils/helpers');

exports.createBooking = async (req, res) => {
  try {
    const {
      pooja_id, booking_date, booking_time,
      address, city, district, special_notes
    } = req.body;

    const userId   = req.user.id;
    const tenantId = req.tenant.id;

    // 1. Pooja details घ्या (price साठी)
    const [poojas] = await db.query(
      'SELECT id, name_mr, price FROM poojas WHERE id = ? AND tenant_id = ? AND is_active = 1',
      [pooja_id, tenantId]
    );
    if (!poojas.length) {
      return error(res, 'Pooja not found', 404);
    }
    const pooja = poojas[0];

    // 2. Fees calculate करा
    const { totalAmount, platformFee, pujariAmount } = calculateFees(pooja.price);
    // platform_fee = 5%, pujari_amount = 95%

    // 3. Unique booking code generate करा
    const bookingCode = generateBookingCode(); // 'POJ-X7K2M9'

    // 4. DB मध्ये insert करा
    const [result] = await db.query(`
      INSERT INTO bookings 
        (booking_code, user_id, tenant_id, pooja_id, booking_date, 
         booking_time, address, city, district, special_notes,
         total_amount, platform_fee, pujari_amount, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    `, [
      bookingCode, userId, tenantId, pooja_id, booking_date,
      booking_time, address, city, district, special_notes,
      totalAmount, platformFee, pujariAmount
    ]);

    // 5. Admin ला notify करा (fire-and-forget — response block करत नाही)
    notifyAdminNewBooking(tenantId, result.insertId, pooja.name_mr, bookingCode)
      .catch(() => {}); // error ignore — notification fail झाली तरी booking OK

    // 6. Response पाठवा
    return success(res, { bookingCode, id: result.insertId }, 'Booking created!', 201);

  } catch (err) {
    console.error('createBooking error:', err);
    return error(res, 'Server error', 500);
  }
};
```

### Response Utility (`utils/response.util.js`):

```javascript
// Standardized response format — सगळ्या controllers मध्ये same structure
exports.success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.error = (res, message = 'Error', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

// Client ला मिळतं:
// { "success": true, "message": "Booking created!", "data": { "bookingCode": "POJ-X7K2M9" } }
```

### Helper Functions (`utils/helpers.js`):

```javascript
// Booking code generate — confusing chars (I, O, 0, 1) remove केले
exports.generateBookingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'POJ-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code; // 'POJ-X7K2M9'
};

// Fee calculation — 5% platform, 95% pujari
exports.calculateFees = (amount) => {
  const platformFee = Math.round(amount * 0.05);
  return {
    totalAmount:  amount,
    platformFee,
    pujariAmount: amount - platformFee
  };
};

// Indian currency format
exports.formatPrice = (amount) => {
  return new Intl.NumberFormat('mr-IN', {
    style: 'currency', currency: 'INR'
  }).format(amount);
  // → '₹१,२३५.००'
};
```

---

## 8. Authentication

### JWT (JSON Web Token) — How it Works:

```
Login → Server creates TOKEN → Client stores it → Client sends it with every request
```

Token structure: `header.payload.signature`  
Example: `eyJhbGc...` (base64 encoded — decode करा jwt.io वर)

### JWT Create + Verify (तुमचा auth.controller.js):

```javascript
const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db     = require('../config/db');

// ── LOGIN ──
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // 1. User शोधा
    const [users] = await db.query(
      'SELECT * FROM users WHERE phone = ? AND tenant_id = ?',
      [phone, req.tenant.id]
    );

    if (!users.length) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = users[0];

    // 2. Password check (plain === hashed?)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // 3. JWT Token बनवा
    const token = jwt.sign(
      { id: user.id, role: user.role, tenant_id: user.tenant_id }, // payload
      process.env.JWT_SECRET,                                        // secret key
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }            // expiry
    );

    res.json({
      success: true,
      token,   // client ला द्या — localStorage मध्ये store करतो
      user: {
        id: user.id, name: user.name,
        role: user.role, phone: user.phone
      }
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── REGISTER ──
exports.register = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // 1. Already exists?
    const [existing] = await db.query(
      'SELECT id FROM users WHERE phone = ? AND tenant_id = ?',
      [phone, req.tenant.id]
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Phone already registered' });
    }

    // 2. Password hash करा — plain text कधीच store करू नये
    const saltRounds = 10; // जास्त = secure पण slow
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // '123456' → '$2a$10$abcdef...' (irreversible)

    // 3. Insert
    const [result] = await db.query(
      'INSERT INTO users (name, phone, password_hash, role, tenant_id) VALUES (?, ?, ?, ?, ?)',
      [name, phone, hashedPassword, 'user', req.tenant.id]
    );

    // 4. Token बनवा
    const token = jwt.sign(
      { id: result.insertId, role: 'user', tenant_id: req.tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ success: true, token });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
```

### OTP Authentication:

```javascript
// ── SEND OTP ──
exports.sendOtp = async (req, res) => {
  const { phone } = req.body;

  // Random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 10 minutes expiry
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // UTC+0

  // DB मध्ये store करा
  await db.query(
    'UPDATE users SET otp_code = ?, otp_expiry = ? WHERE phone = ?',
    [otp, expiry, phone]
  );

  // SMS पाठवा
  await sendOTP(phone, otp);

  res.json({ success: true, message: 'OTP sent' });
};

// ── VERIFY OTP ──
exports.verifyOtp = async (req, res) => {
  const { phone, otp } = req.body;

  const [users] = await db.query(
    'SELECT * FROM users WHERE phone = ? AND otp_code = ?',
    [phone, otp]
  );

  if (!users.length) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // Expiry check
  if (new Date() > new Date(users[0].otp_expiry)) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  // OTP use झाला — clear करा
  await db.query('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE id = ?', [users[0].id]);

  // Token द्या
  const token = jwt.sign({ id: users[0].id, ... }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token });
};
```

### Google OAuth:

```javascript
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  // Google token verify करा
  const ticket = await client.verifyIdToken({
    idToken:  token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const { name, email, sub: googleId, picture } = ticket.getPayload();

  // User already exists?
  const [users] = await db.query(
    'SELECT * FROM users WHERE google_id = ? OR email = ?',
    [googleId, email]
  );

  let userId;
  if (users.length) {
    userId = users[0].id;
  } else {
    // नवीन user create करा
    const [result] = await db.query(
      'INSERT INTO users (name, email, google_id, photo_url, role, tenant_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, googleId, picture, 'user', req.tenant.id]
    );
    userId = result.insertId;
  }

  const jwtToken = jwt.sign({ id: userId, ... }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, token: jwtToken });
};
```

---

## 9. File Upload

### Multer Setup (तुमचा `config/multer.js`):

```javascript
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

// कुठे save करायचं
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // fieldname वरून folder decide
    const folderMap = {
      image:       'poojas',
      photo:       'pujari',
      certificate: 'pujari',
      blog_image:  'blog',
    };
    const folder = folderMap[file.fieldname] || 'misc';
    const dir = path.join(__dirname, '../../uploads', folder);

    // Folder नसेल तर बनवा
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
    // → 'photo-1718345678901-123456789.jpg'
  }
});

// फक्त images allow
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) {
    cb(null, true);  // allow
  } else {
    cb(new Error('Only images allowed'), false); // reject
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
```

### Route मध्ये वापरणे:

```javascript
// एक file
router.post('/pooja', upload.single('image'), createPooja);

// Multiple files (different fields)
router.post('/pujari/register', upload.fields([
  { name: 'photo',       maxCount: 1 },
  { name: 'certificate', maxCount: 1 }
]), registerPujari);

// Controller मध्ये:
exports.createPooja = async (req, res) => {
  // upload.single('image') नंतर:
  const imageUrl = req.file
    ? `/uploads/poojas/${req.file.filename}`
    : null;

  // upload.fields() नंतर:
  const photoUrl = req.files?.photo?.[0]
    ? `/uploads/pujari/${req.files.photo[0].filename}`
    : null;
  const certUrl  = req.files?.certificate?.[0]
    ? `/uploads/pujari/${req.files.certificate[0].filename}`
    : null;
};
```

### Sharp — Image Optimization:

```javascript
const sharp = require('sharp');

// तुमचा webpConvert middleware
const webpConvert = async (req, res, next) => {
  const files = req.file ? [req.file] : Object.values(req.files || {}).flat();

  for (const file of files) {
    const ext = path.extname(file.filename).toLowerCase();
    if (ext === '.pdf') continue; // PDFs skip

    const webpPath = file.path.replace(/\.(jpe?g|png|gif|webp)$/i, '.webp');
    const thumbPath = webpPath.replace('.webp', '_thumb.webp');

    // Original → WebP (82% quality)
    await sharp(file.path)
      .webp({ quality: 82, effort: 4 })
      .toFile(webpPath);

    // Thumbnail (320px wide)
    await sharp(file.path)
      .resize(320, null, { withoutEnlargement: true })
      .webp({ quality: 75 })
      .toFile(thumbPath);

    // Original delete करा
    fs.unlink(file.path, () => {});

    // req.file update करा — controller ला webp path मिळेल
    file.path     = webpPath;
    file.filename = path.basename(webpPath);
    file.mimetype = 'image/webp';
  }

  next();
};
```

---

## 10. Caching — Redis

Cache म्हणजे frequently used data memory मध्ये store करणे — DB hit टाळणे.

```
Request → Cache hit? → YES: return cache (fast)
                    → NO: DB query → store in cache → return
```

### तुमचा `utils/redis.js`:

```javascript
const Redis = require('ioredis');

let client = null;

try {
  client = new Redis({
    host:     process.env.REDIS_HOST || '127.0.0.1',
    port:     parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db:       parseInt(process.env.REDIS_DB) || 0,
    lazyConnect: true,
  });

  client.on('error', () => { client = null; }); // Redis नसेल तर graceful fail
} catch {
  client = null;
}

// Cache GET
exports.getCache = async (key) => {
  if (!client) return null; // Redis नसेल तर null (cache miss)
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// Cache SET
exports.setCache = async (key, data, ttlSeconds = 1800) => {
  if (!client) return;
  try {
    await client.setex(key, ttlSeconds, JSON.stringify(data));
    // setex = set + expiry (TTL)
  } catch {}
};

// Cache DELETE
exports.delCache = async (...keys) => {
  if (!client) return;
  try {
    await client.del(...keys);
  } catch {}
};

// Pattern DELETE — 'pooja:list:*' सगळ्या list cache clear
exports.delCachePattern = async (pattern) => {
  if (!client) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length) await client.del(...keys);
  } catch {}
};
```

### Cache Pattern in Controller:

```javascript
const { getCache, setCache, delCachePattern } = require('../utils/redis');

// GET with Cache
exports.getPoojas = async (req, res) => {
  const { category, page = 1, search } = req.query;

  // Unique cache key — query params वरून
  const cacheKey = `pooja:list:${req.tenant.id}:${JSON.stringify({ category, page, search })}`;

  // Cache hit check
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, fromCache: true });
  }

  // Cache miss → DB query
  const [rows] = await db.query('SELECT * FROM poojas WHERE ... LIMIT ? OFFSET ?', [...]);

  // Store in cache (30 minutes)
  await setCache(cacheKey, rows, 1800);

  res.json({ success: true, data: rows });
};

// CRUD वेळी cache invalidate करा
exports.createPooja = async (req, res) => {
  // ... insert ...

  // सगळ्या list caches clear करा
  await delCachePattern(`pooja:list:${req.tenant.id}:*`);

  res.json({ success: true });
};
```

**Cache TTLs तुमच्या project मधल्या:**
- Categories: 3600s (60 min) — rarely changes
- Pooja list: 1800s (30 min)
- Single pooja: 1800s (30 min)
- Blog list: 300s (5 min) — frequently updated
- Top reviews: 600s (10 min)

---

## 11. Email — Nodemailer

```javascript
// services/email.service.js
const nodemailer = require('nodemailer');

// Transporter — Gmail SMTP
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,   // 'smtp.gmail.com'
  port:   process.env.EMAIL_PORT,   // 587
  secure: false,                     // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS    // Gmail App Password (not regular password)
  }
});

// Booking Confirmation Email
exports.sendBookingConfirmation = async (toEmail, booking) => {
  try {
    await transporter.sendMail({
      from:    `"Pojjari" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: `बुकिंग Confirm झाले — ${booking.bookingCode}`,
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #b45309;">🙏 बुकिंग Confirmed!</h2>
          <p>नमस्कार ${booking.userName},</p>
          <p>तुमची <strong>${booking.poojaName}</strong> बुकिंग confirm झाली आहे.</p>
          <table style="border-collapse: collapse; width: 100%;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Booking Code</td>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>${booking.code}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">तारीख</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.date}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">वेळ</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${booking.time}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">Amount</td>
              <td style="padding: 8px; border: 1px solid #ddd;">₹${booking.amount}</td>
            </tr>
          </table>
          <p style="color: #666; margin-top: 20px;">हरि ॐ!</p>
        </div>
      `
    });
    console.log('Email sent to', toEmail);
  } catch (err) {
    console.error('Email error:', err.message);
    // Email fail झाली तरी booking fail होऊ नये
  }
};
```

**Gmail साठी App Password कसा मिळवायचा:**
1. Google Account → Security → 2-Step Verification enable
2. App Passwords → "Mail" + "Other" → Generate
3. Generated password `.env` मध्ये `EMAIL_PASS` ला ठेव

---

## 12. SMS — Fast2SMS

```javascript
// services/sms.service.js
const axios = require('axios'); // HTTP requests साठी

exports.sendOTP = async (phone, otp) => {
  if (!process.env.FAST2SMS_API_KEY) {
    // Dev mode — SMS नाही पाठवत, console वर दाखवतो
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return;
  }

  try {
    await axios.post('https://www.fast2sms.com/dev/bulkV2', {
      route:    'q',          // Quick route (no DLT registration needed)
      message:  `Your Pojjari OTP is ${otp}. Valid for 10 minutes.`,
      language: 'english',
      flash:    0,
      numbers:  phone
    }, {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY
      }
    });
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
    // SMS fail झाली तरी throw करू नये — OTP DB मध्ये आहेच
  }
};

exports.sendSMS = async (phone, message) => {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`[DEV] SMS to ${phone}: ${message}`);
    return;
  }
  // same as above with custom message
};
```

---

## 13. Payment — Razorpay

```javascript
// controllers/booking.controller.js — Razorpay integration
const Razorpay = require('razorpay');
const crypto   = require('crypto'); // Node.js built-in (HMAC signature)

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ── STEP 1: Order बनवा ──
exports.createPaymentOrder = async (req, res) => {
  const { bookingId } = req.body;

  const [bookings] = await db.query(
    'SELECT total_amount FROM bookings WHERE id = ? AND user_id = ?',
    [bookingId, req.user.id]
  );

  const order = await razorpay.orders.create({
    amount:   bookings[0].total_amount * 100, // Razorpay = paise (₹500 = 50000)
    currency: 'INR',
    receipt:  `booking_${bookingId}`
  });

  // Order ID client ला द्या
  res.json({ success: true, data: { orderId: order.id, amount: order.amount } });
};

// ── STEP 2: Payment Verify ──
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  // HMAC-SHA256 signature verify — tampering check
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Invalid signature — payment tampered' });
  }

  // Payment genuine → DB update
  await db.query(
    'UPDATE bookings SET payment_status = ?, payment_id = ? WHERE id = ?',
    ['paid', razorpay_payment_id, bookingId]
  );

  res.json({ success: true, message: 'Payment verified!' });
};
```

**Flow:**
```
Client: "Book करायचं" → createPaymentOrder → orderId मिळतो
Client: Razorpay Popup (user pays) → payment complete
Client: verifyPayment (orderId + paymentId + signature) → Backend verify → DB update
```

---

## 14. Real-time — Socket.IO

```javascript
// app.js — Socket.IO setup
const { createServer } = require('http');
const { Server }       = require('socket.io');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true }
});

// Global accessible बनवा — controllers मधून वापरता येईल
global.io = io;

// Connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Client एका tenant च्या "room" मध्ये join होतो
  socket.on('join-tenant', (tenantId) => {
    socket.join(`tenant_${tenantId}`);
    console.log(`Socket joined room: tenant_${tenantId}`);
  });

  // AI poster generation progress track करणे
  socket.on('join-poster-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Server start
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Controller मधून Emit:

```javascript
// Booking create झाली → admin ला real-time notify
exports.createBooking = async (req, res) => {
  // ... booking create ...

  // सगळ्या admin clients ना notify करा जे tenant room मध्ये आहेत
  if (global.io) {
    global.io.to(`tenant_${tenantId}`).emit('new-booking', {
      bookingCode,
      poojaName: pooja.name_mr,
      userName:  req.user.name,
      amount:    totalAmount,
      createdAt: new Date()
    });
  }

  res.json({ success: true, data: { bookingCode } });
};

// AI Poster generation progress
const emitProgress = (roomId, step, total, message) => {
  if (global.io) {
    global.io.to(roomId).emit('poster-progress', {
      step, total,
      percent: Math.round((step / total) * 100),
      message
    });
  }
};
```

### Frontend मध्ये (React):

```javascript
import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_API_URL);

// Admin dashboard मध्ये notifications
socket.emit('join-tenant', tenantId);
socket.on('new-booking', (booking) => {
  // Toast notification दाखवा
  showNotification(`नवीन बुकिंग: ${booking.poojaName} — ${booking.bookingCode}`);
});
```

---

## 15. Push Notifications

```javascript
// services/pushService.js
const webpush = require('web-push');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// सगळ्या tenant subscriptions ना notification पाठवा
exports.sendPushToTenant = async (tenantId, payload) => {
  const [subs] = await db.query(
    'SELECT * FROM push_subscriptions WHERE tenant_id = ?',
    [tenantId]
  );

  const results = await Promise.allSettled(
    subs.map(sub => webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    ))
  );

  // Expired subscriptions delete करा (410 Gone)
  results.forEach((result, i) => {
    if (result.status === 'rejected' && result.reason?.statusCode === 410) {
      db.query('DELETE FROM push_subscriptions WHERE id = ?', [subs[i].id]);
    }
  });
};

// VAPID Keys generate करायला (एकदाच run करा):
// node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys())"
```

---

## 16. Multi-tenancy

**Multi-tenant म्हणजे एकाच codebase मधून multiple clients serve करणे.**

तुमच्या project मध्ये: nashik.pojjari.com, pune.pojjari.com — same code, different data.

```javascript
// प्रत्येक DB query मध्ये tenant_id filter असतो
const [poojas] = await db.query(
  'SELECT * FROM poojas WHERE tenant_id = ? AND is_active = 1',
  [req.tenant.id]  // tenant_id हे middleware ने set केलेलं असतं
);

// Super admin (tenant_id filter नाही — सगळं बघू शकतो)
const filter = req.user.role === 'super_admin'
  ? ''
  : 'WHERE tenant_id = ' + req.tenant.id;

const [all] = await db.query(`SELECT * FROM bookings ${filter}`);
```

### Subscription Gating Middleware:

```javascript
// Expired plan असेल तर API block करा
exports.checkPlanExpiry = async (req, res, next) => {
  const tenant = req.tenant;

  if (!tenant.is_active) {
    return res.status(402).json({ message: 'Subscription inactive' });
  }

  const now = new Date();

  // Trial period check
  if (tenant.trial_ends_at && now > new Date(tenant.trial_ends_at) && !tenant.plan_expires_at) {
    return res.status(402).json({ message: 'Trial expired. Please subscribe.' });
  }

  // Paid plan check
  if (tenant.plan_expires_at && now > new Date(tenant.plan_expires_at)) {
    return res.status(402).json({ message: 'Plan expired. Please renew.' });
  }

  next();
};
```

---

## 17. Error Handling

### Try-Catch Pattern (सगळ्या async functions मध्ये):

```javascript
exports.someController = async (req, res) => {
  try {
    // ... code ...
    res.json({ success: true });
  } catch (err) {
    console.error('someController error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
```

### HTTP Status Codes — कधी काय वापरायचे:

| Code | Meaning | कधी वापरतो |
|------|---------|------------|
| `200` | OK | GET, PUT success |
| `201` | Created | POST success |
| `400` | Bad Request | Invalid input |
| `401` | Unauthorized | Token नाही / invalid |
| `402` | Payment Required | Plan expired |
| `403` | Forbidden | Token आहे पण permission नाही |
| `404` | Not Found | Record नाही |
| `409` | Conflict | Duplicate (phone already registered) |
| `500` | Server Error | DB crash, unexpected error |

### Graceful Degradation Pattern:

```javascript
// Non-critical operations fail झाल्या तरी main flow बंद पडू नये
exports.createBooking = async (req, res) => {
  // Main logic
  const [result] = await db.query('INSERT INTO bookings ...');

  // Fire-and-forget (catch करा — throw करू नये)
  sendBookingEmail(userEmail, booking)
    .catch(err => console.error('Email failed:', err.message));

  sendSMS(phone, message)
    .catch(err => console.error('SMS failed:', err.message));

  notifyAdminSocket(tenantId, booking)
    .catch(() => {}); // Silent fail OK

  // Email/SMS fail झाली तरी booking success
  res.json({ success: true, data: { bookingCode } });
};
```

### Input Validation:

```javascript
const { body, validationResult } = require('express-validator');

// Route level validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name required')
    .isLength({ min: 2, max: 100 }).withMessage('Name: 2-100 chars')
    .not().matches(/<[^>]*>/).withMessage('HTML tags not allowed'), // XSS protection

  body('phone')
    .trim()
    .isMobilePhone('en-IN').withMessage('Invalid Indian phone number'),

  body('password')
    .isLength({ min: 8 }).withMessage('Password min 8 chars')
];

// Controller मध्ये check करा
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  // ... continue ...
};
```

---

## 18. Async/Await

### Sync vs Async — फरक:

```javascript
// ❌ WRONG — synchronous DB call (blocks everything)
function getUser(id) {
  const user = db.query('SELECT * FROM users WHERE id = ?', [id]); // WRONG
  return user;
}

// ✅ RIGHT — async/await
async function getUser(id) {
  const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return users[0];
}
```

### Parallel Queries (जास्त fast):

```javascript
// ❌ SLOW — एक एक करून (total = 300ms + 400ms = 700ms)
const [users]    = await db.query('SELECT COUNT(*) FROM users ...');
const [bookings] = await db.query('SELECT COUNT(*) FROM bookings ...');
const [revenue]  = await db.query('SELECT SUM(amount) FROM bookings ...');

// ✅ FAST — एकत्र (total = max(300, 400, 200) = 400ms)
const [[users], [bookings], [revenue]] = await Promise.all([
  db.query('SELECT COUNT(*) FROM users ...'),
  db.query('SELECT COUNT(*) FROM bookings ...'),
  db.query('SELECT SUM(amount) FROM bookings ...')
]);
```

### Promise.allSettled — एक fail झाला तरी बाकी continue:

```javascript
// Push notifications पाठवताना — एखादी fail झाली तरी बाकी पाठवा
const results = await Promise.allSettled(
  subscriptions.map(sub => webpush.sendNotification(sub, payload))
);

results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    console.log('Sent to:', subscriptions[i].endpoint);
  } else {
    console.error('Failed:', result.reason.message);
  }
});
```

### Geocoding Rate Limit (1 request/sec):

```javascript
// Nominatim ToS: max 1 request per second
const geocodeAllPujaris = async () => {
  const [pujaris] = await db.query(
    'SELECT id, city FROM pujari_profiles WHERE lat IS NULL AND city IS NOT NULL'
  );

  for (const pujari of pujaris) {
    await geocodeCity(pujari); // await — एक एक करून

    // 1.2 second wait (Rate limiting)
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
};
```

---

## 19. Complete Flow

### एक Request कसा travel करतो — Booking Create:

```
POST /api/bookings/
  │
  ├── [1] CORS Middleware          → Origin check (pojjari.com allowed?)
  ├── [2] Helmet Middleware        → Security headers add
  ├── [3] Body Parser              → req.body = { pooja_id, date, ... }
  ├── [4] Tenant Middleware        → req.tenant = { id: 1, name: 'Nashik' }
  ├── [5] Subscription Check       → Plan active? OK
  ├── [6] authenticate Middleware  → JWT verify → req.user = { id: 5, role: 'user' }
  ├── [7] authorize('user')        → Role check → OK
  ├── [8] createBooking Controller →
  │       ├── DB: Pooja details
  │       ├── calculateFees()
  │       ├── generateBookingCode()
  │       ├── DB: INSERT booking
  │       ├── Email (async, non-blocking)
  │       ├── SMS (async, non-blocking)
  │       └── Socket.IO emit (async)
  └── Response: { success: true, data: { bookingCode: 'POJ-X7K2M9' } }
```

### Middleware Chain Route Level:

```javascript
// Route definition
router.post('/',
  authenticate,           // [1] JWT check → req.user
  authorize('user'),      // [2] Role check
  upload.single('image'), // [3] File upload (optional)
  webpConvert,            // [4] Image → WebP
  createPooja             // [5] Controller
);
```

---

## 20. Project Setup

### नवीन Node.js project कसा सुरू करायचा:

```bash
# 1. Folder बनवा
mkdir my-project && cd my-project

# 2. npm initialize
npm init -y
# → package.json बनतो

# 3. Packages install करा
npm install express mysql2 bcryptjs jsonwebtoken dotenv cors helmet multer

# 4. Dev tools
npm install -D nodemon
# nodemon = file save होताच server restart

# 5. package.json मध्ये scripts add करा
```

```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev":   "nodemon src/app.js"
  }
}
```

### Folder Structure (तुमच्या project सारखाच):

```
backend/
├── .env                    ← Secrets (never commit)
├── .env.example            ← Template (commit करा)
├── package.json
├── src/
│   ├── app.js              ← Entry point
│   ├── config/
│   │   ├── db.js           ← Database connection
│   │   └── multer.js       ← File upload config
│   ├── middleware/
│   │   ├── auth.middleware.js    ← JWT + Role
│   │   ├── tenant.middleware.js  ← Multi-tenant
│   │   └── webpConvert.middleware.js ← Image convert
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── booking.routes.js
│   │   └── pooja.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── booking.controller.js
│   │   └── pooja.controller.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── sms.service.js
│   │   └── notificationService.js
│   └── utils/
│       ├── response.util.js  ← success() / error()
│       ├── helpers.js        ← generateBookingCode() etc
│       ├── redis.js          ← Cache
│       └── slugify.js        ← Marathi → ASCII
└── uploads/               ← User uploaded files
    ├── poojas/
    ├── pujari/
    └── blog/
```

### PM2 — Production वर चालवणे:

```bash
# Install PM2 (globally)
npm install -g pm2

# Start app
pm2 start src/app.js --name pojjari-backend

# Auto-restart on crash
pm2 startup   # Boot ला PM2 start होईल
pm2 save      # Current processes save करा

# Useful commands
pm2 list      # सगळे running processes
pm2 logs      # Live logs बघा
pm2 restart pojjari-backend
pm2 stop pojjari-backend
```

### Security Checklist:

- [ ] `.env` → `.gitignore` मध्ये आहे का?
- [ ] JWT_SECRET — strong random string आहे का?
- [ ] Passwords plain text store होत नाहीत (bcrypt)?
- [ ] SQL queries parameterized आहेत (? placeholders)?
- [ ] File upload — type + size validation आहे का?
- [ ] CORS — specific origin सेट केलं आहे का (not `*`)?
- [ ] Helmet middleware लावला आहे का?
- [ ] Razorpay signature verify होतो का?
- [ ] Rate limiting for OTP endpoint?

---

## Quick Reference — Common Patterns

```javascript
// 1. DB Query
const [rows] = await db.query('SELECT * FROM table WHERE id = ?', [id]);

// 2. JWT Create
const token = jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// 3. JWT Verify
const decoded = jwt.verify(token, process.env.JWT_SECRET);

// 4. Password Hash
const hash = await bcrypt.hash(password, 10);
const match = await bcrypt.compare(plaintext, hash);

// 5. Cache Get/Set
const cached = await getCache('key');
if (cached) return res.json(cached);
// ... DB query ...
await setCache('key', data, 1800);

// 6. Fire-and-forget
someAsyncFunction().catch(() => {});

// 7. Parallel queries
const [a, b] = await Promise.all([query1, query2]);

// 8. Response helpers
return success(res, data, 'Message', 201);
return error(res, 'Not found', 404);

// 9. Route params
const { id } = req.params;        // /api/users/:id
const { page } = req.query;       // /api/users?page=2
const { name } = req.body;        // POST body

// 10. File URL
const imageUrl = req.file ? `/uploads/poojas/${req.file.filename}` : null;
```

---

> **हे document तुमच्याच pojjari project च्या actual code वरून बनवलं आहे.**
> प्रत्येक concept — JWT, multer, redis, socket.io, razorpay — तुमच्या production code मध्ये implement आहे.
> Code वाचताना हा document reference म्हणून वापरा.
