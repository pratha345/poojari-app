// __tests__/superadmin.test.js — SuperAdmin Module Tests
// Covers: stats, tenant CRUD (transaction), tenant stats, getAllUsers (filters)
'use strict';

const request = require('supertest');

// ── Mock DB with full transaction support ────────────────────────────
const mockConn = {
  beginTransaction: jest.fn().mockResolvedValue(undefined),
  query:            jest.fn().mockResolvedValue([[]]),
  commit:           jest.fn().mockResolvedValue(undefined),
  rollback:         jest.fn().mockResolvedValue(undefined),
  release:          jest.fn(),
};

jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue(mockConn),
  escape:        jest.fn(v => `'${String(v)}'`),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:  (req, res, next) => { req.tenantId = req.user?.tenant_id ?? 1; next(); },
  subscriptionGate: (req, res, next) => next(),
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const jwt  = require('jsonwebtoken');

// ── Super-admin token (role must be 'super_admin') ───────────────────
const MOCK_SUPER_ADMIN = { id: 999, name: 'Super Admin', role: 'super_admin', tenant_id: null, is_active: true };
const superAdminToken  = jwt.sign(
  { id: MOCK_SUPER_ADMIN.id, role: 'super_admin', tenant_id: null },
  process.env.JWT_SECRET,
  { expiresIn: '1d' }
);

