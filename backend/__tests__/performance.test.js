// __tests__/performance.test.js — API Response Time Benchmarks
'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  escape:        jest.fn(val => `'${String(val)}'`),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:  (req, res, next) => { req.tenantId = req.user?.tenant_id ?? 1; next(); },
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER } = require('./helpers/mockDb');

// Thresholds (ms)
const HEALTH_THRESHOLD    = 250; // cold-start overhead in test env can reach ~200ms
const FAST_API_THRESHOLD  = 300;
const PANCHANG_THRESHOLD  = 500;
const AUTH_THRESHOLD      = 500;

async function timed(fn) {
  const start = Date.now();
  const res   = await fn();
  return { res, ms: Date.now() - start };
}

// ═══════════════════════════════════════════════════════════════════
// PART 3A: Health Check — Should be near-instant
// ═══════════════════════════════════════════════════════════════════
describe('Performance: Health Check', () => {
  it(`GET /api/health responds within ${HEALTH_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() => request(app).get('/api/health'));
    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(HEALTH_THRESHOLD);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3B: Authentication Endpoints
// ═══════════════════════════════════════════════════════════════════
describe('Performance: Auth Endpoints', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it(`POST /api/auth/register (validation fail) responds within ${AUTH_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).post('/api/auth/register').send({})
    );
    expect(res.status).toBe(400);
    expect(ms).toBeLessThan(AUTH_THRESHOLD);
  });

  it(`POST /api/auth/login (validation fail) responds within ${AUTH_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).post('/api/auth/login').send({})
    );
    expect(res.status).toBe(400);
    expect(ms).toBeLessThan(AUTH_THRESHOLD);
  });

  it(`GET /api/auth/me (no token) responds within ${FAST_API_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).get('/api/auth/me')
    );
    expect(res.status).toBe(401);
    expect(ms).toBeLessThan(FAST_API_THRESHOLD);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3C: Panchang — Pure Calculation (no DB)
// ═══════════════════════════════════════════════════════════════════
describe('Performance: Panchang Calculation', () => {
  it(`GET /api/panchang?date=2025-01-15 responds within ${PANCHANG_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).get('/api/panchang?date=2025-01-15')
    );
    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(PANCHANG_THRESHOLD);
  });

  it(`GET /api/panchang (no params) responds within ${PANCHANG_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).get('/api/panchang')
    );
    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(PANCHANG_THRESHOLD);
  });

  it(`GET /api/panchang with custom lat/lon responds within ${PANCHANG_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).get('/api/panchang?date=2025-06-15&lat=18.5204&lon=73.8567')
    );
    expect(res.status).toBe(200);
    expect(ms).toBeLessThan(PANCHANG_THRESHOLD);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3D: Protected Routes — Token Verification Overhead
// ═══════════════════════════════════════════════════════════════════
describe('Performance: Token Verification Speed', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it(`Admin stats 401 path (no token) responds within ${FAST_API_THRESHOLD}ms`, async () => {
    const { res, ms } = await timed(() =>
      request(app).get('/api/admin/stats')
    );
    expect(res.status).toBe(401);
    expect(ms).toBeLessThan(FAST_API_THRESHOLD);
  });

  it(`Admin stats 403 path (user token) responds within ${FAST_API_THRESHOLD}ms`, async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);
    const token = makeUserToken(MOCK_USER);
    const { res, ms } = await timed(() =>
      request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`)
    );
    expect(res.status).toBe(403);
    expect(ms).toBeLessThan(FAST_API_THRESHOLD);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3E: Concurrent Requests
// ═══════════════════════════════════════════════════════════════════
describe('Performance: Concurrent Request Handling', () => {
  it('handles 10 simultaneous panchang requests without timeout', async () => {
    const CONCURRENCY = 10;
    const start = Date.now();
    const promises = Array.from({ length: CONCURRENCY }, (_, i) =>
      request(app).get(`/api/panchang?date=2025-0${(i % 9) + 1}-15`)
    );
    const results = await Promise.all(promises);
    const elapsed = Date.now() - start;

    results.forEach(res => {
      expect([200, 400]).toContain(res.status); // no 500s
    });
    // 10 concurrent requests should finish in under 3 seconds total
    expect(elapsed).toBeLessThan(3000);
  });

  it('handles 10 simultaneous health checks', async () => {
    const promises = Array.from({ length: 10 }, () =>
      request(app).get('/api/health')
    );
    const results = await Promise.all(promises);
    results.forEach(res => expect(res.status).toBe(200));
  });

  it('handles 5 simultaneous auth validation rejections', async () => {
    pool.query.mockResolvedValue([[MOCK_USER]]);
    const token = makeUserToken(MOCK_USER);
    const promises = Array.from({ length: 5 }, () =>
      request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
    );
    const results = await Promise.all(promises);
    // All should either succeed or fail consistently — no 500s
    results.forEach(res => expect(res.status).not.toBe(500));
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 3F: Repeated Calls — No Memory Leak Indicator
// ═══════════════════════════════════════════════════════════════════
describe('Performance: Repeated Calls Stability', () => {
  it('20 sequential panchang calls stay stable in response time', async () => {
    const times = [];
    for (let i = 0; i < 20; i++) {
      const { ms } = await timed(() =>
        request(app).get('/api/panchang?date=2025-03-15')
      );
      times.push(ms);
    }
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    // Average must stay under threshold — large drift indicates regression
    expect(avg).toBeLessThan(PANCHANG_THRESHOLD);
    // Last 5 calls should not be significantly slower than first 5
    const first5Avg = times.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    const last5Avg  = times.slice(-5).reduce((a, b) => a + b, 0) / 5;
    // Allow up to 3x degradation from warmup to steady state
    expect(last5Avg).toBeLessThan(first5Avg * 3 + 100);
  });
});
