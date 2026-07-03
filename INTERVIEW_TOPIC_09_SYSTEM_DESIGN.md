# Topic 09: System Design Basics
> Junior/Mid-level essentials — scaling, databases, caching, message queues

---

## 9.1 System Design Interview Format

For junior/mid level, focus on:
1. **Clarify requirements** — functional vs non-functional
2. **Estimate scale** — users, requests per second, data size
3. **High-level architecture** — components and data flow
4. **Database design** — tables, indexes
5. **Identify bottlenecks** — where will it break?
6. **Solutions** — caching, scaling, queues

---

## 9.2 Scaling — Vertical vs Horizontal

### Vertical Scaling (Scale Up)
```
Small server (2 CPU, 4GB RAM)
       ↓ hit limits
Bigger server (16 CPU, 64GB RAM)
       ↓ hit limits
Biggest server (128 CPU, 512GB RAM) — expensive, single point of failure

Limit: Eventually you can't buy a bigger machine
```

### Horizontal Scaling (Scale Out)
```
1 server
  ↓ hit limits
2 servers behind Load Balancer
  ↓ hit limits
10 servers behind Load Balancer
  ↓ hit limits
100 servers — auto-scaling groups

Limit: Theoretically unlimited — add more machines
```

### Load Balancer
```
Clients
  ↓
[Load Balancer]  ← single entry point
  ↓   ↓   ↓
[App1][App2][App3]  ← multiple identical servers

Strategies:
- Round Robin: 1→2→3→1→2→3 (default, simple)
- Least Connections: send to server with fewest active connections
- IP Hash: same client always goes to same server (sticky sessions)
```

**Problem with horizontal scaling:** Sessions/JWT stored on Server 1 won't be found on Server 2.
**Solution:** Stateless JWT (Pojjari) or Redis shared session store.

---

## 9.3 Database Scaling

### Read Replica (Most Common)
```
Writes → Primary DB (MySQL Master)
             ↓ replication
Reads ← Replica DB (MySQL Slave)
Reads ← Replica DB (MySQL Slave)
Reads ← Replica DB (MySQL Slave)

80% of queries are reads → offload to replicas
Primary only handles writes → less load
```

### Database Sharding (Advanced)
```
Split data across multiple DB instances by key:
User ID 1-1000 → DB Shard 1
User ID 1001-2000 → DB Shard 2
User ID 2001-3000 → DB Shard 3

Benefit: distribute data + queries
Problem: Cross-shard queries are complex
```

### When to add Read Replica vs Cache?
- **Read Replica**: Complex queries, need real-time data, data too dynamic for cache
- **Cache (Redis)**: Simple key-value lookups, data changes infrequently, millisecond response needed

---

## 9.4 Caching Strategies

### Cache-Aside (Lazy Loading) — Pojjari uses this
```
Read:  Cache hit? → return. Miss? → DB → store in cache → return
Write: Update DB → DELETE cache key (next read re-populates)
```

### Write-Through
```
Write: Update DB + Update Cache simultaneously
Read:  Always in cache (no miss for written data)
Problem: Write latency doubles (must wait for both)
```

### Write-Behind (Write-Back)
```
Write: Update Cache → return (fast!) → async DB update in background
Risk:  If cache crashes before DB write → data loss
```

### Cache Eviction Policies
```
LRU (Least Recently Used)  — evict what wasn't used longest (Redis default)
LFU (Least Frequently Used) — evict what's used least often
TTL (Time To Live)          — evict after fixed time (Pojjari: key-specific TTL)
FIFO                        — evict oldest inserted key
```

---

## 9.5 Message Queue — Async Processing

**Problem:** Booking confirmation email takes 2-3 seconds → user waits.
**Solution:** Queue the email task, return response immediately, worker processes async.

```
User books → API responds "booking confirmed" (fast)
                  ↓
           push to Message Queue (e.g., Redis List, BullMQ, RabbitMQ)
                  ↓
           Background Worker picks up → sends email
                  ↓
           Email delivered (user doesn't wait for this)
```

### BullMQ with Redis (Modern Node.js way)
```js
const { Queue, Worker } = require('bullmq');
const redis = { host: 'localhost', port: 6379 };

// Producer (in booking controller)
const emailQueue = new Queue('emails', { connection: redis });
await emailQueue.add('booking-confirmation', {
  to: user.email,
  bookingId: booking.id,
  pujariName: pujari.name,
  date: booking.date,
});
// Instantly returns — email sent asynchronously

// Consumer (separate worker process)
const worker = new Worker('emails', async (job) => {
  if (job.name === 'booking-confirmation') {
    await sendBookingEmail(job.data);
  }
}, { connection: redis });
```

---

## 9.6 CAP Theorem

**For any distributed system, you can only guarantee 2 of 3:**

