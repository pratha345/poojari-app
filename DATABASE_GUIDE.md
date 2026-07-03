# Database Guide — Pojjari MySQL Schema
## Complete Table Reference with Relations

> Source: `backend/src/config/schema.sql` + migration files
> Database: `pojjari_db` | Charset: `utf8mb4` (Marathi Unicode)
> Host: `159.89.167.218:3306`

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Table 01 — users](#2-table-01--users)
3. [Table 02 — pujari_profiles](#3-table-02--pujari_profiles)
4. [Table 03 — pooja_categories](#4-table-03--pooja_categories)
5. [Table 04 — poojas](#5-table-04--poojas)
6. [Table 05 — samagri_items](#6-table-05--samagri_items)
7. [Table 06 — bookings](#7-table-06--bookings)
8. [Table 07 — reviews](#8-table-07--reviews)
9. [Table 08 — blog_posts](#9-table-08--blog_posts)
10. [Table 09 — home_content + home_slider](#10-table-09--home_content--home_slider)
11. [Table 10 — tenants](#11-table-10--tenants)
12. [Table 11 — halls](#12-table-11--halls)
13. [Table 12 — contact_inquiries](#13-table-12--contact_inquiries)
14. [Table 13 — support_tickets](#14-table-13--support_tickets)
15. [ER Diagram — Relations](#15-er-diagram--relations)
16. [Useful Queries](#16-useful-queries)

---

## 1. Database Overview

```
pojjari_db
│
├── Core User System
│   ├── users                    ← सगळे users (user/pujari/admin)
│   └── pujari_profiles          ← पुजाऱ्यांचे detailed profile
│
├── Pooja System
│   ├── pooja_categories         ← गृहपूजा, हवन, कथा etc.
│   ├── poojas                   ← Individual poojas with price
│   └── samagri_items            ← प्रत्येक पूजेसाठी लागणारे साहित्य
│
├── Booking System
│   ├── bookings                 ← User → Pooja booking
│   └── reviews                  ← Booking नंतर rating/review
│
├── Content System
│   ├── blog_posts               ← Blog articles
│   ├── blog_ratings             ← Blog star ratings
│   ├── home_content             ← Homepage hero content
│   └── home_slider              ← Homepage slider images
│
├── Multi-Tenant System
│   ├── tenants                  ← SaaS tenants (multiple cities)
│   └── tenant_subscriptions     ← Plan/expiry
│
├── Halls System
│   └── halls                    ← Marriage/event halls nearby
│
└── Misc
    ├── contact_inquiries        ← Contact form submissions
    ├── support_tickets          ← User support tickets
    ├── push_subscriptions       ← Web push notification tokens
    └── panchang_ratings         ← Panchang helpful/not helpful votes
```

---

## 2. Table 01 — users

**Purpose:** सगळ्या users चा master table — customer, pujari, admin सगळे येथे.

```sql
CREATE TABLE users (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  name         VARCHAR(100) NOT NULL,
  phone        VARCHAR(15)  UNIQUE NOT NULL,   -- Primary identifier (login)
  email        VARCHAR(100) UNIQUE,            -- Optional (Google login)
  password     VARCHAR(255),                   -- bcrypt hash (nullable for Google users)
  role         ENUM('user','pujari','admin') DEFAULT 'user',
  otp_code     VARCHAR(6),                     -- Temporary OTP (expires)
  otp_expiry   DATETIME,                       -- OTP expiry time
  is_verified  BOOLEAN DEFAULT FALSE,          -- Phone OTP verified?
  is_active    BOOLEAN DEFAULT TRUE,           -- Account active?
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Key Points:**
- `phone` = Primary login identifier (not email)
- `password` = bcrypt hash (`$2a$10$...`) — never plain text
- `role` = तीन types: `user` (customer), `pujari` (priest), `admin`
- `otp_code` = Fast2SMS OTP — 6 digits, temporary
- Google login users: `password = NULL`, `is_verified = TRUE`

**Indexes:**
```sql
UNIQUE (phone)   -- Login by phone
UNIQUE (email)   -- No duplicate emails
```

**Example Rows:**
```
id | name        | phone      | role    | is_verified
1  | प्रशासक    | 9307720459 | admin   | TRUE
2  | Rahul Patil | 9876543210 | user    | TRUE
3  | Ganesh Joshi| 9123456789 | pujari  | TRUE
```

---

## 3. Table 02 — pujari_profiles

**Purpose:** `users` table मध्ये pujari role असलेल्यांचे detailed profile.

```sql
CREATE TABLE pujari_profiles (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_id           INT NOT NULL UNIQUE,          -- users.id (1:1 relation)
  full_name         VARCHAR(100) NOT NULL,
  experience_yrs    INT DEFAULT 0,
  city              VARCHAR(100),
  district          VARCHAR(100),
  state             VARCHAR(100) DEFAULT 'महाराष्ट्र',
  address           TEXT,
  languages         JSON,                         -- ["मराठी","हिंदी","संस्कृत"]
  photo_url         VARCHAR(500),                 -- /uploads/pujari-xxx.webp
  certificate_url   VARCHAR(500),                 -- Certificate image
  bio               TEXT,
  brahmin_tradition VARCHAR(100),                 -- ऋग्वेदी, यजुर्वेदी etc.
  specializations   JSON,                         -- [category_ids]
  status            ENUM('pending','approved','rejected') DEFAULT 'pending',
  rejection_reason  TEXT,
  avg_rating        DECIMAL(3,2) DEFAULT 0.00,    -- 0.00 to 5.00
  total_reviews     INT DEFAULT 0,
  total_bookings    INT DEFAULT 0,
  is_available      BOOLEAN DEFAULT TRUE,
  lat               DECIMAL(10,7),                -- GPS latitude (Nominatim geocode)
  lng               DECIMAL(10,7),                -- GPS longitude
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Key Points:**
- `user_id UNIQUE` = एक user = एकच pujari profile (1:1)
- `status` = Admin approval workflow: `pending → approved/rejected`
- `lat/lng` = OpenStreetMap Nominatim geocoding — nearby search साठी
- `languages` = JSON array: `["मराठी", "हिंदी", "संस्कृत"]`
- `brahmin_tradition` = ऋग्वेदी, यजुर्वेदी, सामवेदी, अथर्ववेदी

**Status Flow:**
```
User registers as pujari
        ↓
  status = 'pending'
        ↓
Admin reviews → approve/reject
        ↓
  status = 'approved' → पुजारी booking घेऊ शकतो
  status = 'rejected' → rejection_reason fill होतो
```

---

## 4. Table 03 — pooja_categories

**Purpose:** पूजांचे groups — गृहपूजा, हवन, कथा इत्यादी.

```sql
CREATE TABLE pooja_categories (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  name_mr      VARCHAR(100) NOT NULL,    -- मराठी नाव
  name_en      VARCHAR(100),             -- English name
  slug         VARCHAR(100) UNIQUE NOT NULL,  -- URL: gruh-pooja
  icon_url     VARCHAR(500),            -- Category icon
  description  TEXT,
  sort_order   INT DEFAULT 0,           -- Display order
  is_active    BOOLEAN DEFAULT TRUE
);
```

**Seed Data (8 categories):**
```
id | name_mr           | slug           | sort_order
1  | गृह पूजा          | gruh-pooja     | 1
2  | हवन / जाप         | havan-jaap     | 2
3  | कथा / नित्य पूजा  | katha-nitya    | 3
4  | पित्रुश्राद्ध      | pitru-shraddha | 4
5  | उत्सव पूजा        | utsav-pooja    | 5
6  | वास्तू पूजा        | vastu-pooja    | 6
7  | आध्यात्मिक सेवा   | adhyatmik-seva | 7
8  | लग्न हॉल बुकिंग   | lagn-hall      | 8
```

---

## 5. Table 04 — poojas

**Purpose:** Individual poojas — name, price, description, steps.

```sql
CREATE TABLE poojas (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  category_id   INT NOT NULL,
  tenant_id     INT,                           -- Multi-tenant support
  name_mr       VARCHAR(200) NOT NULL,
  name_en       VARCHAR(200),
  slug          VARCHAR(200) UNIQUE NOT NULL,  -- satyanarayan-pooja
  description   TEXT,
  short_desc    VARCHAR(500),
  price         DECIMAL(10,2) NOT NULL,
  samagri_price DECIMAL(10,2) DEFAULT 0,       -- Samagri extra charge
  duration_hrs  DECIMAL(4,2) DEFAULT 2.00,
  image_url     VARCHAR(500),                  -- /uploads/poojas/xxx.webp
  steps         JSON,                          -- ["चरण १:...", "चरण २:..."]
  is_active     BOOLEAN DEFAULT TRUE,
  is_featured   BOOLEAN DEFAULT FALSE,
  views         INT DEFAULT 0,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES pooja_categories(id)
);
```

**Key Points:**
- `slug` = URL-friendly name: `ganesh-puja`, `satyanarayan-pooja`
- `steps` = JSON array of ritual steps (AI-generated via Groq)
- `price` = Pujari fee; `samagri_price` = Materials extra
- `is_featured` = Homepage वर दाखवायचे का?
- `views` = Page view counter (analytics)

**Price Calculation (Booking):**
```
total_amount  = pooja.price
platform_fee  = total_amount × 5%   (Pojjari's commission)
pujari_amount = total_amount - platform_fee
```

---

## 6. Table 05 — samagri_items

**Purpose:** प्रत्येक पूजेसाठी लागणाऱ्या वस्तूंची यादी.

```sql
CREATE TABLE samagri_items (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  pooja_id   INT NOT NULL,
  name_mr    VARCHAR(200) NOT NULL,    -- काळे तीळ
  name_en    VARCHAR(200),             -- Black Sesame
  quantity   VARCHAR(100),             -- ५०० ग्रॅम
  unit       VARCHAR(50),              -- gram, piece, bunch
  note       VARCHAR(255),             -- Special instructions
  sort_order INT DEFAULT 0,
  FOREIGN KEY (pooja_id) REFERENCES poojas(id) ON DELETE CASCADE
);
```

**Example (Satyanarayan Pooja):**
```
pooja_id | name_mr      | quantity    | sort_order
1        | रवा (सुजी)  | ५०० ग्रॅम  | 1
1        | साखर         | २५० ग्रॅम  | 2
1        | केळी         | ५ नग        | 3
1        | पंचामृत      | १ संच       | 4
1        | तुळशीपत्र    | १ मूठ       | 5
```

---

## 7. Table 06 — bookings

**Purpose:** User → Pooja → Pujari booking records.

```sql
CREATE TABLE bookings (
  id                 INT PRIMARY KEY AUTO_INCREMENT,
  booking_code       VARCHAR(20) UNIQUE NOT NULL,  -- POJ1A2B3C
  user_id            INT NOT NULL,
  pooja_id           INT NOT NULL,
  pujari_id          INT,                           -- Admin assigns after booking
  preferred_pujari_id INT,                          -- User preference
  booking_date       DATE NOT NULL,
  booking_time       TIME NOT NULL,
  address            TEXT NOT NULL,
  city               VARCHAR(100),
  district           VARCHAR(100),
  special_notes      TEXT,
  total_amount       DECIMAL(10,2) NOT NULL,
  platform_fee       DECIMAL(10,2) DEFAULT 0,
  pujari_amount      DECIMAL(10,2) DEFAULT 0,
  status             ENUM('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
  payment_status     ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
  payment_method     ENUM('online','cash'),
  payment_id         VARCHAR(255),                  -- Razorpay payment_id
  razorpay_order_id  VARCHAR(255),
  cancelled_by       ENUM('user','pujari','admin'),
  cancel_reason      TEXT,
  tenant_id          INT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id),
  FOREIGN KEY (pooja_id)  REFERENCES poojas(id),
  FOREIGN KEY (pujari_id) REFERENCES pujari_profiles(id)
);
```

**Booking Status Flow:**
```
User books
    ↓
status = 'pending'
    ↓
Admin assigns pujari → status = 'confirmed'
    ↓
Pooja day arrives → status = 'in_progress'
    ↓
Pooja complete → status = 'completed'
    ↓
User submits review

OR: Any stage → status = 'cancelled' (with cancel_reason)
```

**Payment Flow:**
```
Online (Razorpay):
  payment_status = 'unpaid'
  → createPaymentOrder → razorpay_order_id set
  → user pays → verifyPayment → payment_status = 'paid'
  → payment_id = rzp_live_xxx (Razorpay reference)

Cash:
  payment_method = 'cash'
  payment_status = 'unpaid'
  → Pujari collects → admin marks → payment_status = 'paid'
```

**`booking_code` Format:**
```javascript
const genCode = () => 'POJ' + Date.now().toString(36).toUpperCase().slice(-6);
// → 'POJ1A2B3C', 'POJX7K9M2'
// Always starts with 'POJ' — easy to identify
```

---

## 8. Table 07 — reviews

**Purpose:** Booking complete झाल्यावर user ची rating + comment.

```sql
CREATE TABLE reviews (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  booking_id  INT NOT NULL UNIQUE,          -- एक booking = एकच review
  user_id     INT NOT NULL,
  pujari_id   INT NOT NULL,
  pooja_id    INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  is_approved BOOLEAN DEFAULT FALSE,        -- Admin approval needed
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (pujari_id)  REFERENCES pujari_profiles(id),
  FOREIGN KEY (pooja_id)   REFERENCES poojas(id)
);
```

**Key Points:**
- `booking_id UNIQUE` = एक booking → एकच review (duplicate prevent)
- `is_approved = FALSE` = Admin review करेपर्यंत hidden
- Admin approve केल्यावरच public profile वर दिसतो
- Review submit केल्यावर `pujari_profiles.avg_rating` update होतो

---

## 9. Table 08 — blog_posts

**Purpose:** Pojjari blog — articles, tutorials, spiritual content.

```sql
CREATE TABLE blog_posts (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  title        VARCHAR(500) NOT NULL,
  slug         VARCHAR(500) UNIQUE NOT NULL,
  excerpt      TEXT,                           -- Short description
  content      LONGTEXT NOT NULL,              -- Full HTML content
  image_url    VARCHAR(500),
  author_name  VARCHAR(100) DEFAULT 'पूजारी टीम',
  category     VARCHAR(100) DEFAULT 'पूजा मार्गदर्शन',
  tags         JSON,                           -- ["गणेश", "पूजा", "विधी"]
  read_time    INT DEFAULT 5,                  -- Minutes to read
  views        INT DEFAULT 0,
  avg_rating   DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  is_published TINYINT(1) DEFAULT 0,          -- 0=draft, 1=published
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blog ratings (star rating — no login needed)
CREATE TABLE blog_ratings (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  blog_post_id INT NOT NULL,
  session_id   VARCHAR(100) NOT NULL,          -- Browser session (no login)
  rating       TINYINT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_session_post (blog_post_id, session_id),
  FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE
);
```

**Key Points:**
- `is_published` = 0 (draft) or 1 (live) — Admin toggle करतो
- `slug` = SEO-friendly URL: `satyanarayan-pooja-kashi-karavi`
- `session_id` = Anonymous rating (login नाही लागत)
- `abhyasak` role blog create/edit करू शकतो (admin शिवाय)

---

## 10. Table 09 — home_content + home_slider

**Purpose:** Admin पॅनेल मधून homepage content manage करणे.

```sql
CREATE TABLE home_content (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  title           VARCHAR(500),          -- Hero heading
  subtitle        VARCHAR(500),          -- Sub heading
  description     TEXT,                  -- Hero description
  button_text_1   VARCHAR(100),
  button_link_1   VARCHAR(500),
  button_text_2   VARCHAR(100),
  button_link_2   VARCHAR(500),
  stats_pujaris   INT DEFAULT 0,         -- "500+ पुजारी"
  stats_poojas    INT DEFAULT 0,         -- "100+ पूजा"
  stats_bookings  INT DEFAULT 0,         -- "5000+ बुकिंग"
  stats_cities    INT DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE home_slider (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  image_url    VARCHAR(500) NOT NULL,    -- /uploads/slider/xxx.webp
  title        VARCHAR(200),
  subtitle     VARCHAR(200),
  link         VARCHAR(500),
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Redis Cache:**
```
Key: 'home:data'
TTL: 600 seconds (10 min)
Contains: { content: {...}, sliders: [...] }
```

---

## 11. Table 10 — tenants

**Purpose:** Multi-tenant SaaS — multiple cities/organizations.

```sql
CREATE TABLE tenants (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(200) NOT NULL,       -- "पुणे पूजारी सेवा"
  slug          VARCHAR(100) UNIQUE NOT NULL, -- 'pune', 'nashik'
  domain        VARCHAR(200),                -- custom domain
  logo_url      VARCHAR(500),
  contact_email VARCHAR(200),
  contact_phone VARCHAR(20),
  plan          ENUM('free','basic','pro') DEFAULT 'free',
  plan_expires_at DATETIME,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**How Multi-Tenancy Works:**
```
Request: nashik.pojjari.com/api/pooja
  ↓
tenant.middleware.js reads subdomain 'nashik'
  ↓
DB lookup: SELECT * FROM tenants WHERE slug = 'nashik'
  ↓
req.tenantId = found tenant's id
  ↓
Queries filter: WHERE tenant_id = req.tenantId
  ↓
Nashik users only see Nashik poojas/pujaris
```

---

## 12. Table 11 — halls

**Purpose:** Marriage halls, event venues nearby search.

```sql
CREATE TABLE halls (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id    INT,
  name         VARCHAR(200) NOT NULL,
  address      TEXT,
  city         VARCHAR(100),
  district     VARCHAR(100),
  state        VARCHAR(100) DEFAULT 'Maharashtra',
  pincode      VARCHAR(10),
  lat          DECIMAL(10,7),             -- GPS (Haversine search)
  lng          DECIMAL(10,7),
  capacity     INT,                       -- Number of guests
  price_per_day DECIMAL(10,2),
  amenities    JSON,                      -- ["AC","Parking","Catering"]
  images       JSON,                      -- ["/uploads/halls/xxx.webp"]
  contact_name VARCHAR(100),
  contact_phone VARCHAR(20),
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Nearby Search (Haversine Formula):**
```sql
-- GET /api/halls/nearby?lat=18.52&lng=73.86&radius=10
SELECT *,
  (6371 * acos(
    cos(radians(?)) * cos(radians(lat)) *
    cos(radians(lng) - radians(?)) +
    sin(radians(?)) * sin(radians(lat))
  )) AS distance
FROM halls
WHERE is_active = TRUE
HAVING distance <= ?
ORDER BY distance;
-- Results: halls within radius km, sorted nearest first
```

---

## 13. Table 12 — contact_inquiries

```sql
CREATE TABLE contact_inquiries (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100),
  phone      VARCHAR(15),
  subject    VARCHAR(200),
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 14. Table 13 — support_tickets

```sql
CREATE TABLE support_tickets (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT,
  name        VARCHAR(100),
  email       VARCHAR(100),
  phone       VARCHAR(20),
  category    VARCHAR(100),              -- booking, payment, technical
  subject     VARCHAR(200) NOT NULL,
  message     TEXT NOT NULL,
  status      ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
  priority    ENUM('low','medium','high') DEFAULT 'medium',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 15. ER Diagram — Relations

```
users (1) ──────── (1) pujari_profiles
  │                         │
  │                         │ (assigns to)
  │                         ▼
  │ (creates)          bookings ──── (1) ──── (1) reviews
  └──────────────────▶    │
                          │ (for)
                     poojas (N)
                          │
                    pooja_categories (1)
                          │
                    samagri_items (N)


tenants (1) ──── (N) poojas
         (1) ──── (N) halls
         (1) ──── (N) pujari_profiles (tenant-specific)


blog_posts (1) ──── (N) blog_ratings

home_content   (standalone)
home_slider    (standalone)
contact_inquiries (standalone)
support_tickets ──── (N) users (optional)
```

**Foreign Key Summary:**
```
pujari_profiles.user_id      → users.id         (CASCADE DELETE)
pujari_specializations.pujari_id → pujari_profiles.id
bookings.user_id             → users.id
bookings.pooja_id            → poojas.id
bookings.pujari_id           → pujari_profiles.id
reviews.booking_id           → bookings.id       (UNIQUE — 1:1)
reviews.user_id              → users.id
reviews.pujari_id            → pujari_profiles.id
reviews.pooja_id             → poojas.id
samagri_items.pooja_id       → poojas.id         (CASCADE DELETE)
poojas.category_id           → pooja_categories.id (RESTRICT)
blog_ratings.blog_post_id    → blog_posts.id     (CASCADE DELETE)
halls.tenant_id              → tenants.id
```

---

## 16. Useful Queries

```sql
-- सगळे pending pujaris बघा
SELECT u.name, u.phone, pp.city, pp.experience_yrs, pp.created_at
FROM pujari_profiles pp
JOIN users u ON pp.user_id = u.id
WHERE pp.status = 'pending'
ORDER BY pp.created_at DESC;

-- Today's bookings
SELECT b.booking_code, u.name AS user_name, u.phone,
       p.name_mr AS pooja_name, b.booking_time, b.address, b.status
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN poojas p ON b.pooja_id = p.id
WHERE b.booking_date = CURDATE()
ORDER BY b.booking_time;

-- Revenue this month
SELECT
  SUM(total_amount) AS total_revenue,
  SUM(platform_fee) AS pojjari_earnings,
  COUNT(*) AS total_bookings
FROM bookings
WHERE status = 'completed'
  AND MONTH(created_at) = MONTH(CURDATE())
  AND YEAR(created_at) = YEAR(CURDATE());

-- Top rated pujaris
SELECT pp.full_name, pp.city, pp.avg_rating, pp.total_reviews, pp.total_bookings
FROM pujari_profiles pp
WHERE pp.status = 'approved' AND pp.avg_rating > 0
ORDER BY pp.avg_rating DESC, pp.total_reviews DESC
LIMIT 10;

-- Pending reviews (not yet approved)
SELECT r.id, u.name AS reviewer, pp.full_name AS pujari,
       r.rating, r.comment, r.created_at
FROM reviews r
JOIN users u ON r.user_id = u.id
JOIN pujari_profiles pp ON r.pujari_id = pp.id
WHERE r.is_approved = FALSE
ORDER BY r.created_at DESC;

-- Popular poojas (by bookings)
SELECT p.name_mr, p.price, COUNT(b.id) AS total_bookings, SUM(b.total_amount) AS revenue
FROM poojas p
LEFT JOIN bookings b ON p.id = b.pooja_id AND b.status = 'completed'
GROUP BY p.id
ORDER BY total_bookings DESC
LIMIT 10;

-- Cache clear करायचा असेल (after direct DB edit)
-- Redis CLI:
-- KEYS "pooja:*" | xargs redis-cli DEL
-- KEYS "blog:*"  | xargs redis-cli DEL
-- DEL home:data
```

---

**Connection Config** (`backend/src/config/db.js`):
```javascript
mysql.createPool({
  host:            '159.89.167.218',
  port:            3306,
  user:            'pojjari_user',
  password:        'StrongPassword@2024!',
  database:        'pojjari_db',
  charset:         'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit:      0,
})
```
