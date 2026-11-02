'use strict';
// seed_blogs_dharmasindhu_kriyakarma.js — kriyakarma blogs grounded in the Dharmasindhu text
// stored in dharmasindhu_content (samskaras, janan-shantis, upanayana, vivah, ahnika,
// pratishtha, everyday muhurtas, antyakarma). Insert-only and idempotent: a blog is skipped
// when its slug already exists. Before inserting it checks the batch for duplicate slugs and
// for internal /blog/<slug> links that point nowhere. Run with --dry to only check.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');

const AUTHOR = 'पूजारी टीम';
const BLOGS = ['A', 'B', 'C', 'D', 'E', 'F']
  .flatMap(p => require(`./blogs_dharmasindhu_kriyakarma_part${p}`));
const DRY = process.argv.includes('--dry');

async function main() {
  const slugs = BLOGS.map(b => b.slug);
  const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
  if (dup.length) throw new Error(`duplicate slugs in batch: ${dup.join(', ')}`);
  for (const b of BLOGS) {
    for (const k of ['title', 'slug', 'category', 'excerpt', 'content']) {
      if (!b[k]) throw new Error(`${b.slug || b.title}: missing ${k}`);
    }
  }

  const [rows] = await pool.query('SELECT slug FROM blog_posts');
  const existing = new Set(rows.map(r => r.slug));
  const known = new Set([...existing, ...slugs]);
  const broken = [];
  for (const b of BLOGS) {
    for (const m of b.content.matchAll(/href="\/blog\/([^"]+)"/g)) {
      if (!known.has(m[1])) broken.push(`${b.slug} -> ${m[1]}`);
    }
  }
  if (broken.length) throw new Error(`broken internal links:\n  ${broken.join('\n  ')}`);

  let added = 0, skipped = 0;
  for (const b of BLOGS) {
    if (existing.has(b.slug)) { skipped++; console.log(`SKIP  ${b.slug}`); continue; }
    if (DRY) { console.log(`NEW   ${b.slug}`); added++; continue; }
    await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author_name, category, tags, read_time, is_published)
       VALUES (?,?,?,?,NULL,?,?,?,?,1)`,
      [b.title, b.slug, b.excerpt, b.content, AUTHOR, b.category, JSON.stringify(b.tags || []), b.read_time || 5]);
    added++;
    console.log(`ADD   ${b.slug}`);
  }
  console.log(`${DRY ? 'DRY RUN — would add' : 'added'} ${added}, skipped ${skipped}, total in batch ${BLOGS.length}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
