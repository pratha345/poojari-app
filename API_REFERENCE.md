# API Reference — Pojjari Backend
## Complete Endpoint Documentation

> Base URL (Production): `https://pujari.mydashboard.site/api`
> Base URL (Local Dev):   `http://localhost:5000/api`
> Auth Header: `Authorization: Bearer <JWT_TOKEN>`
> Content-Type: `application/json`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Poojas](#2-poojas)
3. [Pujaris](#3-pujaris)
4. [Bookings](#4-bookings)
5. [Blog](#5-blog)
6. [Home / CMS](#6-home--cms)
7. [Panchang](#7-panchang)
8. [Rashifal](#8-rashifal)
9. [Halls](#9-halls)
10. [Contact](#10-contact)
11. [Admin Panel](#11-admin-panel)
12. [Super Admin](#12-super-admin)
13. [Response Format](#13-response-format)
14. [Error Codes](#14-error-codes)
15. [Rate Limits](#15-rate-limits)

---

## 1. Authentication

### POST `/api/auth/register`
New user registration.

**Rate Limit:** 5 per IP per hour

**Request:**
```json
{
  "name":     "राहुल पाटील",
  "phone":    "9876543210",
  "email":    "rahul@email.com",
  "password": "MyPassword@123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 42,
      "name": "राहुल पाटील",
      "phone": "9876543210",
      "role": "user",
      "is_verified": false
    }
  },
  "message": "नोंदणी यशस्वी."
}
```

---

### POST `/api/auth/login`
Login with phone + password.

**Rate Limit:** 10 per IP per 15 min | Slow-down after 5 attempts | Account lock after 5 failures

**Request:**
```json
{
  "phone":    "9876543210",
  "password": "MyPassword@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 42,
      "name": "राहुल पाटील",
      "phone": "9876543210",
      "email": "rahul@email.com",
      "role": "user",
      "is_verified": true
    }
  }
}
```

---

### POST `/api/auth/send-otp`
Send OTP to phone via Fast2SMS.

**Rate Limit:** 5 per phone per 10 min

**Request:**
```json
{ "phone": "9876543210" }
```

**Response `200`:**
```json
{ "success": true, "message": "OTP पाठवला." }
```

---

### POST `/api/auth/verify-otp`
Verify OTP + mark phone as verified.

**Request:**
```json
{
  "phone": "9876543210",
  "otp":   "123456"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "token": "eyJ..." },
  "message": "फोन सत्यापित झाला."
}
```

---

### POST `/api/auth/google`
Google OAuth login/register.

**Request:**
```json
{ "credential": "<Google ID Token>" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": 5, "name": "Rahul", "email": "rahul@gmail.com", "role": "user" }
  }
}
```

---

### GET `/api/auth/me`
Get current logged-in user info.

**Auth Required:** Yes

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "राहुल पाटील",
    "phone": "9876543210",
    "email": "rahul@email.com",
    "role": "user",
    "is_verified": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### POST `/api/auth/forgot-password`
Send password reset link via email.

**Request:**
```json
{ "email": "rahul@email.com" }
```

---

### POST `/api/auth/reset-password`
Reset password with token.

**Request:**
```json
{
  "token":    "<reset_token_from_email>",
  "password": "NewPassword@123"
}
```

---

## 2. Poojas

### GET `/api/pooja/categories`
All pooja categories.

**Cache:** Redis `pooja:categories` — 1 hour

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name_mr": "गृह पूजा",
      "name_en": "Gruh Pooja",
      "slug": "gruh-pooja",
      "icon_url": null,
      "sort_order": 1,
      "is_active": true
    }
  ]
}
```

---

### GET `/api/pooja`
List all poojas with optional filters.

**Cache:** Redis `pooja:list:{params}` — 30 min

**Query Parameters:**
```
category    string   Category slug: gruh-pooja, havan-jaap
featured    boolean  true = featured only
search      string   Search in name_mr, short_desc
min_price   number   Minimum price filter
max_price   number   Maximum price filter
page        number   Page number (default: 1)
limit       number   Items per page (default: 12)
tenant_slug string   Filter by tenant
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "poojas": [
      {
        "id": 1,
        "name_mr": "सत्यनारायण पूजा",
        "name_en": "Satyanarayan Pooja",
        "slug": "satyanarayan-pooja",
        "short_desc": "घरामध्ये सुख-समृद्धी...",
        "price": "3963.00",
        "samagri_price": "0.00",
        "duration_hrs": "3.00",
        "image_url": "/uploads/poojas/satyanarayan-pooja.webp",
        "is_featured": true,
        "category_name": "गृह पूजा",
        "category_slug": "gruh-pooja"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 12,
      "pages": 4
    }
  }
}
```

---

### GET `/api/pooja/:slug`
Single pooja detail with samagri + reviews.

**Cache:** Redis `pooja:slug:{slug}` — 30 min

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name_mr": "सत्यनारायण पूजा",
    "description": "...",
    "price": "3963.00",
    "duration_hrs": "3.00",
    "steps": ["चरण १: गणेश पूजन", "चरण २: ..."],
    "samagri": [
      { "name_mr": "रवा", "name_en": "Semolina", "quantity": "५०० ग्रॅम" }
    ],
    "reviews": [
      {
        "rating": 5,
        "comment": "खूप छान पूजा झाली",
        "user_name": "सुनील पाटील",
        "created_at": "2024-03-15"
      }
    ]
  }
}
```

---

### POST `/api/pooja` `[Admin]`
Create new pooja (with image upload).

**Auth:** Admin only
**Content-Type:** `multipart/form-data`

**Form Fields:**
```
category_id   number   required
name_mr       string   required
name_en       string
slug          string   required (auto-increments if duplicate)
description   string
short_desc    string
price         number   required
samagri_price number
duration_hrs  number
steps         JSON     ["चरण १:...", "चरण २:..."]
is_featured   boolean
image         file     Max 5MB (auto-converts to WebP)
```

---

### PUT `/api/pooja/:id` `[Admin]`
Update pooja. Same fields as POST.

---

### DELETE `/api/pooja/:id` `[Admin]`
Soft-delete pooja (`is_active = FALSE`).

---

## 3. Pujaris

### GET `/api/pujari/nearby`
Nearby pujaris using Haversine distance.

**Query Parameters:**
```
lat      number   required   User latitude
lng      number   required   User longitude
radius   number   km radius (default: 25)
```

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "full_name": "श्री गणेश जोशी",
      "city": "पुणे",
      "avg_rating": "4.80",
      "total_bookings": 52,
      "photo_url": "/uploads/pujari-xxx.webp",
      "distance": 3.2
    }
  ]
}
```

---

### GET `/api/pujari/top-reviews`
Top rated pujaris with recent reviews.

**Cache:** Redis `pujari:top-reviews` — 10 min

---

### GET `/api/pujari/:id`
Public pujari profile.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "full_name": "श्री गणेश जोशी",
    "experience_yrs": 15,
    "city": "पुणे",
    "district": "पुणे",
    "bio": "वैदिक पद्धतीने पूजा करतो...",
    "languages": ["मराठी", "हिंदी", "संस्कृत"],
    "avg_rating": "4.80",
    "total_reviews": 28,
    "total_bookings": 52,
    "is_available": true
  }
}
```

---

### GET `/api/pujari/:id/reviews`
Public reviews for a pujari.

---

### POST `/api/pujari/register` `[Auth]`
Register current user as pujari.

**Content-Type:** `multipart/form-data`

**Form Fields:**
```
full_name         string   required
experience_yrs    number
city              string
district          string
address           string
languages         JSON     ["मराठी","हिंदी"]
bio               string
brahmin_tradition string
specializations   JSON     [1, 3, 5] (category IDs)
photo             file     Profile photo (WebP)
certificate       file     Certificate image (WebP)
```

---

### GET `/api/pujari/profile` `[Auth]`
Own profile (for pujari dashboard).

---

### PUT `/api/pujari/profile` `[Auth]`
Update own profile.

---

### POST `/api/pujari/availability` `[Auth]`
Set available/unavailable dates.

**Request:**
```json
{
  "dates": ["2024-12-25", "2024-12-26"],
  "is_available": false
}
```

---

### GET `/api/pujari/bookings` `[Auth - Pujari]`
Pujari's assigned bookings.

---

### PUT `/api/pujari/bookings/:id/respond` `[Auth - Pujari]`
Accept or decline a booking.

**Request:**
```json
{
  "action": "accept",
  "response_note": "येतो मी"
}
```

---

## 4. Bookings

### POST `/api/booking` `[Auth]`
Create new booking.

**Rate Limit:** 20 per IP per hour

**Request:**
```json
{
  "pooja_id":           1,
  "booking_date":       "2024-12-25",
  "booking_time":       "10:00",
  "address":            "१२३, शिवाजी नगर",
  "city":               "पुणे",
  "district":           "पुणे",
  "special_notes":      "सकाळी यावे",
  "preferred_pujari_id": 5
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "booking_code":  "POJ1A2B3C",
    "total_amount":  3963,
    "platform_fee":  198,
    "pujari_amount": 3765,
    "status":        "pending"
  },
  "message": "बुकिंग यशस्वी!"
}
```

---

### GET `/api/booking/my`
Current user's all bookings.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "booking_code": "POJ1A2B3C",
      "pooja_name": "सत्यनारायण पूजा",
      "booking_date": "2024-12-25",
      "booking_time": "10:00:00",
      "status": "confirmed",
      "payment_status": "paid",
      "total_amount": "3963.00"
    }
  ]
}
```

---

### GET `/api/booking/:code`
Booking detail by code.

**Auth:** Required

---

### PUT `/api/booking/:id/cancel`
Cancel booking.

**Auth:** Required

**Request:**
```json
{ "reason": "तारीख बदलायची आहे" }
```

---

### POST `/api/booking/payment/create`
Create Razorpay order.

**Auth:** Required

**Request:**
```json
{ "booking_id": 101 }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id":  "order_xxx",
    "amount":    396300,
    "currency":  "INR",
    "key":       "rzp_live_xxx"
  }
}
```

---

### POST `/api/booking/payment/verify`
Verify Razorpay payment after success.

**Request:**
```json
{
  "razorpay_order_id":   "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature":  "signature_hash"
}
```

---

### POST `/api/booking/review`
Submit review after completed booking.

**Auth:** Required

**Request:**
```json
{
  "booking_id": 101,
  "rating":     5,
  "comment":    "खूप छान पूजा झाली. पुजारी वेळेत आले."
}
```

---

## 5. Blog

### GET `/api/blog`
List published blog posts.

**Cache:** Redis `blog:list:{params}` — 5 min

**Query Parameters:**
```
category  string   Filter by category
search    string   Search in title, excerpt
page      number   Page number (default: 1)
limit     number   Items per page (default: 9)
```

---

### GET `/api/blog/categories`
Blog categories with post count.

**Cache:** Redis `blog:categories` — 10 min

---

### GET `/api/blog/:slug`
Single blog post with related posts.

**Cache:** Redis `blog:slug:{slug}` — 10 min

**Query Parameters:**
```
session_id  string  Browser session ID (for user rating)
```

---

### POST `/api/blog/:slug/rate`
Rate a blog post (no login needed).

**Request:**
```json
{
  "rating":     5,
  "session_id": "browser-uuid-here"
}
```

---

## 6. Home / CMS

### GET `/api/home`
Homepage content + slider images.

**Cache:** Redis `home:data` — 10 min

**Response:**
```json
{
  "success": true,
  "data": {
    "content": {
      "title":          "पूजा बुकिंग करा",
      "subtitle":       "अनुभवी पुजारी घरी बोलवा",
      "stats_pujaris":  500,
      "stats_poojas":   100,
      "stats_bookings": 5000
    },
    "sliders": [
      {
        "id": 1,
        "image_url": "/uploads/slider/xxx.webp",
        "title":     "गणेश पूजा",
        "sort_order": 1
      }
    ]
  }
}
```

---

## 7. Panchang

### GET `/api/panchang`
Daily Panchang data (astronomical calculations).

**Query Parameters:**
```
date  string  YYYY-MM-DD (default: today in IST)
lat   number  Latitude (default: 18.52 — Pune)
lon   number  Longitude (default: 73.86 — Pune)
tz    number  Timezone offset in minutes (default: 330 — IST)
time  string  HH:MM local time
```

**Response:**
```json
{
  "success": true,
  "data": {
    "date":      "2024-12-25",
    "tithi":     "दशमी",
    "nakshatra": "उत्तराषाढा",
    "yoga":      "शुभ",
    "karana":    "बव",
    "maas":      "मार्गशीर्ष",
    "paksha":    "शुक्ल",
    "var":       "बुधवार",
    "sunrise":   "07:14",
    "sunset":    "18:02",
    "rahu_kaal": "12:00-13:30",
    "shubh_muhurat": ["09:30-10:15", "15:45-16:30"]
  }
}
```

---

### POST `/api/panchang/rate`
Rate panchang as helpful/not helpful.

**Request:**
```json
{
  "date":       "2024-12-25",
  "is_helpful": true,
  "session_id": "browser-uuid"
}
```

---

## 8. Rashifal

### GET `/api/rashifal`
Daily horoscope for all 12 rashis.

**Query Parameters:**
```
date  string  YYYY-MM-DD
rashi string  Specific rashi (optional)
```

---

## 9. Halls

### GET `/api/hall/nearby`
Nearby marriage/event halls.

**Query Parameters:**
```
lat     number  required
lng     number  required
radius  number  km (default: 25)
city    string  Filter by city
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "गणेश मंगल कार्यालय",
      "address": "फर्गुसन रोड, पुणे",
      "capacity": 500,
      "price_per_day": "25000.00",
      "amenities": ["AC", "Parking", "Catering"],
      "distance": 2.5
    }
  ]
}
```

---

## 10. Contact

### POST `/api/contact`
Submit contact form.

**Rate Limit:** 10 per IP per hour

**Request:**
```json
{
  "name":    "सुनील पाटील",
  "email":   "sunil@email.com",
  "phone":   "9876543210",
  "subject": "बुकिंग बद्दल",
  "message": "मला गणेश पूजा बद्दल माहिती हवी."
}
```

---

## 11. Admin Panel

All admin endpoints require: `Authorization: Bearer <admin_JWT>`

**Rate Limit:** 300 requests per 15 min

---

### GET `/api/admin/stats`
Dashboard statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_bookings":   245,
    "pending_bookings": 12,
    "total_revenue":    "485000.00",
    "total_pujaris":    38,
    "pending_pujaris":  5,
    "total_users":      520
  }
}
```

