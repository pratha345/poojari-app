# Topic 10: Project Pitch + Behavioral Questions
> तुझा सगळ्यात बलवान हत्यार — live production project + real metrics

---

## 10.1 The 2-Minute Project Pitch (Memorize This!)

> **Practice करा, record करा, perfect करा. Interview मधला सगळ्यात important 2 minutes.**

---

### English Version (Use for Tech Companies)

*"I built Pojjari — a full-stack Marathi-language platform for booking Hindu ceremony priests. It's live in production at pujari.mydashboard.site.*

*The backend is Node.js with Express — 160+ REST API endpoints, MySQL for the database with Redis caching achieving a 95%+ cache hit rate. The frontend is React with Tailwind CSS. Everything is deployed on DigitalOcean with Nginx as a reverse proxy and PM2 for process management.*

*The interesting challenges I solved: First, I implemented a real-time Panchang system — that's the Hindu calendar — using astronomical calculations for accurate date, nakshatra, and tithi data, which required complex math, not just a lookup table. Second, I built complete role-based access control with three roles — user, pujari, and admin — with JWT authentication and bcrypt password hashing. Third, I added an AI poster generation system using Claude API that creates culturally appropriate promotional images for religious ceremonies.*

*For quality assurance, I wrote 450+ end-to-end Playwright tests across 17 test files, which gave me confidence to deploy features quickly without breaking existing functionality.*

*The production URL is live and handles real traffic. I'm happy to walk through any part of it in detail."*

---

### Marathi Version (Use for Marathi Companies / Ice-breaker)

*"मी Pojjari नावाचं project बनवलं — हे एक Marathi-language platform आहे Hindu धार्मिक विधींसाठी पुजारी book करायचं. Production वर live आहे pujari.mydashboard.site वर.*

*Backend: Node.js + Express — 160+ REST APIs. Database: MySQL + Redis caching (95%+ cache hit rate). Frontend: React + Tailwind CSS. Deployment: DigitalOcean वर Nginx + PM2.*

*महत्वाच्या challenges: Real-time Panchang system — astronomical calculations वापरून accurate nakshatra, tithi, yoga data. JWT + bcrypt security. RBAC — user, pujari, admin तीन roles. AI poster generation Claude API वापरून.*

*Quality: 450+ Playwright E2E tests, 17 test files.*

*Project live आहे आणि real traffic handle करतं."*

---

## 10.2 Architecture Diagram (Describe Verbally)

```
User/Browser
     ↓ HTTPS
   Nginx
  ↙      ↘
React    Node.js Express
(SPA)     (160+ APIs)
              ↓
         ┌────┴────┐
       Redis     MySQL
      (cache)   (data)
              ↓
         DigitalOcean
           Ubuntu
```

---

## 10.3 Behavioral Questions — STAR Method

**S**ituation → **T**ask → **A**ction → **R**esult

---

### "Tell me about a challenging technical problem you solved."

**Situation:** Pojjari च्या Panchang feature साठी accurate astronomical data हवी होती. External APIs unreliable होते आणि expensive होते.

**Task:** Node.js मध्ये pure astronomical calculations implement करायचे होते — Indian lunar calendar, nakshatra, tithi, yoga सगळं accurate असायला हवं.

**Action:** Surya Siddhanta algorithms implement केले. Julian Day Number calculations, ahargana (day count from Kali Yuga epoch), lunar longitude, 27 nakshatras map केले. Redis cache केलं — TTL 24 hours, daily midnight expire. Test suite लिहिला accuracy verify करायला.

**Result:** 100% accurate Panchang data, no external API dependency, Redis caching मुळे 95%+ cache hit rate, near-instant response.

---

### "Tell me about a time you worked under pressure."

**Situation:** Project deadline आला, 450 tests मध्ये 30+ failing होते.

**Task:** सगळे tests pass करायचे होते launch आधी.

**Action:** Failed tests systematically group केले — category wise. Race conditions fix केल्या (test isolation). Flaky selector issues fix केल्या (proper `await` + locators). Auth state between tests isolate केली.

**Result:** 252/252 tests passing. Zero regressions. Confident deploy.

---

### "Describe a time you improved performance."

**Situation:** Pujari list API ला प्रत्येक request ला 150-200ms लागत होती — MySQL JOIN query.

