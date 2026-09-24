'use strict';
// apply_blog_rewrites_2026_09.js — replaces 127 low-quality, machine-generated blogs
// (broken "--123" slugs, repeated sentences, Hindi words, factual errors) with rewritten
// content from ./blog_rewrites/*, and unpublishes 33 that duplicated an existing good
// post. Old URLs keep working through blog_slug_redirects (slug changes and merges).
//
// Safe to re-run: backs up affected rows once (backups/blog_rewrites_before_2026_09.json),
// upserts redirects, and only writes rows whose content differs.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const DIR = path.join(__dirname, 'blog_rewrites');
const REWRITES = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort()
  .flatMap(f => require(path.join(DIR, f)));

// Duplicate post id -> id of the good post that already covers the topic
const MERGE_INTO = {
  341: 231, 342: 135, 345: 216, 346: 215, 348: 236, 350: 234, 356: 278, 359: 298,
  361: 214, 363: 489, 369: 552, 382: 145, 386: 143, 387: 185, 389: 187, 392: 224,
  393: 138, 402: 511, 406: 155, 410: 232, 411: 217, 412: 218, 415: 180, 416: 181,
  417: 213, 431: 136, 452: 222, 466: 287, 470: 217, 471: 191, 398: 391, 448: 143,
  449: 349,
};

const readTime = html => Math.max(3, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 180));

function validate() {
  const ids = REWRITES.map(r => r.id);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate id in rewrites');
  for (const id of Object.keys(MERGE_INTO)) if (ids.includes(+id)) throw new Error(`id ${id} both rewritten and merged`);
  const slugs = REWRITES.filter(r => r.slug).map(r => r.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('duplicate slug in rewrites');
  for (const r of REWRITES) {
    if (!r.title || !r.excerpt || !r.content || !r.tags?.length) throw new Error(`incomplete rewrite ${r.id}`);
    for (const tag of ['p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'h2', 'strong', 'em']) {
      const o = (r.content.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;
      const c = (r.content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (o !== c) throw new Error(`unbalanced <${tag}> in rewrite ${r.id}: ${o}/${c}`);
    }
    if (/[A-Za-z][ऀ-ॏ]|[ऀ-ॿ][A-Za-z]/.test(r.content.replace(/<[^>]+>/g, ''))) {
      throw new Error(`Latin letters inside a Devanagari word in rewrite ${r.id}`);
    }
  }
}

(async () => {
  validate();
  const allIds = [...REWRITES.map(r => r.id), ...Object.keys(MERGE_INTO).map(Number)];
  const [rows] = await pool.query(
    'SELECT id, slug, title, excerpt, content, CAST(tags AS CHAR) AS tags, read_time, is_published FROM blog_posts WHERE id IN (?)', [allIds]);
  const byId = Object.fromEntries(rows.map(r => [r.id, r]));
  const missing = allIds.filter(id => !byId[id]);
  if (missing.length) throw new Error(`rows not found: ${missing.join(',')}`);

  // Every rewrite that still has a broken "-..." slug must get a new one
  for (const r of REWRITES) {
    if (!r.slug && byId[r.id].slug.startsWith('-')) throw new Error(`rewrite ${r.id} needs a new slug (current ${byId[r.id].slug})`);
  }
  // New slugs must not collide with other posts
  for (const r of REWRITES.filter(x => x.slug && x.slug !== byId[x.id].slug)) {
    const [[clash]] = await pool.query('SELECT id FROM blog_posts WHERE slug=? AND id<>?', [r.slug, r.id]);
    if (clash) throw new Error(`slug ${r.slug} already used by post ${clash.id}`);
  }

  const backupDir = path.join(__dirname, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, 'blog_rewrites_before_2026_09.json');
  if (!fs.existsSync(backupFile)) {
    fs.writeFileSync(backupFile, JSON.stringify(rows, null, 1), 'utf8');
    console.log(`BACKUP: ${rows.length} rows -> ${path.relative(process.cwd(), backupFile)}`);
  }

  await pool.query(`CREATE TABLE IF NOT EXISTS blog_slug_redirects (
    old_slug VARCHAR(320) COLLATE utf8mb4_unicode_ci NOT NULL PRIMARY KEY,
    new_slug VARCHAR(320) COLLATE utf8mb4_unicode_ci NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const redirect = (from, to) => pool.query(
    'INSERT INTO blog_slug_redirects (old_slug, new_slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE new_slug = VALUES(new_slug)', [from, to]);

  let rewritten = 0, renamed = 0;
  const finalSlug = {};
  for (const r of REWRITES) {
    const old = byId[r.id];
    const slug = r.slug || old.slug;
    finalSlug[r.id] = slug;
    await pool.query(
      'UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, tags=?, read_time=? WHERE id=?',
      [r.title, slug, r.excerpt, r.content, JSON.stringify(r.tags), readTime(r.content), r.id]);
    rewritten++;
    if (slug !== old.slug) { await redirect(old.slug, slug); renamed++; }
  }
  console.log(`rewritten=${rewritten} slug_changes=${renamed}`);

  let merged = 0;
  for (const [dupId, targetId] of Object.entries(MERGE_INTO)) {
    let targetSlug = finalSlug[targetId];
    if (!targetSlug) {
      const [[t]] = await pool.query('SELECT slug, is_published FROM blog_posts WHERE id=?', [targetId]);
      if (!t || !t.is_published) throw new Error(`merge target ${targetId} missing or unpublished`);
      targetSlug = t.slug;
    }
    await pool.query('UPDATE blog_posts SET is_published=0 WHERE id=?', [dupId]);
    await redirect(byId[dupId].slug, targetSlug);
    merged++;
  }
  console.log(`unpublished_and_redirected=${merged}`);

  // Drop cached lists/posts so the site shows the new content immediately
  try {
    const { delCachePattern } = require('../utils/redis');
    await delCachePattern('blog:*');
    console.log('redis blog cache cleared');
  } catch (e) { console.log('redis clear skipped:', e.message); }

  const [[{ pub }]] = await pool.query('SELECT COUNT(*) pub FROM blog_posts WHERE is_published=1');
  const [[{ bad }]] = await pool.query("SELECT COUNT(*) bad FROM blog_posts WHERE is_published=1 AND slug LIKE '-%'");
  console.log(`published blogs: ${pub}, published with broken slugs: ${bad}`);
  process.exit(0);
})().catch(e => { console.error('REWRITE ERROR:', e.message); process.exit(1); });
