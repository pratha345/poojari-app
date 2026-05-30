// __tests__/admin-extended.test.js — Admin Extended Tests
// Covers: stats, assign-pujari, reviews CRUD, getAllUsers, samagri CRUD
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
  subscriptionGate: (req, res, next) => next(),
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER }         = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);
const userToken  = makeUserToken(MOCK_USER);

const MOCK_REVIEW = {
  id: 1, rating: 5, comment: 'उत्तम पूजा!', is_approved: false,
  created_at: '2026-01-01T00:00:00.000Z',
  user_phone: '9876543210', pujari_name: 'राम शास्त्री',
  pooja_name: 'सत्यनारायण पूजा', pujari_id: 10,
};

const MOCK_SAMAGRI = {
  id: 1, pooja_id: 1, name_mr: 'दूध', name_en: 'Milk',
  quantity: '1', unit: 'लिटर', note: null, sort_order: 1,
};

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/admin/stats — Dashboard stats
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/admin/stats — Admin dashboard stats', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all dashboard counts for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ total: 50 }]])   // users
      .mockResolvedValueOnce([[{ total: 12 }]])   // approved pujaris
      .mockResolvedValueOnce([[{ total: 3 }]])    // pending pujaris
      .mockResolvedValueOnce([[{ total: 80 }]])   // bookings
      .mockResolvedValueOnce([[{ total: null }]]); // revenue (null → 0)

    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      users: 50, pujaris: 12, pending_pujaris: 3, bookings: 80, revenue: 0,
    });
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. PUT /api/admin/bookings/:id/assign-pujari
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/admin/bookings/:id/assign-pujari — Assign pujari', () => {
  beforeEach(() => pool.query.mockReset());

  it('assigns pujari and confirms booking', async () => {
    // Controller sequence: authenticate → SELECT booking → UPDATE bookings
    //   → UPDATE pujari total_bookings (increment) → SELECT pujari phone (for SMS)
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])              // authenticate (call 0)
      .mockResolvedValueOnce([[{                           // SELECT booking (call 1)
        pujari_id:    null,                                // no prior pujari → fresh assignment
        booking_code: 'POJ-001',
        pooja_name:   'सत्यनारायण पूजा',
        user_phone:   '9307720459',
        user_name:    'Test User',
        booking_date: '2026-07-15',
      }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])       // UPDATE bookings (call 2)
      .mockResolvedValueOnce([{ affectedRows: 1 }])       // UPDATE pujari total_bookings (call 3)
      .mockResolvedValueOnce([[{ full_name: 'राम शास्त्री', phone: '9000000001' }]]); // SELECT pujari phone (call 4)

    const res = await request(app)
      .put('/api/admin/bookings/100/assign-pujari')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pujari_id: 10 });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/नियुक्त/);

    const bookingUpdate = pool.query.mock.calls[2];  // UPDATE bookings is call index 2
    expect(bookingUpdate[0]).toMatch(/status='confirmed'/i);
    expect(bookingUpdate[1]).toContain(10);  // pujari_id

    const pujariUpdate = pool.query.mock.calls[3];  // UPDATE pujari is call index 3
    expect(pujariUpdate[0]).toMatch(/total_bookings = total_bookings \+ 1/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/admin/bookings/100/assign-pujari')
      .send({ pujari_id: 10 });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);
    const res = await request(app)
      .put('/api/admin/bookings/100/assign-pujari')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ pujari_id: 10 });
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/admin/reviews — List reviews
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/admin/reviews — Admin reviews list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all reviews by default', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_REVIEW, { ...MOCK_REVIEW, id: 2, is_approved: true }]]);

    const res = await request(app)
      .get('/api/admin/reviews')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('pujari_name');
    expect(res.body.data[0]).toHaveProperty('pooja_name');
  });

  it('filters pending reviews (status=pending)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_REVIEW]]);

    await request(app)
      .get('/api/admin/reviews?status=pending')
      .set('Authorization', `Bearer ${adminToken}`);

    const reviewsCall = pool.query.mock.calls[1];
    expect(reviewsCall[0]).toMatch(/is_approved = FALSE/i);
  });

  it('filters approved reviews (status=approved)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ ...MOCK_REVIEW, is_approved: true }]]);

    await request(app)
      .get('/api/admin/reviews?status=approved')
      .set('Authorization', `Bearer ${adminToken}`);

    const reviewsCall = pool.query.mock.calls[1];
    expect(reviewsCall[0]).toMatch(/is_approved = TRUE/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/reviews');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. PUT /api/admin/reviews/:id/approve — Approve review
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/admin/reviews/:id/approve — Approve review', () => {
  beforeEach(() => pool.query.mockReset());

  it('approves a review', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/admin/reviews/1/approve')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/मंजूर/);

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/SET is_approved=TRUE/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/admin/reviews/1/approve');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. PUT /api/admin/reviews/bulk-approve — Bulk approve
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/admin/reviews/bulk-approve — Bulk approve reviews', () => {
  beforeEach(() => pool.query.mockReset());

  it('bulk-approves multiple reviews and recalculates pujari avg', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 3 }])             // UPDATE reviews
      .mockResolvedValueOnce([[{ pujari_id: 10 }, { pujari_id: 11 }]]) // affected pujaris
      .mockResolvedValueOnce([{ affectedRows: 1 }])             // recalc pujari 10
      .mockResolvedValueOnce([{ affectedRows: 1 }]);            // recalc pujari 11

    const res = await request(app)
      .put('/api/admin/reviews/bulk-approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: [1, 2, 3] });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/3 अभिप्राय मंजूर/);
  });

  it('returns 400 when ids array is empty', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .put('/api/admin/reviews/bulk-approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: [] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/IDs आवश्यक/);
  });

  it('returns 400 when ids is not an array', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .put('/api/admin/reviews/bulk-approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ids: 'not-array' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/admin/reviews/bulk-approve')
      .send({ ids: [1, 2] });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. DELETE /api/admin/reviews/:id — Delete review
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/admin/reviews/:id — Delete review', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes review and recalculates pujari avg_rating', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ pujari_id: 10 }]])   // find review
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // DELETE
      .mockResolvedValueOnce([{ affectedRows: 1 }]);  // UPDATE pujari avg

    const res = await request(app)
      .delete('/api/admin/reviews/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/काढला/);

    const avgUpdate = pool.query.mock.calls[3];
    expect(avgUpdate[0]).toMatch(/avg_rating/i);
    expect(avgUpdate[1]).toContain(10); // pujari_id
  });

  it('returns 404 when review not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .delete('/api/admin/reviews/999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडला नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/admin/reviews/1');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. Samagri CRUD (/api/admin/samagri/...)
// ═══════════════════════════════════════════════════════════════════════
describe('Samagri CRUD — Admin samagri management', () => {
  beforeEach(() => pool.query.mockReset());

  // GET /api/admin/samagri/:pooja_id
  it('GET /samagri/:pooja_id — returns samagri for pooja', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_SAMAGRI, { ...MOCK_SAMAGRI, id: 2, name_mr: 'तूप' }]]);

    const res = await request(app)
      .get('/api/admin/samagri/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('name_mr');
  });

  // POST /api/admin/samagri
  it('POST /samagri — creates samagri item', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 10, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/admin/samagri')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pooja_id: 1, name_mr: 'केळी', quantity: '2', unit: 'नग' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.id).toBe(10);
    expect(res.body.message).toMatch(/जोडले/);
  });

  it('POST /samagri — returns 400 when pooja_id missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/admin/samagri')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name_mr: 'दूध' }); // no pooja_id

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/पूजा.*नाव.*आवश्यक/);
  });

  // POST /api/admin/samagri/bulk
  it('POST /samagri/bulk — bulk creates multiple items', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 3 }]);

    const items = [
      { name_mr: 'दूध', quantity: '1', unit: 'लिटर' },
      { name_mr: 'तूप', quantity: '100', unit: 'ग्रॅम' },
      { name_mr: 'साखर', quantity: '50', unit: 'ग्रॅम' },
    ];

    const res = await request(app)
      .post('/api/admin/samagri/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pooja_id: 1, items });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/3 साहित्य जोडले/);
  });

  it('POST /samagri/bulk — returns 400 when items empty', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/admin/samagri/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ pooja_id: 1, items: [] });

    expect(res.status).toBe(400);
  });

  // PUT /api/admin/samagri/:id
  it('PUT /samagri/:id — updates samagri item', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/admin/samagri/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name_mr: 'दूध (अद्यतनित)', quantity: '2', unit: 'लिटर' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/अपडेट/);
  });

  // DELETE /api/admin/samagri/:id
  it('DELETE /samagri/:id — deletes single samagri item', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/admin/samagri/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/हटवले/);

    const deleteCall = pool.query.mock.calls[1];
    expect(deleteCall[0]).toMatch(/DELETE FROM samagri_items/i);
  });

  // DELETE /api/admin/samagri/pooja/:pooja_id
  it('DELETE /samagri/pooja/:pooja_id — deletes all items for a pooja', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 5 }]);

    const res = await request(app)
      .delete('/api/admin/samagri/pooja/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/5 साहित्य हटवले/);
    expect(res.body.count).toBe(5);
  });

  // Auth check
  it('returns 401 on samagri route without token', async () => {
    const res = await request(app).get('/api/admin/samagri/1');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. GET /api/admin/users — Admin user list
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/admin/users — Admin user list', () => {
  beforeEach(() => pool.query.mockReset());

  const MOCK_ADMIN_USER_CTRL = require('../src/controllers/admin.controller');

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
