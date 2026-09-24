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

// All 20 Maharashtra city pages
const CITY_SLUGS = [
  'pune','mumbai','nashik','nagpur','aurangabad','kolhapur',
  'solapur','thane','satara','ratnagiri','ahmednagar','sangli',
  'navi-mumbai','jalgaon','latur','nanded','akola','amravati','dhule','palghar',
];

// NRI country subpages for Online Puja diaspora targeting
const NRI_COUNTRIES = ['usa','uk','uae','canada','australia'];

const TODAY = new Date().toISOString().split('T')[0];

const STATIC_URLS = [
  // ── Tier 1: Homepage & Core ───────────────────────────────────
  { loc: '/',             changefreq: 'daily',   priority: '1.0', lastmod: TODAY },
  { loc: '/pooja',        changefreq: 'daily',   priority: '0.95', lastmod: TODAY },
  { loc: '/panchang',     changefreq: 'daily',   priority: '0.95', lastmod: TODAY },
  { loc: '/muhurat',      changefreq: 'daily',   priority: '0.9',  lastmod: TODAY },

  // ── Tier 2: Feature pages ────────────────────────────────────
  { loc: '/blog',         changefreq: 'daily',   priority: '0.85' },
  { loc: '/cities',       changefreq: 'weekly',  priority: '0.85' },
  { loc: '/rashifal',     changefreq: 'daily',   priority: '0.8', lastmod: TODAY },
  { loc: '/online-puja',  changefreq: 'weekly',  priority: '0.85' },
  { loc: '/hall-booking', changefreq: 'weekly',  priority: '0.85' },

  // ── Tier 3: NRI online-puja subpages ────────────────────────
  ...NRI_COUNTRIES.map(c => ({
    loc: `/online-puja?country=${c}`, changefreq: 'monthly', priority: '0.75',
  })),

  // ── Tier 4: Pooja categories ─────────────────────────────────
  { loc: '/pooja/gruh-pooja',     changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/havan-jaap',     changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/katha-nitya',    changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/pitru-shraddha', changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/utsav-pooja',    changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/vastu-pooja',    changefreq: 'weekly', priority: '0.8' },
  { loc: '/pooja/adhyatmik-seva', changefreq: 'weekly', priority: '0.7' },

  // ── Tier 5: City pages ───────────────────────────────────────
  ...CITY_SLUGS.map(slug => ({
    loc: `/cities/${slug}`, changefreq: 'weekly', priority: '0.9',
  })),

  // ── Tier 6: Info pages ───────────────────────────────────────
  { loc: '/about',   changefreq: 'monthly', priority: '0.55' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.55' },
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
      'SELECT slug, updated_at FROM poojas WHERE is_active = 1 ORDER BY views DESC LIMIT 200'
    );

    const [blogPosts] = await db.query(
      'SELECT slug, updated_at, created_at FROM blog_posts WHERE is_published = 1 ORDER BY created_at DESC LIMIT 2000'
    ).catch(() => [[]]);

    const [pujaris] = await db.query(
      `SELECT id, updated_at FROM pujari_profiles
       WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 500`
    ).catch(() => [[]]);

    const staticEntries = STATIC_URLS.map(urlEntry).join('\n');

    const poojaEntries = poojas.map(p => urlEntry({
      loc:        `/vidhi/${p.slug}`,
      changefreq: 'weekly',
      priority:   '0.85',
      lastmod:    p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : TODAY,
    })).join('\n');

    const blogEntries = blogPosts.map(b => urlEntry({
      loc:        `/blog/${b.slug}`,
      changefreq: 'monthly',
      priority:   '0.75',
      lastmod:    (b.updated_at || b.created_at)
                    ? new Date(b.updated_at || b.created_at).toISOString().split('T')[0]
                    : undefined,
    })).join('\n');

    const pujariEntries = pujaris.map(p => urlEntry({
      loc:        `/pujari/${p.id}`,
      changefreq: 'weekly',
      priority:   '0.70',
      lastmod:    p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : undefined,
    })).join('\n');

    const totalUrls =
      STATIC_URLS.length + poojas.length + (blogPosts.length) + pujaris.length;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- पूजारी Sitemap — ${totalUrls} URLs — Generated: ${TODAY} -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

<!-- ═══ STATIC + CITY PAGES (${STATIC_URLS.length}) ═══ -->
${staticEntries}

<!-- ═══ POOJA DETAIL PAGES (${poojas.length}) ═══ -->
${poojaEntries}

<!-- ═══ BLOG POSTS (${blogPosts.length}) ═══ -->
${blogEntries}

<!-- ═══ PUJARI PROFILES (${pujaris.length}) ═══ -->
${pujariEntries}

</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800'); // 30 min cache
    res.setHeader('X-Sitemap-Count', totalUrls);
    res.send(xml);
  } catch (err) {
    console.error('Sitemap error:', err.message);
    res.status(500).send('Sitemap generation failed');
  }
});

module.exports = router;
