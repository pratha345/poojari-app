// __tests__/pujari.test.js — Pujari Module Tests
// Covers: register, profile (get/update), availability, bookings, respond, nearby, public profile/reviews
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

// Prevent real geocode HTTP calls from interfering with mock sequences
global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in tests'));

const app  = require('../src/app');
const pool = require('../src/config/db');
const { makeUserToken, makePujariToken } = require('./helpers/authHelper');
const { MOCK_USER, MOCK_PUJARI_USER }    = require('./helpers/mockDb');

const userToken   = makeUserToken(MOCK_USER);
const pujariToken = makePujariToken(MOCK_PUJARI_USER);

// ── Shared mock data ───────────────────────────────────────────────────
const MOCK_PUJARI_PROFILE = {
  id:              10,
  user_id:         MOCK_PUJARI_USER.id,
  full_name:       'राम शास्त्री',
  experience_yrs:  8,
  city:            'पुणे',
  district:        'पुणे',
  address:         'कोथरूड, पुणे',
  languages:       JSON.stringify(['मराठी', 'हिंदी']),
  photo_url:       '/uploads/pujari-1.jpg',
  certificate_url: '/uploads/cert-1.jpg',
  bio:             'अनुभवी पुजारी',
  status:          'approved',
  avg_rating:      4.5,
  total_reviews:   20,
  total_bookings:  50,
  is_available:    true,
  specialization_names: 'गृहपूजा,विवाह',
};

const MOCK_BOOKING = {
  id:           100,
  user_id:      MOCK_USER.id,
  pujari_id:    10,
  pooja_id:     1,
  booking_date: '2026-06-15',
  status:       'pending',
  pooja_name:   'सत्यनारायण पूजा',
  user_name:    'Test User',
  user_phone:   '9307720459',
};

const MOCK_REVIEW = {
  id:         1,
  rating:     5,
  comment:    'खूप छान पूजा झाली!',
  created_at: '2026-01-10T10:00:00.000Z',
  user_name:  'Test User',
  pooja_name: 'सत्यनारायण पूजा',
};

