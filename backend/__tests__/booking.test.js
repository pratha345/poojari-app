// __tests__/booking.test.js — Booking Module Tests
// Covers: createBooking, getMyBookings, getByCode, cancel, review, payment
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
const { makeUserToken } = require('./helpers/authHelper');
const { MOCK_USER }     = require('./helpers/mockDb');

const userToken = makeUserToken(MOCK_USER);

// ── Shared mock data ───────────────────────────────────────────────────
const MOCK_POOJA = {
  id: 1, name_mr: 'सत्यनारायण पूजा',
  price: 1500, duration_hrs: 3, is_active: true,
};

const MOCK_BOOKING = {
  id:            100,
  booking_code:  'POJA1B2C3',
  user_id:       MOCK_USER.id,
  pooja_id:      1,
  pujari_id:     10,
  booking_date:  '2026-07-15',
  booking_time:  '10:00',
  address:       'कोथरूड, पुणे',
  city:          'पुणे',
  district:      'पुणे',
  status:        'pending',
  total_amount:  1500,
  platform_fee:  75,
  pujari_amount: 1425,
  payment_status: 'pending',
  pooja_name:    'सत्यनारायण पूजा',
  pooja_image:   '/uploads/poojas/satyanarayan-pooja.png',
  pujari_name:   'राम शास्त्री',
  pujari_phone:  '9000000002',
};

// ═══════════════════════════════════════════════════════════════════════
// 1. POST /api/bookings — Create booking
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/bookings — Create booking', () => {
  const validPayload = {
    pooja_id:     1,
    booking_date: '2026-07-15',
    booking_time: '10:00',
    address:      'कोथरूड, पुणे',
    city:         'पुणे',
    district:     'पुणे',
  };

  beforeEach(() => pool.query.mockReset());

  it('creates a booking and returns code + amount', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])                              // authenticate
      .mockResolvedValueOnce([[MOCK_POOJA]])                             // get pooja
      .mockResolvedValueOnce([[{ pricing_policy: null }]])               // site pricing policy
      .mockResolvedValueOnce([{ insertId: 100, affectedRows: 1 }]);      // INSERT

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('booking_id', 100);
    expect(res.body.data).toHaveProperty('booking_code');
    expect(res.body.data.booking_code).toMatch(/^POJ/);
    expect(res.body.data).toHaveProperty('total_amount', MOCK_POOJA.price);
    expect(res.body.data).toHaveProperty('pooja_name', MOCK_POOJA.name_mr);
    expect(res.body.message).toMatch(/यशस्वी/);
  });

  it('calculates 5% platform fee correctly', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[MOCK_POOJA]])   // price = 1500
      .mockResolvedValueOnce([[{ pricing_policy: null }]])   // default policy: 5% commission
      .mockResolvedValueOnce([{ insertId: 100, affectedRows: 1 }]);

    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPayload);

    // INSERT call — check platform_fee=75, pujari_amount=1425
    const insertCall = pool.query.mock.calls[3];
    const values = insertCall[1];
    expect(values[10]).toBe(75);    // platform_fee  = round(1500 * 0.05)
    expect(values[11]).toBe(1425);  // pujari_amount = 1500 - 75
  });

  it('returns 400 when pooja_id is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validPayload, pooja_id: undefined });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/आवश्यक/);
  });

  it('returns 400 when booking_date is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validPayload, booking_date: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when booking_time is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validPayload, booking_time: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 400 when address is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_USER]]);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validPayload, address: undefined });

    expect(res.status).toBe(400);
  });

  it('returns 404 when pooja does not exist', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]); // pooja not found

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPayload);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/पूजा सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/bookings').send(validPayload);
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[MOCK_POOJA]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(validPayload);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. GET /api/bookings/my — User's bookings
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/my — My bookings', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns list of user bookings', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[
        MOCK_BOOKING,
        { ...MOCK_BOOKING, id: 101, status: 'confirmed' },
      ]]);

    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toHaveProperty('booking_code');
    expect(res.body.data[0]).toHaveProperty('pooja_name');
    expect(res.body.data[0]).toHaveProperty('pujari_name');
  });

  it('filters bookings by status query param', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{ ...MOCK_BOOKING, status: 'confirmed' }]]);

    const res = await request(app)
      .get('/api/bookings/my?status=confirmed')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('confirmed');

    // WHERE clause must include status filter
    const dbCall = pool.query.mock.calls[1];
    expect(dbCall[1]).toContain('confirmed');
  });

  it('returns empty array when no bookings', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]);

    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/bookings/my');
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. GET /api/bookings/:code — Get by booking code
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/bookings/:code — Get booking by code', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns booking detail for valid code', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{
        ...MOCK_BOOKING,
        duration_hrs:   3,
        pujari_photo:   '/uploads/pujari-1.jpg',
      }]]);

    const res = await request(app)
      .get('/api/bookings/POJA1B2C3')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      booking_code: 'POJA1B2C3',
      pooja_name:   'सत्यनारायण पूजा',
    });
  });

  it('returns 404 for non-existent booking code', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .get('/api/bookings/INVALID123')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 404 when booking belongs to another user', async () => {
    // WHERE clause includes user_id, so other user's booking won't show
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]); // filtered out by user_id check

    const res = await request(app)
      .get('/api/bookings/OTHERUSR1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/bookings/POJA1B2C3');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. PUT /api/bookings/:id/cancel — Cancel booking