**Task:** Response time < 10ms पर्यंत आणायचं.

**Action:** Redis cache implement केलं — Cache-Aside pattern. First request: MySQL → Redis store (TTL 5 min). Subsequent: Redis direct. Index add केला `pujaris` table वर `category` + `rating` columns.

**Result:** 95%+ cache hit rate, response time: 150ms → 2ms. 75x improvement.

---

### "Tell me about a time you handled failure."

**Situation:** Production वर pushed केलं, Panchang calculations wrong date दाखवत होत्या.

**Task:** Production bug — users live पाहत होते.

**Action:** Git rollback केलं (30 seconds). Root cause identify केलं — timezone handling bug (IST vs UTC). Fixed: `moment-timezone` properly configure केलं. Unit tests add केल्या edge cases साठी. Re-deploy.

**Result:** 45 minutes total downtime. Post-mortem लिहिला. Staging environment add केलं future साठी.

---

### "Why should we hire you?"

*"तुम्हाला एक developer लागतो जो real production experience आहे, not just tutorials.*

*माझ्याकडे live production project आहे — pujari.mydashboard.site — जो real users handle करतो. मी architecture decisions implement केल्या आहेत: JWT auth, Redis caching, E2E test suite, CI/CD pipeline.*

*मी 3 Oracle certifications आहेत. मी independently problem-solve करतो — Panchang astronomical calculations, AI integration, automated testing — सगळं independently शिकून implement केलं.*

*तुमच्या team ला असा developer हवा असेल जो production-ready code लिहितो आणि independently deliver करतो — मी तेच करतो."*

---

## 10.4 Technical Q&A About Pojjari — Be Ready

**Q: Pojjari चे database schema सांगा**
> Core tables: `users` (auth + roles), `pujaris` (profiles), `bookings` (all pooja bookings), `categories` (ganesh, satyanarayan etc.), `samagri` (per-pooja materials), `blogs` (content), `halls` (hall finder), `password_reset_tokens`.

**Q: Most challenging feature कोणतं?**
> Panchang system — astronomical calculations + real-time accuracy + caching strategy. किंवा AI poster generation — Claude API integration + template design + WhatsApp caption generation.

**Q: 450 tests कशासाठी?**
> Playwright E2E tests — browser मध्ये actual user flows test करतो. Admin login → pujari create → booking → status update. All 252 assertions pass करणं = feature works, no regressions. Confident deploy enables.

**Q: Redis TTL values का different आहेत?**
> Data freshness requirements different आहेत. Panchang: 24hrs (रात्री 12 ला change). Pujari list: 5 min (admin कधीही update करू शकतो). Rate limit: 15 min (window size). TTL = business requirement, not arbitrary.

**Q: Security कसं implement केलं?**
> 10 layers: bcrypt passwords, JWT auth, RBAC middleware, parameterized SQL, rate limiting (5 login attempts/15min), Redis account lockout, Helmet.js headers, CORS whitelist, HTTPS (Let's Encrypt), input validation (express-validator).

---

## 10.5 Numbers to Memorize

```
160+    REST API endpoints
450+    Playwright E2E tests
17      Test files
95%+    Redis cache hit rate
3       User roles (user, pujari, admin)
10+     Security layers
3       Oracle Certifications
1       Live production URL
2       Major databases (MySQL + Redis)
27      Nakshatras in Panchang
```

---

## 10.6 Questions to Ask the Interviewer

Good questions show you think like an engineer, not just a coder:

1. *"What does the tech stack look like? Are you using microservices or monolith?"*
2. *"What's the biggest technical challenge the team is working on right now?"*
3. *"How does the team handle code review and deployment process?"*
4. *"What does a typical first sprint look like for a new engineer?"*
5. *"What opportunities are there for learning and growth?"*

---

## Summary

| Section | Content |
|---------|---------|
| 2-Min Pitch | Pojjari: platform → stack → challenges → metrics → live URL |
| STAR Method | Situation → Task → Action → Result |
| Challenging bug | Panchang wrong date → rollback → fix → test → redeploy |
| Performance | Pujari list 150ms → Redis → 2ms (75x) |
| Pressure | 30 failing tests → fixed → 252/252 pass |
| Numbers | 160+ APIs, 450+ tests, 95% cache hit |
| Close strong | Live project, Oracle certs, independent problem-solver |