---

### GET `/api/admin/bookings`
All bookings with filters.

**Query Parameters:**
```
status   pending|confirmed|completed|cancelled
date     YYYY-MM-DD
page     number
limit    number
```

---

### PUT `/api/admin/bookings/:id/assign-pujari`
Assign pujari to booking.

**Request:**
```json
{ "pujari_id": 5 }
```

---

### PUT `/api/admin/bookings/:id/complete`
Mark booking as completed.

---

### GET `/api/admin/pujaris/pending`
Pujari registration requests.

---

### PUT `/api/admin/pujaris/:id/respond`
Approve or reject pujari.

**Request:**
```json
{
  "status": "approved",
  "rejection_reason": ""
}
```

---

### GET `/api/admin/reviews`
All reviews (approved + pending).

---

### PUT `/api/admin/reviews/:id/approve`
Approve a review.

---

### PUT `/api/admin/reviews/bulk-approve`
Approve all pending reviews.

---

### DELETE `/api/admin/reviews/:id`
Delete a review.

---

### GET `/api/admin/users`
All registered users.

---

### GET `/api/admin/abhyasak`
Blog editor (abhyasak) users.

---

### POST `/api/admin/abhyasak`
Create abhyasak user.

**Request:**
```json
{
  "name":     "सागर देशपांडे",
  "phone":    "9876543210",
  "password": "BlogEditor@123"
}
```

