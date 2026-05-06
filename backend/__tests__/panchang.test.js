// __tests__/panchang.test.js — Panchang API Tests (no DB — pure calculation)
'use strict';

const request = require('supertest');

// ── Mock DB to prevent connection attempts ────────────────────────
jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:  (req, res, next) => next(),
}));

const app = require('../src/app');

// ═══════════════════════════════════════════════════════════════════
// GET /api/panchang
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/panchang', () => {

  it('returns panchang data for a valid date', async () => {
    const res = await request(app).get('/api/panchang?date=2025-01-15');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    expect(data).toHaveProperty('date', '2025-01-15');
    expect(data).toHaveProperty('tithi');
    expect(data).toHaveProperty('nakshatra');
    expect(data).toHaveProperty('yoga');
  });

  it('returns panchang for today when no date param provided', async () => {
    const res = await request(app).get('/api/panchang');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('date');

    // Date should match today IST (within 1-day tolerance)
    const returnedDate = new Date(res.body.data.date);
    const today        = new Date();
    const diffDays     = Math.abs((today - returnedDate) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThan(2);
  });

  it('returns 400 for invalid date format', async () => {
    const res = await request(app).get('/api/panchang?date=15-01-2025');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/अवैध तारीख/);
  });

  it('returns 400 for out-of-range latitude', async () => {
    const res = await request(app).get('/api/panchang?date=2025-01-15&lat=200');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/अक्षांश/);
  });

  it('returns 400 for out-of-range longitude', async () => {
    const res = await request(app).get('/api/panchang?date=2025-01-15&lon=-200');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('accepts custom lat/lon for a different city', async () => {
    // Mumbai coordinates
    const res = await request(app)
      .get('/api/panchang?date=2025-03-20&lat=19.0760&lon=72.8777');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('sunrise');
    expect(res.body.data).toHaveProperty('sunset');
  });

  it('ignores malformed time param and uses default', async () => {
    const res = await request(app)
      .get('/api/panchang?date=2025-01-15&time=badtime');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
