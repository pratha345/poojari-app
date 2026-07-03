# Topic 05: Redis Caching
> In-memory data store — Pojjari achieves 95%+ cache hit rate for panchang + pujari data

---

## 5.1 What is Redis?

Redis = **RE**mote **DI**ctionary **S**erver — an in-memory key-value store.

| Feature | Redis | MySQL |
|---------|-------|-------|
| Storage | RAM | Disk |
| Speed | ~0.1ms | ~5-50ms |
| Data type | Key-Value, Lists, Sets, Sorted Sets, Hashes | Tables (relational) |
| Persistence | Optional (RDB/AOF) | Yes (always) |
| Use case | Cache, sessions, pub/sub, rate limiting | Primary data store |
| Query | Key-based GET/SET | SQL SELECT |

**Rule:** Redis for frequently-read, rarely-changed data. MySQL for source of truth.

---

## 5.2 Basic Commands

```bash
# String (most common — for caching JSON)
SET key "value"                     # store
GET key                             # retrieve (returns nil if not found)
DEL key                             # delete
EXISTS key                          # check existence (returns 1 or 0)
EXPIRE key 3600                     # set TTL (seconds) on existing key
SETEX key 3600 "value"             # set + TTL in one command
TTL key                             # check remaining TTL (-1 = no TTL, -2 = expired)

# Increment (rate limiting, counters)
INCR login_attempts:user:42        # increment by 1, create if not exists
INCRBY key 10                      # increment by 10

# Listing all keys (debug only — never in production)
KEYS *                             # show all keys (expensive on large datasets)
KEYS panchang:*                    # pattern match

# Flush (clear all)
FLUSHALL                           # ⚠️ wipe everything — only for dev/testing
```

---

## 5.3 Cache-Aside Pattern — How Pojjari Uses Redis

**Cache-Aside (Lazy Loading):** Application manages the cache — reads from cache first, falls back to DB on miss, then populates cache.

```js
// utils/cache.js — Redis client setup
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});
module.exports = redis;

// controllers/pujari.controller.js — Cache-Aside pattern
async function getPujaris(req, res) {
  const cacheKey = 'pujaris:all:list';

  // Step 1: Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));  // CACHE HIT — no DB call
  }

  // Step 2: Cache MISS — fetch from DB
  const [rows] = await pool.query(
    'SELECT p.*, u.name, u.email FROM pujaris p INNER JOIN users u ON p.user_id = u.id'
  );

  // Step 3: Store in cache with TTL
  await redis.setex(cacheKey, 300, JSON.stringify(rows)); // 300s = 5 min TTL

  res.json(rows);
}
```

```
First request:
Client → Cache? MISS → MySQL query → Store in Redis → Response

All subsequent requests (within TTL):
Client → Cache? HIT → Response (no MySQL)
```

---

## 5.4 Cache Invalidation — Keep Data Fresh

When data changes in MySQL, the cache must be invalidated (deleted).

```js
// When pujari profile is updated → invalidate their cache
async function updatePujariProfile(req, res) {
  const { id } = req.params;

  await pool.query('UPDATE pujaris SET ? WHERE id = ?', [req.body, id]);

  // Invalidate specific cache keys
  await redis.del(`pujaris:all:list`);    // list cache
  await redis.del(`pujari:${id}:detail`); // individual cache

  res.json({ message: 'Profile updated' });
}
```

### Pattern-based invalidation
```js
// Delete all keys matching a pattern (for complex cache groups)
async function invalidatePujariCache() {
  const keys = await redis.keys('pujari:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

---

## 5.5 Pojjari Cache Strategy — TTL Values

```js
// Different data has different freshness requirements

// Panchang (date data changes daily at midnight)
redis.setex('panchang:2024-01-15', 86400, JSON.stringify(panchangData));  // 24 hours

// Pujari list (changes when admin adds/removes pujaris)
redis.setex('pujaris:list', 300, JSON.stringify(list));  // 5 minutes

// Samagri list (pooja materials — changes rarely)
redis.setex('samagri:ganesh-puja', 3600, JSON.stringify(items));  // 1 hour

// Blog posts (admin publishes new content occasionally)
redis.setex('blogs:recent', 600, JSON.stringify(posts));  // 10 minutes

// User session data (frequent access during session)
redis.setex(`user:${userId}:session`, 3600, JSON.stringify(userData));  // 1 hour

// Rate limiting counter (sliding window per 15 min)
redis.setex(`rate:${ip}:login`, 900, '0');  // 15 minutes
```

---

## 5.6 Rate Limiting with Redis

```js
// middleware/rateLimiter.js — Login attempt limiter
async function loginRateLimiter(req, res, next) {
  const ip = req.ip;
  const key = `rate:login:${ip}`;

  const current = await redis.incr(key);  // increment counter
  if (current === 1) {
    await redis.expire(key, 900);  // first attempt — set 15 min TTL
  }

  if (current > 10) {
    const ttl = await redis.ttl(key);
    return res.status(429).json({
      message: `Too many login attempts. Try again in ${Math.ceil(ttl / 60)} minutes.`
    });
  }

  next();
}

