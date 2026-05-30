// __tests__/kundali-micro.test.js — Kundali / Gun Milan MICRO-LEVEL Tests
// Tests: matchKundali output structure, koota scores, doshas, DB operations,
//        listKundali pagination+search, getKundali JSON parsing, deleteKundali
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
const { makeAdminToken } = require('./helpers/authHelper');
const { MOCK_ADMIN }     = require('./helpers/mockDb');

const adminToken = makeAdminToken(MOCK_ADMIN);

// Known valid rashis and nakshatras for assertions
const VALID_RASHIS = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'];
const VALID_NAKSHATRAS = [
  'अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','अश्लेषा',
  'मघा','पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा',
  'ज्येष्ठा','मूळ','पूर्वाषाढा','उत्तराषाढा','श्रवण','धनिष्ठा','शतभिषा',
  'पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती',
];
const VALID_GANAS   = ['देव','मानव','राक्षस'];
const VALID_NADIS   = ['आदि','मध्य','अंत्य'];
const VALID_GRADES  = ['A+', 'A', 'B', 'C', 'D']; // service uses letter grades
const VALID_STATUSES = ['good','average','bad'];

// ── Test data ─────────────────────────────────────────────────────────
const BRIDE = { name: 'प्रिया शर्मा', dob: '1996-05-15', tob: '08:30', city: 'पुणे' };
const GROOM = { name: 'अमित पाटील',  dob: '1993-11-20', tob: '14:00', city: 'मुंबई' };

