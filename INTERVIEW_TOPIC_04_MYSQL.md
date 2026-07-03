# Topic 04: MySQL + SQL Deep Dive
> Relational DB powering all Pojjari data — bookings, pujaris, samagri, blogs

---

## 4.1 Pojjari Database Overview

```sql
-- Core tables in pojjari_db
users          -- pujari, user, admin accounts
pujaris        -- pujari profiles (linked to users)
bookings       -- pooja booking records
categories     -- ganesh puja, satyanarayan, etc.
samagri        -- pooja materials list
blogs          -- blog posts
contact_us     -- contact form submissions
halls          -- hall finder feature
password_reset_tokens  -- forgot password
```

---

## 4.2 Basic SQL — CRUD

```sql
-- CREATE
INSERT INTO bookings (user_id, pujari_id, date, time, pooja_type, status)
VALUES (42, 7, '2024-01-15', '10:00:00', 'Ganesh Puja', 'pending');

-- READ
SELECT b.id, b.date, p.name AS pujari_name, u.name AS user_name
FROM bookings b
INNER JOIN pujaris p ON b.pujari_id = p.id
INNER JOIN users u   ON b.user_id   = u.id
WHERE b.status = 'confirmed'
ORDER BY b.date DESC
LIMIT 20 OFFSET 0;

-- UPDATE
UPDATE bookings SET status = 'confirmed' WHERE id = 42 AND pujari_id = 7;

-- DELETE
DELETE FROM bookings WHERE id = 42;
```

---

## 4.3 JOINs — Most Asked SQL Topic

### Types of JOINs

```sql
-- INNER JOIN: Only rows that match on BOTH sides
SELECT u.name, b.date
FROM users u
INNER JOIN bookings b ON u.id = b.user_id;
-- Result: Only users WHO HAVE bookings

-- LEFT JOIN: All rows from LEFT table + matching from right (NULL if no match)
SELECT u.name, b.date
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id;
-- Result: ALL users, even those with NO bookings (b.date = NULL)

-- RIGHT JOIN: All rows from RIGHT table + matching from left
-- (rarely used, just flip LEFT JOIN)

-- SELF JOIN: Join table with itself
SELECT a.name AS pujari, b.name AS mentor
FROM pujaris a
LEFT JOIN pujaris b ON a.mentor_id = b.id;
```

### When to use which?
- **INNER JOIN**: "Show me only complete matches" — bookings WITH pujari + user both present
- **LEFT JOIN**: "Show me all X, whether or not they have Y" — all pujaris, even without bookings
- **RIGHT JOIN**: Very rarely needed — just flip the table order and use LEFT JOIN

### Multi-table JOIN (Pojjari admin query)
```sql
SELECT
  b.id,
  b.date,
  b.status,
  p.name      AS pujari_name,
  p.mobile    AS pujari_mobile,
  u.name      AS user_name,
  u.email     AS user_email,
  c.name      AS category
FROM bookings b
INNER JOIN pujaris p   ON b.pujari_id  = p.id
INNER JOIN users u     ON b.user_id    = u.id
INNER JOIN categories c ON b.category_id = c.id
WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY b.created_at DESC;
```

---

## 4.4 Indexes — Performance

### What is an Index?
A B-Tree data structure stored alongside the table that allows fast lookup without scanning all rows.

```
Without index: SELECT * FROM users WHERE email = 'test@example.com'
  → Full table scan — check every row — O(n)
  → 100,000 rows = 100,000 comparisons

With index on email:
  → B-Tree lookup — O(log n)
  → 100,000 rows = ~17 comparisons
```

### Types of Indexes
```sql
-- Primary Key (unique, automatically indexed, clustered)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT
);

-- Unique Index (prevent duplicates + fast lookup)
CREATE UNIQUE INDEX idx_email ON users(email);

-- Regular Index (fast lookup on non-unique column)
CREATE INDEX idx_status ON bookings(status);

-- Composite Index (useful for queries filtering on multiple columns)
CREATE INDEX idx_pujari_date ON bookings(pujari_id, date);
-- Optimizes: WHERE pujari_id = ? AND date = ?
-- Also optimizes: WHERE pujari_id = ? (leftmost column)
-- Does NOT optimize: WHERE date = ? alone
```