| Property | Meaning |
|----------|---------|
| **C**onsistency | Every read gets the most recent write |
| **A**vailability | Every request gets a response (no errors) |
| **P**artition Tolerance | System works even if network partition splits nodes |

**P is always required** (networks do fail) → choice is between C and A:

- **CP (MySQL, MongoDB with strong consistency)**: If network partitions, system may go down rather than serve stale data
- **AP (Cassandra, DynamoDB)**: Always responds, but might serve stale data during partition

**Pojjari:** MySQL (CP) — consistency preferred over availability for financial/booking data.

---

## 9.7 Design: URL Shortener (Common Interview Problem)

### Requirements
- Input: Long URL → Output: short code (e.g., `pojjari.com/abc123`)
- Redirect: `abc123` → original long URL
- Scale: 100M URLs, 1B redirects/day

### Design
```
POST /shorten  {url: "https://very-long-url.com/..."}
               ↓
         Generate unique 7-char code (Base62: a-z A-Z 0-9)
               ↓
         Store: urls table { code, original_url, created_at, user_id }
               ↓
         Return: {shortUrl: "pojjari.com/abc123"}

GET /:code
               ↓
         Redis cache: GET code → found? 301 redirect (fast!)
               ↓ miss
         MySQL: SELECT original_url WHERE code = ?
               ↓
         Redis: SET code originalUrl EX 86400
               ↓
         301 redirect
```

### Code generation
```js
const BASE62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function generateCode(length = 7) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += BASE62[Math.floor(Math.random() * 62)];
  }
  return code;
  // 62^7 = 3.5 trillion possible codes
}
```

---

## 9.8 Design: Pojjari Booking System (Your Project!)

```
Architecture:
                    [Nginx]
                   /       \
         [React SPA]    [Node.js API]
                            |
                    ┌───────┴────────┐
                  [Redis]        [MySQL]
                 (cache)        (source)

API Design:
POST /api/booking            Create booking
GET  /api/booking?userId=42  My bookings
GET  /api/booking/all        Admin: all bookings
PUT  /api/booking/:id        Update status
DELETE /api/booking/:id      Cancel

DB Schema:
bookings(id, user_id, pujari_id, date, time, status, created_at)
users(id, name, email, password_hash, role, mobile)
pujaris(id, user_id, name, category, rating, available, location)

Scale considerations:
- Redis cache for pujari list (frequently read, changes rarely)
- Index on bookings(pujari_id, date) for availability queries
- Index on bookings(user_id) for "my bookings" query
- Transactions for booking + availability update (ACID)
```

---

## Interview Q&A

**Q: Vertical vs Horizontal Scaling — कधी काय?**
> Vertical: Simple, no code changes needed, but limited (can't buy infinite RAM) + single point of failure. Small/early-stage apps साठी.
> Horizontal: Add more servers, load balancer front, theoretically unlimited. Stateless architecture लागतो (JWT not sessions). Pojjari production-ready design horizontal supports करतो — JWT stateless आहे, Redis distributed आहे.

**Q: Pojjari ला 10x traffic आला तर काय करशील?**
> 1. Redis caching already आहे — helps a lot.
> 2. Node.js PM2 cluster mode — already using all CPU cores.
> 3. MySQL Read Replica add करीन — reads offload होतील.
> 4. Horizontal scaling — Load Balancer + 3 Node.js instances.
> 5. CDN साठी static assets (images, CSS, JS).
> 6. Expensive queries optimize करीन — EXPLAIN ANALYZE.

**Q: CAP theorem — Pojjari मध्ये काय?**
> MySQL = CP (Consistency + Partition Tolerance). Booking confirm झाल्यावर सगळ्यांना same data दिसायला हवं — consistency critical. Stale booking data दाखवलं तर double-booking होऊ शकतो. Availability ला थोडं sacrifice ठीक आहे.

**Q: Message queue कधी वापरतो?**
> Long-running background tasks जे user ला wait करायला लागू नयेत: email sending, SMS, PDF generate, image resize, analytics events. Booking confirm → email queue → immediate response. Background worker email process करतो. User ला 2-3 second wait नाही.

---

## Summary Table

| Concept | Key Point |
|---------|-----------|
| Vertical Scaling | Bigger machine — simple but limited |
| Horizontal Scaling | More machines — needs load balancer + stateless |
| Load Balancer | Distribute traffic — Round Robin / Least Connections |
| Read Replica | Read from slave DB — reduce master load |
| CAP Theorem | Can only guarantee 2 of 3 (P always needed) |
| Cache-Aside | Lazy load — miss → DB → cache |
| Message Queue | Async background tasks — decouple processing |
| Base62 | URL shortener code generation — 62^7 = 3.5T combinations |
