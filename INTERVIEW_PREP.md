# Pojjari — Interview Preparation Guide
> Resume मधल्या प्रत्येक concept साठी focused study guide
> Concept → का वापरतो → Code → Interview Q&A

---

## CHAPTER 1: NODE.JS & EXPRESS.JS

### Node.js म्हणजे काय?
Node.js हा JavaScript चा **runtime environment** आहे — browser बाहेर, server वर JavaScript चालवण्यासाठी.

**Key concepts:**
- **Single-threaded** — एकच thread, पण non-blocking
- **Event Loop** — async operations handle करतो
- **Non-blocking I/O** — database call होत असताना दुसरी request handle करतो

```
Request येतो → Event Loop → DB call (non-blocking) → Response परत
```

**Event Loop order:**
```
timers → I/O callbacks → idle → poll → check → close callbacks
```

### Express.js म्हणजे काय?
Node.js वरचा **web framework** — routing, middleware, HTTP handling सोपं करतो.

**Pojjari मध्ये:**
```js
const express = require('express');
const app = express();

// Middleware stack (order matters!)
app.use(helmet());           // Security headers
app.use(cors(corsOptions));  // CORS
app.use(rateLimit(...));     // Rate limiting
app.use(express.json());     // Body parser

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pooja', poojaRoutes);

app.listen(3000);
```

**Middleware म्हणजे काय?**
Request आणि Response च्या मध्ये येणारं function. `next()` call केलं म्हणजे पुढच्या middleware ला जातो.

```js
// Custom middleware example
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next(); // पुढे जा
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Interview Questions:**
- Q: Node.js single-threaded असून concurrent requests कसे handle करतो?
  A: Event Loop मुळे — I/O operations non-blocking असतात, callback queue मध्ये जातात
- Q: `require` vs `import` फरक काय?
  A: `require` = CommonJS (Node.js default), `import` = ES Modules
- Q: Express middleware चा order का important आहे?
  A: Top-to-bottom execute होतो — rate limit आधी, auth नंतर

---

## CHAPTER 2: REST API DESIGN

### REST म्हणजे काय?
**RE**presentational **S**tate **T**ransfer — HTTP वापरून resources manage करण्याचा architectural style.

**HTTP Methods:**
| Method | Use | Example |
|--------|-----|---------|
| GET | Data आण | GET /api/poojas |
| POST | Create | POST /api/booking |
| PUT | Full update | PUT /api/pooja/5 |
| PATCH | Partial update | PATCH /api/user/profile |
| DELETE | Delete | DELETE /api/blog/3 |

**HTTP Status Codes (important!):**
```
200 OK          → Success
201 Created     → POST success
400 Bad Request → Validation error
401 Unauthorized→ Token missing/invalid
403 Forbidden   → Token valid, permission नाही
404 Not Found   → Resource नाही
429 Too Many    → Rate limit exceeded
500 Server Error→ Backend crash
```

**Pojjari मध्ये REST design:**
```
GET    /api/pooja          → सगळ्या poojas (Redis cache)
GET    /api/pooja/:id      → एक pooja
POST   /api/pooja          → नवीन pooja (admin only)
PUT    /api/pooja/:id      → Update (admin only)
DELETE /api/pooja/:id      → Delete (admin only)

POST   /api/booking        → Book करा
GET    /api/booking/my     → माझ्या bookings
PATCH  /api/booking/:id/status → Status change
```

**Interview Questions:**
- Q: REST vs GraphQL?
  A: REST = multiple endpoints, GraphQL = single endpoint, client decides what data चाहिए
- Q: Idempotent म्हणजे काय?
  A: Same request multiple times केलं तरी result same — GET, PUT, DELETE idempotent, POST नाही
- Q: 401 vs 403 फरक?
  A: 401 = authenticated नाही (login कर), 403 = authenticated आहे पण permission नाही

---

## CHAPTER 3: JWT AUTHENTICATION

### JWT म्हणजे काय?
**JSON Web Token** — 3 parts असतात, `.` ने separated:

```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
     HEADER              PAYLOAD              SIGNATURE