### When to add index?
- Columns in `WHERE` clauses that filter on large tables
- `JOIN` columns (foreign keys)
- `ORDER BY` columns with many distinct values
- **Don't** over-index: every index slows down INSERT/UPDATE

---

## 4.5 WHERE vs HAVING

```sql
-- WHERE filters BEFORE grouping (on raw rows)
SELECT pujari_id, COUNT(*) AS booking_count
FROM bookings
WHERE status = 'confirmed'      -- filters rows first
GROUP BY pujari_id;

-- HAVING filters AFTER grouping (on aggregated results)
SELECT pujari_id, COUNT(*) AS booking_count
FROM bookings
GROUP BY pujari_id
HAVING COUNT(*) > 5;            -- filters groups with more than 5 bookings

-- Combined: WHERE then GROUP BY then HAVING
SELECT pujari_id, COUNT(*) AS booking_count
FROM bookings
WHERE status = 'confirmed'      -- filter individual rows
GROUP BY pujari_id
HAVING COUNT(*) >= 3            -- filter grouped results
ORDER BY booking_count DESC;
```

**Rule:** `WHERE` cannot use aggregate functions (`COUNT`, `SUM`, `AVG`). Use `HAVING` for those.

---

## 4.6 ACID Properties

| Property | Meaning | Example |
|----------|---------|---------|
| **Atomicity** | All or nothing — transaction either fully completes or fully rolls back | Transfer money: debit + credit both happen, or neither |
| **Consistency** | DB goes from one valid state to another | Foreign key constraints enforced |
| **Isolation** | Concurrent transactions don't interfere | Two users booking same pujari simultaneously |
| **Durability** | Once committed, data survives crashes | Crash after commit → data still there |

### Transactions in Pojjari
```js
// Creating a booking + deducting pujari availability — must both succeed or both fail
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();

  await conn.query(
    'INSERT INTO bookings (user_id, pujari_id, date) VALUES (?,?,?)',
    [userId, pujariId, date]
  );
  await conn.query(
    'UPDATE pujari_availability SET is_booked = 1 WHERE pujari_id = ? AND date = ?',
    [pujariId, date]
  );

  await conn.commit(); // both succeed → commit
} catch (err) {
  await conn.rollback(); // anything fails → rollback both
  throw err;
} finally {
  conn.release();
}
```

---

## 4.7 N+1 Problem — Performance Bug

### The Problem
```js
// WRONG: N+1 queries — 1 for list + N for each item
const [bookings] = await pool.query('SELECT * FROM bookings');  // 1 query

for (const booking of bookings) {
  const [pujari] = await pool.query(  // N more queries!
    'SELECT * FROM pujaris WHERE id = ?', [booking.pujari_id]
  );
  booking.pujari = pujari[0];
}
// 100 bookings = 101 queries to DB
```

### The Fix — JOIN in one query
```js
// CORRECT: 1 query with JOIN
const [bookings] = await pool.query(`
  SELECT b.*, p.name AS pujari_name, p.mobile AS pujari_mobile
  FROM bookings b
  INNER JOIN pujaris p ON b.pujari_id = p.id
`);
// 1 query, regardless of how many bookings
```

---

## 4.8 SQL Injection — Prevention

```js
// VULNERABLE — never do this
const email = req.body.email; // could be: ' OR '1'='1
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Attacker sends: ' OR '1'='1' --
// Query becomes: SELECT * FROM users WHERE email = '' OR '1'='1' --'
// Returns ALL users!

// SAFE — parameterized queries (Pojjari uses this everywhere)
const [rows] = await pool.query(
  'SELECT * FROM users WHERE email = ?',
  [req.body.email]   // value is escaped, treated as literal string
);
// mysql2 library handles escaping — ? is a placeholder
```

**mysql2 library automatically escapes `?` parameters.** Never concatenate user input into SQL strings.

---

## 4.9 Useful Query Patterns

```sql
-- Pagination
SELECT * FROM pujaris ORDER BY name LIMIT 10 OFFSET 20;  -- page 3, 10 per page

-- Count with condition
SELECT COUNT(*) AS total FROM bookings WHERE status = 'pending';

-- Date range (last 30 days)
SELECT * FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Aggregate per group
SELECT status, COUNT(*) AS count FROM bookings GROUP BY status;

-- Check if exists
SELECT EXISTS(SELECT 1 FROM users WHERE email = ?) AS email_taken;

-- Upsert (Insert or Update)
INSERT INTO pujari_availability (pujari_id, date, is_booked)
VALUES (7, '2024-01-15', 1)
ON DUPLICATE KEY UPDATE is_booked = 1;

-- Full text search (Pojjari pujari search)
SELECT * FROM pujaris
WHERE name LIKE CONCAT('%', ?, '%')
   OR category LIKE CONCAT('%', ?, '%');
```

