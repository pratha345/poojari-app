// __tests__/auth.test.js — Authentication API Tests
'use strict';

const request = require('supertest');
const bcrypt  = require('bcryptjs');

// ── Mock database BEFORE requiring the app ────────────────────────
jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
}));

// ── Mock tenant middleware (no DB calls needed) ───────────────────
jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:  (req, res, next) => { req.tenantId = req.user?.tenant_id ?? 1; next(); },
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeUserToken, makeExpiredToken } = require('./helpers/authHelper');
const { MOCK_USER, getHashedPassword }    = require('./helpers/mockDb');

// ═══════════════════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/auth/register', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('registers a new user and returns token + user', async () => {
    pool.query
      .mockResolvedValueOnce([[]])                                    // phone not taken
      .mockResolvedValueOnce([{ insertId: 42, affectedRows: 1 }]);   // INSERT

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'New User', phone: '9876543210', password: 'Pass@123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({ name: 'New User', phone: '9876543210' });
  });

  it('returns 400 when phone is already registered', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 1 }]]); // phone exists

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup User', phone: '9307720459', password: 'Pass@123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/आधीच नोंदणीकृत/);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Phone' }); // missing phone and password

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {
  let hashedPassword;

  beforeAll(async () => {
    hashedPassword = await getHashedPassword();
  });

  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('logs in with correct credentials and returns token', async () => {
    pool.query.mockResolvedValueOnce([[{
      ...MOCK_USER,
      password: hashedPassword,
    }]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: MOCK_USER.phone, password: 'Test@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.user).toMatchObject({ phone: MOCK_USER.phone, role: 'user' });
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('returns 401 with wrong password', async () => {
    pool.query.mockResolvedValueOnce([[{
      ...MOCK_USER,
      password: hashedPassword,
    }]]);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: MOCK_USER.phone, password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 when user not found', async () => {
    pool.query.mockResolvedValueOnce([[]]); // no user found

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '0000000000', password: 'Pass@123' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9307720459' }); // missing password

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// GET /api/auth/me — Protected route
// ═══════════════════════════════════════════════════════════════════
describe('GET /api/auth/me', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('returns user data with valid token', async () => {
    const token = makeUserToken(MOCK_USER);
    // authenticate middleware does one query; getMe controller does a second query
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])  // authenticate: SELECT ... WHERE id = ?
      .mockResolvedValueOnce([[MOCK_USER]]); // getMe: SELECT id,name,phone... WHERE id = ?

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('phone', MOCK_USER.phone);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 with expired token', async () => {
    const token = makeExpiredToken(MOCK_USER);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.real.token');

    expect(res.status).toBe(401);
  });
});
