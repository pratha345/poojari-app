// __tests__/blog.test.js — Blog Module Tests
// Covers: list, categories, getBySlug, admin CRUD, auth protection
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

// ── Shared mock blog objects ───────────────────────────────────────────
const MOCK_BLOG = {
  id:          1,
  title:       'सत्यनारायण पूजेची संपूर्ण माहिती',
  slug:        'satyanarayan-puja-complete-guide',
  excerpt:     'सत्यनारायण पूजा विधी आणि महत्त्व',
  content:     '<h2>सत्यनारायण पूजा</h2><p>विस्तृत माहिती...</p>',
  image_url:   '/uploads/blog/satyanarayan.jpg',
  author_name: 'पूजारी टीम',
  category:    'पूजा मार्गदर्शन',
  tags:        JSON.stringify(['सत्यनारायण', 'पूजा']),
  read_time:   6,
  is_published: 1,
  views:       100,
  created_at:  '2026-01-01T00:00:00.000Z',
  updated_at:  '2026-01-01T00:00:00.000Z',
};

const MOCK_BLOG_2 = {
  ...MOCK_BLOG,
  id:    2,
  title: 'गृहप्रवेश मुहूर्त 2026',
  slug:  'gruhapravesh-shubh-muhurta-2026',
  category: 'मुहूर्त',
};

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/blog — Public list
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/blog — Public blog list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns paginated list of published blogs', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_BLOG, MOCK_BLOG_2]])   // posts
      .mockResolvedValueOnce([[{ total: 2 }]]);             // count

    const res = await request(app).get('/api/blog');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.posts).toHaveLength(2);
    expect(res.body.data).toMatchObject({ total: 2, page: 1, limit: 9 });
  });

  it('filters blogs by category', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_BLOG]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const res = await request(app).get('/api/blog?category=पूजा मार्गदर्शन');

    expect(res.status).toBe(200);
    expect(res.body.data.posts).toHaveLength(1);
    expect(res.body.data.posts[0].category).toBe('पूजा मार्गदर्शन');
  });

  it('searches blogs by title keyword', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_BLOG]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const res = await request(app).get('/api/blog?search=सत्यनारायण');

    expect(res.status).toBe(200);
    expect(res.body.data.posts[0].title).toContain('सत्यनारायण');
  });

  it('supports custom page and limit', async () => {
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    const res = await request(app).get('/api/blog?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ page: 2, limit: 5 });
  });

  it('returns empty list when no blogs published', async () => {
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    const res = await request(app).get('/api/blog');

    expect(res.status).toBe(200);
    expect(res.body.data.posts).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app).get('/api/blog');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/blog/categories
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/blog/categories — Category list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns list of categories with post counts', async () => {
    const mockCats = [
      { category: 'पूजा मार्गदर्शन', count: 25 },
      { category: 'सण-उत्सव',       count: 18 },
      { category: 'ज्योतिष',         count: 15 },
      { category: 'मुहूर्त',          count: 10 },
    ];
    pool.query.mockResolvedValueOnce([mockCats]);

    const res = await request(app).get('/api/blog/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.data[0]).toHaveProperty('category');
    expect(res.body.data[0]).toHaveProperty('count');
  });

  it('returns empty array when no blogs exist', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/blog/categories');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));

    const res = await request(app).get('/api/blog/categories');
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/blog/:slug — Single post
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/blog/:slug — Get blog by slug', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns full blog post with related posts', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_BLOG]])         // find post
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // increment views
      .mockResolvedValueOnce([[MOCK_BLOG_2]]);       // related posts

    const res = await request(app)
      .get('/api/blog/satyanarayan-puja-complete-guide');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post).toMatchObject({
      slug:  'satyanarayan-puja-complete-guide',
      title: 'सत्यनारायण पूजेची संपूर्ण माहिती',
    });
    expect(Array.isArray(res.body.data.related)).toBe(true);
  });

  it('increments view count on each visit', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_BLOG]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // views update called
      .mockResolvedValueOnce([[]]);

    await request(app).get('/api/blog/satyanarayan-puja-complete-guide');

    // Second query must be the views increment UPDATE
    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/views = views \+ 1/i);
  });

  it('returns 404 for non-existent slug', async () => {
    pool.query.mockResolvedValueOnce([[]]); // not found

    const res = await request(app).get('/api/blog/slug-that-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/सापडला नाही/);
  });

  it('returns 404 for unpublished post', async () => {
    // Query returns empty because WHERE is_published = 1 filters it out
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/blog/draft-post-slug');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/blog/some-slug');
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. GET /api/blog/admin/all — Admin list (protected)
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/blog/admin/all — Admin blog list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all blogs (including drafts) for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])                     // authenticate
      .mockResolvedValueOnce([[MOCK_BLOG, MOCK_BLOG_2]]);        // all posts

    const res = await request(app)
      .get('/api/blog/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/blog/admin/all');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]); // authenticate returns normal user

    const res = await request(app)
      .get('/api/blog/admin/all')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. POST /api/blog/admin — Create blog
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/blog/admin — Create blog post', () => {
  const newBlog = {
    title:       'नवीन ब्लॉग पोस्ट',
    slug:        'naveen-blog-post',
    excerpt:     'लहान वर्णन',
    content:     '<p>ब्लॉग मजकूर</p>',
    category:    'पूजा मार्गदर्शन',
    author_name: 'पूजारी टीम',
    read_time:   5,
    is_published: 1,
  };

  beforeEach(() => pool.query.mockReset());

  it('creates a blog post successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])                   // authenticate
      .mockResolvedValueOnce([{ insertId: 200, affectedRows: 1 }]); // INSERT

    const res = await request(app)
      .post('/api/blog/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newBlog);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', 200);
    expect(res.body.message).toMatch(/जोडला/);
  });

  it('returns 400 when title is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/blog/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ slug: 'some-slug', content: '<p>content</p>' }); // no title

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/शीर्षक/);
  });

  it('returns 400 when slug is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/blog/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Title', content: '<p>content</p>' }); // no slug

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when content is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/blog/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Title', slug: 'slug' }); // no content

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 on duplicate slug', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY', message: 'Duplicate entry' });

    const res = await request(app)
      .post('/api/blog/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newBlog);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/slug.*वापरला/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/blog/admin').send(newBlog);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/blog/admin')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newBlog);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. PUT /api/blog/admin/:id — Update blog
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/blog/admin/:id — Update blog post', () => {
  const updatePayload = {
    title:       'अद्यतनित ब्लॉग',
    slug:        'satyanarayan-puja-complete-guide',
    content:     '<p>नवीन मजकूर</p>',
    category:    'पूजा मार्गदर्शन',
    author_name: 'पूजारी टीम',
    read_time:   7,
    is_published: 1,
  };

  beforeEach(() => pool.query.mockReset());

  it('updates blog post successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])             // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }]);     // UPDATE

    const res = await request(app)
      .put('/api/blog/admin/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अद्यतनित/);
  });

  it('returns 400 on duplicate slug during update', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY', message: 'Duplicate entry' });

    const res = await request(app)
      .put('/api/blog/admin/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/slug/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/blog/admin/1').send(updatePayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .put('/api/blog/admin/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. PATCH /api/blog/admin/:id/publish — Toggle publish
// ═══════════════════════════════════════════════════════════════════════
describe('PATCH /api/blog/admin/:id/publish — Toggle publish status', () => {
  beforeEach(() => pool.query.mockReset());

  it('toggles blog from published to draft', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])               // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }])        // UPDATE toggle
      .mockResolvedValueOnce([[{ is_published: 0 }]]);     // SELECT new status

    const res = await request(app)
      .patch('/api/blog/admin/1/publish')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('is_published', 0);
    expect(res.body.message).toMatch(/मसुदा/);
  });

  it('toggles blog from draft to published', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ is_published: 1 }]]);

    const res = await request(app)
      .patch('/api/blog/admin/1/publish')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('is_published', 1);
    expect(res.body.message).toMatch(/प्रकाशित/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/blog/admin/1/publish');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .patch('/api/blog/admin/1/publish')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. DELETE /api/blog/admin/:id — Delete blog
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/blog/admin/:id — Delete blog post', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes a blog post successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])            // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }]);    // DELETE

    const res = await request(app)
      .delete('/api/blog/admin/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/काढला/);
  });

  it('returns 200 even for non-existent id (soft delete behaviour)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/blog/admin/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/blog/admin/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .delete('/api/blog/admin/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .delete('/api/blog/admin/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
