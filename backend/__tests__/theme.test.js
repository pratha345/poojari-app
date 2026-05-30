// __tests__/theme.test.js — Theme Module Tests
// Covers: getTheme (manual/festival/auto), updateTheme, Festival CRUD
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

// Mock AI / external services — not testing AI generation here
jest.mock('../src/services/stabilityService',     () => ({
  generateFestivalImage:   jest.fn().mockResolvedValue({ image_url: '/uploads/test.jpg' }),
  generateMultipleImages:  jest.fn().mockResolvedValue([]),
}));
jest.mock('../src/services/whatsappCaption.service', () => ({
  generateWhatsAppCaption: jest.fn().mockReturnValue('Test caption'),
}));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeAdminToken, makeUserToken } = require('./helpers/authHelper');
const { MOCK_ADMIN, MOCK_USER }         = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);
const userToken  = makeUserToken(MOCK_USER);

// ── Shared mock data ───────────────────────────────────────────────────
const MOCK_SETTINGS_MANUAL = {
  id: 1, active_theme: 'saffron-divine', theme_mode: 'manual',
};
const MOCK_SETTINGS_FESTIVAL = {
  id: 1, active_theme: 'saffron-divine', theme_mode: 'festival',
};
const MOCK_SETTINGS_AUTO = {
  id: 1, active_theme: 'saffron-divine', theme_mode: 'auto',
};