---

### POST `/api/admin/pooja/generate-steps`
AI-generate pooja ritual steps (via Groq LLaMA).

**Request:**
```json
{
  "name_mr": "सत्यनारायण पूजा",
  "name_en": "Satyanarayan Pooja"
}
```

**Response:**
```json
{
  "success": true,
  "steps": [
    "गणेश पूजन — सर्व कार्यारंभी श्री गणेशाची पूजा करावी.",
    "संकल्प — यजमानाने संकल्प घ्यावा.",
    "..."
  ]
}
```

---

### POST `/api/admin/janam-patrika/generate`
Generate birth chart (Janam Kundali) via AI.

**Request:**
```json
{
  "name":      "राहुल पाटील",
  "dob":       "1995-06-15",
  "tob":       "14:30",
  "pob":       "पुणे, महाराष्ट्र",
  "lat":       18.52,
  "lng":       73.86
}
```

---

## 12. Super Admin

Requires `super_admin` role JWT.

### GET `/api/superadmin/tenants`
All registered tenants.

### POST `/api/superadmin/tenants`
Create new tenant.

### PUT `/api/superadmin/tenants/:id`
Update tenant / change plan.

### GET `/api/superadmin/stats`
Platform-wide statistics across all tenants.

---

## 13. Response Format

**All API responses follow this structure:**

