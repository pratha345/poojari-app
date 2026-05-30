// __tests__/pooja.test.js — Pooja Module Tests
// Covers: categories, list (filters/pagination), getBySlug, Admin CRUD
'use strict';

const request = require('supertest');

// ── Mock DB before requiring app ──────────────────────────────────────
jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
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

// ── Shared mock data ───────────────────────────────────────────────────
const MOCK_CATEGORY = {
  id: 1, name_mr: 'गृहपूजा', slug: 'gruhapuja',
  is_active: true, sort_order: 1, image_url: '/uploads/cat1.png',
};

const MOCK_POOJA = {
  id: 1, category_id: 1, name_mr: 'सत्यनारायण पूजा',
  name_en: 'Satyanarayan Puja', slug: 'satyanarayan-pooja',
  short_desc: 'संपूर्ण सत्यनारायण पूजा विधी',
  description: 'विस्तृत वर्णन', price: 1500,
  duration_hrs: 3, image_url: '/uploads/poojas/satyanarayan-pooja.png',
  is_featured: true, is_active: true, views: 250,
  category_name: 'गृहपूजा', category_slug: 'gruhapuja',
};

const MOCK_POOJA_2 = {
  ...MOCK_POOJA, id: 2, name_mr: 'रुद्राभिषेक',
  name_en: 'Rudrabhishek', slug: 'rudra-abhishek',
  price: 2100, is_featured: false,
};

const MOCK_SAMAGRI = [
  { id: 1, pooja_id: 1, item_name: 'दूध',   quantity: '1 लिटर', sort_order: 1 },
  { id: 2, pooja_id: 1, item_name: 'तुळस',   quantity: '10 पाने', sort_order: 2 },
];

