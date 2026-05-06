// __tests__/edge-cases.test.js — Edge Case & Input Validation Tests
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
const { makeUserToken, makeAdminToken } = require('./helpers/authHelper');
const { MOCK_USER, MOCK_ADMIN } = require('./helpers/mockDb');

// ═══════════════════════════════════════════════════════════════════
// PART 1A: Empty / Missing Field Submissions
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Empty Form Submissions', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('POST /api/auth/register — rejects completely empty body', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register — rejects missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ phone: '9876543210', password: 'Pass@123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register — rejects missing phone', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', password: 'Pass@123' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register — rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', phone: '9876543210' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login — rejects empty body', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/login — rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9307720459' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/contact — rejects empty contact form', async () => {
    const res = await request(app).post('/api/contact').send({});
    // Should not return 500 — graceful validation error
    expect(res.status).toBeLessThan(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1B: Invalid Input Formats
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Invalid Input Formats', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('POST /api/auth/register — short phone number', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no existing user
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', phone: '123', password: 'Pass@123' });
    // Controller may allow it (no phone format validation) — just must not crash
    expect(res.status).not.toBe(500);
  });

  it('GET /api/panchang — invalid date format DD-MM-YYYY', async () => {
    const res = await request(app).get('/api/panchang?date=15-01-2025');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/panchang — alphabetic date', async () => {
    const res = await request(app).get('/api/panchang?date=notadate');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/panchang — negative latitude', async () => {
    const res = await request(app).get('/api/panchang?date=2025-01-15&lat=-99');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/panchang — string latitude', async () => {
    const res = await request(app).get('/api/panchang?date=2025-01-15&lat=abc');
    expect([400, 200]).toContain(res.status); // accepts default or rejects — must not 500
  });

  it('GET /api/panchang — out-of-range longitude (>180)', async () => {
    const res = await request(app).get('/api/panchang?date=2025-01-15&lon=999');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1C: Very Long Inputs (Boundary / Overflow)
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Very Long Inputs', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('POST /api/auth/register — 500-char name should not crash server', async () => {
    const longName = 'अ'.repeat(500);
    pool.query.mockResolvedValueOnce([[]]); // phone not taken
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: longName, phone: '9123456789', password: 'Pass@123' });
    expect(res.status).not.toBe(500);
  });

  it('POST /api/auth/register — 1000-char password should not crash server', async () => {
    pool.query.mockResolvedValueOnce([[]]); // phone not taken
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', phone: '9123456788', password: 'A'.repeat(1000) });
    expect(res.status).not.toBe(500);
  });

  it('POST /api/auth/login — very long phone does not crash', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9'.repeat(500), password: 'Pass@123' });
    expect(res.status).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1D: Panchang Date Boundary Tests
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Panchang Date Boundaries', () => {
  it('returns data for far future date (2099-12-31)', async () => {
    const res = await request(app).get('/api/panchang?date=2099-12-31');
    expect([200, 400]).toContain(res.status); // must not 500
  });

  it('returns data for historical date (1970-01-01)', async () => {
    const res = await request(app).get('/api/panchang?date=1970-01-01');
    expect([200, 400]).toContain(res.status);
  });

  it('handles Feb 30 date gracefully (JS rolls to Mar 2 — does not crash)', async () => {
    const res = await request(app).get('/api/panchang?date=2025-02-30');
    // JS Date('2025-02-30') rolls over silently to 2025-03-02.
    // The panchang service currently accepts this (no strict calendar validation).
    // FINDING: Add strict ISO date validation to reject impossible dates.
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('accepts a valid leap-year date (2024-02-29)', async () => {
    const res = await request(app).get('/api/panchang?date=2024-02-29');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1E: Protected Route Edge Cases
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Protected Routes with Edge Tokens', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('GET /api/auth/me — null Authorization header value', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', '');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me — Bearer with empty token string', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me — Token without "Bearer" prefix', async () => {
    const token = makeUserToken(MOCK_USER);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', token); // missing "Bearer "
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/stats — Non-admin token gets 403', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);
    const token = makeUserToken(MOCK_USER);
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1F: Booking Edge Cases
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Booking Routes', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('POST /api/bookings — rejects unauthenticated booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({ pooja_id: 1, booking_date: '2025-12-01' });
    expect(res.status).toBe(401);
  });

  it('GET /api/bookings/my — rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect(res.status).toBe(401);
  });

  it('GET /api/bookings/INVALID-CODE — returns 401 without auth', async () => {
    const res = await request(app).get('/api/bookings/INVALID-CODE');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 1G: Unknown Routes
// ═══════════════════════════════════════════════════════════════════
describe('Edge Case: Unknown Routes', () => {
  it('GET /api/unknown-route → 404', async () => {
    const res = await request(app).get('/api/this-does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/panchang (wrong method) → 404', async () => {
    const res = await request(app).post('/api/panchang').send({});
    expect(res.status).toBe(404);
  });

  it('DELETE /api/auth/login (wrong method) → 404', async () => {
    const res = await request(app).delete('/api/auth/login');
    expect(res.status).toBe(404);
  });
});