// Reset on successful login
async function resetLoginAttempts(ip) {
  await redis.del(`rate:login:${ip}`);
}
```

---

## 5.7 Cache Stampede Problem

**Problem:** Cache expires → 1000 simultaneous requests all get MISS → all hit DB at same time → DB overloaded.

```js
// Simple fix: Add small random jitter to TTL
const BASE_TTL = 300;
const jitter = Math.floor(Math.random() * 30); // 0-30 seconds random
await redis.setex(key, BASE_TTL + jitter, JSON.stringify(data));
// Different users' caches expire at slightly different times
```

Advanced fix: Lock pattern (only first miss queries DB, others wait).

---

## 5.8 Redis Data Types Beyond String

```js
// Hash — store object fields individually
await redis.hset(`user:${id}`, {
  name: 'Prathamesh',
  email: 'p@example.com',
  role: 'admin'
});
const name = await redis.hget(`user:${id}`, 'name');
const user = await redis.hgetall(`user:${id}`);

// List — ordered list (recent bookings, queue)
await redis.lpush(`user:${id}:recent`, bookingId);  // push front
await redis.ltrim(`user:${id}:recent`, 0, 9);       // keep last 10 only
const recents = await redis.lrange(`user:${id}:recent`, 0, 9);

// Sorted Set — leaderboard, ranking
await redis.zadd('pujari:bookings', score, pujariId);
const top10 = await redis.zrevrange('pujari:bookings', 0, 9, 'WITHSCORES');
```

---

## Interview Q&A

**Q: Redis vs MySQL — कधी काय वापरतो?**
> Redis: Frequently-read, rarely-changed data. Response time critical आहे. Examples: API response cache, session data, rate limiting counters, panchang data.
> MySQL: Source of truth, relational data, complex queries, transactions, ACID needed.
> Rule: Redis is a cache layer — MySQL is the primary store. Redis lost हो‌ऊ शकतो (memory eviction), MySQL ला always data असायला हवी.

**Q: Cache Hit vs Cache Miss**
> Cache Hit: Redis मध्ये key found — DB call नाही, ultra-fast response.
> Cache Miss: Key नाही (expired, never set, or invalidated) — DB query करतो, result cache मध्ये store करतो.
> Pojjari: 95%+ cache hit rate — म्हणजे 95 requests Redis मधून येतात, फक्त 5 DB ला जातात.

**Q: Cache Invalidation strategy**
> Write-through: DB update झाल्यावर लगेच cache update. Always consistent but extra write time.
> Cache-Aside: Read वर lazy populate. Write वर `redis.del(key)`. Next read cache miss होईल → DB → re-populate.
> Pojjari: Cache-Aside — update/delete वर `redis.del()`. Simpler, works for our use case.

**Q: TTL म्हणजे काय? Pojjari मध्ये कोणते values?**
> TTL = Time To Live — seconds मध्ये, key auto-delete होतो after that time. Pojjari values: Panchang: 86400 (24h), Pujari list: 300 (5min), Samagri: 3600 (1h), Blogs: 600 (10min), Rate limit window: 900 (15min).

**Q: Cache Stampede म्हणजे काय?**
> Popular cache key expire होतो → त्याच वेळी 1000 requests येतात → सगळ्यांना MISS → सगळे DB ला hit → DB overload. Fix: Random TTL jitter (0-30 sec extra) — different users चे caches different वेळी expire होतात. Advanced: mutex/lock pattern — फक्त first request DB ला जातो, बाकी wait करतात.

**Q: `KEYS *` production मध्ये का नाही वापरायचं?**
> `KEYS *` blocking operation आहे — Redis single-threaded असल्याने सगळे keys scan होईपर्यंत (millions असतील तर) इतर operations block होतात. Production मध्ये `SCAN` cursor-based iteration वापरायचं — non-blocking.

---

## Pojjari Project Connection

| Feature | Redis Usage |
|---------|------------|
| Panchang API | Cache daily panchang data — TTL 24hrs |
| Pujari list | Cache SELECT result — TTL 5min |
| Samagri per category | Cache per category key — TTL 1hr |
| Login rate limiting | INCR counter per IP, EXPIRE 900s |
| Blog posts | Cache recent posts — TTL 10min |
| Cache invalidation | `redis.del()` on pujari/samagri update |

---

## Summary Table

| Concept | Key Point |
|---------|-----------|
| Cache-Aside | Check cache → miss → DB → store in cache |
| TTL | Auto-expire key after N seconds |
| Cache Invalidation | `redis.del(key)` on data change |
| Cache Hit | Key found in Redis — no DB call |
| Cache Miss | Key not found — must query DB |
| Cache Stampede | Simultaneous misses → DB overload |
| `SETEX key ttl val` | Set value with TTL in one command |
| `INCR` | Atomic increment — for rate limiting |
| Redis vs MySQL | Redis=cache/speed, MySQL=persistence/truth |
| 95% cache hit rate | Pojjari production metric |
