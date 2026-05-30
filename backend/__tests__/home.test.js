// __tests__/home.test.js — Home Module Tests
// Covers: getHome, upsertHome (INSERT/UPDATE/clear_bg), addSlider, deleteSlider, toggleSlider
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

// ── Mock upload middleware — inject fake files via request header ─────
jest.mock('../src/middleware/upload.middleware', () => {
  const singleMiddleware = () => (req, res, next) => {
    if (req.get('x-test-inject-file') === '1') {
      req.file = {
        filename: 'test-slider-1234.jpg',
        path:     'uploads/test-slider-1234.jpg',
        mimetype: 'image/jpeg',
        size:     1024,
      };
    }
    next();
  };
  const fieldsMiddleware = () => (req, res, next) => {
    req.files = req.files || {};
    if (req.get('x-test-inject-hero') === '1') {
      req.files.hero_image = [{ filename: 'test-hero.jpg' }];
    }
    if (req.get('x-test-inject-bg') === '1') {
      req.files.bg_image = [{ filename: 'test-bg.jpg' }];
    }
    next();
  };
  return { single: singleMiddleware, fields: fieldsMiddleware };
});

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER }         = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);
const userToken  = makeUserToken(MOCK_USER);

// ── Shared mock data ───────────────────────────────────────────────────
const MOCK_CONTENT = {
  id:            1,
  title:         'पूजारी — घरी पूजा बुक करा',
  subtitle:      'अनुभवी पुजारी आपल्या दारी',
  description:   'महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा',
  button_text_1: 'पूजा बुक करा',
  button_text_2: 'पुजारी व्हा',
  hero_image:    '/uploads/hero.jpg',
  bg_image:      '/uploads/bg.jpg',
  stat_bookings: '५,०००+',
  stat_pujaris:  '५००+',
  stat_cities:   '३५+',
  stat_years:    '५+',
};

const MOCK_SLIDER = {
  id:          1,
  image_url:   '/uploads/slider-1.jpg',
  title:       'गणेश चतुर्थी विशेष',
  description: 'गणेश चतुर्थी पूजा बुकिंग सुरू',
  sort_order:  1,
  is_active:   1,
};

