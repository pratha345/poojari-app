'use strict';
// seed_blogs_pitrupaksha_2026.js — 30 Pitrupaksha / shraddha / antyakarma blogs grounded
// in the Dharmasindhu text stored in dharmasindhu_content, plus corrections to six
// existing Pitrupaksha blogs (wrong 2026 dates, wrong tithi rules, filler content).
// Idempotent: new blogs are skipped when the slug exists; patches are skipped when the
// old text is no longer present. Before changing existing rows it writes their current
// state to backups/pitru_blogs_before_<date>.json (only if that file does not exist).
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./db');
const { PATCHES, REWRITES } = require('./blogs_pitrupaksha_2026_updates');

const AUTHOR = 'पूजारी टीम';
const BLOGS = [
  ...require('./blogs_pitrupaksha_2026_part1'),
  ...require('./blogs_pitrupaksha_2026_part2'),
  ...require('./blogs_pitrupaksha_2026_part3'),
];

async function backupExisting() {
  const slugs = [...PATCHES.map(p => p[0]), ...Object.keys(REWRITES)];
  const [rows] = await pool.query(
    'SELECT id, slug, title, excerpt, tags, read_time, content FROM blog_posts WHERE slug IN (?)', [slugs]);
  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'pitru_blogs_before_2026_09_24.json');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(rows, null, 1), 'utf8');
    console.log(`BACKUP: ${rows.length} rows -> ${path.relative(process.cwd(), file)}`);
  }
  return rows.length;
}

(async () => {
  const slugs = BLOGS.map(b => b.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error('duplicate slug in BLOGS');

  let inserted = 0, skipped = 0;
  for (const b of BLOGS) {
    const [[dup]] = await pool.query('SELECT id FROM blog_posts WHERE slug=?', [b.slug]);
    if (dup) { skipped++; console.log(`SKIP (exists): ${b.slug}`); continue; }
    await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author_name, category, tags, read_time, is_published)
       VALUES (?,?,?,?,NULL,?,?,?,?,1)`,
      [b.title, b.slug, b.excerpt, b.content, AUTHOR, b.category, JSON.stringify(b.tags), b.read_time]
    );
    inserted++;
    console.log(`INSERTED: ${b.slug}`);
  }

  const found = await backupExisting();
  console.log(`existing rows to update found: ${found}`);

  let patched = 0;
  for (const [slug, reps] of PATCHES) {
    const [[row]] = await pool.query('SELECT id, content FROM blog_posts WHERE slug=?', [slug]);
    if (!row) { console.log(`PATCH MISSING ROW: ${slug}`); continue; }
    let content = row.content.replace(/\r\n/g, '\n');
    let applied = 0;
    for (const [oldText, newText] of reps) {
      if (content.includes(oldText)) { content = content.replace(oldText, newText); applied++; }
      else console.log(`  patch text not found (already applied?) in ${slug}: ${oldText.slice(0, 40)}...`);
    }
    if (applied) {
      await pool.query('UPDATE blog_posts SET content=? WHERE id=?', [content, row.id]);
      patched++;
    }
    console.log(`PATCHED ${slug}: ${applied}/${reps.length}`);
  }

  let rewritten = 0;
  for (const [slug, r] of Object.entries(REWRITES)) {
    const [[row]] = await pool.query('SELECT id, title, excerpt, tags, read_time FROM blog_posts WHERE slug=?', [slug]);
    if (!row) { console.log(`REWRITE MISSING ROW: ${slug}`); continue; }
    await pool.query(
      'UPDATE blog_posts SET title=?, excerpt=?, tags=?, read_time=?, content=? WHERE id=?',
      [r.title || row.title, r.excerpt || row.excerpt,
       r.tags ? JSON.stringify(r.tags) : (typeof row.tags === 'string' ? row.tags : JSON.stringify(row.tags)),
       r.read_time || row.read_time, r.content, row.id]);
    rewritten++;
    console.log(`REWROTE ${slug} (id ${row.id})`);
  }

  console.log(`\nDONE — inserted=${inserted} skipped=${skipped} patched=${patched} rewritten=${rewritten}`);
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM blog_posts');
  console.log(`TOTAL blogs in DB: ${total}`);
  process.exit(0);
})().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
