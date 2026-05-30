// __tests__/contact.test.js — Contact Module Tests
// Covers: POST /api/contact — form submission, validation, DB insert
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
// POST /api/contact
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/contact — Contact form submission', () => {
  const fullPayload = {
    name:    'रामचंद्र देशपांडे',
    email:   'ram@example.com',
    phone:   '9876543210',
    subject: 'पूजा बुकिंग विचारणा',
    message: 'मला सत्यनारायण पूजेसाठी पुजारी हवा आहे.',
  };

  beforeEach(() => pool.query.mockReset());

  it('submits contact form with all fields successfully', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 1, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/contact')
      .send(fullPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/संदेश पाठवला/);
  });

  it('inserts all fields into DB correctly', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 2, affectedRows: 1 }]);

    await request(app).post('/api/contact').send(fullPayload);

    const insertCall = pool.query.mock.calls[0];
    expect(insertCall[0]).toMatch(/INSERT INTO contact_inquiries/i);
    expect(insertCall[1]).toContain('रामचंद्र देशपांडे');
    expect(insertCall[1]).toContain('ram@example.com');
    expect(insertCall[1]).toContain('9876543210');
    expect(insertCall[1]).toContain('पूजा बुकिंग विचारणा');
    expect(insertCall[1]).toContain('मला सत्यनारायण पूजेसाठी पुजारी हवा आहे.');
  });

  it('submits with only required fields (name + message)', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 3, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'सुरेश पाटील', message: 'मला मदत हवी आहे.' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('submits without email (optional)', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 4, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'अनिल कुलकर्णी', phone: '9111111111', message: 'चौकशी' });

    expect(res.status).toBe(200);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ message: 'नाव न देता संदेश' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/नाव.*संदेश.*आवश्यक/);
    // DB should NOT be called
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns 400 when message is missing', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'कोणीतरी' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('returns 400 when both name and message are missing', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ email: 'test@test.com', phone: '9999999999' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty request body', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 500 on DB error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .post('/api/contact')
      .send(fullPayload);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/त्रुटी/);
  });

  it('does not require authentication — public route', async () => {
    pool.query.mockResolvedValueOnce([{ insertId: 5, affectedRows: 1 }]);

    // No Authorization header
    const res = await request(app)
      .post('/api/contact')
      .send(fullPayload);

    expect(res.status).toBe(200);
  });
});