const MOCK_TENANT = {
  id: 2, name: 'Test Pandit', slug: 'test-pandit', domain: 'test.com',
  plan: 'basic', is_active: true, created_at: '2026-01-01T00:00:00.000Z',
  user_count: 5, pujari_count: 3, booking_count: 10, admin_email: 'admin@test.com',
};

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/superadmin/stats
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/superadmin/stats — Platform stats', () => {
  beforeEach(() => { pool.query.mockReset(); mockConn.query.mockReset(); });

  it('returns platform-wide stats for super_admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])       // authenticate
      .mockResolvedValueOnce([[{ total: 5 }]])           // tenants count
      .mockResolvedValueOnce([[{ total: 200 }]])         // users count
      .mockResolvedValueOnce([[{ total: 50 }]])          // pujaris count
      .mockResolvedValueOnce([[{ total: 300 }]])         // bookings count
      .mockResolvedValueOnce([[{ total: 450000 }]]);     // revenue

    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      tenants: 5, users: 200, pujaris: 50, bookings: 300, revenue: 450000,
    });
  });

  it('returns revenue 0 when no paid bookings', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[{ total: 1 }]])
      .mockResolvedValueOnce([[{ total: 10 }]])
      .mockResolvedValueOnce([[{ total: 5 }]])
      .mockResolvedValueOnce([[{ total: 20 }]])
      .mockResolvedValueOnce([[{ total: null }]]);       // null → 0

    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.body.data.revenue).toBe(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/superadmin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for regular admin (not super_admin)', async () => {
    const { MOCK_ADMIN } = require('./helpers/mockDb');
    const { makeAdminToken } = require('./helpers/authHelper');
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .get('/api/superadmin/stats')
      .set('Authorization', `Bearer ${makeAdminToken(MOCK_ADMIN)}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/सुपर-ॲडमिन/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/superadmin/tenants — List all tenants
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/superadmin/tenants — Tenant list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns list of all tenants with counts', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[MOCK_TENANT, { ...MOCK_TENANT, id: 3 }]]);

    const res = await request(app)
      .get('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('user_count');
    expect(res.body.data[0]).toHaveProperty('admin_email');
  });

  it('returns 403 for regular admin', async () => {
    const { MOCK_ADMIN } = require('./helpers/mockDb');
    const { makeAdminToken } = require('./helpers/authHelper');
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .get('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${makeAdminToken(MOCK_ADMIN)}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/superadmin/tenants/:id — Single tenant
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/superadmin/tenants/:id — Single tenant', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns tenant by id', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[MOCK_TENANT]]);

    const res = await request(app)
      .get('/api/superadmin/tenants/2')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 2, slug: 'test-pandit' });
  });

  it('returns 404 for non-existent tenant', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .get('/api/superadmin/tenants/9999')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडला नाही/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. POST /api/superadmin/tenants — Create tenant (transaction)
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/superadmin/tenants — Create tenant', () => {
  const newTenant = {
    name: 'नवीन पंडित सेवा', slug: 'naveen-pandit', domain: 'naveen.com',
    plan: 'basic',
    admin_name: 'नवीन शर्मा', admin_email: 'naveen@test.com',
    admin_phone: '9123456789', admin_password: 'Admin@123',
  };

  beforeEach(() => {
    pool.query.mockReset();
    mockConn.query.mockReset();
    mockConn.beginTransaction.mockResolvedValue(undefined);
    mockConn.commit.mockResolvedValue(undefined);
    mockConn.rollback.mockResolvedValue(undefined);
    mockConn.release.mockReset();
  });

  it('creates tenant with admin user in a transaction', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_SUPER_ADMIN]]);  // authenticate

    mockConn.query
      .mockResolvedValueOnce([[]])                              // check slug → not taken
      .mockResolvedValueOnce([{ insertId: 5, affectedRows: 1 }]) // INSERT tenant
      .mockResolvedValueOnce([{ insertId: 50 }])               // INSERT admin user
      .mockResolvedValueOnce([{ insertId: 1 }]);               // INSERT site_settings

    const res = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(newTenant);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('tenant_id', 5);
    expect(res.body.message).toMatch(/तयार केला/);
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  it('returns 400 when slug already taken', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_SUPER_ADMIN]]);
    mockConn.query.mockResolvedValueOnce([[{ id: 2 }]]);  // slug exists

    const res = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(newTenant);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/slug.*वापरले/);
  });

  it('returns 400 when required fields missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_SUPER_ADMIN]]);

    const res = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Test', slug: 'test' }); // missing required fields

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/आवश्यक/);
  });

  it('rolls back transaction on DB error', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_SUPER_ADMIN]]);
    mockConn.query
      .mockResolvedValueOnce([[]])                          // slug check
      .mockRejectedValueOnce(new Error('INSERT failed'));   // INSERT fails

    const res = await request(app)
      .post('/api/superadmin/tenants')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send(newTenant);

    expect(res.status).toBe(500);
    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/superadmin/tenants').send(newTenant);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. PUT /api/superadmin/tenants/:id — Update tenant
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/superadmin/tenants/:id — Update tenant', () => {
  beforeEach(() => pool.query.mockReset());

  it('updates tenant with COALESCE fields', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/superadmin/tenants/2')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Updated Name', plan: 'pro' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/अपडेट/);

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/COALESCE/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/superadmin/tenants/2').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. DELETE /api/superadmin/tenants/:id — Delete tenant
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/superadmin/tenants/:id — Delete tenant', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes non-default tenant', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/superadmin/tenants/2')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/काढला/);
  });

  it('returns 400 when trying to delete default tenant (id=1)', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_SUPER_ADMIN]]);

    const res = await request(app)
      .delete('/api/superadmin/tenants/1')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Default tenant/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/superadmin/tenants/2');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. GET /api/superadmin/tenants/:id/stats — Tenant-level stats
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/superadmin/tenants/:id/stats — Tenant stats', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all stats for a specific tenant', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[{ total: 25 }]])    // users
      .mockResolvedValueOnce([[{ total: 8 }]])     // approved pujaris
      .mockResolvedValueOnce([[{ total: 2 }]])     // pending pujaris
      .mockResolvedValueOnce([[{ total: 80 }]])    // bookings
      .mockResolvedValueOnce([[{ total: 75000 }]]); // revenue

    const res = await request(app)
      .get('/api/superadmin/tenants/2/stats')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      users: 25, pujaris: 8, pending_pujaris: 2,
      bookings: 80, revenue: 75000,
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. GET /api/superadmin/users — All users across tenants
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/superadmin/users — All users', () => {
  beforeEach(() => pool.query.mockReset());

  const MOCK_USER_ROW = {
    id: 1, name: 'Test User', phone: '9307720459', email: 'test@test.com',
    role: 'user', is_active: true, created_at: '2026-01-01T00:00:00.000Z',
    tenant_name: 'Test Pandit', tenant_slug: 'test-pandit',
  };

  it('returns paginated users across all tenants', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[MOCK_USER_ROW]])          // rows
      .mockResolvedValueOnce([[{ total: 1 }]]);          // count

    const res = await request(app)
      .get('/api/superadmin/users')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rows).toHaveLength(1);
    expect(res.body.data).toMatchObject({ total: 1, page: 1, limit: 20 });
    expect(res.body.data.rows[0]).toHaveProperty('tenant_name');
  });

  it('filters by tenant_id', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[MOCK_USER_ROW]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    await request(app)
      .get('/api/superadmin/users?tenant_id=2')
      .set('Authorization', `Bearer ${superAdminToken}`);

    const usersCall = pool.query.mock.calls[1];
    expect(usersCall[1]).toContain('2'); // tenant_id in params
  });

  it('filters by role', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[{ ...MOCK_USER_ROW, role: 'pujari' }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    await request(app)
      .get('/api/superadmin/users?role=pujari')
      .set('Authorization', `Bearer ${superAdminToken}`);

    const usersCall = pool.query.mock.calls[1];
    expect(usersCall[1]).toContain('pujari');
  });

  it('excludes super_admin from results', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SUPER_ADMIN]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await request(app)
      .get('/api/superadmin/users')
      .set('Authorization', `Bearer ${superAdminToken}`);

    const usersCall = pool.query.mock.calls[1];
    expect(usersCall[0]).toMatch(/role != .?super_admin.?/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/superadmin/users');
    expect(res.status).toBe(401);
  });
});
