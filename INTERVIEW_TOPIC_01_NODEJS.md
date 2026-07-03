# Topic 01: Node.js Internals
> Single-threaded, non-blocking I/O runtime — the backbone of the entire Pojjari backend

---

## 1.1 What is Node.js?

Node.js is a **JavaScript runtime built on Chrome's V8 engine**. It runs JS code outside the browser — on a server.

Key characteristics:
- **Single-threaded** — one JS thread handles all requests
- **Non-blocking** — I/O operations (DB, file, network) do NOT block execution
- **Event-driven** — callbacks/promises fire when async work completes
- **Fast** — V8 compiles JS directly to machine code

Pojjari uses Node.js v18 with Express.js on a DigitalOcean Ubuntu droplet.

---

## 1.2 The Event Loop (Most Asked Question)

How can Node.js handle 1000 requests with a single thread?

```
   ┌──────────────────────────────┐
   │     Your JS Code (V8)       │  ← sync code runs here first
   └─────────────┬────────────────┘
                 │ call stack empty?
   ┌─────────────▼────────────────┐
   │        Event Loop            │
   │                              │
   │  Phase 1: timers             │  ← setTimeout / setInterval callbacks
   │  Phase 2: I/O callbacks      │  ← DB results, file reads complete
   │  Phase 3: idle / prepare     │
   │  Phase 4: poll               │  ← wait for new I/O events
   │  Phase 5: check              │  ← setImmediate callbacks
   │  Phase 6: close callbacks    │  ← socket.on('close') etc.
   │                              │
   │  [microtask queue runs       │  ← Promise.then() / process.nextTick()
   │   between every phase]       │     BEFORE the next phase starts
   └──────────────────────────────┘
```

**The key insight:** When Node hits a DB query, it hands it off to the OS, then immediately picks up the next request. The OS calls back when the query finishes. No thread is sitting idle waiting.

### Execution Order Example
```js
console.log('1');                              // sync → runs first
setTimeout(() => console.log('2'), 0);         // macro task (timers phase)
Promise.resolve().then(() => console.log('3')); // microtask queue
console.log('4');                              // sync → runs second

// Output: 1, 4, 3, 2
// Why: sync runs first (1, 4), then microtask queue (3), then timer (2)
```

---

## 1.3 Async Patterns — Callback → Promise → Async/Await

### Old Way: Callbacks (Callback Hell)
```js
db.query('SELECT * FROM pujaris WHERE id = ?', [id], (err, rows) => {
  if (err) return handleError(err);
  db.query('SELECT * FROM bookings WHERE pujari_id = ?', [rows[0].id], (err2, bookings) => {
    // deeply nested — hard to read, hard to debug
  });
});
```

### Promises
```js
db.query('SELECT * FROM pujaris WHERE id = ?', [id])
  .then(rows => db.query('SELECT * FROM bookings WHERE pujari_id = ?', [rows[0].id]))
  .then(bookings => res.json(bookings))
  .catch(err => next(err));
```

### Async/Await (Pojjari uses this everywhere)
```js
// booking.controller.js
async function createBooking(req, res, next) {
  try {
    const [pujaris] = await pool.query(
      'SELECT * FROM pujaris WHERE id = ?', [req.body.pujariId]
    );
    if (!pujaris.length) return res.status(404).json({ message: 'Pujari not found' });

    const [result] = await pool.query(
      'INSERT INTO bookings SET ?', [{ ...req.body, status: 'pending' }]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err); // error-handling middleware handles it
  }
}
```

### Promise.all() — Parallel Execution
```js
// Run INDEPENDENT queries simultaneously — much faster than one-by-one
const [pujaris, categories, blogs] = await Promise.all([
  pool.query('SELECT * FROM pujaris'),
  pool.query('SELECT * FROM categories'),
  pool.query('SELECT * FROM blogs'),
]);
// All 3 DB queries run at the same time — total time = slowest query (not sum of all)
```

---

## 1.4 Module System

### CommonJS (Node.js default — Pojjari backend uses this)
```js
// Exporting
module.exports = { createBooking, getBookings, updateBooking };

// Importing
const { createBooking } = require('./controllers/booking.controller');
const pool = require('../config/db');
```

### ES Modules (Modern JS — React frontend uses this)
```js
import pool from '../config/db.js';
export { createBooking, getBookings };
```

**`require()` behavior:**
1. First call: Loads the file, executes it, caches the result
2. Subsequent calls: Returns from cache (file NOT re-executed)
3. Implication: Module-level code (like DB connections) runs only once

---

## 1.5 Built-in Modules — Used in Pojjari