const MOCK_SLIDER_2 = { ...MOCK_SLIDER, id: 2, title: 'नवरात्री विशेष', sort_order: 2 };

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/home — Public: get home data
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/home — Public home data', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns home content and active sliders', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_CONTENT]])              // home_content
      .mockResolvedValueOnce([[MOCK_SLIDER, MOCK_SLIDER_2]]); // sliders

    const res = await request(app).get('/api/home');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toMatchObject({
      title:    'पूजारी — घरी पूजा बुक करा',
      subtitle: 'अनुभवी पुजारी आपल्या दारी',
    });
    expect(res.body.data.sliders).toHaveLength(2);
    expect(res.body.data.sliders[0]).toHaveProperty('image_url');
  });

  it('returns content null when no home content exists', async () => {
    pool.query
      .mockResolvedValueOnce([[]])   // no content → [[]] → content = undefined
      .mockResolvedValueOnce([[MOCK_SLIDER]]);

    const res = await request(app).get('/api/home');

    expect(res.status).toBe(200);
    expect(res.body.data.content).toBeNull();
    expect(res.body.data.sliders).toHaveLength(1);
  });

  it('returns empty sliders array when none are active', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_CONTENT]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/home');

    expect(res.status).toBe(200);
    expect(res.body.data.sliders).toHaveLength(0);
  });

  it('queries only active sliders ordered by sort_order', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_CONTENT]])
      .mockResolvedValueOnce([[]]);

    await request(app).get('/api/home');

    const sliderCall = pool.query.mock.calls[1];
    expect(sliderCall[0]).toMatch(/is_active = 1/i);
    expect(sliderCall[0]).toMatch(/sort_order/i);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/home');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. POST /api/home — Admin: upsertHome
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/home — Admin upsert home content', () => {
  const homePayload = {
    title:         'पूजारी — घरी पूजा बुक करा',
    subtitle:      'अनुभवी पुजारी आपल्या दारी',
    description:   'महाराष्ट्रातील सर्वोत्तम सेवा',
    button_text_1: 'पूजा बुक करा',
    button_text_2: 'पुजारी व्हा',
    stat_bookings: '५,०००+',
    stat_pujaris:  '५००+',
    stat_cities:   '३५+',
    stat_years:    '५+',
  };

  beforeEach(() => pool.query.mockReset());

  it('INSERTs content when none exists', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])   // authenticate
      .mockResolvedValueOnce([[]])             // SELECT existing → none
      .mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]); // INSERT

    const res = await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(homePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/जतन/);

    const insertCall = pool.query.mock.calls[2];
    expect(insertCall[0]).toMatch(/INSERT INTO home_content/i);
  });

  it('UPDATEs content when record already exists', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_CONTENT]])   // existing content found
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE

    const res = await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(homePayload);

    expect(res.status).toBe(200);
    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).toMatch(/UPDATE home_content/i);
  });

  it('clears bg_image when clear_bg_image=1', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_CONTENT]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...homePayload, clear_bg_image: '1' });

    const updateCall = pool.query.mock.calls[2];
    // Query must set bg_image = NULL
    expect(updateCall[0]).toMatch(/bg_image = NULL/i);
  });

  it('does NOT clear bg_image when clear_bg_image=0', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_CONTENT]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...homePayload, clear_bg_image: '0' });

    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).not.toMatch(/bg_image = NULL/i);
    expect(updateCall[0]).toMatch(/COALESCE.*bg_image/i);
  });

  it('uses COALESCE to keep old hero when no new hero uploaded', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_CONTENT]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    // No x-test-inject-hero header → no new hero image
    await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(homePayload);

    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).toMatch(/COALESCE.*hero_image/i);
  });

  it('uses new hero_image when uploaded', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_CONTENT]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-test-inject-hero', '1')
      .send(homePayload);

    const updateCall = pool.query.mock.calls[2];
    // New hero filename injected via mock
    expect(updateCall[1]).toContain('/uploads/test-hero.jpg');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/home').send(homePayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${userToken}`)
      .send(homePayload);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/home')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(homePayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. POST /api/home/slider — Admin: add slider image
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/home/slider — Admin add slider', () => {
  beforeEach(() => pool.query.mockReset());

  it('adds a slider image successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 5, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/home/slider')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-test-inject-file', '1')   // inject fake req.file
      .send({ title: 'दिवाळी विशेष', description: 'दिवाळी पूजा', sort_order: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', 5);
    expect(res.body.data).toHaveProperty('image_url', '/uploads/test-slider-1234.jpg');
    expect(res.body.message).toMatch(/जोडली/);
  });

  it('stores correct title and description in DB', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 6, affectedRows: 1 }]);

    await request(app)
      .post('/api/home/slider')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-test-inject-file', '1')
      .send({ title: 'नवरात्री विशेष', sort_order: 2 });

    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[0]).toMatch(/INSERT INTO home_slider/i);
    expect(insertCall[1]).toContain('नवरात्री विशेष');
    expect(insertCall[1]).toContain(2); // sort_order
  });

  it('returns 400 when no image file uploaded', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    // No x-test-inject-file header → req.file stays undefined

    const res = await request(app)
      .post('/api/home/slider')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/इमेज आवश्यक/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/home/slider').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/home/slider')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Test' });

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/home/slider')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-test-inject-file', '1')
      .send({ title: 'Test' });

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. DELETE /api/home/slider/:id — Admin: delete slider
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/home/slider/:id — Admin delete slider', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes slider and removes file', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_SLIDER]])           // find slider
      .mockResolvedValueOnce([{ affectedRows: 1 }]);    // DELETE

    const res = await request(app)
      .delete('/api/home/slider/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/काढली/);

    const deleteCall = pool.query.mock.calls[2];
    expect(deleteCall[0]).toMatch(/DELETE FROM home_slider/i);
    expect(deleteCall[1]).toContain('1');
  });

  it('returns 404 when slider not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // no slider found

    const res = await request(app)
      .delete('/api/home/slider/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडला नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/home/slider/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .delete('/api/home/slider/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .delete('/api/home/slider/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. PATCH /api/home/slider/:id/toggle — Admin: toggle slider active
// ═══════════════════════════════════════════════════════════════════════
describe('PATCH /api/home/slider/:id/toggle — Admin toggle slider', () => {
  beforeEach(() => pool.query.mockReset());

  it('toggles slider is_active successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .patch('/api/home/slider/1/toggle')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/स्थिती बदलली/);

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/is_active = NOT is_active/i);
    expect(updateCall[1]).toContain('1');
  });

  it('toggle call uses NOT is_active (DB-side flip)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .patch('/api/home/slider/2/toggle')
      .set('Authorization', `Bearer ${adminToken}`);

    const updateCall = pool.query.mock.calls[1];
    // Verify using MySQL NOT — no JS-level flip needed
    expect(updateCall[0]).toMatch(/NOT is_active/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).patch('/api/home/slider/1/toggle');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .patch('/api/home/slider/1/toggle')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .patch('/api/home/slider/1/toggle')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
