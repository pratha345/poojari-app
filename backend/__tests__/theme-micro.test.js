// __tests__/theme-micro.test.js — Theme Module MICRO-LEVEL Tests
// Deep coverage: resolveTheme all paths, AI generation, upload, captions,
//                autoUpdate, is_active behaviour, field combinations
'use strict';

const request = require('supertest');

// ── Mock DB ───────────────────────────────────────────────────────────
jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:  (req, res, next) => { req.tenantId = req.user?.tenant_id ?? 1; next(); },
  subscriptionGate: (req, res, next) => next(),
}));

// ── Mock AI / external services ───────────────────────────────────────
const mockGenerateSingle   = jest.fn();
const mockGenerateMultiple = jest.fn();
const mockWhatsAppCaption  = jest.fn().mockReturnValue('🪔 गणेश चतुर्थीच्या हार्दिक शुभेच्छा!');
const mockGetFestivals     = jest.fn();

jest.mock('../src/services/stabilityService', () => ({
  generateFestivalImage:  (...a) => mockGenerateSingle(...a),
  generateMultipleImages: (...a) => mockGenerateMultiple(...a),
}));
jest.mock('../src/services/whatsappCaption.service', () => ({
  generateWhatsAppCaption: (...a) => mockWhatsAppCaption(...a),
}));
jest.mock('../src/services/hinduFestivals', () => ({
  getFestivalsForYear: (...a) => mockGetFestivals(...a),
}));

// ── Mock multer for upload-image endpoint ─────────────────────────────
// Injects req.file when header x-test-inject-festival-image=1 is set
jest.mock('multer', () => {
  const injectSingle = () => (req, res, next) => {
    if (req.get('x-test-inject-festival-image') === '1') {
      req.file = {
        filename: `festival-1-${Date.now()}.jpg`,
        path:     'uploads/festivals/festival-1-test.jpg',
        mimetype: 'image/jpeg',
        size:     2048,
      };
    }
    next();
  };
  const passThrough = () => (req, res, next) => next();

  const multerFactory = jest.fn(() => ({
    single: injectSingle,
    fields: passThrough,
    array:  passThrough,
  }));
  // Required by admin.routes.js → multer().memoryStorage() and multer.diskStorage()
  multerFactory.diskStorage   = jest.fn(() => ({}));
  multerFactory.memoryStorage = jest.fn(() => ({}));
  // Also expose on instance (admin.routes calls require('multer').memoryStorage())
  multerFactory.mockImplementation(() => ({
    single:        injectSingle,
    fields:        passThrough,
    array:         passThrough,
    memoryStorage: jest.fn(() => ({})),
  }));
  return multerFactory;
});

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER }         = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);
const userToken  = makeUserToken(MOCK_USER);

// ── Shared mock data ───────────────────────────────────────────────────
const S_MANUAL   = { id: 1, active_theme: 'saffron-divine',  theme_mode: 'manual'   };
const S_FESTIVAL = { id: 1, active_theme: 'saffron-divine',  theme_mode: 'festival' };
const S_AUTO     = { id: 1, active_theme: 'saffron-divine',  theme_mode: 'auto'     };

const TODAY = new Date().toISOString().split('T')[0];

const ACTIVE_FEST = {
  id: 5, festival_name: 'गणेश चतुर्थी', theme_name: 'ganesh-green',
  start_date: '2026-08-25', end_date: '2026-09-04',
  is_active: true, image_url: '/uploads/festivals/ganesh.webp',
};

const AI_RESULT = {
  image_url:   '/uploads/festivals/ganesh-poster.webp',
  thumb_url:   '/uploads/festivals/thumbs/ganesh-poster-thumb.webp',
  filename:    'ganesh-poster.webp',
  festivalName:'गणेश चतुर्थी',
  slug:        'ganesh-chaturthi',
  type:        'poster',
  style:       'realistic',
  variant:     1,
  prompt:      'Ganesh Chaturthi festive poster',
  size:        512000,
  colors:      ['#FF6B00', '#FFDE59'],
  mood:        'festive',
};

