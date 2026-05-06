// __tests__/error-handling.test.js — Error Handling & Resilience Tests
'use strict';

const request = require('supertest');

// Start with normal mock; individual tests override as needed
const mockQuery = jest.fn().mockResolvedValue([[]]);

jest.mock('../src/config/db', () => ({
  query:         mockQuery,
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
// PART 8A: Database Failure Simulation
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Database Failures', () => {
  it('POST /api/auth/login — DB failure returns 500 with error message', async () => {
    pool.query.mockRejectedValueOnce(new Error('MySQL connection lost'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9307720459', password: 'Test@1234' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    // Should NOT leak internal error details in production
    expect(res.body).not.toHaveProperty('stack');
  });

  it('POST /api/auth/register — DB insert failure returns 500', async () => {
    pool.query
      .mockResolvedValueOnce([[]])           // phone check passes
      .mockRejectedValueOnce(new Error('Deadlock found when trying to get lock'));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', phone: '9000000099', password: 'Pass@123' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/admin/stats — DB failure returns 500 with auth intact', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]]) // authenticate
      .mockRejectedValueOnce(new Error('Table doesnt exist'));

    const token = makeAdminToken(MOCK_ADMIN);
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me — DB failure during user lookup returns 500', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])  // authenticate: user exists
      .mockRejectedValueOnce(new Error('Connection pool exhausted'));

    const token = makeUserToken(MOCK_USER);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8B: Malformed Request Bodies
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Malformed Request Bodies', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('POST /api/auth/register — malformed JSON body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{ name: Test, this is not: valid JSON }');

    expect([400, 422]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('POST /api/auth/login — Content-Type mismatch', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'text/plain')
      .send('phone=9307720459&password=Test@1234');

    // Should not crash the server
    expect(res.status).not.toBe(500);
  });

  it('POST /api/auth/register — JSON with null values', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: null, phone: null, password: null });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/register — JSON with array for name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: ['array', 'injection'], phone: '9876543210', password: 'Pass@123' });

    expect(res.status).not.toBe(500);
  });

  it('POST /api/auth/register — JSON with object for phone', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', phone: { nested: 'object' }, password: 'Pass@123' });

    expect(res.status).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8C: 404 Route Handling
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: 404 Routes', () => {
  const NOT_FOUND_ROUTES = [
    '/api/doesnotexist',
    '/api/users/me',         // wrong path (correct is /api/auth/me)
    '/api/puja',             // typo for /api/poojas
    '/api/admin/delete-all', // nonexistent destructive route
    '/api/superadmin/hack',
  ];

  NOT_FOUND_ROUTES.forEach(route => {
    it(`GET ${route} → 404`, async () => {
      const res = await request(app).get(route);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8D: Error Response Structure Consistency
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Error Response Structure', () => {
  beforeEach(() => pool.query.mockReset().mockResolvedValue([[]]));

  it('All 400 errors have { success: false, message: string }', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
  });

  it('All 401 errors have { success: false }', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.body).toMatchObject({ success: false });
    expect(typeof res.body.message).toBe('string');
  });

  it('All 403 errors have { success: false }', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);
    const token = makeUserToken(MOCK_USER);
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toMatchObject({ success: false });
  });

  it('404 errors have { success: false, message: string }', async () => {
    const res = await request(app).get('/api/this-route-does-not-exist');
    expect(res.body).toMatchObject({
      success: false,
      message: expect.any(String),
    });
  });

  it('Error responses never expose internal stack traces', async () => {
    pool.query.mockRejectedValueOnce(new Error('Internal DB error'));
    const res = await request(app)
      .post('/api/auth/login')
      .send({ phone: '9307720459', password: 'Test' });

    expect(JSON.stringify(res.body)).not.toContain('at Object');
    expect(JSON.stringify(res.body)).not.toContain('node_modules');
    expect(res.body).not.toHaveProperty('stack');
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 8E: Panchang Service Errors
// ═══════════════════════════════════════════════════════════════════
describe('Error Handling: Panchang Calculation Errors', () => {
  it('Invalid date does not crash panchang service', async () => {
    const res = await request(app).get('/api/panchang?date=9999-99-99');
    // FINDING: JS Date is lenient — '9999-99-99' rolls to a valid date instead of rejecting.
    // Service returns 200 with a far-future rolled date instead of 400.
    // Recommendation: Add strict ISO date parsing (no roll-over tolerance).
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  it('Extremely large lat/lon values do not crash server', async () => {
    const res = await request(app)
      .get('/api/panchang?date=2025-01-15&lat=999999&lon=999999');
    expect(res.status).not.toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// PART 9: Logging — No Uncaught Exception Leakage
// ═══════════════════════════════════════════════════════════════════
describe('Logging: No Unhandled Rejection Leakage', () => {
  let unhandledCount = 0;
  let uncaughtCount  = 0;

  beforeAll(() => {
    process.on('unhandledRejection', () => { unhandledCount++; });
    process.on('uncaughtException',  () => { uncaughtCount++;  });
  });

  it('DB failure does not cause unhandled promise rejection', async () => {
    pool.query.mockRejectedValueOnce(new Error('Simulated DB crash'));
    await request(app).post('/api/auth/login').send({ phone: '1', password: '1' });
    // Allow event loop to flush
    await new Promise(r => setTimeout(r, 50));
    expect(unhandledCount).toBe(0);
  });

  it('Malformed token does not cause uncaught exception', async () => {
    await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer !!invalid!!');
    await new Promise(r => setTimeout(r, 50));
    expect(uncaughtCount).toBe(0);
  });
});
