// __tests__/gallery.test.js — Gallery Module Tests
// Covers: getGallery (filters/pagination), getGalleryItem, getGalleryStats,
//         getAdminGallery, selectImage, togglePublish, deleteGalleryItem, deleteByFestival
'use strict';

const request = require('supertest');

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

const MOCK_ITEM = {
  id: 1, festival_name: 'गणेश चतुर्थी', festival_slug: 'ganesh-chaturthi',
  image_url: '/uploads/festivals/ganesh-1.webp', thumb_url: '/uploads/festivals/thumbs/ganesh-1-thumb.webp',
  filename: 'ganesh-1.webp', theme_type: 'poster', style: 'realistic',
  variant: 1, is_selected: false, is_published: true,
  colors: '["#FF6B00","#FFFFFF"]', mood: 'festive',
  created_at: '2026-08-01T00:00:00.000Z',
};

const MOCK_ITEM_2 = { ...MOCK_ITEM, id: 2, filename: 'ganesh-2.webp', is_selected: true };

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/gallery — Public list with filters
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/gallery — Public gallery list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns paginated gallery items (published only)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 2 }]])
      .mockResolvedValueOnce([[MOCK_ITEM, MOCK_ITEM_2]]);

    const res = await request(app).get('/api/gallery');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data).toMatchObject({ total: 2, page: 1, limit: 24 });
  });

  it('only queries published items (is_published = TRUE)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ total: 0 }]])
      .mockResolvedValueOnce([[]]);

    await request(app).get('/api/gallery');

    expect(pool.query.mock.calls[0][0]).toMatch(/is_published = TRUE/i);
  });

  it('filters by festival slug', async () => {
    pool.query.mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[MOCK_ITEM]]);

    const res = await request(app).get('/api/gallery?festival=ganesh-chaturthi');

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toContain('ganesh-chaturthi');
  });

  it('filters by theme_type', async () => {
    pool.query.mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[MOCK_ITEM]]);

    const res = await request(app).get('/api/gallery?theme_type=poster');

    expect(res.status).toBe(200);
    expect(pool.query.mock.calls[0][0]).toMatch(/theme_type = \?/i);
  });

  it('filters by style', async () => {
    pool.query.mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[MOCK_ITEM]]);

    await request(app).get('/api/gallery?style=realistic');

    expect(pool.query.mock.calls[0][0]).toMatch(/style = \?/i);
  });

  it('filters by search keyword', async () => {
    pool.query.mockResolvedValueOnce([[{ total: 1 }]]).mockResolvedValueOnce([[MOCK_ITEM]]);

    await request(app).get('/api/gallery?search=गणेश');

    expect(pool.query.mock.calls[0][1]).toContain('%गणेश%');
  });

  it('calculates pages correctly', async () => {
    pool.query.mockResolvedValueOnce([[{ total: 48 }]]).mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/gallery?limit=24');

    expect(res.body.data.pages).toBe(2);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/gallery');
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/gallery/:id — Single gallery item (public)
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/gallery/:id — Gallery item detail', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns gallery item by id', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ITEM]]);

    const res = await request(app).get('/api/gallery/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ id: 1, festival_name: 'गणेश चतुर्थी' });
  });

  it('returns 404 when item not found', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/gallery/9999');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/gallery/stats — Admin stats
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/gallery/stats — Gallery stats (admin)', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns totals, by-festival and by-type stats', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ total: 50, selected: 10, published: 40, total_size: 10000 }]])
      .mockResolvedValueOnce([[{ festival_name: 'गणेश चतुर्थी', festival_slug: 'ganesh-chaturthi', count: 12 }]])
      .mockResolvedValueOnce([[{ theme_type: 'poster', count: 35 }]]);

    const res = await request(app)
      .get('/api/gallery/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totals');
    expect(res.body.data).toHaveProperty('byFestival');
    expect(res.body.data).toHaveProperty('byType');
    expect(res.body.data.totals.total).toBe(50);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/gallery/stats');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .get('/api/gallery/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. GET /api/gallery/admin — Admin gallery (all items + filters)
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/gallery/admin — Admin gallery list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all items including unpublished, plus filter dropdowns', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ total: 3 }]])
      .mockResolvedValueOnce([[MOCK_ITEM, MOCK_ITEM_2, { ...MOCK_ITEM, id: 3, is_published: false }]])
      .mockResolvedValueOnce([[{ festival_name: 'गणेश चतुर्थी', festival_slug: 'ganesh-chaturthi' }]])
      .mockResolvedValueOnce([[{ theme_type: 'poster' }]])
      .mockResolvedValueOnce([[{ style: 'realistic' }]]);

    const res = await request(app)
      .get('/api/gallery/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data.filters).toHaveProperty('festivals');
    expect(res.body.data.filters).toHaveProperty('themeTypes');
    expect(res.body.data.filters).toHaveProperty('styles');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/gallery/admin');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. PATCH /api/gallery/:id/select — Select best image
// ═══════════════════════════════════════════════════════════════════════
describe('PATCH /api/gallery/:id/select — Select image', () => {
  beforeEach(() => pool.query.mockReset());

  it('selects image and unselects others in same festival+type', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_ITEM]])              // find item
      .mockResolvedValueOnce([{ affectedRows: 2 }])      // unselect others
      .mockResolvedValueOnce([{ affectedRows: 1 }]);     // select this one

    const res = await request(app)
      .patch('/api/gallery/1/select')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: '1', is_selected: true });

    // Verify: first UPDATE sets is_selected=FALSE for same festival+type
    const unselectCall = pool.query.mock.calls[2];
    expect(unselectCall[0]).toMatch(/is_selected = FALSE/i);
    expect(unselectCall[1]).toContain(MOCK_ITEM.festival_slug);
  });

  it('returns 404 when item not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .patch('/api/gallery/999/select')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/gallery/1/select');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. PATCH /api/gallery/:id/publish — Toggle publish
// ═══════════════════════════════════════════════════════════════════════
describe('PATCH /api/gallery/:id/publish — Toggle publish', () => {
  beforeEach(() => pool.query.mockReset());

  it('unpublishes a published item', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ is_published: true }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .patch('/api/gallery/1/publish')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_published).toBe(false);
    expect(res.body.message).toBe('Unpublished');
  });

  it('publishes an unpublished item', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{ is_published: false }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .patch('/api/gallery/1/publish')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.is_published).toBe(true);
    expect(res.body.message).toBe('Published');
  });

  it('returns 404 when item not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .patch('/api/gallery/999/publish')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/gallery/1/publish');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. DELETE /api/gallery/:id — Delete single item
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/gallery/:id — Delete gallery item', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes gallery item successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_ITEM]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/gallery/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/काढली/);

    const deleteCall = pool.query.mock.calls[2];
    expect(deleteCall[0]).toMatch(/DELETE FROM poster_gallery/i);
  });

  it('returns 404 when item not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .delete('/api/gallery/999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/gallery/1');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. DELETE /api/gallery/festival/:slug — Delete all by festival
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/gallery/festival/:slug — Delete by festival', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes all items for a festival', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_ITEM, MOCK_ITEM_2]])  // 2 items found
      .mockResolvedValueOnce([{ affectedRows: 2 }]);

    const res = await request(app)
      .delete('/api/gallery/festival/ganesh-chaturthi')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(2);
    expect(res.body.message).toMatch(/2 images काढल्या/);
  });

  it('returns 0 deleted when no items for festival', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]])                       // no items
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/gallery/festival/non-existent-festival')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/gallery/festival/ganesh-chaturthi');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .delete('/api/gallery/festival/ganesh-chaturthi')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
