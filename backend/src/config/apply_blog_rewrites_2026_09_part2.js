'use strict';
// Part 2 of the 2026-09 blog cleanup: the rest of the 2026-06-09/17 generated batch
// (wrong festival dates, invented biographies), found after part 1. Also merges the
// duplicate Vishnu Sahasranama post into the fuller one and gives the two Pitrupaksha
// posts rewritten earlier (tarpan, mahalaya) real slugs. Backs up rows first.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const REWRITES = require('./blog_rewrites_2/h1_batch0609');
const MERGE_INTO = { 298: 503 };
const META = [
  { id: 353, slug: 'pitru-tarpan-vidhi-kase-karave' },
  { id: 397, slug: 'mahalaya-mhanje-kay-mahalaya-paksha', title: 'महालय — पितृपक्षातील महालयाचे महत्त्व आणि प्रकार' },
];
const readTime = h => Math.max(3, Math.round(h.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 180));

(async () => {
  const ids = [...REWRITES.map(r => r.id), ...Object.keys(MERGE_INTO).map(Number), ...META.map(m => m.id)];
  const [rows] = await pool.query('SELECT id, slug, title, excerpt, content, CAST(tags AS CHAR) tags, read_time, is_published FROM blog_posts WHERE id IN (?)', [ids]);
  if (rows.length !== ids.length) throw new Error('some rows missing');
  const byId = Object.fromEntries(rows.map(r => [r.id, r]));
  for (const r of REWRITES) if (!r.slug && byId[r.id].slug.startsWith('-')) throw new Error(`needs slug: ${r.id}`);

  const file = path.join(__dirname, 'backups', 'blog_rewrites_part2_before_2026_09.json');
  if (!fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(rows, null, 1), 'utf8'); console.log('BACKUP', rows.length); }
  const redirect = (a, b) => pool.query('INSERT INTO blog_slug_redirects (old_slug, new_slug) VALUES (?,?) ON DUPLICATE KEY UPDATE new_slug=VALUES(new_slug)', [a, b]);

  for (const r of REWRITES) {
    const slug = r.slug || byId[r.id].slug;
    await pool.query('UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, tags=?, read_time=? WHERE id=?',
      [r.title, slug, r.excerpt, r.content, JSON.stringify(r.tags), readTime(r.content), r.id]);
    if (slug !== byId[r.id].slug) await redirect(byId[r.id].slug, slug);
  }
  for (const m of META) {
    await pool.query('UPDATE blog_posts SET slug=?, title=COALESCE(?, title) WHERE id=?', [m.slug, m.title || null, m.id]);
    if (m.slug !== byId[m.id].slug) await redirect(byId[m.id].slug, m.slug);
  }
  for (const [dup, target] of Object.entries(MERGE_INTO)) {
    const [[t]] = await pool.query('SELECT slug, is_published FROM blog_posts WHERE id=?', [target]);
    if (!t || !t.is_published) throw new Error('bad merge target');
    await pool.query('UPDATE blog_posts SET is_published=0 WHERE id=?', [dup]);
    await redirect(byId[dup].slug, t.slug);
  }
  try { await require('../utils/redis').delCachePattern('blog:*'); } catch {}
  const [[{ bad }]] = await pool.query("SELECT COUNT(*) bad FROM blog_posts WHERE is_published=1 AND slug LIKE '-%'");
  const [[{ pub }]] = await pool.query('SELECT COUNT(*) pub FROM blog_posts WHERE is_published=1');
  console.log(`rewritten=${REWRITES.length} meta=${META.length} merged=${Object.keys(MERGE_INTO).length} published=${pub} broken_slugs=${bad}`);
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
