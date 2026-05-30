// __tests__/admin.test.js — Admin API Tests
'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  // admin.controller uses pool.escape() inside tenantFilter() — must be mocked
  escape:        jest.fn(val => `'${String(val)}'`),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant:    (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1, plan: 'premium' }; next(); },
  attachTenant:     (req, res, next) => { req.tenantId = req.user?.tenant_id ?? 1; next(); },
  subscriptionGate: (req, res, next) => next(),
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER, MOCK_PUJARI_USER, MOCK_PENDING_PUJARI, MOCK_APPROVED_PUJARI } = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);
const userToken  = makeUserToken(MOCK_USER);

// ═══════════════════════════════════════════════════════════════════
// Route Protection Tests
// ═══════════════════════════════════════════════════════════════════
describe('Admin route protection', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('GET /api/admin/stats → 401 without token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/stats → 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]); // authenticate returns normal user
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/परवानगी नाही/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/admin/pujaris/pending
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/admin/pujaris/pending', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('returns list of pending pujaris for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])         // authenticate
      .mockResolvedValueOnce([[MOCK_PENDING_PUJARI, { ...MOCK_PENDING_PUJARI, id: 11 }]]); // controller

    const res = await request(app)
      .get('/api/admin/pujaris/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('returns empty array when no pending pujaris', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // empty

    const res = await request(app)
      .get('/api/admin/pujaris/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/admin/pujaris (approved)
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/admin/pujaris', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('returns approved pujaris list for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])             // authenticate
      .mockResolvedValueOnce([[{ total: 1 }]])           // COUNT(*) — runs first in controller
      .mockResolvedValueOnce([[MOCK_APPROVED_PUJARI]]); // SELECT rows

    const res = await request(app)
      .get('/api/admin/pujaris')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rows[0]).toMatchObject({ status: 'approved' });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PUT /api/admin/pujaris/:id/respond
// ═══════════════════════════════════════════════════════════════════
describe('PUT /api/admin/pujaris/:id/respond', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('approves a pending pujari', async () => {
    // Controller: authenticate → UPDATE pujari_profiles → SELECT user_id → UPDATE users
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])                     // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }])             // UPDATE pujari_profiles status
      .mockResolvedValueOnce([[{ user_id: MOCK_PUJARI_USER.id }]]) // SELECT user_id (for approve)
      .mockResolvedValueOnce([{ affectedRows: 1 }]);            // UPDATE users SET role='pujari'

    const res = await request(app)
      .put(`/api/admin/pujaris/${MOCK_PENDING_PUJARI.id}/respond`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'approve' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects a pending pujari', async () => {
    // Reject: authenticate → UPDATE pujari_profiles (no extra SELECT/UPDATE for role)
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put(`/api/admin/pujaris/${MOCK_PENDING_PUJARI.id}/respond`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'reject' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .put('/api/admin/pujaris/1/respond')
      .send({ action: 'approve' });

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/admin/bookings
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/admin/bookings', () => {
  const MOCK_BOOKING = {
    id:           1,
    booking_code: 'POJ-2025-001',
    pooja_name:   'सत्यनारायण पूजा',
    status:       'pending',
    booking_date: '2025-06-01',
    tenant_id:    1,
  };

  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('returns all bookings for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_BOOKING]]);

    const res = await request(app)
      .get('/api/admin/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