```js
const path   = require('path');    // join paths: path.join(__dirname, 'uploads')
const fs     = require('fs');      // read/write files: image handling
const crypto = require('crypto');  // secure tokens: password reset
const os     = require('os');      // system info
const http   = require('http');    // base HTTP server

// Crypto — password reset token (Pojjari forgot-password feature)
const token = crypto.randomBytes(32).toString('hex');
// → 64-character hex string, cryptographically secure
```

---

## 1.6 Streams — Large Data Without Memory Overload

```js
// Processing large CSV import without loading entire file into RAM
const fs = require('fs');
const readline = require('readline');

const fileStream = fs.createReadStream('pujaris-bulk.csv');
const rl = readline.createInterface({ input: fileStream });

rl.on('line', async (line) => {
  const [name, mobile, category] = line.split(',');
  await pool.query('INSERT INTO pujaris SET ?', { name, mobile, category });
});
rl.on('close', () => console.log('Import complete'));
```

**Why streams?** A 50,000-row CSV file could be 10MB — loading it all into memory would spike RAM. Streams read line-by-line, keeping memory usage constant.

---

## 1.7 Environment Configuration

```js
// Step 1: Install dotenv
// npm install dotenv

// Step 2: backend/.env file
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=secret
JWT_SECRET=your_long_secret_key_here

// Step 3: backend/src/app.js (top of file, before anything else)
require('dotenv').config();

// Step 4: Use anywhere in codebase
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET;
```

---

## Interview Q&A

**Q: Node.js single-threaded आहे तर 1000 concurrent requests कसं handle करतो?**
> Node.js JS code single thread वर execute करतो, पण DB query, file read, network call — हे सगळं OS ला delegate करतो. OS ते background मध्ये handle करतं. जेव्हा complete होतं, callback event queue मध्ये येतो आणि event loop त्याला process करतो. त्यामुळे thread sleeping नाही, waiting नाही — फक्त callbacks पेंडिंग असतात. हे CPU-intensive tasks साठी चांगलं नाही (long computation blocks the thread), पण I/O-heavy apps (REST APIs, DB calls) साठी ideal आहे.

**Q: setTimeout(fn, 0) vs Promise.resolve().then(fn) — कोणतं आधी?**
> Promise आधी. Promise microtask queue मध्ये जातो, setTimeout macro task (timers phase) मध्ये. Microtasks प्रत्येक phase नंतर, पुढचा phase सुरू होण्याआधी, run होतात. Output: sync code → microtasks → setTimeout.

**Q: `require()` कसं काम करतो?**
> First time: File शोधतो, load करतो, execute करतो, result `module.exports` object cache करतो. Same path ला दुसऱ्यांदा `require()` केलं तर cache मधूनच return करतो — file परत execute होत नाही. DB connection pool एकच वेळा create होतो.

**Q: `Promise.all()` कधी वापरतो, कधी sequential `await`?**
> Independent operations असतील (एकाचा result दुसऱ्यासाठी लागत नसेल) तर `Promise.all()` — सगळ्या queries parallel run होतात, total time = slowest query. Pojjari admin dashboard मध्ये bookings count, pujaris count, revenue — तिघे parallel. Dependent असतील (booking नंतर payment, payment नंतर notification) तर sequential await.

**Q: `process.nextTick()` vs `Promise.then()` — फरक?**
> `process.nextTick()` current operation नंतर, event loop च्या कोणत्याही phase आधी, immediately run होतो. Promise.then() microtask queue मध्ये येतो. nextTick() Promise पेक्षाही आधी run होतो.

---

## Pojjari Project Connection

| Feature | Node.js Concept Used |
|---------|---------------------|
| All 160+ REST API endpoints | `async/await` with MySQL pool |
| Image upload (pujari photos) | `multer` + `fs` streams |
| Password reset token | `crypto.randomBytes(32)` |
| Email sending | async `nodemailer` — non-blocking |
| Panchang WebSocket | `socket.io` on Node HTTP server |
| Redis caching | async `ioredis` — non-blocking |
| Bulk pujari import | Readline streams |

---

## Summary Table

| Concept | What it is | Interview Trigger |
|---------|-----------|-------------------|
| V8 Engine | Compiles JS to machine code | "how is JS fast?" |
| Event Loop | Manages task + callback queues | "single-threaded concurrent?" |
| Microtask Queue | Promise callbacks — run before next phase | "execution order" |
| `require()` | Load + cache module | "module system" |
| `async/await` | Readable syntax for Promises | "avoid callback hell" |
| `Promise.all()` | Parallel async execution | "performance" |
| Streams | Process large data chunk-by-chunk | "file handling, memory" |
| `process.env` | Runtime configuration | "how do you manage secrets?" |
