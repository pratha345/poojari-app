# Interview Master Index — Prathamesh Paranjape
> Node.js · Express · JWT · MySQL · Redis · Security · React · Docker · System Design · DSA
> **Production Project:** [pujari.mydashboard.site](https://pujari.mydashboard.site)

---

## Study Order + Priority

| # | Topic | File | Priority | Time |
|---|-------|------|----------|------|
| 1 | Node.js Internals | [Topic 01](INTERVIEW_TOPIC_01_NODEJS.md) | 🔴 Critical | 3 hrs |
| 2 | Express.js + Middleware | [Topic 02](INTERVIEW_TOPIC_02_EXPRESS.md) | 🔴 Critical | 3 hrs |
| 3 | JWT + Authentication | [Topic 03](INTERVIEW_TOPIC_03_JWT_AUTH.md) | 🔴 Critical | 2 hrs |
| 4 | MySQL + SQL | [Topic 04](INTERVIEW_TOPIC_04_MYSQL.md) | 🔴 Critical | 4 hrs |
| 5 | Redis Caching | [Topic 05](INTERVIEW_TOPIC_05_REDIS.md) | 🟠 Important | 2 hrs |
| 6 | Security | [Topic 06](INTERVIEW_TOPIC_06_SECURITY.md) | 🔴 Critical | 2 hrs |
| 7 | React.js | [Topic 07](INTERVIEW_TOPIC_07_REACT.md) | 🟠 Important | 3 hrs |
| 8 | Docker + DevOps + CI/CD | [Topic 08](INTERVIEW_TOPIC_08_DOCKER_DEVOPS.md) | 🟠 Important | 3 hrs |
| 9 | System Design | [Topic 09](INTERVIEW_TOPIC_09_SYSTEM_DESIGN.md) | 🟡 Good to Know | 2 hrs |
| 10 | Project Pitch + Behavioral | [Topic 10](INTERVIEW_TOPIC_10_PROJECT_PITCH.md) | 🔴 Critical | 2 hrs |
| 11 | DSA Basics | [Topic 11](INTERVIEW_TOPIC_11_DSA_BASICS.md) | 🟠 Important | 4 hrs |

**Total: ~30 hours of focused study**

---

## 3-Week Study Plan

### Week 1 — Backend Core
```
Day 1  →  Node.js: Event Loop, Async/Await, Modules
Day 2  →  Express.js: Middleware, Routing, Error Handling
Day 3  →  JWT: Auth Flow, bcrypt, RBAC
Day 4  →  MySQL: JOINs, Indexes, Transactions
Day 5  →  SQL Practice (LeetCode SQL problems)
Day 6  →  Redis: Cache-Aside, TTL, Invalidation
Day 7  →  Revision + Mock Questions (Week 1 topics)
```

### Week 2 — Security + Frontend + DevOps
```
Day 1  →  Security: XSS, SQL Injection, Rate Limiting, Helmet
Day 2  →  React: Hooks, Context, Virtual DOM, Router
Day 3  →  Docker: Dockerfile, Compose, Multi-stage
Day 4  →  CI/CD: GitHub Actions, PM2, Nginx
Day 5  →  System Design: Scaling, Load Balancer, Message Queue
Day 6  →  DSA: Arrays, HashMap, Two Pointer (10 problems)
Day 7  →  Revision
```

### Week 3 — Polish + Practice
```
Day 1  →  Project Pitch — 2-minute script memorize
Day 2  →  Mock interview (record yourself)
Day 3  →  DSA — 10 more LeetCode Easy problems
Day 4  →  Behavioral Questions — STAR method practice
Day 5  →  Resume walkthrough + numbers memorize
Day 6  →  Light revision + rest
Day 7  →  Interview 🎯
```

---

## Pojjari Numbers — Memorize These!

```
160+   →  REST API endpoints
450+   →  Playwright E2E tests
17     →  Test files
95%+   →  Redis cache hit rate
10+    →  Security layers
3      →  Oracle Certifications
1.5+   →  Years experience
1      →  Live production URL: pujari.mydashboard.site
```

---

## Top 35 Questions — Nakki Yenaar

### Node.js + Express
1. Event Loop कसं काम करतं? Single thread असून concurrent requests कसं?
2. Callback vs Promise vs Async/Await — फरक + कधी काय वापरतो?
3. Middleware म्हणजे काय? `next()` काय करतो?
4. Error-handling middleware मध्ये 4 parameters का असतात?
5. `require()` vs `import` — CommonJS vs ES Modules
6. `req.body` undefined का होतो?
7. `Promise.all()` vs sequential `await` — कधी काय वापरतो?

### JWT + Auth
8. JWT structure explain करा — 3 parts
9. Session-based vs Token-based auth — फरक
10. 401 vs 403 — नक्की फरक
11. bcrypt vs MD5 — का bcrypt वापरतो?
12. JWT कुठे store करतो? localStorage का नाही?
13. RBAC कसं implement केलं Pojjari मध्ये?
14. JWT revoke कसं करतो?

### MySQL
15. INNER JOIN vs LEFT JOIN — कधी काय?
16. WHERE vs HAVING — फरक
17. Index म्हणजे काय? कधी add करतो?
18. ACID properties — सांगा
19. N+1 problem काय आहे? कसं solve केलं?
20. SQL Injection कसं prevent केलं?
21. Composite index म्हणजे काय?

### Redis
22. Redis vs MySQL — कधी काय वापरतो?
23. Cache Hit / Cache Miss म्हणजे काय?
24. Cache Invalidation कशी करतो?
25. TTL म्हणजे काय? Pojjari मध्ये कोणते TTL values?
26. Cache Stampede म्हणजे काय? Fix?

### Security
27. XSS म्हणजे काय? कसं fix केलं?
28. Rate limiting implementation explain करा
29. Helmet.js काय headers set करतो?
30. CORS म्हणजे काय? Pojjari मध्ये configuration?

### React
31. Virtual DOM म्हणजे काय? कसं efficient आहे?
32. useState vs useRef — फरक
33. useEffect dependency array `[]` vs `[value]` vs nothing
34. Context API vs Props drilling

### DevOps
35. Docker Container vs VM — फरक
36. Multi-stage Dockerfile का वापरतो?
37. `pm2 restart` vs `pm2 reload` — फरक
38. GitHub Actions CI/CD pipeline explain करा

---

## Quick Concept Locator

| Concept | Topic | Section |
|---------|-------|---------|
| Event Loop | Topic 01 | 1.2 |
| Async/Await | Topic 01 | 1.3 |
| Middleware Chain | Topic 02 | 2.2 |
| Error Middleware (4 params) | Topic 02 | 2.4 |
| JWT Structure | Topic 03 | 3.2 |
| bcrypt | Topic 03 | 3.4 |
| INNER vs LEFT JOIN | Topic 04 | 4.3 |
| Index | Topic 04 | 4.4 |
| Cache-Aside Pattern | Topic 05 | 5.3 |
| Cache Invalidation | Topic 05 | 5.4 |
| SQL Injection | Topic 06 | 6.2 |
| XSS | Topic 06 | 6.3 |
| Rate Limiting | Topic 06 | 6.1 |
| Virtual DOM | Topic 07 | 7.1 |
| useState / useEffect | Topic 07 | 7.2 |
| Dockerfile | Topic 08 | 8.2 |
| PM2 | Topic 08 | 8.4 |
| Nginx | Topic 08 | 8.5 |
| Scaling | Topic 09 | 9.2 |
| URL Shortener Design | Topic 09 | 9.7 |
| 2-Minute Pitch | Topic 10 | 10.1 |
| STAR Method | Topic 10 | 10.3 |
| Two Sum | Topic 11 | 11.3 |
| Binary Search | Topic 11 | 11.6 |

---

## Golden Rule

> **Interview मध्ये प्रत्येक technical answer नंतर हे add कर:**
> *"मी Pojjari project मध्ये हे implement केलं आहे आणि production वर live आहे."*
>
> तुझ्याकडे live production project आहे, real numbers आहेत, real challenges solved केल्या आहेत.
> हे 90% fresh graduates कडे नसतं. **Confidence ठेव!**
