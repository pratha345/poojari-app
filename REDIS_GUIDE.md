# Redis — Complete Professional Guide
## तुमच्या Pojjari Backend मधून शिका

> हा document तुमच्याच actual code वर based आहे.
> प्रत्येक line explain केली आहे — theory + actual usage एकत्र.

---

## अनुक्रमणिका (Table of Contents)

1. [Redis म्हणजे काय?](#1-redis-म्हणजे-काय)
2. [Redis vs MySQL — फरक](#2-redis-vs-mysql--फरक)
3. [ioredis — Node.js Redis Client](#3-ioredis--nodejs-redis-client)
4. [तुमची redis.js फाईल — Line by Line](#4-तुमची-redisjs-फाईल--line-by-line)
5. [getCache — Cache वाचणे](#5-getcache--cache-वाचणे)
6. [setCache — Cache साठवणे](#6-setcache--cache-साठवणे)
7. [delCache — Cache Delete करणे](#7-delcache--cache-delete-करणे)
8. [delCachePattern — Pattern Delete करणे](#8-delcachepattern--pattern-delete-करणे)
9. [Pooja Controller मधील Redis](#9-pooja-controller-मधील-redis)
10. [Blog Controller मधील Redis](#10-blog-controller-मधील-redis)
11. [Home Controller मधील Redis](#11-home-controller-मधील-redis)
12. [Booking Controller मधील Redis](#12-booking-controller-मधील-redis)
13. [Cache Keys चे Naming Pattern](#13-cache-keys-चे-naming-pattern)
14. [TTL म्हणजे काय?](#14-ttl-म्हणजे-काय)
15. [Cache Invalidation — सर्वात Important Concept](#15-cache-invalidation--सर्वात-important-concept)
16. [Graceful Fallback — Redis नसेल तरी App चालतो](#16-graceful-fallback--redis-नसेल-तरी-app-चालतो)
17. [Redis Data Structures](#17-redis-data-structures)
18. [Redis Commands — Practice](#18-redis-commands--practice)
19. [Performance Impact — Real Numbers](#19-performance-impact--real-numbers)
20. [Redis Production Setup](#20-redis-production-setup)

---

## 1. Redis म्हणजे काय?

```
साध्या भाषेत:
Redis = RAM मध्ये data साठवणारा database

MySQL: Hard disk → HDD/SSD → 10-100ms वेळ लागतो
Redis: RAM → 0.1-1ms वेळ लागतो

100x ते 1000x जलद!
```

**Real Life Example:**

```
तुम्ही रोज office ला जाताना:
❌ Without Cache: घरातून निघताना map उघडा → route search करा → 5 min
✅ With Cache:    काल लक्षात ठेवलेला route follow करा → 30 sec

Redis = तुमची memory/cache
MySQL = GPS ने पुन्हा calculate करणे
```

**Pojjari मध्ये Redis कुठे वापरला:**

```
GET /api/pooja/categories
  Without Redis: MySQL query → 50ms
  With Redis:    Redis GET → 0.5ms → 100x जलद!

GET /api/blog/posts?page=1
  Without Redis: MySQL JOIN + COUNT → 120ms
  With Redis:    Redis GET → 1ms → 120x जलद!

GET /api/home
  Without Redis: 2 MySQL queries → 80ms
  With Redis:    Redis GET → 0.8ms → 100x जलद!
```

---

## 2. Redis vs MySQL — फरक

```
┌─────────────────┬───────────────────┬────────────────────┐
│ Feature         │ MySQL             │ Redis              │
├─────────────────┼───────────────────┼────────────────────┤
│ Storage         │ Hard Disk (SSD)   │ RAM (Memory)       │
│ Speed           │ 10-200ms          │ 0.1-2ms            │
│ Data persists   │ Forever ✅        │ Optional (TTL)     │
│ Data type       │ Tables/Rows       │ Key-Value          │
│ SQL support     │ Yes ✅            │ No                 │
│ Relations       │ JOIN, FK ✅       │ No                 │
│ Use case        │ Primary database  │ Cache/Session      │
│ Size limit      │ TB+               │ RAM size (~GB)     │
└─────────────────┴───────────────────┴────────────────────┘

तुमच्या App मध्ये:
MySQL = Source of Truth (सगळा data येथे आहे)
Redis = Fast Copy   (वारंवार लागणारा data येथे)
```

---

## 3. ioredis — Node.js Redis Client

**`ioredis` म्हणजे काय?**

```javascript
// Redis एक server आहे (port 6379 वर चालतो)
// तुमचा Node.js code त्याच्याशी बोलण्यासाठी client library लागते
// ioredis = तो client library

// package.json मध्ये:
"ioredis": "^5.11.0"

// हे install करण्यासाठी:
npm install ioredis

// ioredis vs redis (दुसरी library):
// ioredis → Cluster support, Promises, More reliable ✅ (तुम्ही हेच वापरतो)
// redis   → Official npm package, simpler
```

---

## 4. तुमची redis.js फाईल — Line by Line

**File:** `backend/src/utils/redis.js`

```javascript
'use strict';
// ↑ JavaScript strict mode enable करतो
// → undeclared variables, duplicate parameters → error देतो
// → safer code लिहण्यासाठी good practice
```

```javascript
let redis = null;
// ↑ redis variable null ने start करतो
// का? Redis unavailable असेल तर null राहतो
// पुढे सगळ्या functions मध्ये: if (!redis) return null;
// म्हणजे Redis नसेल तरी app crash होत नाही!
```

```javascript
try {
  const Redis = require('ioredis');
  // ↑ ioredis library import करतो
  // try-catch मध्ये का? ioredis install नसेल तरी app चालावा
```

```javascript
  redis = new Redis({
    host:     process.env.REDIS_HOST || '127.0.0.1',
    // ↑ Redis server कुठे आहे?
    //   env var असेल तर ते, नाहीतर localhost (127.0.0.1)
    //   Production मध्ये: REDIS_HOST=your-redis-server.com

    port:     parseInt(process.env.REDIS_PORT || '6379'),
    // ↑ Redis चा default port = 6379
    //   parseInt → string को number मध्ये convert (env vars strings असतात)

    password: process.env.REDIS_PASSWORD || undefined,
    // ↑ Production मध्ये Redis password protected असतो
    //   undefined म्हणजे no password (local development)

    db:       0,
    // ↑ Redis मध्ये 0-15 databases असतात (like MySQL databases)
    //   db 0 = default, general purpose use

    lazyConnect: true,
    // ↑ new Redis() केल्यावर लगेच connect नको
    //   खाली redis.connect() manually call करतो
    //   का? Error handle करणे सोपे होते

    enableOfflineQueue: false,
    // ↑ Redis down असेल तर commands queue मध्ये ठेवू नको
    //   false म्हणजे: Redis नाही → error → catch → null return
    //   true असतं तर: commands queue होतात → memory leak होऊ शकतो

    retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 2000)),
    // ↑ Connection fail झाल्यावर किती वेळा retry करायचे?
    //   times = attempt number (1, 2, 3...)
    //   times > 3 → null → retry बंद करा
    //   Math.min(times * 500, 2000):
    //     attempt 1 → 500ms wait
    //     attempt 2 → 1000ms wait
    //     attempt 3 → 1500ms wait
    //     max → 2000ms (2 sec) wait
    //   Exponential backoff pattern!

    maxRetriesPerRequest: 1,
    // ↑ प्रत्येक GET/SET command fail झाल्यावर 1 वेळाच retry
    //   default 20 असतो — खूप जास्त

    connectTimeout: 2000,
    // ↑ Connection establish होण्यासाठी max 2 seconds wait
    //   2 sec नंतर fail → fallback to null

    commandTimeout: 1000,
    // ↑ प्रत्येक command (GET, SET) साठी max 1 second wait
    //   1 sec नंतर timeout → catch → null return
  });
```

```javascript
  redis.on('error', () => {});
  // ↑ Error event listener — EMPTY function
  // ioredis मध्ये: error event unhandled असेल → process crash!
  // Empty handler: "error आला → ignore करा → app चालू राहू दे"
  // Production मध्ये येथे logging add करू शकतो:
  //   redis.on('error', (err) => console.warn('Redis error:', err.message));

  redis.connect().catch(() => {});
  // ↑ redis.connect() → Promise return करतो
  //   .catch(() => {}) → connection fail झाली तरी unhandled rejection नाही
  //   Redis unavailable → catch → app चालू राहतो
```

```javascript
} catch (_) {
  redis = null;
}
// ↑ try block मध्ये कुठलीही error (require fail, etc.)
//   redis = null ठेवतो
//   '_' म्हणजे: error variable use नाही करणार (conventional name)
```

---

## 5. getCache — Cache वाचणे

```javascript
async function getCache(key) {
  // key = Redis मधील unique identifier
  // उदा: 'pooja:categories', 'blog:list:{"page":1}'

  if (!redis) return null;
  // ↑ Redis connected नाही? → null return → DB query होईल

  try {
    const val = await redis.get(key);
    // ↑ redis.get(key) = Redis ला "हे key दे" सांगणे
    //   val = string किंवा null
    //   null म्हणजे: key exist नाही (cache miss)

    return val ? JSON.parse(val) : null;
    // ↑ val असेल तर: JSON.parse → JavaScript object
    //   val नसेल तर: null return (cache miss)
    //
    // का JSON.parse?
    // Redis only strings store करतो!
    // Object → JSON.stringify → Redis store
    // Redis read → JSON.parse → Object back
    //
    // उदा:
    //   Redis मध्ये: '{"name":"गणेश पूजा","price":1500}'
    //   JSON.parse → { name: "गणेश पूजा", price: 1500 }

  } catch (_) {
    return null;
    // ↑ Redis timeout, connection error, JSON parse error
    //   कुठलीही error → null return → DB query होईल
    //   App कधीच crash होत नाही!
  }
}
```

**Real usage — Pooja Controller:**

```javascript
// pooja.controller.js — getCategories function
const cached = await getCache(CAT_KEY);  // CAT_KEY = 'pooja:categories'
if (cached) return success(res, cached);
// ↑ Cache hit: Redis मध्ये data आहे → लगेच response → DB query नाही!

// Cache miss: Redis मध्ये नाही → DB query करा
const [rows] = await pool.query('SELECT * FROM pooja_categories ...');
```

---

## 6. setCache — Cache साठवणे

```javascript
async function setCache(key, data, ttlSeconds) {
  // key        = Redis key (unique name)
  // data       = save करायचा JavaScript object
  // ttlSeconds = किती seconds नंतर automatically delete?

  if (!redis) return;
  // ↑ Redis नाही → silently return → no error

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    // ↑ redis.set() चे 4 arguments:
    //
    //   key           → 'pooja:categories'
    //   JSON.stringify → Object → String (Redis only strings घेतो)
    //   'EX'          → Expire (TTL) flag
    //   ttlSeconds    → किती seconds नंतर delete?
    //
    // उदा:
    //   redis.set('pooja:categories', '[{...}]', 'EX', 3600)
    //   → 3600 seconds (1 hour) नंतर automatically delete
    //
    // Redis command: SET pooja:categories '[{...}]' EX 3600

  } catch (_) {}
  // ↑ Empty catch: save fail झाली → no error, no crash
  //   पुढचा request DB मधून fetch करेल
}
```

**Real usage — TTL values:**

```javascript
// pooja.controller.js — top of file
const CAT_KEY  = 'pooja:categories';
const CAT_TTL  = 60 * 60;       // 1 hour  = 3600 seconds
const LIST_TTL = 30 * 60;       // 30 min  = 1800 seconds
const SLUG_TTL = 30 * 60;       // 30 min  = 1800 seconds

// का इतका जास्त TTL?
// Categories rarely बदलतात → 1 hour ठीक आहे
// List बदलते (नवीन pooja add) → 30 min

// blog.controller.js
const CAT_TTL  = 10 * 60;  // 10 min — blog categories
const LIST_TTL = 5  * 60;  // 5 min  — blog list (जास्त बदलते)
const SLUG_TTL = 10 * 60;  // 10 min — individual post

// homeController.js
const HOME_TTL = 10 * 60;  // 10 min — homepage data
```

---

## 7. delCache — Cache Delete करणे

```javascript
async function delCache(...keys) {
  // ...keys = Rest parameters → multiple keys एकत्र pass करता येतात
  // उदा:
  //   delCache('blog:categories')              → 1 key delete
  //   delCache('blog:categories', 'home:data') → 2 keys delete

  if (!redis) return;

  try {
    await redis.del(...keys);
    // ↑ redis.del() multiple keys delete करतो एकाच command मध्ये
    // Redis command: DEL blog:categories home:data

  } catch (_) {}
}
```

**Real usage — Blog Controller:**

```javascript
// blog.controller.js — update function
await Promise.all([
  delCachePattern('blog:list:*'),           // सगळे list cache delete
  delCache(CAT_KEY),                        // 'blog:categories' delete
  slug ? delCache(`blog:slug:${slug}`) : Promise.resolve(),  // specific post delete
]);

// Promise.all म्हणजे: तिन्ही delete एकाच वेळी (parallel)
// एकामागून एक (sequential) नाही → faster!
```

---

## 8. delCachePattern — Pattern Delete करणे

**सर्वात Powerful Function!**

```javascript
async function delCachePattern(pattern) {
  // pattern = wildcard pattern
  // उदा: 'pooja:list:*' → 'pooja:list:' ने सुरू होणारे सगळे keys

  if (!redis) return;

  try {
    let cursor = '0';
    // ↑ SCAN command cursor-based iteration वापरतो
    //   '0' = starting cursor

    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      // ↑ redis.scan() = KEYS command चा safe alternative
      //
      //   cursor  → current position
      //   'MATCH' → filter pattern
      //   pattern → 'pooja:list:*'
      //   'COUNT' → per iteration किती keys check करायचे (hint, not guarantee)
      //   100     → ~100 keys per scan
      //
      //   Returns:
      //     next → नवीन cursor position
      //     keys → matched keys array
      //
      // का SCAN? KEYS वापरले तर:
      //   KEYS pooja:list:* → सगळे keys एकाच वेळी scan → server block!
      //   Production मध्ये 1 million keys असतील तर app freeze!
      //   SCAN → iterative, non-blocking ✅

      cursor = next;
      // ↑ cursor update करा

      if (keys.length) await redis.del(...keys);
      // ↑ matched keys delete करा
      //   keys.length check → empty array del करायला नको

    } while (cursor !== '0');
    // ↑ cursor '0' वर परत आला = scan complete
    //   '0' = Redis ने सांगणे "आता सगळं scan झालं"

  } catch (_) {}
}
```

**का Pattern Delete लागते?**

```javascript
// Pooja list URL examples:
// GET /api/pooja?page=1
// GET /api/pooja?page=2
// GET /api/pooja?category=ganesh&page=1
// GET /api/pooja?search=अभिषेक&page=1

// Cache keys (pooja.controller.js मधून):
// 'pooja:list:{"category":undefined,"page":"1","limit":"12"}'
// 'pooja:list:{"category":"ganesh","page":"1","limit":"12"}'
// 'pooja:list:{"search":"अभिषेक","page":"1","limit":"12"}'

// नवीन pooja add केली → सगळे list cache invalid!
// एकेक delete करणे impossible (किती combinations असतील?)

// Solution:
await delCachePattern('pooja:list:*');
// ↑ Pattern: 'pooja:list:' ने सुरू होणारे सगळे keys delete!
// 10 keys असोत किंवा 10,000 → सगळे delete!
```

---

## 9. Pooja Controller मधील Redis

**File:** `backend/src/controllers/pooja.controller.js`

### 9.1 Categories Cache

```javascript
const CAT_KEY = 'pooja:categories';  // Fixed key — categories एकच list आहे
const CAT_TTL = 60 * 60;             // 1 hour

exports.getCategories = async (req, res) => {
  try {
    // ── Step 1: Cache check ───────────────────────────────────
    const cached = await getCache(CAT_KEY);
    if (cached) return success(res, cached);
    // ↑ Cache HIT: Redis मध्ये आहे → DB query नाही → fast response!
    // ↑ Cache MISS: null → खाली जा → DB query

    // ── Step 2: DB query (cache miss वेळी) ───────────────────
    const [rows] = await pool.query(
      'SELECT * FROM pooja_categories WHERE is_active=TRUE ORDER BY sort_order'
    );
    const data = resolveImages(rows);

    // ── Step 3: Cache save ────────────────────────────────────
    await setCache(CAT_KEY, data, CAT_TTL);
    // ↑ DB result Redis मध्ये save करा
    //   पुढचा request → Redis मधून येईल (Step 1 hit होईल)

    return success(res, data);
  } catch (err) {
    return error(res, 'श्रेणी मिळवताना त्रुटी झाली.');
  }
};
```

**Flow Diagram:**

```
Request येतो
     ↓
Redis मध्ये 'pooja:categories' आहे?
     ↓ YES (cache HIT)           ↓ NO (cache MISS)
     ↓                               ↓
Response → 0.5ms              MySQL query → 50ms
                                    ↓
                              Redis मध्ये save (1 hour)
                                    ↓
                              Response → 50ms
                              (पुढचा request → 0.5ms)
```

### 9.2 Pooja List Cache — Dynamic Key

```javascript
exports.getPoojas = async (req, res) => {
  const { category, featured, search, min_price, max_price, page = 1, limit = 12, tenant_slug } = req.query;

  // ── Dynamic Cache Key ─────────────────────────────────────
  const listKey = `pooja:list:${JSON.stringify({
    category, featured, search, min_price, max_price, page, limit, tenant_slug,
    tid: req.tenantId
  })}`;
  // ↑ प्रत्येक unique query combination → unique cache key!
  //
  // ?page=1 → 'pooja:list:{"page":"1","limit":"12"}'
  // ?page=2 → 'pooja:list:{"page":"2","limit":"12"}'
  // ?category=ganesh → 'pooja:list:{"category":"ganesh","page":"1","limit":"12"}'
  //
  // JSON.stringify → consistent ordering (parameters always same order)

  const cachedList = await getCache(listKey);
  if (cachedList) return success(res, cachedList);
  // ↑ Exact same query → cached! Different query → DB

  // ... MySQL query ...
  // ... pagination ...

  await setCache(listKey, listData, LIST_TTL);
  // ↑ Result save with 30 min TTL
};
```

### 9.3 Slug Cache

```javascript
exports.getPoojaBySlug = async (req, res) => {
  const { slug } = req.params;
  const slugKey  = `pooja:slug:${slug}`;
  // ↑ Key: 'pooja:slug:ganesh-puja'
  //        'pooja:slug:satyanarayan-puja'
  //        प्रत्येक pooja ला unique key

  const cachedSlug = await getCache(slugKey);
  if (cachedSlug) {
    // Cache HIT — पण view count update करायचा आहे!
    pool.query('UPDATE poojas SET views = views + 1 WHERE slug = ?', [slug])
      .catch(() => {});
    // ↑ .catch(() => {}) → async, non-blocking
    //   response wait नाही करत → user ला fast response
    //   background मध्ये update होतो

    return success(res, cachedSlug);
  }

  // Cache MISS: DB query करा
  // ... samagri, reviews fetch ...

  const slugData = { ...pooja, samagri, reviews };
  await setCache(slugKey, slugData, SLUG_TTL);
  // ↑ Complete pooja data (samagri + reviews सकट) cache!
  //   30 min cache → 30 min मध्ये users DB hit नाही करत
};
```

### 9.4 Cache Invalidation on Create/Update/Delete

```javascript
exports.createPooja = async (req, res) => {
  // ... DB insert ...
  await delCachePattern('pooja:list:*');
  await delCache(CAT_KEY);
  // ↑ नवीन pooja → list cache आता stale (जुना)
  //   Pattern delete → सगळे list pages invalid
  //   Category cache delete → category count बदलला असेल
};

exports.updatePooja = async (req, res) => {
  // ... DB update ...
  await delCachePattern('pooja:list:*');
  await delCachePattern('pooja:slug:*');
  // ↑ Update → list आणि individual page दोन्ही invalid
};

exports.deletePooja = async (req, res) => {
  // ... DB soft delete ...
  await delCachePattern('pooja:list:*');
  await delCachePattern('pooja:slug:*');
  // ↑ Delete → सगळं invalid
};
```

---

## 10. Blog Controller मधील Redis

**File:** `backend/src/controllers/blog.controller.js`

```javascript
const CAT_KEY  = 'blog:categories';  // Notice: 'blog:' prefix — pooja keys पासून वेगळे!
const LIST_TTL = 5 * 60;             // 5 min — blog list जास्त बदलतो (publish/unpublish)
```

### Slug Cache — Special Case

```javascript
exports.getBySlug = async (req, res) => {
  const { slug } = req.params;
  const { session_id } = req.query;  // User च्या rating साठी

  const slugKey = `blog:slug:${slug}`;
  const cached = await getCache(slugKey);

  if (cached) {
    // ── Cache HIT — Special handling ────────────────────────
    pool.query('UPDATE blog_posts SET views = views + ? WHERE slug = ?',
      [Math.floor(Math.random() * 9) + 1, slug]).catch(() => {});
    // ↑ views random increment (1-9)
    //   का random? Organic feel — सगळ्यांना exactly +1 नाही दिसत
    //   Async, non-blocking

    // ── Session-specific data → CACHE नाही! ────────────────
    let user_rating = null;
    if (session_id) {
      const [[ur]] = await pool.query(
        'SELECT rating FROM blog_ratings WHERE blog_post_id = ? AND session_id = ?',
        [cached.post.id, session_id]
      );
      if (ur) user_rating = ur.rating;
    }
    // ↑ User चा rating cache करता येत नाही!
    //   प्रत्येक user वेगळा → session_id वेगळा → rating वेगळा
    //   Post data cache, user-specific data fresh fetch

    return success(res, { ...cached, user_rating });
    // ↑ Cache data + fresh user_rating combine करून send
  }

  // Cache MISS → full fetch...
  const postData = { post: rows[0], related };
  await setCache(slugKey, postData, SLUG_TTL);
  // ↑ post + related articles cache (user_rating नाही!)
  return success(res, { ...postData, user_rating });
};
```

### Rating Update → Cache Invalidation

```javascript
exports.rateBlog = async (req, res) => {
  // ... DB update avg_rating ...

  await delCache(`blog:slug:${slug}`);
  // ↑ Rating changed → cached data मध्ये old avg_rating आहे
  //   Cache delete → पुढचा request fresh data fetch करेल
  //   Specific slug delete (list cache valid राहतो — list मध्ये rating नाही)
};
```

---

## 11. Home Controller मधील Redis

**File:** `backend/src/controllers/homeController.js`

```javascript
const HOME_KEY = 'home:data';
const HOME_TTL = 10 * 60;  // 10 minutes

exports.getHome = async (req, res) => {
  try {
    const cached = await getCache(HOME_KEY);
    if (cached) return success(res, cached);
    // ↑ Homepage सर्वात जास्त load होतो!
    //   Cache hit → DB ला एकही request नाही

    // Cache miss → 2 DB queries
    const [[content]] = await pool.query(
      'SELECT * FROM home_content ORDER BY id DESC LIMIT 1'
    );
    const [sliders] = await pool.query(
      'SELECT * FROM home_slider WHERE is_active = 1 ORDER BY sort_order ASC'
    );

    const data = { content: content || null, sliders };
    await setCache(HOME_KEY, data, HOME_TTL);
    // ↑ content + sliders एकत्र cache
    //   10 min TTL → 10 min मध्ये हजारो requests → DB hit नाही
    return success(res, data);
  }
};

// Admin update → Cache invalidate
exports.upsertHome = async (req, res) => {
  // ... DB update ...
  await delCache(HOME_KEY);  // 'home:data' delete → fresh fetch होईल
};
```

---

## 12. Booking Controller मधील Redis

**File:** `backend/src/controllers/booking.controller.js`

```javascript
const { delCache, delCachePattern } = require('../utils/redis');
// ↑ Notice: getCache, setCache नाही!
//   Booking cache नाही करत — का?
```

**का Booking Cache करत नाही:**

```
Booking data = Per user, real-time sensitive
- माझ्या bookings → तुम्हाला दाखवता येत नाही
- Booking status बदलतो (pending → confirmed → completed)
- Cache करणे = stale status दिसण्याचा risk

Cache करत असते तर:
  User books → confirmed
  User cancels → DB update
  User page refresh → Cache मधून old 'confirmed' दिसतो! ❌
```

**Booking नंतर Related Cache Delete:**

```javascript
exports.createBooking = async (req, res) => {
  // ... DB insert ...
  // नवीन booking → admin stats/reports cache invalid
  // (तुमच्या project मध्ये admin stats cache नाही, पण concept सांगतो)
};
```

---

## 13. Cache Keys चे Naming Pattern

**तुमच्या project मधील pattern:**

```
Format: 'entity:type:identifier'

Fixed keys (एकच value):
  'pooja:categories'         → सगळ्या categories
  'blog:categories'          → blog categories
  'home:data'                → homepage content
  'granth:list'              → granth books list

Dynamic keys (query-based):
  'pooja:list:{json}'        → filter/page combination
  'blog:list:{json}'         → blog filter/page
  'pooja:slug:ganesh-puja'   → individual pooja
  'blog:slug:navratri-puja'  → individual blog post

Pattern groups (wildcard delete):
  'pooja:list:*'   → सगळे pooja list pages
  'pooja:slug:*'   → सगळे pooja detail pages
  'blog:list:*'    → सगळे blog list pages
```

**Namespace का?**

```javascript
// Bad:
redis.set('categories', data)  // कुठल्या categories? Pooja? Blog?
redis.set('list', data)        // कुठला list?

// Good (तुमच्यासारखे):
redis.set('pooja:categories', data)  // Clear!
redis.set('blog:categories', data)   // Different key, same type!
redis.set('pooja:list:{...}', data)
redis.set('blog:list:{...}', data)

// Delete करताना:
delCachePattern('pooja:*')  // फक्त pooja keys delete
delCachePattern('blog:*')   // फक्त blog keys delete
// — mix होत नाहीत!
```

---

## 14. TTL म्हणजे काय?

**TTL = Time To Live**

```
Redis key create झाला → TTL timer सुरू
TTL expire → Key automatically delete!

तुम्हाला manually delete करायला नाही लागत!
```

**तुमच्या project मधील TTLs:**

```
Data Type              TTL            का?
─────────────────────  ─────────────  ────────────────────────────────
pooja:categories       3600s (1hr)    Categories rarely बदलतात
pooja:list:*           1800s (30min)  List कधीतरी update होतो
pooja:slug:*           1800s (30min)  Individual pooja data stable
blog:categories        600s  (10min)  Blog categories बदलतात
blog:list:*            300s  (5min)   Blog जास्त actively publish होतो
blog:slug:*            600s  (10min)  Post content stable
home:data              600s  (10min)  Homepage content बदलतो
granth:list            (no TTL seen)  Admin panel — manual refresh
```

**TTL Logic:**

```
जास्त TTL:
  + कमी DB queries → fast
  - Data stale होण्याचा risk जास्त

कमी TTL:
  + Fresh data
  - जास्त DB queries

Balance:
  Categories → 1hr (rarely change)
  Blog list  → 5min (actively updated)
```

---

## 15. Cache Invalidation — सर्वात Important Concept

**"There are only two hard things in Computer Science:
cache invalidation and naming things." — Phil Karlton**

**Cache Invalidation म्हणजे: जुना cache delete करणे जेव्हा data बदलतो**

**तुमच्या project मधील Strategy:**

```
Write-Through Invalidation:
  1. DB update करा
  2. Related cache delete करा
  3. पुढचा read → cache miss → fresh DB query → cache fill

तुम्ही हेच करतो:
  createPooja → DB insert → delCachePattern('pooja:list:*')
  updatePooja → DB update → delCachePattern('pooja:list:*') + delCachePattern('pooja:slug:*')
  deletePooja → DB delete → delCachePattern('pooja:list:*') + delCachePattern('pooja:slug:*')
```

**Cache Stale होण्याचे Example:**

```
1. User visits /pooja → list cache fill (30 min TTL)
2. Admin नवीन Pooja add करतो
3. Admin createPooja → delCachePattern('pooja:list:*') ← हे important!
4. User refresh करतो → cache miss → fresh DB → नवीन pooja दिसतो ✅

Step 3 नसता तर:
4. User refresh → old cache → नवीन pooja 30 min पर्यंत दिसत नाही ❌
```

---

## 16. Graceful Fallback — Redis नसेल तरी App चालतो

**हे तुमच्या redis.js चे सर्वात smart feature आहे!**

```javascript
// redis.js मधील pattern:

async function getCache(key) {
  if (!redis) return null;  // ← Redis नाही → null
  try {
    // ...
  } catch (_) {
    return null;             // ← Error → null
  }
}

async function setCache(key, data, ttlSeconds) {
  if (!redis) return;       // ← Redis नाही → silently return
  try {
    // ...
  } catch (_) {}            // ← Error → ignore
}
```

**Result:**

```
Redis चालू असेल:    Fast caching ✅
Redis बंद असेल:    DB queries (slower पण working) ✅
Redis crash झाला:  DB queries (no crash) ✅
Redis timeout:     DB queries (no crash) ✅

App NEVER crashes because of Redis!
```

**Controllers मध्ये pattern:**

```javascript
// pooja.controller.js
const cached = await getCache(CAT_KEY);
if (cached) return success(res, cached);  // Redis works → fast

// Redis नाही / cache miss:
const [rows] = await pool.query('SELECT ...');  // DB fallback
await setCache(CAT_KEY, data, CAT_TTL);         // Try to cache (may silently fail)
return success(res, data);
```

---

## 17. Redis Data Structures

**Redis मध्ये 5 main data types आहेत**

**तुम्ही वापरतो: String (simplest)**

```
String:
  SET key value
  GET key
  DEL key
  SET key value EX 3600   ← TTL सकट

तुमचा use:
  SET 'pooja:categories' '[{...}]' EX 3600
  GET 'pooja:categories'
```

**Other types (शिकण्यासाठी):**

```
List:   [ val1, val2, val3 ]        → Queue/Stack
        LPUSH key val               → left add
        RPOP key                    → right remove
        Use case: Job queue, activity feed

Hash:   { field1: val1, field2: val2 }  → Object
        HSET key field value
        HGET key field
        Use case: User session data

Set:    { val1, val2, val3 }        → Unique values
        SADD key val
        SMEMBERS key
        Use case: Tags, unique visitors

Sorted Set: { val: score }          → Ordered set
            ZADD key score val
            ZRANGE key 0 -1
            Use case: Leaderboard, trending posts
```

---

## 18. Redis Commands — Practice

**तुमच्या server वर Redis CLI:**

```bash
# Redis CLI open करा
redis-cli

# ── Basic Commands ──────────────────────────────────────
SET name "Pojjari"          # Save
GET name                    # Read → "Pojjari"
DEL name                    # Delete
EXISTS name                 # 0 or 1

# ── TTL Commands ─────────────────────────────────────────
SET session "abc123" EX 3600   # 1 hour TTL
TTL session                    # किती seconds बाकी? → 3599
PTTL session                   # milliseconds मध्ये
PERSIST session                # TTL remove करा (permanent)

# ── Your Project's Keys बघा ──────────────────────────────
KEYS pooja:*                   # सगळे pooja keys
KEYS blog:*                    # सगळे blog keys
KEYS *                         # सगळे keys (production मध्ये avoid!)

# ── Cache बघा ──────────────────────────────────────────
GET "pooja:categories"         # Cached categories
GET "home:data"                # Cached homepage

# ── Cache manually delete ────────────────────────────────
DEL "pooja:categories"         # Categories cache clear
DEL "home:data"                # Home cache clear

# ── Pattern delete (like delCachePattern) ────────────────
# Redis CLI मध्ये directly नाही होत, script लागतो:
redis-cli KEYS "pooja:list:*" | xargs redis-cli DEL

# ── Stats बघा ──────────────────────────────────────────
INFO memory                    # Memory usage
INFO stats                     # Hit/miss statistics
DBSIZE                         # Total keys count

# ── Exit ────────────────────────────────────────────────
exit
```

**Useful Debug Commands:**

```bash
# App चालू असताना live commands बघा:
redis-cli MONITOR

# Output:
# 1234567890.123456 [0 127.0.0.1:54321] "GET" "pooja:categories"
# 1234567890.234567 [0 127.0.0.1:54321] "SET" "pooja:categories" "[{...}]" "EX" "3600"

# Cache hit rate:
redis-cli INFO stats | grep keyspace
# keyspace_hits:1523
# keyspace_misses:45
# Hit rate = 1523/(1523+45) = 97%! 🎉
```

---

## 19. Performance Impact — Real Numbers

**तुमच्या App साठी estimate:**

```
Scenario: 100 users /api/pooja/categories मागतात (without Redis):
  100 requests × 50ms MySQL = 5000ms total DB load

Scenario: 100 users /api/pooja/categories मागतात (with Redis):
  1st request: Redis miss → MySQL 50ms → Redis save
  2-100 requests: Redis hit → 0.5ms each
  Total: 50ms + 99 × 0.5ms = 99.5ms DB load
  Savings: 4900ms! 98% reduction!

Real-world impact on DigitalOcean $6 droplet:
  Without Redis: DB connection pool भरतो → queue → timeouts
  With Redis:    DB connections कमी → stable → fast
```

**Cache Hit Rate:**

```
Cache Hit = "Redis मधून मिळाला"
Cache Miss = "DB मधून fetch केला"

Good hit rate: >80%
Excellent:     >95%

तुमच्या pooja:categories साठी:
  1st request: MISS (DB)
  पुढचे 3600 seconds (1hr): HIT (Redis) — कितीही requests!
  
  जर दर minute 10 requests = 600 requests per hour
  Hit rate = 599/600 = 99.8%! 🎉
```

---

## 20. Redis Production Setup

**तुमच्या DigitalOcean Server वर:**

```bash
# ── Install ──────────────────────────────────────────────
apt-get update
apt-get install -y redis-server

# ── Config ───────────────────────────────────────────────
nano /etc/redis/redis.conf

# बदला:
bind 127.0.0.1           # Only localhost (external access नाही!)
requirepass StrongRedisPassword@2024   # Password set करा
maxmemory 256mb          # Max 256MB RAM use करा
maxmemory-policy allkeys-lru  # RAM भरला तर least-recently-used delete

# ── Start ────────────────────────────────────────────────
systemctl enable redis-server
systemctl start redis-server
systemctl status redis-server   # active (running) दिसावं

# ── Test ─────────────────────────────────────────────────
redis-cli -a StrongRedisPassword@2024 ping
# → PONG ✅
```

**Backend .env Update:**

```bash
# backend/env मध्ये add करा:
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=StrongRedisPassword@2024
```

**Verify App uses Redis:**

```bash
# PM2 logs बघा:
pm2 logs pojjari-backend

# Redis CLI मध्ये बघा:
redis-cli -a StrongRedisPassword@2024 KEYS "*"
# pooja:categories
# home:data
# blog:categories
# ... keys दिसल्या म्हणजे app Redis वापरतोय! ✅
```

---

## Summary — Redis तुमच्या App मध्ये काय करतो

```
┌──────────────────────────────────────────────────────────┐
│                    Redis चे Role                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Public pages cache करणे:                               │
│  - Homepage (10 min)                                     │
│  - Pooja categories (1 hour)                             │
│  - Pooja list pages (30 min)                             │
│  - Individual pooja details (30 min)                     │
│  - Blog list + posts (5-10 min)                          │
│  - Granth book list                                      │
│                                                          │
│  DB load कमी करणे:                                       │
│  - 98%+ requests Redis मधून → MySQL ला कमी load          │
│  - $6 droplet वर हजारो users handle होतात                │
│                                                          │
│  Graceful degradation:                                   │
│  - Redis down → App automatically DB fallback            │
│  - Zero code change लागत नाही                           │
│  - Users ला फरक जाणवत नाही (slightly slower)           │
│                                                          │
│  Cache invalidation:                                     │
│  - Write (create/update/delete) → related cache delete   │
│  - Fresh data guaranteed after any mutation              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

**Key Takeaways:**

```
1. Redis = RAM database → 100x faster than MySQL
2. getCache → setCache → delCache pattern सगळीकडे same
3. TTL = automatic expiry → manual delete नाही लागत
4. Cache invalidation = Write झाल्यावर related cache delete
5. Graceful fallback = Redis नसेल तरी app चालतो
6. SCAN not KEYS = production safe pattern delete
7. JSON.stringify/parse = Redis string ↔ JS object conversion
8. Namespace keys = 'entity:type:id' format → organized
```