---

## Interview Q&A

**Q: INNER JOIN vs LEFT JOIN — कधी काय?**
> INNER JOIN: फक्त दोन्ही tables मध्ये match असलेले rows — "कोणत्या users नी bookings केल्या?"
> LEFT JOIN: Left table चे सगळे rows + matching right rows (match नसेल तर NULL) — "सगळे pujaris, whether or not त्यांना bookings आहेत."
> Pojjari admin dashboard: bookings report साठी INNER JOIN (bookings + pujari + user सगळे present असायला हवेत). All pujaris list साठी LEFT JOIN with booking count.

**Q: WHERE vs HAVING**
> WHERE = GROUP BY आधी filter — individual rows filter करतो. HAVING = GROUP BY नंतर filter — grouped/aggregated results filter करतो. `WHERE COUNT(*) > 5` error येईल, `HAVING COUNT(*) > 5` correct.

**Q: Index म्हणजे काय? कधी add करतो?**
> Index म्हणजे B-Tree data structure जो columns वर fast lookup enable करतो. Full table scan O(n) ऐवजी O(log n). WHERE clause मधले columns, JOIN columns (foreign keys), ORDER BY columns वर index लावतो. Over-indexing नको — INSERT/UPDATE slow होतो कारण indexes update होतात.

**Q: ACID properties — सांगा**
> A=Atomicity (all or nothing), C=Consistency (DB valid state ला valid state), I=Isolation (concurrent transactions interfere नाही), D=Durability (commit झाल्यावर crash ला survive). Pojjari booking + availability update — transaction मध्ये दोन्ही एकत्र commit किंवा दोन्ही rollback.

**Q: N+1 problem — म्हणजे काय, कसं solve?**
> Loop मध्ये प्रत्येक item साठी एक DB query. 100 bookings असतील तर 101 queries — slow. Fix: JOIN वापरून एकाच query मध्ये सगळं आणतो. ORM वापरत असाल तर eager loading / include statements.

**Q: SQL Injection कसं prevent करतो?**
> Parameterized queries / prepared statements — user input directly query मध्ये concatenate करत नाही. `pool.query('SELECT * FROM users WHERE email = ?', [email])` — mysql2 library automatically escape करतो. ORM वापरत असाल तर automatically protected.

**Q: Composite index म्हणजे काय?**
> Multiple columns वर एकत्र index. `CREATE INDEX idx_pujari_date ON bookings(pujari_id, date)`. Leftmost prefix rule: `WHERE pujari_id = ?` → index uses होतो, `WHERE pujari_id = ? AND date = ?` → index uses होतो, `WHERE date = ?` alone → index uses होत नाही.

---

## Pojjari Project Connection

| Feature | SQL Concept |
|---------|------------|
| Booking creation | `INSERT` + Transaction |
| Booking list with names | Multi-table `INNER JOIN` |
| All pujaris + booking count | `LEFT JOIN` + `GROUP BY` + `COUNT` |
| Admin dashboard stats | `COUNT`, `SUM`, `GROUP BY` |
| Pujari search | `LIKE %search%` |
| Pagination | `LIMIT ? OFFSET ?` |
| Login | `WHERE email = ?` — parameterized |
| Email unique check | `UNIQUE INDEX` on email |

---

## Summary Table

| Concept | Key Point |
|---------|-----------|
| INNER JOIN | Match both tables — excludes non-matches |
| LEFT JOIN | All of left + nullable right |
| Index | B-Tree for fast O(log n) lookup |
| Composite Index | Multi-column — leftmost prefix rule |
| WHERE | Filter before GROUP BY |
| HAVING | Filter after GROUP BY — use with aggregates |
| ACID | Atomicity, Consistency, Isolation, Durability |
| Transaction | `BEGIN` → queries → `COMMIT` or `ROLLBACK` |
| N+1 Problem | Loop queries → fix with JOIN |
| SQL Injection | Parameterized queries — never concatenate |
