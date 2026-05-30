// __tests__/hall.test.js — Hall Module Tests
// Covers: getHalls (filters), getNearbyHalls (Haversine), getPlacesNearbyHalls (Overpass),
//         Admin CRUD (getAllHallsAdmin, createHall, updateHall, deleteHall)
'use strict';

const request = require('supertest');

// ── Mock DB before requiring app ──────────────────────────────────────
jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
  escape:        jest.fn(v => `'${String(v)}'`),
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
const MOCK_HALL = {
  id:            1,
  name:          'श्री गणेश मंगल कार्यालय',
  phone:         '9876543210',
  whatsapp:      '9876543210',
  city:          'पुणे',
  district:      'पुणे',
  taluka:        'हवेली',
  address:       'कोथरूड, पुणे',
  capacity:      500,
  price_per_day: 25000,
  latitude:      18.5074,
  longitude:     73.8077,
  created_at:    '2026-01-01T00:00:00.000Z',
};

const MOCK_HALL_2 = {
  ...MOCK_HALL,
  id:       2,
  name:     'राम मंगल हॉल',
  city:     'नाशिक',
  district: 'नाशिक',
  taluka:   'नाशिक',
  latitude: 19.9975,
  longitude: 73.7898,
};

// ─── Overpass API mock element (event venue) ──────────────────────────
const MOCK_OSM_ELEMENT = {
  type: 'node', id: 123456789,
  lat: 18.5100, lon: 73.8100,
  tags: {
    name:          'Ganesh Mangal Karyalay',
    'addr:street': 'FC Road',
    'addr:city':   'Pune',
    phone:         '+919876543210',
    capacity:      '300',
  },
};