// ═══════════════════════════════════════════════════════════════════════
// 1. POST /api/pujari/register
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/pujari/register', () => {
  const regPayload = {
    full_name:       'नवीन पुजारी',
    experience_yrs:  5,
    city:            'नाशिक',
    district:        'नाशिक',
    address:         'पेठ रोड, नाशिक',
    languages:       ['मराठी', 'हिंदी'],
    bio:             'अनुभवी वैदिक पुजारी',
    specializations: [1, 2],
  };

  beforeEach(() => pool.query.mockReset());

  it('registers a new pujari successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])          // authenticate
      .mockResolvedValueOnce([[]])                   // check existing profile — none
      .mockResolvedValueOnce([{ insertId: 10, affectedRows: 1 }])  // INSERT profile
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE user role
      .mockResolvedValueOnce([{ affectedRows: 2 }]); // INSERT specializations

    const res = await request(app)
      .post('/api/pujari/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send(regPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('pujari_id', 10);
    expect(res.body.message).toMatch(/नोंदणी यशस्वी/);
  });

  it('registers without specializations', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 11, affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    // specializations query should NOT be called

    const res = await request(app)
      .post('/api/pujari/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...regPayload, specializations: [] });

    expect(res.status).toBe(201);
    // Only 4 DB calls — no specialization INSERT
    expect(pool.query.mock.calls).toHaveLength(4);
  });

  it('returns 400 when already registered', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{ id: 10 }]]); // profile already exists

    const res = await request(app)
      .post('/api/pujari/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send(regPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/आधीच.*नोंदणी/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/pujari/register').send(regPayload);
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/pujari/register')
      .set('Authorization', `Bearer ${userToken}`)
      .send(regPayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/pujari/profile
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/pujari/profile', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns pujari profile with specializations', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])        // authenticate
      .mockResolvedValueOnce([[MOCK_PUJARI_PROFILE]]);    // profile query

    const res = await request(app)
      .get('/api/pujari/profile')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      full_name: 'राम शास्त्री',
      city:      'पुणे',
    });
    expect(res.body.data).toHaveProperty('specialization_names');
  });

  it('resolves photo_url and certificate_url to relative paths', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[{
        ...MOCK_PUJARI_PROFILE,
        photo_url:       'https://cdn.example.com/uploads/pujari-1.jpg',
        certificate_url: 'https://cdn.example.com/uploads/cert-1.jpg',
      }]]);

    const res = await request(app)
      .get('/api/pujari/profile')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.photo_url).toBe('/uploads/pujari-1.jpg');
    expect(res.body.data.certificate_url).toBe('/uploads/cert-1.jpg');
  });

  it('returns 404 when profile not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[]]); // no profile

    const res = await request(app)
      .get('/api/pujari/profile')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/pujari/profile');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. PUT /api/pujari/profile
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/pujari/profile', () => {
  const updatePayload = {
    full_name:      'राम शास्त्री (अद्यतनित)',
    experience_yrs: 9,
    city:           'मुंबई',
    district:       'मुंबई',
    address:        'दादर, मुंबई',
    languages:      ['मराठी', 'हिंदी', 'इंग्रजी'],
    bio:            'अनुभवी वैदिक पुजारी — नवीन माहिती',
  };

  beforeEach(() => pool.query.mockReset());

  it('updates pujari profile successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])      // authenticate
      .mockResolvedValueOnce([{ affectedRows: 1 }]);    // UPDATE

    const res = await request(app)
      .put('/api/pujari/profile')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अद्यतनित/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/pujari/profile').send(updatePayload);
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .put('/api/pujari/profile')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send(updatePayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. POST /api/pujari/availability
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/pujari/availability', () => {
  const availPayload = {
    dates: [
      { date: '2026-07-01', is_available: true  },
      { date: '2026-07-02', is_available: false },
      { date: '2026-07-03', is_available: true  },
    ],
  };

  beforeEach(() => pool.query.mockReset());

  it('sets availability dates successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])        // authenticate
      .mockResolvedValueOnce([[{ id: 10 }]])              // find pujari profile
      .mockResolvedValueOnce([{ affectedRows: 3 }]);      // INSERT availability

    const res = await request(app)
      .post('/api/pujari/availability')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send(availPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/उपलब्धता/);
  });

  it('uses ON DUPLICATE KEY UPDATE for existing dates', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([{ affectedRows: 3 }]);

    await request(app)
      .post('/api/pujari/availability')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send(availPayload);

    const insertCall = pool.query.mock.calls[2];
    expect(insertCall[0]).toMatch(/ON DUPLICATE KEY UPDATE/i);
  });

  it('returns 404 when pujari profile not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[]]); // no profile

    const res = await request(app)
      .post('/api/pujari/availability')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send(availPayload);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/pujari/availability').send(availPayload);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. GET /api/pujari/bookings
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/pujari/bookings', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns all bookings for the pujari', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[{ id: 10 }]])          // pujari profile
      .mockResolvedValueOnce([[MOCK_BOOKING, { ...MOCK_BOOKING, id: 101, status: 'confirmed' }]]);

    const res = await request(app)
      .get('/api/pujari/bookings')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('pooja_name');
    expect(res.body.data[0]).toHaveProperty('user_name');
  });

  it('filters bookings by status', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([[{ ...MOCK_BOOKING, status: 'confirmed' }]]);

    const res = await request(app)
      .get('/api/pujari/bookings?status=confirmed')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('confirmed');
  });

  it('returns empty array when no bookings', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[{ id: 10 }]])
      .mockResolvedValueOnce([[]]); // no bookings

    const res = await request(app)
      .get('/api/pujari/bookings')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 404 when pujari profile not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[]]); // no profile

    const res = await request(app)
      .get('/api/pujari/bookings')
      .set('Authorization', `Bearer ${pujariToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/pujari/bookings');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. PUT /api/pujari/bookings/:id/respond
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/pujari/bookings/:id/respond', () => {
  beforeEach(() => pool.query.mockReset());

  const authAndProfile = () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])   // authenticate
      .mockResolvedValueOnce([[{ id: 10 }]]);         // pujari profile
  };

  it('confirms a booking successfully', async () => {
    authAndProfile();
    pool.query
      .mockResolvedValueOnce([[MOCK_BOOKING]])         // find booking
      .mockResolvedValueOnce([{ affectedRows: 1 }]);   // UPDATE status

    const res = await request(app)
      .put('/api/pujari/bookings/100/respond')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send({ action: 'confirm' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/स्वीकारली/);

    const updateCall = pool.query.mock.calls[3];
    expect(updateCall[1][0]).toBe('confirmed');
  });

  it('cancels a booking with reason', async () => {
    authAndProfile();
    pool.query
      .mockResolvedValueOnce([[MOCK_BOOKING]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/pujari/bookings/100/respond')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send({ action: 'cancel', reason: 'उपलब्ध नाही' });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/नाकारली/);

    const updateCall = pool.query.mock.calls[3];
    expect(updateCall[1][0]).toBe('cancelled');
    expect(updateCall[1][1]).toBe('pujari');   // cancelled_by
    expect(updateCall[1][2]).toBe('उपलब्ध नाही'); // reason
  });

  it('returns 404 when booking not found or belongs to another pujari', async () => {
    authAndProfile();
    pool.query.mockResolvedValueOnce([[]]); // booking not found

    const res = await request(app)
      .put('/api/pujari/bookings/999/respond')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send({ action: 'confirm' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/बुकिंग सापडली नाही/);
  });

  it('returns 404 when pujari profile not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_USER]])
      .mockResolvedValueOnce([[]]); // no profile

    const res = await request(app)
      .put('/api/pujari/bookings/100/respond')
      .set('Authorization', `Bearer ${pujariToken}`)
      .send({ action: 'confirm' });

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/pujari/bookings/100/respond')
      .send({ action: 'confirm' });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. GET /api/pujari/nearby — Public
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/pujari/nearby', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns pujaris filtered by city', async () => {
    pool.query.mockResolvedValueOnce([[
      { ...MOCK_PUJARI_PROFILE, specializations: 'गृहपूजा,विवाह' },
    ]]);

    const res = await request(app).get('/api/pujari/nearby?city=पुणे');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('full_name');
    expect(res.body.data[0]).toHaveProperty('specializations');
  });

  it('returns pujaris filtered by district', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_PUJARI_PROFILE]]);

    const res = await request(app).get('/api/pujari/nearby?district=पुणे');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('returns empty array when neither city nor district provided', async () => {
    // Controller always runs a fallback query when no city/district/lat/lng given
    pool.query.mockResolvedValueOnce([[]]); // fallback SELECT → no pujaris → []

    const res = await request(app).get('/api/pujari/nearby');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it('respects limit query param', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_PUJARI_PROFILE]]);

    await request(app).get('/api/pujari/nearby?city=पुणे&limit=3');

    const dbCall = pool.query.mock.calls[0];
    expect(dbCall[1]).toContain(3); // limit param passed to query
  });

  it('resolves photo_url to relative path', async () => {
    pool.query.mockResolvedValueOnce([[{
      ...MOCK_PUJARI_PROFILE,
      photo_url: 'https://cdn.example.com/uploads/pujari-1.jpg',
    }]]);

    const res = await request(app).get('/api/pujari/nearby?city=पुणे');

    expect(res.body.data[0].photo_url).toBe('/uploads/pujari-1.jpg');
  });

  it('returns empty array on DB error (graceful failure)', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/pujari/nearby?city=पुणे');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. GET /api/pujari/:id — Public profile
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/pujari/:id — Public profile', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns approved pujari profile with past pujas', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_PROFILE]])   // profile query
      .mockResolvedValueOnce([[                         // past pujas
        { pooja_name: 'सत्यनारायण पूजा', booking_date: '2026-05-01' },
      ]]);

    const res = await request(app).get('/api/pujari/10');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ full_name: 'राम शास्त्री' });
    expect(Array.isArray(res.body.data.past_pujas)).toBe(true);
    expect(res.body.data.past_pujas[0]).toHaveProperty('pooja_name');
  });

  it('returns 404 for non-existent or non-approved pujari', async () => {
    pool.query.mockResolvedValueOnce([[]]); // not found

    const res = await request(app).get('/api/pujari/9999');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/सापडला नाही/);
  });

  it('resolves photo_url to relative path', async () => {
    pool.query
      .mockResolvedValueOnce([[{
        ...MOCK_PUJARI_PROFILE,
        photo_url: 'https://cdn.example.com/uploads/pujari-1.jpg',
      }]])
      .mockResolvedValueOnce([[]]); // no past pujas

    const res = await request(app).get('/api/pujari/10');

    expect(res.body.data.photo_url).toBe('/uploads/pujari-1.jpg');
  });

  it('returns empty past_pujas when no completed bookings', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_PUJARI_PROFILE]])
      .mockResolvedValueOnce([[]]); // no past pujas

    const res = await request(app).get('/api/pujari/10');

    expect(res.status).toBe(200);
    expect(res.body.data.past_pujas).toHaveLength(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/pujari/10');
    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 9. GET /api/pujari/:id/reviews — Public reviews
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/pujari/:id/reviews — Public reviews', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns approved reviews for a pujari', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_REVIEW, { ...MOCK_REVIEW, id: 2, rating: 4 }]]);

    const res = await request(app).get('/api/pujari/10/reviews');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('rating');
    expect(res.body.data[0]).toHaveProperty('user_name');
    expect(res.body.data[0]).toHaveProperty('pooja_name');
  });

  it('returns empty array when no reviews', async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const res = await request(app).get('/api/pujari/10/reviews');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/api/pujari/10/reviews');
    expect(res.status).toBe(500);
  });
});