const MOCK_FESTIVAL = {
  id:            1,
  festival_name: 'गणेश चतुर्थी',
  theme_name:    'ganesh-green',
  start_date:    '2026-08-25',
  end_date:      '2026-09-04',
  is_active:     true,
  image_url:     '/uploads/ganesh-theme.jpg',
};

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/theme — resolveTheme (3 modes)
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/theme — Resolve active theme', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns manual theme directly (no festival query)', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_SETTINGS_MANUAL]]); // site_settings

    const res = await request(app).get('/api/theme');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      theme: 'saffron-divine',
      mode:  'manual',
    });
    // Only 1 DB call — no festival query needed for manual mode
    expect(pool.query.mock.calls).toHaveLength(1);
  });

  it('returns festival theme when active festival exists in DB', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SETTINGS_FESTIVAL]])  // site_settings
      .mockResolvedValueOnce([[MOCK_FESTIVAL]]);           // festival_themes

    const res = await request(app).get('/api/theme');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      theme:         'ganesh-green',
      mode:          'festival',
      festival_name: 'गणेश चतुर्थी',
      festival_id:   1,
    });
  });

  it('returns festival image_url when set', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SETTINGS_FESTIVAL]])
      .mockResolvedValueOnce([[MOCK_FESTIVAL]]);

    const res = await request(app).get('/api/theme');

    expect(res.body.data.festival_image_url).toBe('/uploads/ganesh-theme.jpg');
  });

  it('falls back to default theme when no festival matches (auto mode)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_SETTINGS_AUTO]])  // site_settings
      .mockResolvedValueOnce([[]]);                    // no matching festival in DB

    // hinduFestivals.js checked in JS — even if no match, falls back to active_theme
    const res = await request(app).get('/api/theme');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('theme');
    expect(res.body.data).toHaveProperty('mode');
  });

  it('returns default saffron theme when no site_settings row exists', async () => {
    // resolveTheme(1) makes 2 queries: WHERE tenant_id=1 (empty), then WHERE id=1 (empty)
    pool.query
      .mockResolvedValueOnce([[]])  // WHERE tenant_id=1 → no row
      .mockResolvedValueOnce([[]]); // WHERE id=1 fallback → no row → default theme

    const res = await request(app).get('/api/theme');

    expect(res.status).toBe(200);
    expect(res.body.data.theme).toBe('saffron-divine');
    expect(res.body.data.mode).toBe('manual');
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/theme');
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. POST /api/theme/admin — Update theme settings
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin — Update theme', () => {
  beforeEach(() => pool.query.mockReset());

  // After update, resolveTheme is called again.
  // festival/auto mode needs 2 extra queries (site_settings + festival_themes).
  const mockUpsertAndResolve = (settings = MOCK_SETTINGS_MANUAL) => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])             // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }])     // INSERT/UPDATE site_settings
      .mockResolvedValueOnce([[settings]]);              // resolveTheme → site_settings
    // If non-manual mode, resolveTheme queries festival_themes too
    if (settings.theme_mode && settings.theme_mode !== 'manual') {
      pool.query.mockResolvedValueOnce([[]]);            // resolveTheme → festival_themes (no match)
    }
  };

  it('updates active_theme successfully', async () => {
    mockUpsertAndResolve({ ...MOCK_SETTINGS_MANUAL, active_theme: 'lotus-pink' });

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active_theme: 'lotus-pink' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अपडेट/);
  });

  it('updates theme_mode to festival', async () => {
    mockUpsertAndResolve(MOCK_SETTINGS_FESTIVAL);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ theme_mode: 'festival' });

    expect(res.status).toBe(200);
    // resolveTheme returns the updated mode
    expect(res.body.data.mode).toBe('festival');
  });

  it('returns 400 for invalid theme_mode', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ theme_mode: 'invalid-mode' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/अवैध थीम मोड/);
  });

  it('returns 400 when no fields provided to update', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/काहीही नाही/);
  });

  it('uses ON DUPLICATE KEY UPDATE for site_settings', async () => {
    mockUpsertAndResolve();

    await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active_theme: 'navratri-red', theme_mode: 'festival' });

    const upsertCall = pool.query.mock.calls[1];
    expect(upsertCall[0]).toMatch(/ON DUPLICATE KEY UPDATE/i);
  });

  it('accepts valid theme_modes: manual, festival, auto', async () => {
    for (const mode of ['manual', 'festival', 'auto']) {
      pool.query.mockReset();
      mockUpsertAndResolve({ ...MOCK_SETTINGS_MANUAL, theme_mode: mode });

      const res = await request(app)
        .post('/api/theme/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ theme_mode: mode });

      expect(res.status).toBe(200);
    }
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/theme/admin').send({ active_theme: 'test' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/theme/admin')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ active_theme: 'test' });

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/theme/admin/festivals — List festivals + settings
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/theme/admin/festivals — Festival list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns festivals array and settings for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_FESTIVAL, { ...MOCK_FESTIVAL, id: 2 }]])  // festivals
      .mockResolvedValueOnce([[MOCK_SETTINGS_MANUAL]]);                        // settings

    const res = await request(app)
      .get('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.festivals).toHaveLength(2);
    expect(res.body.data.settings).toHaveProperty('active_theme');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/theme/admin/festivals');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .get('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. POST /api/theme/admin/festivals — Add festival theme
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/theme/admin/festivals — Add festival', () => {
  const newFestival = {
    festival_name: 'दिवाळी',
    theme_name:    'diwali-golden',
    start_date:    '2026-10-20',
    end_date:      '2026-10-25',
    is_active:     true,
  };

  beforeEach(() => pool.query.mockReset());

  it('creates festival theme successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 10, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newFestival);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', 10);
    expect(res.body.message).toMatch(/जोडली/);
  });

  it('returns 400 when festival_name is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newFestival, festival_name: undefined });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/आवश्यक/);
  });

  it('returns 400 when theme_name is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newFestival, theme_name: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when start_date or end_date is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ festival_name: 'Test', theme_name: 'test-theme' });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .send(newFestival);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/theme/admin/festivals')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newFestival);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. PUT /api/theme/admin/festivals/:id — Update festival
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/theme/admin/festivals/:id — Update festival', () => {
  const updatePayload = {
    festival_name: 'दिवाळी (अद्यतनित)',
    theme_name:    'diwali-golden-v2',
    start_date:    '2026-10-19',
    end_date:      '2026-10-26',
    is_active:     true,
  };

  beforeEach(() => pool.query.mockReset());

  it('updates festival theme successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/theme/admin/festivals/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अपडेट/);

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE festival_themes/i);
    expect(updateCall[1]).toContain('दिवाळी (अद्यतनित)');
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/theme/admin/festivals/1')
      .send(updatePayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .put('/api/theme/admin/festivals/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .put('/api/theme/admin/festivals/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. DELETE /api/theme/admin/festivals/:id — Delete festival
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/theme/admin/festivals/:id — Delete festival', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes festival theme successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/theme/admin/festivals/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/काढली/);

    const deleteCall = pool.query.mock.calls[1];
    expect(deleteCall[0]).toMatch(/DELETE FROM festival_themes/i);
    expect(deleteCall[1]).toContain('1');
  });

  it('returns 200 when festival id does not exist (no error)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/theme/admin/festivals/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/theme/admin/festivals/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .delete('/api/theme/admin/festivals/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .delete('/api/theme/admin/festivals/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