```

- **Header**: Algorithm (HS256)
- **Payload**: User data (userId, role, exp)
- **Signature**: Header + Payload + Secret → HMAC SHA256

**JWT Flow:**
```
Login → Server validates → JWT generate → Client ला पाठव
→ Client header मध्ये पाठवतो (Authorization: Bearer <token>)
→ Server verify करतो (secret वापरून)
→ User ओळखतो
```

**Pojjari मध्ये:**
```js
// Generate token
const token = jwt.sign(
  { userId: user.id, role: user.role },  // payload
  process.env.JWT_SECRET,                 // secret
  { expiresIn: '7d' }                    // expiry
);

// Verify token (middleware मध्ये)
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// decoded = { userId: 1, role: 'admin', iat: ..., exp: ... }
```

**JWT vs Sessions:**
| JWT | Session |
|-----|---------|
| Stateless (server ला store नाही) | Stateful (server ला store करतो) |
| Scalable (multiple servers) | Sticky sessions लागतात |
| Token expire होतो | Server-side invalidate करता येतो |
| Bigger payload | Smaller (just session ID) |

**Interview Questions:**
- Q: JWT कुठे store करायचा?
  A: httpOnly Cookie (XSS safe) — localStorage नाही (XSS attack)
- Q: JWT refresh कसा करतात?
  A: Access token (15 min) + Refresh token (7 days) — access expire झाल्यावर refresh वापरून नवीन घेतो
- Q: JWT revoke कसा करायचा?
  A: Blacklist in Redis/DB, किंवा short expiry + refresh token rotation

---

## CHAPTER 4: MYSQL & DATABASE

### Installation:
```bash
# Ubuntu/DigitalOcean server वर
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# Connect
mysql -u root -p
```

### Key Concepts:

**Indexing म्हणजे काय?**
Data जलद शोधण्यासाठी sorted structure. Without index = full table scan.

```sql
-- Pojjari मधील indexes
CREATE INDEX idx_poojas_category ON poojas(category_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- Composite index
CREATE INDEX idx_bookings_user_date ON bookings(user_id, booking_date);
```

**Joins:**
```sql
-- INNER JOIN: दोन्ही tables मध्ये match
SELECT b.id, u.name, p.name as pooja_name
FROM bookings b
INNER JOIN users u ON b.user_id = u.id
INNER JOIN poojas p ON b.pooja_id = p.id
WHERE b.status = 'confirmed';

-- LEFT JOIN: Left table चे सगळे rows (right match नसला तरी)
SELECT u.name, COUNT(b.id) as total_bookings
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id;
```

**Transactions (ACID):**
```sql
START TRANSACTION;
  INSERT INTO bookings (user_id, pooja_id, amount) VALUES (1, 5, 1100);
  UPDATE pujari_profiles SET booking_count = booking_count + 1 WHERE id = 3;
COMMIT;
-- एखादं fail झालं तर:
ROLLBACK;
```

**Query Optimization:**
```sql
-- EXPLAIN वापर
EXPLAIN SELECT * FROM bookings WHERE user_id = 5;
-- type=ALL = bad (full scan), type=ref = good (index used)

-- Avoid SELECT *
SELECT id, user_id, status, amount FROM bookings WHERE user_id = 5;

-- LIMIT always use for lists
SELECT * FROM blog_posts ORDER BY created_at DESC LIMIT 10 OFFSET 0;
```

**Interview Questions:**
- Q: Primary Key vs Unique Key?
  A: Primary Key = NOT NULL + UNIQUE, फक्त एकच per table. Unique Key = multiple possible, NULL allow
- Q: ACID म्हणजे काय?
  A: Atomicity (all or nothing), Consistency (rules follow), Isolation (concurrent safe), Durability (commit = permanent)
- Q: N+1 query problem म्हणजे काय?
  A: 1 query for list, then N queries for each item. Fix: JOIN वापर किंवा batch fetch

---

## CHAPTER 5: REDIS CACHING

### Redis म्हणजे काय?
**In-memory key-value store** — RAM मध्ये data ठेवतो, MySQL पेक्षा 100x fast.

### Installation:
```bash
# Ubuntu server वर
sudo apt install redis-server
sudo systemctl start redis
redis-cli ping  # PONG यायला हवं

# Node.js मध्ये
npm install ioredis
```

### Pojjari मधील Redis pattern:

```js
// redis.js — utility functions
const Redis = require('ioredis');
const client = new Redis({ host: 'localhost', port: 6379 });

// GET cache
async function getCache(key) {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

// SET cache with TTL
async function setCache(key, value, ttlSeconds = 300) {
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

// DELETE cache
async function delCache(key) {
  await client.del(key);
}

// DELETE pattern (e.g., all pooja keys)
async function delCachePattern(pattern) {
  const keys = await client.keys(pattern); // e.g., 'pooja:*'
  if (keys.length > 0) await client.del(...keys);
}
```

**Cache-aside pattern (Pojjari मध्ये):**
```js
// Controller मध्ये
async function getPoojas(req, res) {
  const cacheKey = 'pooja:list:all';

  // 1. Cache check
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached); // Cache hit!

  // 2. Cache miss → DB query
  const poojas = await db.query('SELECT * FROM poojas WHERE active = 1');

  // 3. Cache ला save कर (5 min TTL)
  await setCache(cacheKey, poojas, 300);

  res.json(poojas);
}

// Create/Update/Delete वेळी cache clear कर
async function createPooja(req, res) {
  await db.query('INSERT INTO poojas ...');
  await delCachePattern('pooja:*'); // सगळे pooja keys clear
  res.status(201).json({ success: true });
}
```

**TTL Values in Pojjari:**
```
pooja:list    → 300s (5 min) — पूजा list बदलत नाही often
blog:slug:*   → 600s (10 min) — blogs rarely change
home:data     → 3600s (1 hr) — home content static
rashifal:*    → 86400s (24 hr) — daily horoscope
```

**Redis CLI commands (important!):**
```bash
redis-cli
PING                  # Server alive?
SET key "value"       # Set
GET key               # Get
SETEX key 300 "val"   # Set with TTL (seconds)
TTL key               # Remaining time
DEL key               # Delete
KEYS "pooja:*"        # Pattern search
FLUSHDB               # Clear सगळं (DANGER)
INFO memory           # Memory usage
```

**Interview Questions:**
- Q: Cache invalidation म्हणजे काय?
  A: Data update झाल्यावर जुना cache clear करणं — stale data prevent करण्यासाठी
- Q: Cache stampede म्हणजे काय?
  A: Cache expire → simultaneously 1000 requests DB वर → DB overload. Fix: Mutex lock किंवा staggered TTL
- Q: Redis persistent storage आहे का?
  A: Default = in-memory (restart = data gone). AOF/RDB enable केलं तर disk वर save होतो

---

## CHAPTER 6: SECURITY

### Rate Limiting:
```js
const rateLimit = require('express-rate-limit');

// Pojjari मधील global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                   // 200 requests per IP
  message: { error: 'Too many requests' },
  standardHeaders: true,
});

