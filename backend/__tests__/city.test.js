// __tests__/city.test.js — City Module Tests
// Covers: list (static), byState (grouped), getCity (static + DB pujari count)
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

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/cities — List all cities (static data)
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/cities — City list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns list of cities with required fields', async () => {
    const res = await request(app).get('/api/cities');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('each city has slug, name_mr, name_en, state fields', async () => {
    const res = await request(app).get('/api/cities');

    const city = res.body.data[0];
    expect(city).toHaveProperty('slug');
    expect(city).toHaveProperty('name_mr');
    expect(city).toHaveProperty('name_en');
    expect(city).toHaveProperty('state_mr');
    expect(city).toHaveProperty('state_en');
    expect(city).toHaveProperty('pujari_count');
    expect(city).toHaveProperty('booking_count');
  });

  it('includes Pune in the city list', async () => {
    const res = await request(app).get('/api/cities');

    const pune = res.body.data.find(c => c.slug === 'pune');
    expect(pune).toBeDefined();
    expect(pune.name_mr).toBe('पुणे');
    expect(pune.state_en).toBe('Maharashtra');
  });

  it('includes Mumbai in the city list', async () => {
    const res = await request(app).get('/api/cities');

    const mumbai = res.body.data.find(c => c.slug === 'mumbai');
    expect(mumbai).toBeDefined();
    expect(mumbai.name_en).toBe('Mumbai');
  });

  it('does not expose internal fields (desc, seo_desc, areas, testimonials)', async () => {
    const res = await request(app).get('/api/cities');

    const city = res.body.data[0];
    expect(city).not.toHaveProperty('desc');
    expect(city).not.toHaveProperty('seo_desc');
    expect(city).not.toHaveProperty('keywords');
    expect(city).not.toHaveProperty('testimonials');
    expect(city).not.toHaveProperty('areas');
  });

  it('does not call DB — data is from static file', async () => {
    await request(app).get('/api/cities');
    expect(pool.query).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/cities/by-state — Cities grouped by state
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/cities/by-state — Cities by state', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns cities grouped by state', async () => {
    const res = await request(app).get('/api/cities/by-state');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('each group has state_en, state_mr and cities array', async () => {
    const res = await request(app).get('/api/cities/by-state');

    const group = res.body.data[0];
    expect(group).toHaveProperty('state_en');
    expect(group).toHaveProperty('state_mr');
    expect(group).toHaveProperty('cities');
    expect(Array.isArray(group.cities)).toBe(true);
  });

  it('Maharashtra group contains Pune and Mumbai', async () => {
    const res = await request(app).get('/api/cities/by-state');

    const mh = res.body.data.find(g => g.state_en === 'Maharashtra');
    expect(mh).toBeDefined();
    const slugs = mh.cities.map(c => c.slug);
    expect(slugs).toContain('pune');
    expect(slugs).toContain('mumbai');
  });

  it('city objects in group have slug, name_mr, name_en', async () => {
    const res = await request(app).get('/api/cities/by-state');

    const firstCity = res.body.data[0].cities[0];
    expect(firstCity).toHaveProperty('slug');
    expect(firstCity).toHaveProperty('name_mr');
    expect(firstCity).toHaveProperty('name_en');
  });

  it('does not call DB — data is from static file', async () => {
    await request(app).get('/api/cities/by-state');
    expect(pool.query).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/cities/:slug — Single city page data
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/cities/:slug — City detail', () => {
  const MOCK_POOJA = {
    id: 1, name_mr: 'सत्यनारायण पूजा', name_en: 'Satyanarayan Puja',
    slug: 'satyanarayan-pooja', price: 1500, is_featured: true,
    category_name: 'गृहपूजा',
  };

  beforeEach(() => pool.query.mockReset());

  it('returns city data with poojas and pujari_count', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])       // poojas query
      .mockResolvedValueOnce([[{ pujari_count_db: 12 }]]); // pujari count

    const res = await request(app).get('/api/cities/pune');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.city).toMatchObject({
      slug:    'pune',
      name_mr: 'पुणे',
    });
    expect(Array.isArray(res.body.data.poojas)).toBe(true);
    expect(res.body.data.city).toHaveProperty('pujari_count');
  });

  it('uses DB pujari_count when higher than static count', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockResolvedValueOnce([[{ pujari_count_db: 999 }]]); // very high DB count

    const res = await request(app).get('/api/cities/pune');

    // DB count (999) > static count (45) → should use 999
    expect(res.body.data.city.pujari_count).toBe(999);
  });

  it('uses static pujari_count when higher than DB count', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockResolvedValueOnce([[{ pujari_count_db: 0 }]]); // DB has none

    const res = await request(app).get('/api/cities/pune');

    // Static count (45) > DB count (0) → should use 45
    expect(res.body.data.city.pujari_count).toBe(45);
  });

  it('includes city detail fields (testimonials, areas, popular_pujas)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockResolvedValueOnce([[{ pujari_count_db: 10 }]]);

    const res = await request(app).get('/api/cities/pune');

    const city = res.body.data.city;
    expect(city).toHaveProperty('testimonials');
    expect(city).toHaveProperty('areas');
    expect(city).toHaveProperty('popular_pujas');
    expect(city).toHaveProperty('tagline');
  });

  it('queries poojas with is_active = TRUE and LIMIT 12', async () => {
    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ pujari_count_db: 5 }]]);

    await request(app).get('/api/cities/pune');

    const poojaCall = pool.query.mock.calls[0];
    expect(poojaCall[0]).toMatch(/is_active = TRUE/i);
    expect(poojaCall[0]).toMatch(/LIMIT 12/i);
  });

  it('queries pujari count using city name and district', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockResolvedValueOnce([[{ pujari_count_db: 8 }]]);

    await request(app).get('/api/cities/pune');

    const pujariCall = pool.query.mock.calls[1];
    expect(pujariCall[0]).toMatch(/pujari_profiles/i);
    expect(pujariCall[0]).toMatch(/status = 'approved'/i);
    expect(pujariCall[1]).toContain('%Pune%'); // city.name_en from static data
  });

  it('returns 404 for non-existent city slug', async () => {
    const res = await request(app).get('/api/cities/invalid-city-xyz');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/सापडले नाही/);
    // DB should NOT be called for unknown city
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/cities/pune');
    expect(res.status).toBe(500);
  });
});
