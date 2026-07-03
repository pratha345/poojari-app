# Prathamesh Paranjape

**Email:** paranjapeprathamesh85@gmail.com | **Mobile:** +91-9561903219
**Location:** Mumbai, Maharashtra | **GitHub:** github.com/prathameshvp2001

---

## Professional Summary

Full-Stack Software Developer and Oracle Cloud Certified DevOps Professional with 1.5+ years of experience building production-grade web applications, scalable REST APIs, and cloud-deployed systems. Hands-on expertise in Node.js, React.js, MySQL, Redis caching, and Docker containerization. Proven track record in designing secure, high-performance backends with JWT authentication, rate limiting, and automated CI/CD pipelines. Experienced with DigitalOcean, OCI, and PM2-managed production environments.

---

## Technical Skills

**Backend:**
Node.js, Express.js, REST API Design, JWT Authentication, bcrypt, Socket.IO, Nodemailer, Web Push Notifications, Razorpay Payment Integration, Google OAuth 2.0, Fast2SMS API, Multi-tenant SaaS Architecture

**Frontend:**
React.js, Vite, HTML5, CSS3, JavaScript (ES6+), PHP

**Databases:**
MySQL, Oracle Database, SQL Query Optimization, Schema Design, Relational Modeling, Redis (Caching, Cache Invalidation, TTL Management, ioredis)

**DevOps & Cloud:**
Docker, GitHub Actions (CI/CD), PM2, Nginx, Oracle Cloud Infrastructure (OCI), DigitalOcean, VPS Hosting, SSH Server Management, Linux (Ubuntu), UFW Firewall, Certbot (SSL/HTTPS), Fail2ban

**Security:**
Rate Limiting (express-rate-limit), Account Lockout, XSS Prevention, SQL Injection Protection, Helmet.js, CORS Policy, HTTP Parameter Pollution (HPP), Input Sanitization

**File & Media:**
Multer (File Upload), Sharp (Image Processing, WebP Conversion), EXIF Stripping

**Testing & Tools:**
Playwright (E2E Testing), Jest, Supertest, Git, GitLab, GitHub, Postman, cPanel, VS Code

**AI/API Integrations:**
Groq (LLaMA 70B), Google Gemini AI, Stability AI, OpenStreetMap (Nominatim Geocoding), Haversine Distance Formula

---

## Experience

### Protovec Technologies Pvt. Ltd. — Software Developer
**Andheri, Marol, Mumbai | Dec 2023 – Present**

- Architected and developed full-stack enterprise web applications using Node.js, Express.js, and React.js with MySQL as the primary database, serving production users.
- Designed and optimized MySQL and Oracle database schemas for high-traffic production systems, including indexing strategies and query optimization reducing query response times.
- Built and deployed RESTful APIs with JWT-based authentication, role-based access control (RBAC), and input validation using express-validator.
- Implemented a comprehensive security middleware stack including rate limiting, account lockout (5-attempt / 30-min lock), XSS sanitization, SQL injection detection, and Helmet.js CSP headers.
- Integrated Redis caching (ioredis) achieving 95%+ cache hit rates on high-traffic endpoints, significantly reducing MySQL load.
- Deployed and managed applications on DigitalOcean and OCI using PM2 process management, Nginx reverse proxy, and Certbot SSL — maintaining production uptime.
- Implemented CI/CD-ready deployment workflows, automated database backup scripts (cron + mysqldump), and server monitoring using UptimeRobot.
- Implemented secure data synchronization between on-premise systems and cloud-hosted databases, ensuring data integrity across environments.
- Supported application lifecycle management including zero-downtime deployments (PM2 reload), rollback strategies, and log analysis.

---

## Projects

### Pojjari — Marathi Pooja Booking Platform (SaaS)
**Tech Stack:** Node.js, Express.js, React.js (Vite), MySQL, Redis, Socket.IO, Docker, Razorpay, PM2, Nginx, DigitalOcean

A production-deployed multi-tenant SaaS platform enabling users to book traditional Hindu puja ceremonies with verified priests (pujaris) across Maharashtra.

**Backend Architecture:**
- Designed and built RESTful API with 40+ endpoints covering authentication, bookings, puja catalog, pujari management, blog, and admin panel — live at `pujari.mydashboard.site`.
- Implemented multi-tenant architecture isolating data by subdomain (e.g., `nashik.pojjari.com`) using tenant middleware and per-tenant MySQL filtering.
- Integrated Razorpay payment gateway with order creation, payment verification (HMAC SHA256 signature), and cash collection workflows.
- Built real-time poster generation progress using Socket.IO with room-based tenant isolation.