// Auth routes साठी stricter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // फक्त 10 login attempts
});

app.use(globalLimiter);
app.use('/api/auth', authLimiter);
```

### Account Lockout:
```js
// 5 failed attempts = 30 min lock
async function checkAccountLock(email) {
  const attempts = await getCache(`lockout:${email}`);
  if (attempts >= 5) {
    throw new Error('Account locked for 30 minutes');
  }
}

async function recordFailedAttempt(email) {
  const key = `lockout:${email}`;
  const attempts = (await getCache(key) || 0) + 1;
  await setCache(key, attempts, 1800); // 30 min TTL
}
```

### XSS Prevention:
```js
const xss = require('xss-clean');
app.use(xss()); // सगळ्या inputs sanitize होतात

// Output encode करा HTML मध्ये
// React automatically करतो — {userInput} safe आहे
// dangerouslySetInnerHTML वापरू नका!
```

### SQL Injection:
```js
// BAD (SQL injection vulnerable):
const query = `SELECT * FROM users WHERE email = '${email}'`;
// email = "' OR 1=1 --" → सगळे users मिळतात

// GOOD (Parameterized query):
const [rows] = await db.execute(
  'SELECT * FROM users WHERE email = ?',
  [email] // placeholder values — automatic escape
);
```

### Helmet.js:
```js
const helmet = require('helmet');
app.use(helmet()); // Automatically sets:
// X-Frame-Options: DENY (clickjacking prevent)
// X-XSS-Protection: 1; mode=block
// Content-Security-Policy
// Strict-Transport-Security (HTTPS force)
// X-Content-Type-Options: nosniff
```

### CORS:
```js
const cors = require('cors');
const corsOptions = {
  origin: ['https://pujari.mydashboard.site', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
```

**Interview Questions:**
- Q: XSS म्हणजे काय?
  A: Cross-Site Scripting — attacker malicious script inject करतो, user च्या browser मध्ये execute होतो
- Q: SQL Injection prevent कसं करतो?
  A: Parameterized queries / Prepared Statements — user input कधी query मध्ये directly घालू नका
- Q: CORS म्हणजे काय?
  A: Cross-Origin Resource Sharing — browser security — different domain चे requests block होतात. Server whitelist करतो

---

## CHAPTER 7: DOCKER

### Docker म्हणजे काय?
Application आणि त्याच्या सगळ्या dependencies एकत्र **container** मध्ये pack करणं. "माझ्या machine वर चालतं" problem solve होतो.

### Key Concepts:
- **Image**: Read-only template (Dockerfile बनवतो)
- **Container**: Image चा running instance
- **Dockerfile**: Instructions to build image
- **docker-compose**: Multiple containers एकत्र manage

### Installation:
```bash
# Ubuntu server वर
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
docker --version  # verify
```

### Pojjari Dockerfile:
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "src/app.js"]
```

**Multi-stage म्हणजे काय?**
- Stage 1: npm ci — सगळे dependencies install
- Stage 2: फक्त production files copy — image size कमी

### docker-compose:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8
    environment:
      MYSQL_DATABASE: pojjari
      MYSQL_ROOT_PASSWORD: secret
    volumes:
      - mysql_data:/var/lib/mysql  # Data persist

  redis:
    image: redis:7-alpine

volumes:
  mysql_data:
```

### Docker Commands:
```bash
docker build -t pojjari-backend .      # Image build
docker run -p 3000:3000 pojjari-backend # Run container
docker ps                               # Running containers
docker logs <container-id>             # Logs बघ
docker exec -it <id> sh               # Container मध्ये enter
docker-compose up -d                   # सगळे services start
docker-compose down                    # बंद कर
docker images                          # सगळ्या images
docker rmi <image-id>                 # Image delete
```

**Interview Questions:**
- Q: Docker vs Virtual Machine फरक?
  A: VM = full OS, heavy (GBs). Docker = OS kernel share करतो, lightweight (MBs), fast start
- Q: Container restart झाला तर data जातो का?
  A: हो, जातो — म्हणून **volumes** वापरतो: `volumes: - ./uploads:/app/uploads`
- Q: Multi-stage build का?
  A: Build tools (npm, gcc) production image मध्ये नको — image size कमी, security better

---

## CHAPTER 8: GITHUB ACTIONS CI/CD

### CI/CD म्हणजे काय?
- **CI** (Continuous Integration): Code push = auto test run
- **CD** (Continuous Deployment): Test pass = auto deploy

### Pojjari workflow (.github/workflows/deploy.yml):
```yaml
name: Deploy Pojjari

on:
  push:
    branches: [main]  # main ला push झाल्यावर trigger

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test  # Jest tests run

  deploy:
    needs: test  # test pass झाल्यावरच
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/pojjari
            git pull origin main
            npm ci --only=production
            pm2 reload pojjari-backend

      - name: Health check
        run: |
          sleep 10
          curl -f https://pujari.mydashboard.site/api/health
```

**GitHub Secrets म्हणजे काय?**
- Repository Settings → Secrets → Actions
- `SERVER_IP`, `SSH_PRIVATE_KEY` — code मध्ये expose होत नाहीत

**Interview Questions:**
- Q: CI vs CD फरक?
  A: CI = integrate + test automatically. CD = deploy automatically after CI passes
- Q: GitHub Actions vs Jenkins?
  A: GitHub Actions = cloud-based, YAML, no server needed. Jenkins = self-hosted, more control
- Q: Secrets कुठे store करतात?
  A: GitHub Secrets (encrypted) — `.env` file commit करू नका

---

## CHAPTER 9: PM2 (Process Manager)

### PM2 म्हणजे काय?
Node.js application चा **production process manager** — crash झाला तर auto-restart, cluster mode, logs manage.

### Installation:
```bash
npm install -g pm2
```

### Commands:
```bash
pm2 start src/app.js --name pojjari-backend  # Start
pm2 list                                      # Running apps
pm2 logs pojjari-backend                     # Logs बघ
pm2 restart pojjari-backend                  # Restart
pm2 reload pojjari-backend                   # Zero-downtime reload
pm2 stop pojjari-backend                     # Stop
pm2 delete pojjari-backend                   # Remove

# Server restart वर auto-start
pm2 startup
pm2 save
```

### ecosystem.config.js:
```js
module.exports = {
  apps: [{
    name: 'pojjari-backend',
    script: 'src/app.js',
    instances: 2,          // 2 processes (cluster mode)
    exec_mode: 'cluster',  // Load balance between instances
    max_memory_restart: '500M', // Memory leak protect
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Interview Questions:**
- Q: PM2 cluster mode म्हणजे काय?
  A: Multiple processes on multiple CPU cores — performance better, load distributed
- Q: `pm2 restart` vs `pm2 reload` फरक?
  A: restart = downtime असतो, reload = zero-downtime (new process ready झाल्यावर old बंद होतो)

---

## CHAPTER 10: NGINX

### Nginx म्हणजे काय?
**Reverse proxy + Web server** — Internet ला Node.js directly expose करत नाही.

```
Internet → Nginx (port 80/443) → Node.js (port 3000)
```

### Installation:
```bash
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx  # Server restart वर auto-start
```

### Pojjari Nginx config:
```nginx
server {
    listen 80;
    server_name pujari.mydashboard.site;
    return 301 https://$server_name$request_uri;  # HTTP → HTTPS redirect
}

server {
    listen 443 ssl;
    server_name pujari.mydashboard.site;

    ssl_certificate /etc/letsencrypt/live/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;

    # React frontend (built files)
    location / {
        root /var/www/pojjari/frontend/dist;
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';  # WebSocket
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo nginx -t             # Config test
sudo systemctl reload nginx  # Apply changes
```

**Interview Questions:**
- Q: Nginx का वापरतो Node.js साठी?
  A: SSL terminate, static files serve, load balance, port 80/443 access (non-root), DDoS basic protection
- Q: Reverse proxy म्हणजे काय?
  A: Client ला directly backend दिसत नाही — Nginx मध्ये request येतो, backend ला forward करतो

---

## CHAPTER 11: PLAYWRIGHT E2E TESTING

### E2E Testing म्हणजे काय?
**End-to-End Testing** — Real browser मध्ये, real user सारखं test करणं. Login → Search → Book → Payment — पूर्ण flow.

### Installation:
```bash
npm install -D @playwright/test
npx playwright install chromium
```

### Pojjari मधील test example:
```js
// e2e/tests/auth.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Authentication Flow', () => {

  test('User can register', async ({ page }) => {
    await page.goto('http://localhost:5173/register');
    await page.fill('[name="name"]', 'Test User');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test@123');
    await page.click('[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('User can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test@123');
    await page.click('[type="submit"]');
    await expect(page.locator('.welcome-msg')).toBeVisible();
  });

  test('Invalid login shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'wrong@example.com');
    await page.fill('[name="password"]', 'wrongpass');
    await page.click('[type="submit"]');
    await expect(page.locator('.error-msg')).toContainText('Invalid');
  });
});
```

### playwright.config.js:
```js
module.exports = {
  testDir: './e2e/tests',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,       // Browser visible नको (CI साठी)
    screenshot: 'only-on-failure',
  },
};
```

```bash
npx playwright test              # सगळे tests run
npx playwright test auth.spec.js # Specific file
npx playwright test --ui         # Visual UI mode
npx playwright show-report       # HTML report
```

**Pojjari मधील 17 test files, 450+ tests:**
- `auth.spec.js` (40) — Login, Register, OTP, OAuth
- `booking-flow.spec.js` (29) — Book pooja, payment, cancel
- `admin-panel.spec.js` (50) — Admin CRUD operations
- `api-core.spec.js` (45) — All API endpoints test
- `security.spec.js` (10) — XSS, SQL injection attempt
- `performance.spec.js` (9) — Page load time

**Interview Questions:**
- Q: Unit test vs Integration test vs E2E test?
  A: Unit = एक function, Integration = multiple modules together, E2E = full user flow in real browser
- Q: Playwright vs Selenium vs Cypress?
  A: Playwright = faster, multi-browser, auto-wait. Selenium = old, manual waits. Cypress = JS only, no multi-tab
- Q: Headless म्हणजे काय?
  A: Browser visible नसतो — CI/CD मध्ये server वर run होतो

---

## CHAPTER 12: JEST (Unit Testing)

### Installation:
```bash
npm install -D jest supertest
```

### Unit test example:
```js
// tests/utils/redis.test.js
const { getCache, setCache } = require('../../src/utils/redis');

describe('Redis Utils', () => {
  test('setCache and getCache works', async () => {
    await setCache('test:key', { name: 'Prathamesh' }, 60);
    const result = await getCache('test:key');
    expect(result).toEqual({ name: 'Prathamesh' });
  });

  test('getCache returns null for missing key', async () => {
    const result = await getCache('nonexistent:key');
    expect(result).toBeNull();
  });
});
```

### Supertest (API testing):
```js
// tests/api/auth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('POST /api/auth/login', () => {
  test('Valid credentials return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('Invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });
});
```

---

## CHAPTER 13: SOCKET.IO (Real-time)

### Socket.IO म्हणजे काय?
**WebSocket** वर based real-time bidirectional communication — server ला client ला push करता येतं.

**HTTP vs WebSocket:**
```
HTTP:    Client → Request → Server → Response (one-time)
WebSocket: Client ←→ Server (persistent connection, both ways)
```

### Pojjari मधील use:
AI poster generation — progress updates real-time पाठवतो.

```js
// Server side
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (tenantId) => {
    socket.join(`tenant:${tenantId}`); // Room join
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Controller मध्ये progress emit
async function generatePoster(req, res) {
  const { tenantId } = req.user;
  io.to(`tenant:${tenantId}`).emit('poster-progress', { step: 1, message: 'Generating...' });
  // ... AI processing ...
  io.to(`tenant:${tenantId}`).emit('poster-progress', { step: 3, message: 'Done!', url: '...' });
}
```

```js
// Client side (React)
import io from 'socket.io-client';
const socket = io(import.meta.env.VITE_API_URL);

socket.emit('join-room', tenantId);
socket.on('poster-progress', (data) => {
  setProgress(data); // UI update
});
```

**Interview Questions:**
- Q: Socket.IO vs WebSocket?
  A: WebSocket = raw protocol. Socket.IO = library on top with rooms, reconnection, fallback to polling
- Q: Room म्हणजे काय?
  A: Group of sockets — emit to room = सगळ्या members ला message जातो (multi-tenant isolation)

---

## CHAPTER 14: GOOGLE OAUTH 2.0

### OAuth Flow:
```
User "Google ने Login" click करतो
→ Google login page
→ User Google account approve करतो
→ Google → Authorization Code → Backend ला
→ Backend → Code exchange → Access Token
→ Google API → User info (email, name, picture)
→ JWT generate करून user ला पाठव
```

### Pojjari मध्ये:
```js
// passport.js
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;
  let user = await User.findByEmail(email);
  if (!user) {
    user = await User.create({ email, name: profile.displayName, google_id: profile.id });
  }
  done(null, user);
}));

// Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google'), (req, res) => {
  const token = jwt.sign({ userId: req.user.id }, process.env.JWT_SECRET);
  res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
});
```

---

## CHAPTER 15: RAZORPAY PAYMENT

### Payment Flow:
```
1. Client → "Pay" click → Backend ला request
2. Backend → Razorpay API → Order create (amount, currency)
3. Backend → Order ID → Client ला पाठव
4. Client → Razorpay checkout (card details enter)
5. Razorpay → payment_id, signature → Client
6. Client → Backend → Verify signature
7. Backend → HMAC SHA256 verify → Success/Fail
```

### Pojjari मध्ये:
```js
const Razorpay = require('razorpay');
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
async function createOrder(req, res) {
  const order = await razorpay.orders.create({
    amount: req.body.amount * 100, // Paise मध्ये (₹1 = 100 paise)
    currency: 'INR',
    receipt: `booking_${Date.now()}`
  });
  res.json({ orderId: order.id });
}

// Verify payment (HMAC SHA256)
async function verifyPayment(req, res) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .toString('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }
  // Payment confirmed → booking update करा
}
```

**Interview Questions:**
- Q: Signature verify का करतो?
  A: Client ने tamper केलं असेल तर? Signature = server-side proof that Razorpay actually charged. Without this, anyone can fake a successful payment.

---

## CHAPTER 16: MULTER + SHARP (File Upload)

### Multer म्हणजे काय?
Node.js मध्ये **file upload handle** करण्यासाठी middleware.

```js
// multer.js config
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});
```

### Sharp म्हणजे काय?
**Image processing library** — resize, format convert, compress.

```js
// webpConvert.middleware.js
const sharp = require('sharp');

async function webpConvert(req, res, next) {
  if (!req.file) return next();

  const originalPath = req.file.path;
  const webpPath = originalPath.replace(/\.[^.]+$/, '.webp');

  await sharp(originalPath)
    .webp({ quality: 82, effort: 4 }) // 82% quality — best size/quality ratio
    .toFile(webpPath);

  // Remove original
  fs.unlinkSync(originalPath);

  // Update req.file to point to webp
  req.file.path = webpPath;
  req.file.filename = path.basename(webpPath);
  req.file.mimetype = 'image/webp';

  next();
}
```

**WebP vs JPEG:**
- WebP = 25-35% smaller file size at same quality
- Browser support = 95%+ (Chrome, Firefox, Safari 14+)
- EXIF strip = user's location metadata remove होतो (privacy)

---

## CHAPTER 17: REACT.JS FUNDAMENTALS

### Key Concepts:

**useState:**
```js
const [count, setCount] = useState(0);
setCount(count + 1); // Re-render triggers
```

**useEffect:**
```js
useEffect(() => {
  // Component mount वर run होतो
  fetchPoojas();

  return () => {
    // Cleanup (unmount वर)
  };
}, [categoryId]); // dependency array — categoryId change झाल्यावर re-run
```

**useCallback / useMemo:**
```js
// useMemo — expensive calculation memoize
const filteredPoojas = useMemo(() =>
  poojas.filter(p => p.category === activeCategory),
  [poojas, activeCategory]
);

// useCallback — function memoize (child re-render prevent)
const handleBook = useCallback((poojaId) => {
  navigate(`/book/${poojaId}`);
}, [navigate]);
```

**Interview Questions:**
- Q: Virtual DOM म्हणजे काय?
  A: Real DOM चा in-memory representation — React state change → Virtual DOM update → diff calculate → फक्त changed parts real DOM मध्ये update (efficient)
- Q: useEffect dependency array empty [] vs nothing vs [value]?
  A: [] = mount once, nothing = every render, [value] = value change झाल्यावर
- Q: React re-render कधी होतो?
  A: state change, props change, parent re-render, context change

---

## CHAPTER 18: MULTI-TENANT SAAS ARCHITECTURE

### Multi-tenant म्हणजे काय?
एकाच application मध्ये multiple clients (tenants) — प्रत्येकाचा data isolated.

**Pojjari मध्ये:**
```
nashik.pojjari.com  → tenant_id = 1 (Nashik data)
pune.pojjari.com    → tenant_id = 2 (Pune data)
mumbai.pojjari.com  → tenant_id = 3 (Mumbai data)
```

**Tenant Middleware:**
```js
// tenantMiddleware.js
async function tenantMiddleware(req, res, next) {
  const hostname = req.hostname; // e.g., 'nashik.pojjari.com'
  const subdomain = hostname.split('.')[0]; // 'nashik'

  const tenant = await db.query(
    'SELECT * FROM tenants WHERE subdomain = ?', [subdomain]
  );
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  req.tenant = tenant; // सगळ्या routes ला available
  next();
}

// Routes मध्ये
app.use(tenantMiddleware);
// Controller मध्ये
const poojas = await db.query(
  'SELECT * FROM poojas WHERE tenant_id = ?',
  [req.tenant.id]
);
```

**Interview Questions:**
- Q: Multi-tenant approaches काय आहेत?
  A: 1) Separate DB per tenant (most isolated), 2) Shared DB, separate schema, 3) Shared DB, tenant_id column (Pojjari वापरतो — cost effective)
- Q: Data isolation कशी ensure करतो?
  A: प्रत्येक query मध्ये `WHERE tenant_id = ?` — middleware ने inject होतो

---

## CHAPTER 19: RBAC (Role-Based Access Control)

```js
// Pojjari roles: 'user', 'pujari', 'admin', 'superadmin'

// Middleware
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// Routes मध्ये
router.post('/pooja', authenticate, authorize('admin'), ctrl.createPooja);
router.get('/pooja', ctrl.getPoojas); // Public
router.delete('/user/:id', authenticate, authorize('admin', 'superadmin'), ctrl.deleteUser);
```

---

## CHAPTER 20: AGILE / SCRUM

**Key Terms:**
- **Sprint**: Fixed time period (2 weeks) — features deliver करायच्या
- **Sprint Planning**: काय करायचं ते decide
- **Daily Standup**: 15 min — काय केलं, काय करणार, blockers
- **Sprint Review**: Sprint end — demo
- **Retrospective**: काय चांगलं, काय improve करायचं

**Interview Questions:**
- Q: Agile vs Waterfall?
  A: Waterfall = linear (plan all → build all → test all). Agile = iterative (plan a bit → build → test → repeat)
- Q: User Story म्हणजे काय?
  A: "As a [user], I want [feature], so that [benefit]" — developer ला end user perspective देतो

---

## QUICK REVISION — TOP 25 INTERVIEW QUESTIONS

1. **Event Loop** काय आहे? — Async operations handle करणारा mechanism
2. **Callback vs Promise vs async/await** — Async code handle करण्याचे 3 ways
3. **JWT structure** — Header.Payload.Signature
4. **SQL Injection prevent** — Parameterized queries
5. **XSS prevent** — Input sanitize, output encode, httpOnly cookies
6. **Redis TTL** — Key automatic expire होतो
7. **Cache invalidation** — Write वेळी cache clear करणं
8. **Docker image vs container** — Template vs running instance
9. **Multi-stage Dockerfile** — Smaller production image
10. **CI vs CD** — Integrate+test vs deploy automatically
11. **CORS** — Browser security, cross-origin requests
12. **Helmet.js** — HTTP security headers automatically set
13. **Rate limiting** — Request flood prevent
14. **ACID** — DB transaction properties
15. **Index** — Fast data retrieval structure
16. **JOIN types** — INNER, LEFT, RIGHT, FULL
17. **Virtual DOM** — React efficient update mechanism
18. **useEffect cleanup** — Memory leak prevent
19. **WebSocket vs HTTP** — Persistent vs one-time connection
20. **OAuth flow** — Authorization Code flow
21. **Razorpay signature verify** — HMAC SHA256 tamper proof
22. **PM2 cluster mode** — Multi-core CPU use
23. **Nginx reverse proxy** — Backend hide, SSL terminate
24. **Multi-tenant** — tenant_id isolation
25. **E2E vs Unit testing** — Full flow vs single function

---

> **Tip:** Interview मध्ये हे सांग: "Pojjari project मध्ये मी हे implement केलं आहे आणि production वर live आहे — pujari.mydashboard.site"
> Real production experience = strongest proof!