const MOCK_REVIEWS = [
  { id: 1, pooja_id: 1, user_id: 10, rating: 5, comment: 'उत्तम!', user_name: 'राहुल' },
];

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/poojas/categories
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/poojas/categories', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns list of active categories', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_CATEGORY,
      { ...MOCK_CATEGORY, id: 2, name_mr: 'विवाह', slug: 'vivah' }
    ]]);

    const res = await request(app).get('/api/poojas/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('name_mr');
    expect(res.body.data[0]).toHaveProperty('slug');
  });

  it('returns empty array when no categories', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/poojas/categories');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('resolves image_url to relative path', async () => {
    pool.query.mockResolvedValueOnce([[{
      ...MOCK_CATEGORY,
      image_url: 'https://example.com/uploads/cat1.png',
    }]]);

    const res = await request(app).get('/api/poojas/categories');

    expect(res.status).toBe(200);
    expect(res.body.data[0].image_url).toBe('/uploads/cat1.png');
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/api/poojas/categories');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/poojas — List with filters
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/poojas — Pooja list', () => {
  beforeEach(() => pool.query.mockReset());

  const mockListResponse = (rows, total = rows.length) => {
    pool.query
      .mockResolvedValueOnce([rows])
      .mockResolvedValueOnce([[{ total }]]);
  };

  it('returns paginated list of active poojas', async () => {
    mockListResponse([MOCK_POOJA, MOCK_POOJA_2]);

    const res = await request(app).get('/api/poojas');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.poojas).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({ total: 2, page: 1, limit: 12 });
  });

  it('filters by category slug', async () => {
    mockListResponse([MOCK_POOJA]);

    const res = await request(app).get('/api/poojas?category=gruhapuja');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas).toHaveLength(1);
  });

  it('filters by featured=true', async () => {
    mockListResponse([MOCK_POOJA]); // only featured one

    const res = await request(app).get('/api/poojas?featured=true');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas[0].is_featured).toBe(true);
  });

  it('searches by Marathi name keyword', async () => {
    mockListResponse([MOCK_POOJA]);

    const res = await request(app).get('/api/poojas?search=सत्यनारायण');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas[0].name_mr).toContain('सत्यनारायण');
  });

  it('filters by min_price', async () => {
    mockListResponse([MOCK_POOJA_2]); // price 2100

    const res = await request(app).get('/api/poojas?min_price=2000');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas[0].price).toBeGreaterThanOrEqual(2000);
  });

  it('filters by max_price', async () => {
    mockListResponse([MOCK_POOJA]); // price 1500

    const res = await request(app).get('/api/poojas?max_price=2000');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas[0].price).toBeLessThanOrEqual(2000);
  });

  it('filters by price range (min + max)', async () => {
    mockListResponse([MOCK_POOJA]);

    const res = await request(app).get('/api/poojas?min_price=1000&max_price=2000');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas).toHaveLength(1);
  });

  it('supports custom page and limit', async () => {
    mockListResponse([], 50);

    const res = await request(app).get('/api/poojas?page=3&limit=6');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination).toMatchObject({ page: 3, limit: 6, total: 50 });
  });

  it('calculates total pages correctly', async () => {
    mockListResponse([], 25);

    const res = await request(app).get('/api/poojas?limit=10');

    expect(res.body.data.pagination.pages).toBe(3); // ceil(25/10)
  });

  it('returns empty poojas list when none match', async () => {
    mockListResponse([]);

    const res = await request(app).get('/api/poojas?category=non-existent');

    expect(res.status).toBe(200);
    expect(res.body.data.poojas).toHaveLength(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/poojas');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/poojas/:slug — Pooja detail
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/poojas/:slug — Pooja detail', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns pooja detail with samagri and reviews', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])    // find pooja
      .mockResolvedValueOnce([MOCK_SAMAGRI])    // samagri
      .mockResolvedValueOnce([MOCK_REVIEWS])    // reviews
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // views update

    const res = await request(app).get('/api/poojas/satyanarayan-pooja');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      slug: 'satyanarayan-pooja',
      name_mr: 'सत्यनारायण पूजा',
    });
    expect(Array.isArray(res.body.data.samagri)).toBe(true);
    expect(Array.isArray(res.body.data.reviews)).toBe(true);
    expect(res.body.data.samagri).toHaveLength(2);
    expect(res.body.data.reviews).toHaveLength(1);
  });

  it('increments view count on each visit', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockResolvedValueOnce([MOCK_SAMAGRI])
      .mockResolvedValueOnce([MOCK_REVIEWS])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app).get('/api/poojas/satyanarayan-pooja');

    // 4th query should be views UPDATE
    const viewsCall = pool.query.mock.calls[3];
    expect(viewsCall[0]).toMatch(/views = views \+ 1/i);
    expect(viewsCall[1]).toContain(MOCK_POOJA.id);
  });

  it('returns 404 for non-existent slug', async () => {
    pool.query.mockResolvedValueOnce([[]]); // not found

    const res = await request(app).get('/api/poojas/not-a-real-pooja');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 404 for inactive (soft-deleted) pooja', async () => {
    // Controller WHERE clause includes is_active = TRUE, so inactive returns empty
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/poojas/deleted-pooja');

    expect(res.status).toBe(404);
  });

  it('resolves full image URL to relative path', async () => {
    pool.query
      .mockResolvedValueOnce([[{
        ...MOCK_POOJA,
        image_url: 'https://cdn.example.com/uploads/poojas/satyanarayan-pooja.png',
      }]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).get('/api/poojas/satyanarayan-pooja');

    expect(res.status).toBe(200);
    expect(res.body.data.image_url).toBe('/uploads/poojas/satyanarayan-pooja.png');
  });

  it('returns pooja even when no samagri or reviews exist', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockResolvedValueOnce([[]])     // empty samagri
      .mockResolvedValueOnce([[]])     // empty reviews
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app).get('/api/poojas/satyanarayan-pooja');

    expect(res.status).toBe(200);
    expect(res.body.data.samagri).toHaveLength(0);
    expect(res.body.data.reviews).toHaveLength(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/poojas/satyanarayan-pooja');
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. POST /api/poojas — Admin: Create pooja
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/poojas — Admin create pooja', () => {
  const newPooja = {
    category_id:  1,
    name_mr:      'नवीन पूजा',
    name_en:      'New Puja',
    slug:         'naveen-puja',
    short_desc:   'लहान वर्णन',
    description:  'विस्तृत वर्णन',
    price:        1200,
    duration_hrs: 2,
    is_featured:  false,
  };

  beforeEach(() => pool.query.mockReset());

  it('creates a new pooja successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])                    // authenticate
      .mockResolvedValueOnce([[]])                              // slug check → not taken
      .mockResolvedValueOnce([{ insertId: 101, affectedRows: 1 }]); // INSERT

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newPooja);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', 101);
    expect(res.body.message).toMatch(/जोडली/);
  });

  it('auto-appends suffix when slug already exists', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])            // authenticate
      .mockResolvedValueOnce([[{ id: 1 }]])             // slug 'naveen-puja' taken
      .mockResolvedValueOnce([[{ id: 2 }]])             // slug 'naveen-puja-2' taken
      .mockResolvedValueOnce([[]])                      // slug 'naveen-puja-3' free
      .mockResolvedValueOnce([{ insertId: 102, affectedRows: 1 }]); // INSERT

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newPooja);

    expect(res.status).toBe(201);
    // The INSERT call should use the modified slug 'naveen-puja-3'
    const insertCall = pool.query.mock.calls.find(c =>
      typeof c[0] === 'string' && c[0].includes('INSERT INTO poojas')
    );
    expect(insertCall).toBeDefined();
    expect(insertCall[1][3]).toBe('naveen-puja-3');
  });

  it('returns 400 when category_id is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newPooja, category_id: undefined });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/आवश्यक/);
  });

  it('returns 400 when name_mr is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newPooja, name_mr: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when slug is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newPooja, slug: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when price is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newPooja, price: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/poojas').send(newPooja);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newPooja);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error during INSERT', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]])                       // slug check ok
      .mockRejectedValueOnce(new Error('DB crash'));     // INSERT fails

    const res = await request(app)
      .post('/api/poojas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newPooja);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. PUT /api/poojas/:id — Admin: Update pooja
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/poojas/:id — Admin update pooja', () => {
  const updatePayload = {
    name_mr:     'अद्यतनित पूजा',
    price:       1800,
    is_featured: true,
  };

  beforeEach(() => pool.query.mockReset());

  it('updates pooja fields successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])           // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }]);   // UPDATE

    const res = await request(app)
      .put('/api/poojas/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अद्यतनित/);
  });

  it('stringifies steps array when provided', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/poojas/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...updatePayload, steps: ['पाऊल १', 'पाऊल २'] });

    expect(res.status).toBe(200);
    // steps should have been JSON.stringified before UPDATE
    const updateCall = pool.query.mock.calls[1];
    const stepsValue = updateCall[1].find(v => v && typeof v === 'string' && v.includes('पाऊल'));
    expect(stepsValue).toBeDefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/poojas/1').send(updatePayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .put('/api/poojas/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .put('/api/poojas/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. DELETE /api/poojas/:id — Admin: Soft delete pooja
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/poojas/:id — Admin soft-delete pooja', () => {
  beforeEach(() => pool.query.mockReset());

  it('soft-deletes (sets is_active=FALSE) successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])           // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }]);   // UPDATE is_active=FALSE

    const res = await request(app)
      .delete('/api/poojas/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/काढली/);

    // Verify it uses UPDATE (soft delete), not DELETE
    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE poojas SET is_active=FALSE/i);
  });

  it('returns 200 even when ID does not exist (no error thrown)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);   // nothing updated

    const res = await request(app)
      .delete('/api/poojas/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/poojas/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .delete('/api/poojas/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .delete('/api/poojas/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