**Security Implementation:**
- Implemented layered security: global rate limiter (200 req/IP/15 min), auth limiter (10 req/IP/15 min), OTP limiter (5 req/phone/10 min), account lockout (5 failures = 30 min lock), and progressive slow-down middleware.
- Added XSS input sanitization, SQL injection pattern detection, suspicious path blocking (/wp-admin, /.env, path traversal), and Content Security Policy via Helmet.js.

**Performance & Caching:**
- Integrated Redis caching with namespace key strategy (`pooja:list:*`, `blog:slug:*`, `home:data`) and TTL-based expiry (5 min – 1 hr), reducing database queries by ~95% on frequently accessed endpoints.
- Implemented cache invalidation on write operations ensuring data consistency across all cache layers.

**DevOps & Infrastructure:**
- Deployed on DigitalOcean (64.227.152.85) with Nginx reverse proxy, PM2 process management, UFW firewall, and Let's Encrypt SSL.
- Created Docker containerization setup (multi-stage Dockerfile) with volume mounting for persistent uploads.
- Authored GitHub Actions CI/CD pipeline: test → build → deploy on push to main branch with health check verification.
- Automated daily MySQL backups (cron + mysqldump + gzip) with 30-day retention on separate database server.

**AI Integrations:**
- Integrated Groq API (LLaMA 3.3 70B) for AI-generated puja ritual steps (विधी चरण) in Marathi.
- Added Google Gemini AI for AI poster generation with WebSocket progress streaming.
- Implemented OpenStreetMap Nominatim geocoding and Haversine formula for nearby pujari discovery.

**Other Features:**
- Built OTP-based phone verification using Fast2SMS API and Google OAuth 2.0 login.
- Implemented Multer + Sharp pipeline for image uploads with auto WebP conversion, EXIF stripping, and 80% size reduction.
- Developed Playwright E2E test suite with 187 tests covering auth, booking flow, admin panel, and API endpoints.
- Integrated Web Push Notifications (VAPID), Nodemailer (email), and SMS notifications.

---

### Rossari Industrial Management System
**Tech Stack:** MySQL, SQL, PHP, Cloud Deployment (OCI/DigitalOcean)**

- Developed a centralized platform for production monitoring and chemical usage tracking across industrial units.
- Implemented role-based access control (RBAC) with department-level data isolation.
- Designed optimized MySQL schemas with indexing strategies improving reporting query performance by 40%.
- Deployed on cloud VPS with secure database access controls and backup policies.

---

### BLVL Data Monitoring Platform
**Tech Stack:** MySQL, SQL, PHP, Backend API, Cloud Hosting**

- Built a cloud-hosted real-time data monitoring solution with optimized backend database access patterns.
- Designed efficient SQL queries with proper indexing, reducing data retrieval latency for dashboard views.
- Ensured 99%+ data availability through connection pooling and error handling strategies.

---

### CigRate Stock Management System
**Tech Stack:** MySQL, SQL, PHP, Inventory Management**

- Developed a database-centric inventory and sales management application with real-time stock tracking.
- Designed normalized relational database schemas ensuring ACID compliance, data accuracy, and consistency.
- Implemented automated stock alert triggers and sales reporting modules.

---

## Certifications

- **Oracle Cloud Infrastructure 2025 Certified DevOps Professional** — Oracle
- **Oracle APEX Cloud Developer Certified Professional** — Oracle
- **Oracle Cloud Infrastructure 2025 Certified AI Foundations Associate** — Oracle

---

## Education

**Bachelor of Engineering — Information Technology**
Hope Foundation's F.A.M.T, Ratnagiri | Jul 2019 – Jun 2023 | **CGPA: 8.64**

**Information Technology (HSC — MSBSHSE)**
Sahajeevan Shikshan Sanstha, Khed | Jun 2017 – May 2019 | Percentage: 58%

---

## Key Strengths

- Production-grade backend development with real security implementation
- Database design + Redis caching for high-performance systems
- Full deployment lifecycle: code → test → Docker → CI/CD → live server
- Oracle Cloud certified with DigitalOcean production experience
- Strong SQL optimization and relational schema design background
