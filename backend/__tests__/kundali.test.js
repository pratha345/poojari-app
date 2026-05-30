// __tests__/kundali.test.js — Kundali Milan API Tests (admin-only)
'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  // kundaliController doesn't use pool.escape(), but include for safety
  escape:        jest.fn(val => `'${String(val)}'`),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:  (req, res, next) => { req.tenantId = req.user?.tenant_id ?? 1; next(); },
  subscriptionGate: (req, res, next) => next(),
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER }         = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);
const userToken  = makeUserToken(MOCK_USER);

// Controller expects { bride: { name, dob }, groom: { name, dob } }
const VALID_KUNDALI_PAYLOAD = {
  bride: { name: 'प्रिया देशमुख', dob: '1997-09-22' },
  groom: { name: 'राहुल जोशी',   dob: '1995-06-15' },
};

// ═══════════════════════════════════════════════════════════════════
// Route Protection
// ═══════════════════════════════════════════════════════════════════
describe('Kundali route protection', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('POST /api/kundali/match → 401 without token', async () => {
    const res = await request(app)
      .post('/api/kundali/match')
      .send(VALID_KUNDALI_PAYLOAD);

    expect(res.status).toBe(401);
  });

  it('POST /api/kundali/match → 403 for regular user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${userToken}`)
      .send(VALID_KUNDALI_PAYLOAD);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/kundali/match — pure calculation, no DB write
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/kundali/match', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('returns kundali match result with totalGun for admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]); // authenticate

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VALID_KUNDALI_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;
    // matchKundali returns: { bride, groom, totalGun, maxGun, percent, result, grade, kootas, doshas, recommendation }
    expect(data).toHaveProperty('totalGun');
    expect(typeof data.totalGun).toBe('number');
    expect(data.totalGun).toBeGreaterThanOrEqual(0);
    expect(data.totalGun).toBeLessThanOrEqual(36);
  });

  it('result includes grade and recommendation', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VALID_KUNDALI_PAYLOAD);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data).toHaveProperty('grade');
    expect(data).toHaveProperty('recommendation');
    expect(data).toHaveProperty('kootas');
    expect(Array.isArray(data.kootas)).toBe(true);
  });

  it('includes bride and groom details with nakshatra/rashi', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(VALID_KUNDALI_PAYLOAD);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('bride');
    expect(res.body.data).toHaveProperty('groom');
    expect(res.body.data.bride).toHaveProperty('nakshatra');
    expect(res.body.data.groom).toHaveProperty('rashi');
  });

  it('returns 400 when bride/groom fields are missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: { name: 'Only Bride Name' } }); // no dob, no groom

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/नाव व जन्मतारीख/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/kundali — list saved matches
// Controller does: SELECT rows → SELECT COUNT(*) (two queries in that order)
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/kundali', () => {
  const MOCK_MATCH = {
    id: 1, bride_name: 'प्रिया', groom_name: 'राहुल',
    total_gun: 28, grade: 'A', created_at: new Date().toISOString(),
  };

  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('returns saved kundali list for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])       // authenticate
      .mockResolvedValueOnce([[MOCK_MATCH]])        // SELECT rows
      .mockResolvedValueOnce([[{ total: 1 }]]);    // SELECT COUNT(*)

    const res = await request(app)
      .get('/api/kundali')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('rows');
    expect(Array.isArray(res.body.data.rows)).toBe(true);
    expect(res.body.data).toHaveProperty('total', 1);
  });

  it('returns empty list when no matches saved', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]])                 // empty rows
      .mockResolvedValueOnce([[{ total: 0 }]]);   // count = 0

    const res = await request(app)
      .get('/api/kundali')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rows).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});