// ═══════════════════════════════════════════════════════════════════════
// 1. resolveTheme — all paths deep tested
// ═══════════════════════════════════════════════════════════════════════
describe('resolveTheme() — all code paths', () => {
  beforeEach(() => { pool.query.mockReset(); mockGetFestivals.mockReset(); });

  // ── Manual mode ──────────────────────────────────────────────
  it('manual mode: returns theme immediately, NO festival query', async () => {
    pool.query.mockResolvedValueOnce([[S_MANUAL]]);

    const res = await request(app).get('/api/theme');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ theme: 'saffron-divine', mode: 'manual', festival_name: null });
    // Only 1 DB call — no festival query
    expect(pool.query.mock.calls).toHaveLength(1);
  });

  it('manual mode: festival_name is always null regardless of active festivals', async () => {
    pool.query.mockResolvedValueOnce([[S_MANUAL]]);

    const res = await request(app).get('/api/theme');

    expect(res.body.data.festival_name).toBeNull();
  });

  // ── Festival mode — DB match ──────────────────────────────────
  it('festival mode + DB festival active today → returns festival theme', async () => {
    pool.query
      .mockResolvedValueOnce([[S_FESTIVAL]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);

    const res = await request(app).get('/api/theme');

    expect(res.body.data).toMatchObject({
      theme:         'ganesh-green',
      mode:          'festival',
      festival_name: 'गणेश चतुर्थी',
      festival_id:   5,
      festival_image_url: '/uploads/festivals/ganesh.webp',
    });
  });

  it('festival mode + festival has no image_url → festival_image_url is null', async () => {
    pool.query
      .mockResolvedValueOnce([[S_FESTIVAL]])
      .mockResolvedValueOnce([[{ ...ACTIVE_FEST, image_url: null }]]);

    const res = await request(app).get('/api/theme');

    expect(res.body.data.festival_image_url).toBeNull();
  });

  it('festival mode + festival queries are date-bound (start_date <= today AND end_date >= today)', async () => {
    pool.query
      .mockResolvedValueOnce([[S_FESTIVAL]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);

    await request(app).get('/api/theme');

    const festQuery = pool.query.mock.calls[1];
    expect(festQuery[0]).toMatch(/start_date <= \?/i);
    expect(festQuery[0]).toMatch(/end_date >= \?/i);
    expect(festQuery[1][0]).toBe(TODAY);
    expect(festQuery[1][1]).toBe(TODAY);
  });

  // ── Festival mode — no DB match, JS fallback ─────────────────
  it('festival mode + no DB match + JS festival matches today → uses JS fallback', async () => {
    pool.query
      .mockResolvedValueOnce([[S_FESTIVAL]])
      .mockResolvedValueOnce([[]]); // no DB festival

    mockGetFestivals.mockReturnValueOnce([{
      festival_name: 'नागपंचमी', theme_name: 'nag-panchami-gold',
      start_date: TODAY, end_date: TODAY, is_active: true,
    }]);

    const res = await request(app).get('/api/theme');

    expect(res.body.data.theme).toBe('nag-panchami-gold');
    expect(res.body.data.festival_name).toBe('नागपंचमी');
    expect(res.body.data.festival_image_url).toBeNull(); // JS fallback has no image
  });

  it('festival mode + no DB match + JS has festival with is_active=false → skipped', async () => {
    pool.query
      .mockResolvedValueOnce([[S_FESTIVAL]])
      .mockResolvedValueOnce([[]]); // no DB festival

    mockGetFestivals.mockReturnValueOnce([{
      festival_name: 'Test', theme_name: 'test-theme',
      start_date: TODAY, end_date: TODAY, is_active: false, // inactive
    }]);

    const res = await request(app).get('/api/theme');

    // Inactive JS festival skipped → falls back to active_theme
    expect(res.body.data.theme).toBe('saffron-divine');
    expect(res.body.data.festival_name).toBeNull();
  });

  // ── Festival mode — full fallback to active_theme ─────────────
  it('festival mode + no DB match + no JS match → falls back to active_theme', async () => {
    pool.query
      .mockResolvedValueOnce([[S_FESTIVAL]])
      .mockResolvedValueOnce([[]]); // no DB festival

    mockGetFestivals.mockReturnValueOnce([]); // no JS festivals either

    const res = await request(app).get('/api/theme');

    expect(res.body.data.theme).toBe('saffron-divine');
    expect(res.body.data.festival_name).toBeNull();
  });

  // ── Auto mode ─────────────────────────────────────────────────
  it('auto mode works identically to festival mode', async () => {
    pool.query
      .mockResolvedValueOnce([[S_AUTO]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);

    const res = await request(app).get('/api/theme');

    expect(res.body.data.mode).toBe('auto');
    expect(res.body.data.theme).toBe('ganesh-green');
  });

  // ── No settings row ───────────────────────────────────────────
  it('no site_settings row → default saffron-divine, manual, festival_name null', async () => {
    // resolveTheme(1) makes 2 queries: WHERE tenant_id=1 (empty), then WHERE id=1 (empty)
    pool.query
      .mockResolvedValueOnce([[]])  // WHERE tenant_id=1 → no row
      .mockResolvedValueOnce([[]]); // WHERE id=1 fallback → no row → default theme

    const res = await request(app).get('/api/theme');

    expect(res.body.data).toEqual({
      theme: 'saffron-divine', mode: 'manual', festival_name: null,
    });
    expect(pool.query.mock.calls).toHaveLength(2); // tenant query + id=1 fallback
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. updateTheme — field combinations & ON DUPLICATE KEY
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin — updateTheme field combinations', () => {
  beforeEach(() => pool.query.mockReset());

  const resolveAfterUpdate = (settings = S_MANUAL) => {
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])      // upsert
      .mockResolvedValueOnce([[settings]]);               // resolveTheme → settings
    if (settings.theme_mode !== 'manual') {
      pool.query.mockResolvedValueOnce([[]]); // resolveTheme → festivals
    }
  };

  it('updates only active_theme — theme_mode unchanged', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    resolveAfterUpdate({ ...S_MANUAL, active_theme: 'lotus-pink' });

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active_theme: 'lotus-pink' });

    expect(res.status).toBe(200);
    const upsertCall = pool.query.mock.calls[1];
    expect(upsertCall[0]).toMatch(/active_theme = \?/i);
    expect(upsertCall[0]).not.toMatch(/theme_mode = \?/i);
  });

  it('updates only theme_mode — active_theme unchanged', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    resolveAfterUpdate({ ...S_FESTIVAL, active_theme: 'saffron-divine' });

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ theme_mode: 'festival' });

    expect(res.status).toBe(200);
    const upsertCall = pool.query.mock.calls[1];
    expect(upsertCall[0]).toMatch(/theme_mode = \?/i);
    expect(upsertCall[0]).not.toMatch(/active_theme = \?/i);
  });

  it('updates both fields in one call', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    resolveAfterUpdate({ active_theme: 'navratri-red', theme_mode: 'festival' });

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active_theme: 'navratri-red', theme_mode: 'festival' });

    expect(res.status).toBe(200);
    const upsertCall = pool.query.mock.calls[1];
    expect(upsertCall[0]).toMatch(/active_theme = \?/i);
    expect(upsertCall[0]).toMatch(/theme_mode = \?/i);
  });

  it('uses INSERT ... ON DUPLICATE KEY UPDATE (id=1 always)', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    resolveAfterUpdate();

    await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active_theme: 'diwali-golden' });

    const upsertCall = pool.query.mock.calls[1];
    expect(upsertCall[0]).toMatch(/INSERT INTO site_settings/i);
    expect(upsertCall[0]).toMatch(/ON DUPLICATE KEY UPDATE/i);
    // params: [tenant_id, active_theme, theme_mode, ...updateValues]
    // index 0 = tenant_id (1), index 1 = active_theme
    expect(upsertCall[1][1]).toBe('diwali-golden'); // active_theme value in INSERT
  });

  it('all valid theme_modes accepted without 400', async () => {
    for (const mode of ['manual', 'festival', 'auto']) {
      pool.query.mockReset();
      pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
      const settings = { ...S_MANUAL, theme_mode: mode };
      pool.query
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[settings]]);
      if (mode !== 'manual') pool.query.mockResolvedValueOnce([[]]); // festival query

      const res = await request(app)
        .post('/api/theme/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ theme_mode: mode });

      expect(res.status).toBe(200, `mode=${mode} should be accepted`);
    }
  });

  it('invalid theme_mode rejects with 400 and no DB write', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ theme_mode: 'dark-mode' });

    expect(res.status).toBe(400);
    expect(pool.query.mock.calls).toHaveLength(1); // only authenticate
  });

  it('empty body → 400 (nothing to update)', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/काहीही नाही/);
  });

  it('returns the resolved theme in response after update', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    pool.query
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ ...S_MANUAL, active_theme: 'ganesh-green' }]]);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active_theme: 'ganesh-green' });

    expect(res.status).toBe(200);
    expect(res.body.data.theme).toBe('ganesh-green');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. getFestivalThemes — settings null edge case
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/theme/admin/festivals — getFestivalThemes edge cases', () => {
  beforeEach(() => pool.query.mockReset());

  it('festivals ordered by start_date ASC', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST, { ...ACTIVE_FEST, id: 6, start_date: '2026-10-20' }]])
      .mockResolvedValueOnce([[S_MANUAL]]);

    await request(app)
      .get('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`);

    const festivalsCall = pool.query.mock.calls[1];
    expect(festivalsCall[0]).toMatch(/ORDER BY start_date ASC/i);
  });

  it('settings is null/undefined when no site_settings row', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])
      .mockResolvedValueOnce([[]]); // no settings row

    const res = await request(app)
      .get('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.settings).toBeUndefined();
  });

  it('returns empty festivals array when none exist', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[S_MANUAL]]);

    const res = await request(app)
      .get('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.festivals).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. addFestivalTheme — is_active behaviour
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals — is_active edge cases', () => {
  beforeEach(() => pool.query.mockReset());

  const base = { festival_name: 'दिवाळी', theme_name: 'diwali-golden', start_date: '2026-10-20', end_date: '2026-10-25' };

  it('is_active=true → inserts as TRUE', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 10 }]);

    await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...base, is_active: true });

    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[1][4]).toBe(true); // is_active value
  });

  it('is_active=false → inserts as FALSE', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 11 }]);

    await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...base, is_active: false });

    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[1][4]).toBe(false);
  });

  it('is_active not provided → defaults to TRUE (is_active !== false)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 12 }]);

    await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(base); // no is_active field

    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[1][4]).toBe(true);
  });

  it('missing festival_name → 400', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ theme_name: 'test', start_date: '2026-01-01', end_date: '2026-01-02' });

    expect(res.status).toBe(400);
  });

  it('missing theme_name → 400', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'दिवाळी', start_date: '2026-01-01', end_date: '2026-01-02' });

    expect(res.status).toBe(400);
  });

  it('missing start_date → 400', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'दिवाळी', theme_name: 'diwali-golden', end_date: '2026-01-02' });

    expect(res.status).toBe(400);
  });

  it('missing end_date → 400', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'दिवाळी', theme_name: 'diwali-golden', start_date: '2026-01-01' });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. updateFestivalTheme — field and is_active behaviour
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/theme/admin/festivals/:id — updateFestivalTheme field checks', () => {
  beforeEach(() => pool.query.mockReset());

  it('updates all fields in correct order', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .put('/api/theme/admin/festivals/5')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        festival_name: 'गणेश चतुर्थी 2026', theme_name: 'ganesh-green',
        start_date: '2026-08-25', end_date: '2026-09-04', is_active: true,
      });

    const updateCall = pool.query.mock.calls[1];
    const [fn, tn, sd, ed, ia, id] = updateCall[1];
    expect(fn).toBe('गणेश चतुर्थी 2026');
    expect(tn).toBe('ganesh-green');
    expect(sd).toBe('2026-08-25');
    expect(ed).toBe('2026-09-04');
    expect(ia).toBe(true);
    expect(id).toBe('5'); // string from req.params
  });

  it('is_active=false → sets to FALSE', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .put('/api/theme/admin/festivals/5')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'Test', theme_name: 'test', start_date: '2026-01-01', end_date: '2026-01-02', is_active: false });

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[1][4]).toBe(false);
  });

  it('is_active not provided → defaults to TRUE', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .put('/api/theme/admin/festivals/5')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'Test', theme_name: 'test', start_date: '2026-01-01', end_date: '2026-01-02' });

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[1][4]).toBe(true);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .put('/api/theme/admin/festivals/5')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'X', theme_name: 'x', start_date: '2026-01-01', end_date: '2026-01-02' });

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. generateFestivalThemeImage — AI + socket.io
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals/:id/generate — AI image generation', () => {
  beforeEach(() => {
    pool.query.mockReset();
    mockGenerateSingle.mockReset();
    mockWhatsAppCaption.mockReturnValue('🪔 शुभेच्छा!');
  });

  it('generates image, updates festival, saves to gallery, returns result', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])             // find festival
      .mockResolvedValueOnce([{ affectedRows: 1 }])       // UPDATE festival image_url
      .mockResolvedValueOnce([{ insertId: 20 }]);         // INSERT poster_gallery

    mockGenerateSingle.mockResolvedValueOnce(AI_RESULT);

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'poster', style: 'realistic', variant: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('image_url', AI_RESULT.image_url);
    expect(res.body.data).toHaveProperty('galleryId', 20);
    expect(res.body.data).toHaveProperty('whatsapp_caption');
    expect(res.body.message).toMatch(/गणेश चतुर्थी/);
  });

  it('calls generateFestivalImage with correct params', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 21 }]);

    mockGenerateSingle.mockResolvedValueOnce(AI_RESULT);

    await request(app)
      .post('/api/theme/admin/festivals/5/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'banner', style: 'artistic', variant: 2 });

    const [festName, type, style, variant] = mockGenerateSingle.mock.calls[0];
    expect(festName).toBe('गणेश चतुर्थी');
    expect(type).toBe('banner');
    expect(style).toBe('artistic');
    expect(variant).toBe(2);
  });

  it('updates festival_themes with new image_url and thumb_url', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 22 }]);

    mockGenerateSingle.mockResolvedValueOnce(AI_RESULT);

    await request(app)
      .post('/api/theme/admin/festivals/5/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'poster' });

    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).toMatch(/UPDATE festival_themes SET image_url/i);
    expect(updateCall[1][0]).toBe(AI_RESULT.image_url);
    expect(updateCall[1][1]).toBe(AI_RESULT.thumb_url);
    expect(updateCall[1][2]).toBe('5');
  });

  it('returns 404 when festival not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // festival not found

    const res = await request(app)
      .post('/api/theme/admin/festivals/9999/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'poster' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सण सापडला नाही/);
    expect(mockGenerateSingle).not.toHaveBeenCalled();
  });

  it('returns 500 and emits socket error when AI fails', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);

    mockGenerateSingle.mockRejectedValueOnce(new Error('AI API quota exceeded'));

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'poster' });

    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/AI API quota exceeded/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/theme/admin/festivals/5/generate').send({});
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/generate')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. generateMultipleThemeImages — batch generation
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals/:id/generate-multi — Multi image generation', () => {
  beforeEach(() => { pool.query.mockReset(); mockGenerateMultiple.mockReset(); });

  it('generates multiple images and saves all to gallery', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])
      .mockResolvedValueOnce([{ insertId: 30 }])   // gallery insert 1
      .mockResolvedValueOnce([{ insertId: 31 }])   // gallery insert 2
      .mockResolvedValueOnce([{ insertId: 32 }])   // gallery insert 3
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE festival image_url

    const results = [
      { ...AI_RESULT, filename: 'g1.webp', variant: 1 },
      { ...AI_RESULT, filename: 'g2.webp', variant: 2 },
      { ...AI_RESULT, filename: 'g3.webp', variant: 3 },
    ];
    mockGenerateMultiple.mockResolvedValueOnce({ results, errors: [] });

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/generate-multi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'poster', style: 'realistic', count: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.generated).toBe(3);
    expect(res.body.data.failed).toBe(0);
    expect(res.body.data.galleryIds).toHaveLength(3);
    expect(res.body.message).toMatch(/3\/3/);
  });

  it('handles partial failure (2 success, 1 error)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])
      .mockResolvedValueOnce([{ insertId: 40 }])   // gallery for result 1
      .mockResolvedValueOnce([{ insertId: 41 }])   // gallery for result 2
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE festival

    const results = [
      { ...AI_RESULT, filename: 'g1.webp' },
      { ...AI_RESULT, filename: 'g2.webp' },
    ];
    mockGenerateMultiple.mockResolvedValueOnce({
      results,
      errors: [{ variant: 3, error: 'API rate limit' }],
    });

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/generate-multi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ count: 3 });

    expect(res.body.data.generated).toBe(2);
    expect(res.body.data.failed).toBe(1);
    expect(res.body.message).toMatch(/2\/3/);
  });

  it('updates festival image_url with FIRST result', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]])
      .mockResolvedValueOnce([{ insertId: 50 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const firstImage = '/uploads/festivals/first.webp';
    mockGenerateMultiple.mockResolvedValueOnce({
      results: [{ ...AI_RESULT, image_url: firstImage }],
      errors:  [],
    });

    await request(app)
      .post('/api/theme/admin/festivals/5/generate-multi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ count: 1 });

    const updateCall = pool.query.mock.calls.find(c =>
      typeof c[0] === 'string' && c[0].includes('UPDATE festival_themes')
    );
    expect(updateCall[1][0]).toBe(firstImage);
  });

  it('returns 404 when festival not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .post('/api/theme/admin/festivals/9999/generate-multi')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ count: 3 });

    expect(res.status).toBe(404);
    expect(mockGenerateMultiple).not.toHaveBeenCalled();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/theme/admin/festivals/5/generate-multi').send({});
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. uploadFestivalImage — file upload
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals/:id/upload-image — File upload', () => {
  beforeEach(() => pool.query.mockReset());

  it('uploads image and updates festival image_url', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/upload-image')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-test-inject-festival-image', '1'); // inject fake req.file

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.image_url).toMatch(/\/uploads\/festivals\//);
    expect(res.body.message).toMatch(/अपलोड/);

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE festival_themes SET image_url/i);
    expect(updateCall[1][2]).toBe('5');
  });

  it('sets both image_url and thumb_url to same path', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/upload-image')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-test-inject-festival-image', '1');

    expect(res.body.data.image_url).toBe(res.body.data.thumb_url);
  });

  it('returns 400 when no image file provided', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    // No x-test-inject-festival-image header → req.file = undefined

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/upload-image')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/इमेज फाइल आवश्यक/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/theme/admin/festivals/5/upload-image');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/upload-image')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 9. getWhatsAppCaption — occasion logic
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals/:id/whatsapp-caption — Caption generation', () => {
  beforeEach(() => { pool.query.mockReset(); mockWhatsAppCaption.mockReset(); });

  it('returns caption for festival with default occasion', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);

    mockWhatsAppCaption.mockReturnValueOnce('🪔 गणेश चतुर्थीच्या शुभेच्छा!');

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/whatsapp-caption')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.caption).toBe('🪔 गणेश चतुर्थीच्या शुभेच्छा!');
    expect(res.body.data.festival_name).toBe('गणेश चतुर्थी');
    expect(res.body.data.occasion).toBe('morning'); // default
  });

  it('passes occasion to generateWhatsAppCaption', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);

    mockWhatsAppCaption.mockReturnValueOnce('🌙 संध्याकाळच्या शुभेच्छा!');

    await request(app)
      .post('/api/theme/admin/festivals/5/whatsapp-caption')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ occasion: 'evening' });

    expect(mockWhatsAppCaption).toHaveBeenCalledWith('गणेश चतुर्थी', 'evening');
  });

  it('returns occasion in response data', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[ACTIVE_FEST]]);
    mockWhatsAppCaption.mockReturnValueOnce('🌃 रात्रीच्या शुभेच्छा!');

    const res = await request(app)
      .post('/api/theme/admin/festivals/5/whatsapp-caption')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ occasion: 'night' });

    expect(res.body.data.occasion).toBe('night');
  });

  it('returns 404 when festival not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .post('/api/theme/admin/festivals/9999/whatsapp-caption')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सण सापडला नाही/);
    expect(mockWhatsAppCaption).not.toHaveBeenCalled();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/theme/admin/festivals/5/whatsapp-caption').send({});
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 10. autoUpdateFestivals — year param + DELETE + INSERT
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals/auto-update — Auto-update festivals', () => {
  beforeEach(() => { pool.query.mockReset(); mockGetFestivals.mockReset(); });

  const mockFestivalList = (count = 3) => Array.from({ length: count }, (_, i) => ({
    festival_name: `सण ${i + 1}`, theme_name: `theme-${i + 1}`,
    start_date: `2026-0${i + 1}-01`, end_date: `2026-0${i + 1}-05`, is_active: true,
  }));

  it('auto-updates festivals for current year', async () => {
    const list = mockFestivalList(3);
    mockGetFestivals.mockReturnValueOnce(list);

    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 2 }])   // DELETE existing
      .mockResolvedValueOnce([{ affectedRows: 3 }])   // INSERT new
      .mockResolvedValueOnce([list]);                  // SELECT all

    const res = await request(app)
      .post('/api/theme/admin/festivals/auto-update')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(3);
    expect(res.body.message).toMatch(/3 सण/);
  });

  it('auto-updates for specific year via query param', async () => {
    const list = mockFestivalList(2);
    mockGetFestivals.mockReturnValueOnce(list);

    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // DELETE
      .mockResolvedValueOnce([{ affectedRows: 2 }])   // INSERT
      .mockResolvedValueOnce([list]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/auto-update?year=2027')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.year).toBe(2027);
    // Verify getFestivalsForYear called with 2027
    expect(mockGetFestivals).toHaveBeenCalledWith(2027);
  });

  it('deletes ONLY that year\'s festivals (YEAR(start_date) = ?)', async () => {
    mockGetFestivals.mockReturnValueOnce(mockFestivalList(1));

    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[mockFestivalList(1)]]);

    await request(app)
      .post('/api/theme/admin/festivals/auto-update?year=2026')
      .set('Authorization', `Bearer ${adminToken}`);

    const deleteCall = pool.query.mock.calls[1];
    expect(deleteCall[0]).toMatch(/DELETE FROM festival_themes WHERE YEAR\(start_date\)/i);
    expect(deleteCall[1]).toContain(2026);
  });

  it('returns 404 when getFestivalsForYear returns empty array', async () => {
    mockGetFestivals.mockReturnValueOnce([]); // no festivals

    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/auto-update?year=1900')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सण उपलब्ध नाहीत/);
  });

  it('inserts festivals with correct format (batch VALUES ?)', async () => {
    const list = mockFestivalList(2);
    mockGetFestivals.mockReturnValueOnce(list);

    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([{ affectedRows: 2 }])
      .mockResolvedValueOnce([list]);

    await request(app)
      .post('/api/theme/admin/festivals/auto-update')
      .set('Authorization', `Bearer ${adminToken}`);

    const insertCall = pool.query.mock.calls[2];
    expect(insertCall[0]).toMatch(/INSERT INTO festival_themes.*VALUES \?/i);
    const values = insertCall[1][0]; // array of arrays
    expect(Array.isArray(values)).toBe(true);
    expect(values[0]).toHaveLength(5); // [festival_name, theme_name, start_date, end_date, is_active]
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/theme/admin/festivals/auto-update');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals/auto-update')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