// ═══════════════════════════════════════════════════════════════════════
// 1. GET /api/halls — List halls with filters
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/halls — Hall list with filters', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all halls when no filters given', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL, MOCK_HALL_2]]);

    const res = await request(app).get('/api/halls');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('phone');
  });

  it('filters by district', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL]]);

    const res = await request(app).get('/api/halls?district=पुणे');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);

    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[0]).toMatch(/district = \?/);
    expect(dbCall[1]).toContain('पुणे');
  });

  it('filters by taluka', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL]]);

    const res = await request(app).get('/api/halls?taluka=हवेली');

    expect(res.status).toBe(200);
    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[0]).toMatch(/taluka = \?/);
    expect(dbCall[1]).toContain('हवेली');
  });

  it('filters by both district AND taluka', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL]]);

    const res = await request(app).get('/api/halls?district=पुणे&taluka=हवेली');

    expect(res.status).toBe(200);
    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[0]).toMatch(/district = \?/);
    expect(dbCall[0]).toMatch(/taluka = \?/);
  });

  it('filters by city only when district and taluka are absent', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL]]);

    const res = await request(app).get('/api/halls?city=पुणे');

    expect(res.status).toBe(200);
    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[0]).toMatch(/city LIKE \?/);
    expect(dbCall[1][0]).toBe('%पुणे%');
  });

  it('ignores city filter when district is also provided', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL]]);

    await request(app).get('/api/halls?district=पुणे&city=पुणे');

    const dbCall = pool.query.mock.calls[0];
    // city LIKE should NOT appear — district takes priority
    expect(dbCall[0]).not.toMatch(/city LIKE/);
    expect(dbCall[0]).toMatch(/district = \?/);
  });

  it('returns empty array when no halls match filter', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/halls?district=अस्तित्वात नाही');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('trims whitespace from filter params', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_HALL]]);

    await request(app).get('/api/halls?district=%20पुणे%20');

    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[1]).toContain('पुणे'); // trimmed
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/halls');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/halls/nearby — Haversine DB search
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/halls/nearby — Nearby halls (Haversine)', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns halls within 40km ordered by distance', async () => {
    const hallWithDist = { ...MOCK_HALL, distance: 2.3 };
    pool.query.mockResolvedValueOnce([[hallWithDist]]);

    const res = await request(app)
      .get('/api/halls/nearby?lat=18.5074&lng=73.8077');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('distance');
  });

  it('passes lat and lng to Haversine SQL query', async () => {
    pool.query.mockResolvedValueOnce([[{ ...MOCK_HALL, distance: 1.5 }]]);

    await request(app).get('/api/halls/nearby?lat=18.5074&lng=73.8077');

    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[0]).toMatch(/ACOS/i);          // Haversine formula
    expect(dbCall[0]).toMatch(/HAVING distance/i);
    expect(dbCall[1]).toContain(18.5074);
    expect(dbCall[1]).toContain(73.8077);
  });

  it('returns 400 when lat is missing', async () => {
    const res = await request(app).get('/api/halls/nearby?lng=73.8077');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/अवैध निर्देशांक/);
  });

  it('returns 400 when lng is missing', async () => {
    const res = await request(app).get('/api/halls/nearby?lat=18.5074');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/अवैध निर्देशांक/);
  });

  it('returns 400 when lat/lng are non-numeric', async () => {
    const res = await request(app).get('/api/halls/nearby?lat=abc&lng=xyz');

    expect(res.status).toBe(400);
  });

  it('returns empty array when no halls within 40km', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/halls/nearby?lat=0.0&lng=0.0');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/halls/nearby?lat=18.5&lng=73.8');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/halls/places-nearby — Overpass API search
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/halls/places-nearby — OpenStreetMap Overpass search', () => {
  beforeEach(() => {
    pool.query.mockReset();
    // Reset fetch mock before each test
    global.fetch = undefined;
  });

  const mockFetchSuccess = (elements = [MOCK_OSM_ELEMENT]) => {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(
        JSON.stringify({ version: 0.6, elements })
      ),
    });
  };

  it('returns mapped hall objects from Overpass response', async () => {
    mockFetchSuccess();

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);

    const hall = res.body.data[0];
    expect(hall).toHaveProperty('id', `osm-node-${MOCK_OSM_ELEMENT.id}`);
    expect(hall).toHaveProperty('name', 'Ganesh Mangal Karyalay');
    expect(hall).toHaveProperty('source', 'osm');
    expect(hall).toHaveProperty('latitude', MOCK_OSM_ELEMENT.lat);
    expect(hall).toHaveProperty('longitude', MOCK_OSM_ELEMENT.lon);
    expect(hall).toHaveProperty('distance');
    expect(hall).toHaveProperty('maps_url');
  });

  it('deduplicates halls with same name', async () => {
    mockFetchSuccess([
      MOCK_OSM_ELEMENT,
      { ...MOCK_OSM_ELEMENT, id: 999 }, // same name, different id
    ]);

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.status).toBe(200);
    // Duplicate name filtered out
    expect(res.body.data).toHaveLength(1);
  });

  it('excludes elements without a name tag', async () => {
    mockFetchSuccess([
      { ...MOCK_OSM_ELEMENT, tags: {} },       // no name
      MOCK_OSM_ELEMENT,                          // has name
    ]);

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.body.data).toHaveLength(1);
  });

  it('excludes elements without valid coordinates', async () => {
    // Different name so dedup doesn't eliminate it — but missing coords → filtered out
    mockFetchSuccess([
      { ...MOCK_OSM_ELEMENT, id: 555, lat: undefined, lon: undefined,
        tags: { name: 'No Coords Hall' } },
      MOCK_OSM_ELEMENT, // valid coords → kept
    ]);

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Ganesh Mangal Karyalay');
  });

  it('maps center coordinates for way elements', async () => {
    mockFetchSuccess([{
      type: 'way', id: 777,
      center: { lat: 18.52, lon: 73.85 },
      tags: { name: 'Way Hall', 'addr:city': 'Pune' },
    }]);

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.body.data[0].latitude).toBe(18.52);
    expect(res.body.data[0].longitude).toBe(73.85);
  });

  it('sorts halls by distance ascending', async () => {
    mockFetchSuccess([
      { ...MOCK_OSM_ELEMENT, id: 1, lat: 18.60, lon: 73.90, tags: { name: 'Far Hall'  } },
      { ...MOCK_OSM_ELEMENT, id: 2, lat: 18.51, lon: 73.81, tags: { name: 'Near Hall' } },
    ]);

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Near Hall');
  });

  it('returns 400 when lat is missing', async () => {
    const res = await request(app).get('/api/halls/places-nearby?lng=73.8077');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/अवैध निर्देशांक/);
  });

  it('returns 400 when lng is missing', async () => {
    const res = await request(app).get('/api/halls/places-nearby?lat=18.5074');
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-numeric coordinates', async () => {
    const res = await request(app)
      .get('/api/halls/places-nearby?lat=pune&lng=73.8');
    expect(res.status).toBe(400);
  });

  it('returns 500 when all Overpass endpoints fail', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('returns empty array when Overpass returns no elements', async () => {
    mockFetchSuccess([]);

    const res = await request(app)
      .get('/api/halls/places-nearby?lat=18.5074&lng=73.8077');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. GET /api/admin/halls — Admin: List all halls
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/admin/halls — Admin hall list', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all halls for admin', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])               // authenticate
      .mockResolvedValueOnce([[MOCK_HALL, MOCK_HALL_2]]);  // getAllHallsAdmin

    const res = await request(app)
      .get('/api/admin/halls')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/halls');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .get('/api/admin/halls')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. POST /api/admin/halls — Admin: Create hall
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/admin/halls — Admin create hall', () => {
  const newHall = {
    name:          'नवीन मंगल हॉल',
    phone:         '9123456789',
    whatsapp:      '9123456789',
    city:          'नागपूर',
    district:      'नागपूर',
    taluka:        'नागपूर',
    address:       'सीताबर्डी, नागपूर',
    capacity:      300,
    price_per_day: 20000,
    latitude:      21.1458,
    longitude:     79.0882,
  };

  beforeEach(() => pool.query.mockReset());

  it('creates a hall successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 50, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/admin/halls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newHall);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('id', 50);
    expect(res.body.message).toMatch(/जोडला/);
  });

  it('returns 400 when name is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/admin/halls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newHall, name: undefined });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/नाव.*फोन.*आवश्यक/);
  });

  it('returns 400 when phone is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/admin/halls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...newHall, phone: undefined });

    expect(res.status).toBe(400);
  });

  it('creates hall with only required fields (name + phone)', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 51, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/admin/halls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'मिनिमल हॉल', phone: '9000000099' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 51);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/admin/halls').send(newHall);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/admin/halls')
      .set('Authorization', `Bearer ${userToken}`)
      .send(newHall);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/admin/halls')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newHall);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. PUT /api/admin/halls/:id — Admin: Update hall
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/admin/halls/:id — Admin update hall', () => {
  const updatePayload = {
    name:          'अद्यतनित मंगल हॉल',
    phone:         '9111111111',
    capacity:      600,
    price_per_day: 30000,
    city:          'पुणे',
    district:      'पुणे',
    taluka:        'हवेली',
    address:       'नवीन पत्ता, पुणे',
    latitude:      18.52,
    longitude:     73.85,
  };

  beforeEach(() => pool.query.mockReset());

  it('updates hall successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/admin/halls/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अपडेट/);
  });

  it('passes all fields including id to UPDATE query', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .put('/api/admin/halls/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/UPDATE halls SET/i);
    expect(updateCall[1]).toContain('1');          // id is string from req.params
    expect(updateCall[1]).toContain('अद्यतनित मंगल हॉल');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/admin/halls/1').send(updatePayload);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .put('/api/admin/halls/1')
      .set('Authorization', `Bearer ${userToken}`)
      .send(updatePayload);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .put('/api/admin/halls/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updatePayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. DELETE /api/admin/halls/:id — Admin: Hard-delete hall
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/admin/halls/:id — Admin delete hall', () => {
  beforeEach(() => pool.query.mockReset());

  it('hard-deletes a hall successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/admin/halls/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/हटवला/);

    // Must be a real DELETE (not soft delete)
    const deleteCall = pool.query.mock.calls[1];
    expect(deleteCall[0]).toMatch(/DELETE FROM halls/i);
    expect(deleteCall[1]).toContain('1');
  });

  it('returns 200 even when id does not exist', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]);

    const res = await request(app)
      .delete('/api/admin/halls/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/admin/halls/1');
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin user', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .delete('/api/admin/halls/1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .delete('/api/admin/halls/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