// ═══════════════════════════════════════════════════════════════════════
describe('PUT /api/bookings/:id/cancel — Cancel booking', () => {
  beforeEach(() => pool.query.mockReset());

  it('cancels a pending booking successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{ ...MOCK_BOOKING, status: 'pending' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/bookings/100/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'वेळापत्रक बदलले' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/रद्द/);

    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).toMatch(/status="cancelled"/);
    expect(updateCall[0]).toMatch(/cancelled_by="user"/);
    expect(updateCall[1][0]).toBe('वेळापत्रक बदलले');
  });

  it('cancels a confirmed booking successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{ ...MOCK_BOOKING, status: 'confirmed' }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/bookings/100/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'अडचण आली' });

    expect(res.status).toBe(200);
  });

  it('returns 400 when booking is already completed', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{ ...MOCK_BOOKING, status: 'completed' }]]);

    const res = await request(app)
      .put('/api/bookings/100/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'test' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/रद्द करता येत नाही/);
  });

  it('returns 400 when booking is already cancelled', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[{ ...MOCK_BOOKING, status: 'cancelled' }]]);

    const res = await request(app)
      .put('/api/bookings/100/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'test' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/रद्द करता येत नाही/);
  });

  it('returns 404 when booking not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .put('/api/bookings/9999/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'test' });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .put('/api/bookings/100/cancel')
      .send({ reason: 'test' });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. POST /api/bookings/review — Submit review
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/bookings/review — Submit review', () => {
  const reviewPayload = { booking_id: 100, rating: 5, comment: 'खूप छान पूजा झाली!' };

  const completedBooking = {
    ...MOCK_BOOKING,
    status:     'completed',
    pujari_id:  10,
    pooja_id:   1,
  };

  beforeEach(() => pool.query.mockReset());

  it('submits a review for a completed booking', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[completedBooking]])      // find completed booking
      .mockResolvedValueOnce([{ insertId: 1 }])         // INSERT review
      .mockResolvedValueOnce([{ affectedRows: 1 }]);    // UPDATE pujari avg_rating

    const res = await request(app)
      .post('/api/bookings/review')
      .set('Authorization', `Bearer ${userToken}`)
      .send(reviewPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/अभिप्राय.*धन्यवाद/);
  });

  it('updates pujari avg_rating after review submission', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[completedBooking]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .post('/api/bookings/review')
      .set('Authorization', `Bearer ${userToken}`)
      .send(reviewPayload);

    // 4th query must update pujari rating
    const ratingCall = pool.query.mock.calls[3];
    expect(ratingCall[0]).toMatch(/UPDATE pujari_profiles/i);
    expect(ratingCall[0]).toMatch(/avg_rating/i);
    expect(ratingCall[1]).toContain(completedBooking.pujari_id);
  });

  it('returns 404 when booking is not completed', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]); // pending/confirmed booking → filtered by status='completed'

    const res = await request(app)
      .post('/api/bookings/review')
      .set('Authorization', `Bearer ${userToken}`)
      .send(reviewPayload);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/पूर्ण झालेली.*सापडली नाही/);
  });

  it('returns 400 on duplicate review', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[completedBooking]])
      .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY', message: 'Duplicate entry' });

    const res = await request(app)
      .post('/api/bookings/review')
      .set('Authorization', `Bearer ${userToken}`)
      .send(reviewPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/आधीच.*अभिप्राय/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/bookings/review').send(reviewPayload);
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. POST /api/bookings/payment/create — Create payment order
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/bookings/payment/create — Create payment order', () => {
  beforeEach(() => pool.query.mockReset());

  it('creates a payment order with amount in paise', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[MOCK_BOOKING]])        // find booking
      .mockResolvedValueOnce([{ affectedRows: 1 }]);  // UPDATE razorpay_order_id

    const res = await request(app)
      .post('/api/bookings/payment/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ booking_id: 100 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('order_id');
    expect(res.body.data.order_id).toMatch(/^order_/);
    expect(res.body.data).toHaveProperty('currency', 'INR');
    // amount must be in paise (×100)
    expect(res.body.data.amount).toBe(MOCK_BOOKING.total_amount * 100);
  });

  it('saves razorpay_order_id to booking', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[MOCK_BOOKING]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .post('/api/bookings/payment/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ booking_id: 100 });

    const updateCall = pool.query.mock.calls[2];
    expect(updateCall[0]).toMatch(/razorpay_order_id/i);
    expect(updateCall[1][1]).toBe(100); // booking_id
  });

  it('returns 404 when booking not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .post('/api/bookings/payment/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ booking_id: 9999 });

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/bookings/payment/create')
      .send({ booking_id: 100 });
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/bookings/payment/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ booking_id: 100 });

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. POST /api/bookings/payment/verify — Verify payment
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/bookings/payment/verify — Verify payment', () => {
  const crypto = require('crypto');

  // Controller checks HMAC signature — compute matching sig so it passes
  const makeVerifyPayload = (orderId, paymentId, bookingId = 100) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return { booking_id: bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature };
  };

  beforeEach(() => pool.query.mockReset());

  it('marks booking as paid and confirmed', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);  // UPDATE payment_status + status

    const res = await request(app)
      .post('/api/bookings/payment/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send(makeVerifyPayload('order_test123', 'pay_TestPaymentId123'));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/पेमेंट यशस्वी/);
  });

  it('sets payment_status=paid and status=confirmed in DB', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    await request(app)
      .post('/api/bookings/payment/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send(makeVerifyPayload('order_test123', 'pay_TestPaymentId123'));

    const updateCall = pool.query.mock.calls[1];
    expect(updateCall[0]).toMatch(/payment_status="paid"/i);
    expect(updateCall[0]).toMatch(/status="confirmed"/i);
    expect(updateCall[1][0]).toBe('pay_TestPaymentId123'); // razorpay_payment_id saved
    expect(updateCall[1][1]).toBe(100);                    // booking_id
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/bookings/payment/verify')
      .send(makeVerifyPayload('order_test123', 'pay_xyz'));
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_USER]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/bookings/payment/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send(makeVerifyPayload('order_err456', 'pay_errorTest456'));

    expect(res.status).toBe(500);
  });
});