```typescript
// Success
{
  success: true,
  data:    any,       // Response payload
  message: string     // Optional success message
}

// Error
{
  success: false,
  message: string     // Error description in Marathi/English
}
```

**`response.util.js` helper:**
```javascript
success(res, data, message, statusCode = 200)
error(res, message, statusCode = 500)
```

---

## 14. Error Codes

```
400 Bad Request     → Missing/invalid input fields
401 Unauthorized    → No token / invalid token
403 Forbidden       → Insufficient role (user trying admin)
404 Not Found       → Resource doesn't exist
409 Conflict        → Duplicate (email/phone/slug)
429 Too Many Requests → Rate limit exceeded
500 Internal Error  → Server/DB error
```

**Auth Errors:**
```json
{ "success": false, "message": "Token आवश्यक आहे." }           // 401
{ "success": false, "message": "अवैध token." }                  // 401
{ "success": false, "message": "परवानगी नाही." }                // 403
```

**Rate Limit Errors:**
```json
{ "success": false, "message": "खूप जास्त login attempts. 15 मिनिटांनंतर पुन्हा प्रयत्न करा." }
{ "success": false, "message": "Account 30 मिनिटांसाठी lock झाले." }
```

---

## 15. Rate Limits

```
Endpoint                    Limit              Window
────────────────────────── ────────────────── ──────────
Global (all endpoints)      200 requests       15 min
POST /api/auth/login        10 per IP          15 min
POST /api/auth/register     5 per IP           1 hour
POST /api/auth/send-otp     5 per phone        10 min
POST /api/auth/verify-otp   5 per phone        10 min
POST /api/contact           10 per IP          1 hour
POST /api/booking           20 per IP          1 hour
Admin endpoints             300 per IP         15 min

Slow-down (login):
  After 5 attempts → +500ms delay per request
  Max delay: 5000ms (5 seconds)

Account Lockout (login):
  5 wrong passwords → 30 minute lockout
  Key: phone + IP combination
```

**Rate Limit Response Headers:**
```
X-RateLimit-Limit:     10
X-RateLimit-Remaining: 7
X-RateLimit-Reset:     1703520000
```