// ═══════════════════════════════════════════════════════════════════════
// 1. POST /api/kundali/match — Input Validation
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/kundali/match — Input validation', () => {
  beforeEach(() => pool.query.mockReset());

  it('returns 400 when bride data missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ groom: GROOM });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/नाव.*जन्मतारीख/);
  });

  it('returns 400 when bride.name is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: { dob: '1996-05-15' }, groom: GROOM });

    expect(res.status).toBe(400);
  });

  it('returns 400 when bride.dob is missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: { name: 'Test' }, groom: GROOM });

    expect(res.status).toBe(400);
  });

  it('returns 400 when groom data missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE });

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty body', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).post('/api/kundali/match').send({ bride: BRIDE, groom: GROOM });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 2. POST /api/kundali/match — Output Structure (real calculation)
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/kundali/match — Output structure', () => {
  let result;

  beforeAll(async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });
    result = res.body.data;
  });

  it('returns success with Gun Milan message', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/गुण मिलान/);
  });

  // ── Total Gun ────────────────────────────────────────────────
  it('totalGun is between 0 and 36', () => {
    expect(result.totalGun).toBeGreaterThanOrEqual(0);
    expect(result.totalGun).toBeLessThanOrEqual(36);
  });

  it('totalGun equals sum of all koota scores', () => {
    const kootaSum = result.kootas.reduce((sum, k) => sum + (k.score || 0), 0);
    expect(result.totalGun).toBeCloseTo(kootaSum, 0);
  });

  // ── Grade ────────────────────────────────────────────────────
  it('grade is one of the valid grades', () => {
    expect(VALID_GRADES).toContain(result.grade);
  });

  it('grade reflects totalGun correctly (A+/A/B/C/D)', () => {
    if      (result.totalGun >= 32) expect(result.grade).toBe('A+');
    else if (result.totalGun >= 27) expect(result.grade).toBe('A');
    else if (result.totalGun >= 21) expect(result.grade).toBe('B');
    else if (result.totalGun >= 18) expect(result.grade).toBe('C');
    else                             expect(result.grade).toBe('D');
  });

  // ── Kootas (8 elements) ──────────────────────────────────────
  it('kootas has exactly 8 elements', () => {
    expect(result.kootas).toHaveLength(8);
  });

  it('each koota has score, max, note, status', () => {
    result.kootas.forEach(k => {
      expect(k).toHaveProperty('score');
      expect(k).toHaveProperty('max');
      expect(typeof k.note).toBe('string');
      expect(VALID_STATUSES).toContain(k.status);
    });
  });

  it('koota scores are non-negative', () => {
    result.kootas.forEach(k => {
      expect(k.score).toBeGreaterThanOrEqual(0);
    });
  });

  it('koota scores do not exceed max', () => {
    result.kootas.forEach(k => {
      expect(k.score).toBeLessThanOrEqual(k.max);
    });
  });

  it('Nadi koota has max=8 (highest weight)', () => {
    const nadi = result.kootas.find(k => k.nameEn === 'Nadi');
    expect(nadi).toBeDefined();
    expect(nadi.max).toBe(8);
  });

  it('Varna koota has max=1 (lowest weight)', () => {
    const varna = result.kootas.find(k => k.nameEn === 'Varna');
    expect(varna).toBeDefined();
    expect(varna.max).toBe(1);
  });

  it('kootas have all 8 names in correct order', () => {
    const names = result.kootas.map(k => k.nameEn);
    expect(names).toEqual(['Varna','Vashya','Tara','Yoni','Graha Maitri','Gana','Bhakoot','Nadi']);
  });

  it('maxGun is always 36', () => {
    expect(result.maxGun).toBe(36);
  });

  it('percent = round(totalGun/36 * 100)', () => {
    expect(result.percent).toBe(Math.round(result.totalGun / 36 * 100));
  });

  // ── Doshas ───────────────────────────────────────────────────
  it('doshas is an array of strings', () => {
    expect(Array.isArray(result.doshas)).toBe(true);
    result.doshas.forEach(d => expect(typeof d).toBe('string'));
  });

  it('doshas contains known dosha names when present', () => {
    const knownDoshas = ['नाडी दोष', 'भकूट दोष', 'गण दोष'];
    result.doshas.forEach(d => {
      expect(knownDoshas.some(k => d.includes(k.split(' ')[0]))).toBe(true);
    });
  });

  // ── Recommendation ───────────────────────────────────────────
  it('recommendation is a non-empty string', () => {
    expect(typeof result.recommendation).toBe('string');
    expect(result.recommendation.length).toBeGreaterThan(0);
  });

  // ── Bride/Groom birth data ────────────────────────────────────
  it('bride data has valid nakshatra', () => {
    expect(VALID_NAKSHATRAS).toContain(result.bride.nakshatra);
  });

  it('bride data has valid rashi', () => {
    expect(VALID_RASHIS).toContain(result.bride.rashi);
  });

  it('bride has planets array with 9 entries (9 grahas)', () => {
    expect(Array.isArray(result.bride.planets)).toBe(true);
    expect(result.bride.planets).toHaveLength(9);
  });

  it('each planet has name and rashiIdx (0-11)', () => {
    result.bride.planets.forEach(p => {
      expect(p).toHaveProperty('name');
      expect(p.rashiIdx).toBeGreaterThanOrEqual(0);
      expect(p.rashiIdx).toBeLessThanOrEqual(11);
    });
  });

  it('groom data has valid nakshatra', () => {
    expect(VALID_NAKSHATRAS).toContain(result.groom.nakshatra);
  });

  it('groom data has valid rashi', () => {
    expect(VALID_RASHIS).toContain(result.groom.rashi);
  });

  it('nakshatraIdx is between 0 and 26', () => {
    expect(result.bride.nakshatraIdx).toBeGreaterThanOrEqual(0);
    expect(result.bride.nakshatraIdx).toBeLessThanOrEqual(26);
    expect(result.groom.nakshatraIdx).toBeGreaterThanOrEqual(0);
  });

  it('rashiIdx is between 0 and 11', () => {
    expect(result.bride.rashiIdx).toBeGreaterThanOrEqual(0);
    expect(result.bride.rashiIdx).toBeLessThanOrEqual(11);
    expect(result.groom.rashiIdx).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 3. POST /api/kundali/match — Dosha Detection Logic
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/kundali/match — Dosha detection', () => {
  beforeEach(() => pool.query.mockReset());

  it('Nadi Dosha when both same nakshatra → nadi koota = 0 and dosha listed', async () => {
    // Same DOB → same nakshatra → same nadi → nadi dosha
    const samePerson = { name: 'A', dob: '1995-07-15', tob: '10:00' };
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: { ...samePerson, name: 'Bride' }, groom: { ...samePerson, name: 'Groom' } });

    expect(res.status).toBe(200);
    // Same nakshatra → Nadi dosha (same nadi = 0 points)
    const nadiKoota = res.body.data.kootas.find(k => k.max === 8);
    expect(nadiKoota.score).toBe(0);
    // doshas is array of strings
    expect(res.body.data.doshas.some(d => d.includes('नाडी'))).toBe(true);
  });

  it('No doshas possible when couple highly compatible', async () => {
    // Different nakshatras → no nadi dosha
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });

    expect(res.status).toBe(200);
    // doshas can be 0 or more — just ensure it's a valid array
    expect(Array.isArray(res.body.data.doshas)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 4. POST /api/kundali/match — result field consistency
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/kundali/match — result field', () => {
  beforeEach(() => pool.query.mockReset());

  it('result field reflects grade category', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/match')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });

    expect(res.body.data).toHaveProperty('result');
    // result should be a string description
    expect(typeof res.body.data.result).toBe('string');
    expect(res.body.data.result.length).toBeGreaterThan(0);
  });

  it('deterministic — same inputs give same output', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const [r1, r2] = await Promise.all([
      request(app).post('/api/kundali/match').set('Authorization', `Bearer ${adminToken}`).send({ bride: BRIDE, groom: GROOM }),
      request(app).post('/api/kundali/match').set('Authorization', `Bearer ${adminToken}`).send({ bride: BRIDE, groom: GROOM }),
    ]);

    expect(r1.body.data.totalGun).toBe(r2.body.data.totalGun);
    expect(r1.body.data.grade).toBe(r2.body.data.grade);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 5. POST /api/kundali/save — Save to DB
// ═══════════════════════════════════════════════════════════════════════
describe('POST /api/kundali/save — Save kundali match', () => {
  beforeEach(() => pool.query.mockReset());

  it('calculates + saves to DB and returns 201', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 50, affectedRows: 1 }]);

    const res = await request(app)
      .post('/api/kundali/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/जतन/);
    expect(res.body.data.totalGun).toBeGreaterThanOrEqual(0);
  });

  it('DB INSERT includes all 19 required columns', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 51, affectedRows: 1 }]);

    await request(app)
      .post('/api/kundali/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });

    const insertCall = pool.query.mock.calls[1];
    expect(insertCall[0]).toMatch(/INSERT INTO kundali_matches/i);
    // 19 values for 19 columns
    expect(insertCall[1]).toHaveLength(19);
  });

  it('kootas and doshas are JSON.stringified in DB', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 52, affectedRows: 1 }]);

    await request(app)
      .post('/api/kundali/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });

    const insertCall = pool.query.mock.calls[1];
    const values = insertCall[1];
    // Find the two JSON fields — kootas (array) and doshas (array) are JSON strings
    const jsonStrings = values.filter(v => typeof v === 'string' && (v.startsWith('[') || v.startsWith('{')));
    expect(jsonStrings.length).toBeGreaterThanOrEqual(2);
    jsonStrings.forEach(s => expect(() => JSON.parse(s)).not.toThrow());
  });

  it('created_by is set to req.user.id', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ insertId: 53, affectedRows: 1 }]);

    await request(app)
      .post('/api/kundali/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: BRIDE, groom: GROOM });

    const insertCall = pool.query.mock.calls[1];
    // Last value = created_by = MOCK_ADMIN.id
    expect(insertCall[1][18]).toBe(MOCK_ADMIN.id);
  });

  it('returns 400 when required fields missing', async () => {
    pool.query.mockResolvedValueOnce([[MOCK_ADMIN]]);

    const res = await request(app)
      .post('/api/kundali/save')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ bride: { name: 'Test' } });

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/kundali/save')
      .send({ bride: BRIDE, groom: GROOM });
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 6. GET /api/kundali — List saved matches
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/kundali — List kundali matches', () => {
  beforeEach(() => pool.query.mockReset());

  const MOCK_RECORD = {
    id: 1, bride_name: 'प्रिया', bride_dob: '1996-05-15', bride_city: 'पुणे',
    bride_nak_idx: 12, bride_rashi_idx: 3,
    groom_name: 'अमित', groom_dob: '1993-11-20', groom_city: 'मुंबई',
    groom_nak_idx: 20, groom_rashi_idx: 7,
    total_gun: 25, match_result: 'उत्तम जुळणी', grade: 'उत्तम',
    doshas: '[]', recommendation: 'विवाह योग्य आहे.',
    created_at: '2026-01-01T00:00:00.000Z',
  };

  it('returns paginated list of saved matches', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_RECORD]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const res = await request(app)
      .get('/api/kundali')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.rows).toHaveLength(1);
    expect(res.body.data).toMatchObject({ total: 1, page: 1, limit: 20 });
  });

  it('searches by bride_name', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_RECORD]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    await request(app)
      .get('/api/kundali?search=प्रिया')
      .set('Authorization', `Bearer ${adminToken}`);

    const listCall = pool.query.mock.calls[1];
    expect(listCall[0]).toMatch(/bride_name LIKE/i);
    expect(listCall[1]).toContain('%प्रिया%');
  });

  it('searches by groom_name too', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_RECORD]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    await request(app)
      .get('/api/kundali?search=अमित')
      .set('Authorization', `Bearer ${adminToken}`);

    const listCall = pool.query.mock.calls[1];
    expect(listCall[0]).toMatch(/groom_name LIKE/i);
  });

  it('returns correct pagination for page=2&limit=5', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 15 }]]);

    const res = await request(app)
      .get('/api/kundali?page=2&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data).toMatchObject({ page: 2, limit: 5, total: 15 });
    // OFFSET = (2-1)*5 = 5
    const listCall = pool.query.mock.calls[1];
    expect(listCall[1]).toContain(5); // limit
    expect(listCall[1]).toContain(5); // offset
  });

  it('no WHERE clause when no search param', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await request(app)
      .get('/api/kundali')
      .set('Authorization', `Bearer ${adminToken}`);

    const listCall = pool.query.mock.calls[1];
    expect(listCall[0]).not.toMatch(/WHERE/i);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/kundali');
    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 7. GET /api/kundali/:id — Get single match
// ═══════════════════════════════════════════════════════════════════════
describe('GET /api/kundali/:id — Get single kundali match', () => {
  beforeEach(() => pool.query.mockReset());

  const MOCK_DB_RECORD = {
    id: 1, bride_name: 'प्रिया', groom_name: 'अमित',
    total_gun: 25, grade: 'उत्तम',
    details:  JSON.stringify([{ name: 'वर्ण', score: 1, max: 1 }]),
    doshas:   JSON.stringify([{ name: 'नाडी दोष', description: 'समान नाडी' }]),
    recommendation: 'विवाह योग्य',
  };

  it('returns record with parsed JSON details and doshas', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[MOCK_DB_RECORD]]);

    const res = await request(app)
      .get('/api/kundali/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    // details should be parsed (array, not string)
    expect(Array.isArray(res.body.data.details)).toBe(true);
    expect(res.body.data.details[0]).toHaveProperty('name', 'वर्ण');
    // doshas should be parsed too
    expect(Array.isArray(res.body.data.doshas)).toBe(true);
  });

  it('does not re-parse already-parsed objects', async () => {
    // If DB returns parsed objects (not strings), controller shouldn't crash
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[{
        ...MOCK_DB_RECORD,
        details:  [{ name: 'वर्ण', score: 1 }], // already object
        doshas:   [],
      }]]);

    const res = await request(app)
      .get('/api/kundali/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  it('returns 404 when record not found', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([[]]); // not found

    const res = await request(app)
      .get('/api/kundali/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/kundali/1');
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .get('/api/kundali/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// 8. DELETE /api/kundali/:id — Delete saved match
// ═══════════════════════════════════════════════════════════════════════
describe('DELETE /api/kundali/:id — Delete kundali match', () => {
  beforeEach(() => pool.query.mockReset());

  it('deletes existing record successfully', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .delete('/api/kundali/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/हटवली/);

    const deleteCall = pool.query.mock.calls[1];
    expect(deleteCall[0]).toMatch(/DELETE FROM kundali_matches/i);
    expect(deleteCall[1]).toContain('1');
  });

  it('returns 404 when record does not exist', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockResolvedValueOnce([{ affectedRows: 0 }]); // 0 rows deleted

    const res = await request(app)
      .delete('/api/kundali/9999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/सापडली नाही/);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete('/api/kundali/1');
    expect(res.status).toBe(401);
  });

  it('returns 500 on DB error', async () => {
    pool.query
      .mockResolvedValueOnce([[MOCK_ADMIN]])
      .mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app)
      .delete('/api/kundali/1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(500);
  });
});
