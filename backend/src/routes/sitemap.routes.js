// src/routes/sitemap.routes.js — Dynamic XML sitemap
const router = require('express').Router();
const db     = require('../config/db');

// BASE_URL = the public frontend URL (not the API server).
// Fallback chain: BASE_URL → CLIENT_URL (already in .env) → localhost.
const BASE_URL = (
  process.env.BASE_URL ||
  process.env.CLIENT_URL ||
  'http://localhost:5173'
).replace(/\/$/, ''); // strip trailing slash

const STATIC_URLS = [
  { loc: '/',          changefreq: 'daily',   priority: '1.0' },
  { loc: '/pooja',     changefreq: 'daily',   priority: '0.9' },
  { loc: '/panchang',  changefreq: 'daily',   priority: '0.9' },
  { loc: '/about',     changefreq: 'monthly', priority: '0.6' },
  { loc: '/contact',   changefreq: 'monthly', priority: '0.6' },
  { loc: '/pooja/gruh-pooja',      changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/havan-jaap',      changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/katha-nitya',     changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/pitru-shraddha',  changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/utsav-pooja',     changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/vastu-pooja',     changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/adhyatmik-seva',  changefreq: 'weekly', priority: '0.8' },
];

function urlEntry({ loc, changefreq, priority, lastmod }) {
  return `  <url>
    <loc>${BASE_URL}${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>\n    ` : ''}<changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

router.get('/', async (req, res) => {
  try {
    const [poojas] = await db.query(
      'SELECT slug, updated_at FROM poojas WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 200'
    );

    const staticEntries  = STATIC_URLS.map(urlEntry).join('\n');
    const dynamicEntries = poojas.map(p => urlEntry({
      loc:        `/vidhi/${p.slug}`,
      changefreq: 'weekly',
      priority:   '0.85',
      lastmod:    p.updated_at
        ? new Date(p.updated_at).toISOString().split('T')[0]
        : undefined,
    })).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${dynamicEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err.message);
    res.status(500).send('Sitemap generation failed');
  }
});

module.exports = router;
