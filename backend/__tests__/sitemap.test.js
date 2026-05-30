// __tests__/sitemap.test.js — Sitemap Module Tests
// Covers: GET /sitemap.xml — XML generation with poojas, blogs, pujaris, static URLs
'use strict';

const request = require('supertest');

jest.mock('../src/config/db', () => ({
  query:         jest.fn().mockResolvedValue([[]]),
  getConnection: jest.fn().mockResolvedValue({ release: jest.fn() }),
}));

jest.mock('../src/middleware/tenant.middleware', () => ({
  resolveTenant: (req, res, next) => { req.tenantId = 1; req.tenant = { id: 1 }; next(); },
  attachTenant:     (req, res, next) => next(),
  subscriptionGate: (req, res, next) => next(),
}));

const app  = require('../src/app');
const pool = require('../src/config/db');

describe('GET /sitemap.xml — Dynamic XML Sitemap', () => {
  beforeEach(() => pool.query.mockReset());

  const mockSitemapData = () => {
    pool.query
      .mockResolvedValueOnce([[                                              // poojas
        { slug: 'satyanarayan-pooja',   updated_at: '2026-01-01T00:00:00Z' },
        { slug: 'rudra-abhishek',       updated_at: '2026-02-01T00:00:00Z' },
      ]])
      .mockResolvedValueOnce([[                                              // blog_posts
        { slug: 'ganesh-chaturthi-2026', created_at: '2026-01-01T00:00:00Z', updated_at: null },
        { slug: 'navratri-2026',         created_at: '2026-01-05T00:00:00Z', updated_at: '2026-01-10T00:00:00Z' },
      ]])
      .mockResolvedValueOnce([[                                              // pujari_profiles
        { id: 10, updated_at: '2026-01-15T00:00:00Z' },
        { id: 11, updated_at: '2026-01-20T00:00:00Z' },
      ]]);
  };

  it('returns valid XML with Content-Type application/xml', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/xml/i);
  });

  it('response starts with XML declaration', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toMatch(/^<\?xml version="1\.0"/);
  });

  it('contains <urlset> root element', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toContain('<urlset');
    expect(res.text).toContain('</urlset>');
  });

  it('includes homepage URL with highest priority', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toMatch(/<priority>1\.0<\/priority>/);
    expect(res.text).toContain('<changefreq>daily</changefreq>');
  });

  it('includes pooja detail URLs (/vidhi/slug)', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toContain('/vidhi/satyanarayan-pooja');
    expect(res.text).toContain('/vidhi/rudra-abhishek');
  });

  it('includes blog post URLs (/blog/slug)', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toContain('/blog/ganesh-chaturthi-2026');
    expect(res.text).toContain('/blog/navratri-2026');
  });

  it('includes pujari profile URLs (/pujari/:id)', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toContain('/pujari/10');
    expect(res.text).toContain('/pujari/11');
  });

  it('includes city pages (/cities/pune, /cities/mumbai)', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.text).toContain('/cities/pune');
    expect(res.text).toContain('/cities/mumbai');
    expect(res.text).toContain('/cities/nashik');
  });

  it('includes X-Sitemap-Count header', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.headers['x-sitemap-count']).toBeDefined();
    const count = parseInt(res.headers['x-sitemap-count']);
    expect(count).toBeGreaterThan(0);
  });

  it('handles empty DB gracefully (blog query fails softly)', async () => {
    pool.query
      .mockResolvedValueOnce([[{ slug: 'test-pooja', updated_at: null }]])
      .mockRejectedValueOnce(new Error('blog table missing'))  // blog query fails
      .mockResolvedValueOnce([[{ id: 1, updated_at: null }]]);

    const res = await request(app).get('/sitemap.xml');

    // Blog query uses .catch(() => [[]]) — should not crash
    expect(res.status).toBe(200);
    expect(res.text).toContain('<urlset');
  });

  it('sets 30-minute Cache-Control header', async () => {
    mockSitemapData();

    const res = await request(app).get('/sitemap.xml');

    expect(res.headers['cache-control']).toMatch(/max-age=1800/);
  });

  it('returns 500 when main poojas query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB crash'));

    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(500);
  });
});
