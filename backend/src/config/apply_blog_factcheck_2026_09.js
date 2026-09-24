'use strict';
// apply_blog_factcheck_2026_09.js — line-by-line fact-check of the ~400 published blogs that the
// earlier rewrite passes did not touch. Fixes live in ./blog_factcheck/*.js as small edits:
//   { id, from, to }        replace one exact span of blog_posts.content (must occur exactly once)
//   { id, re, to }          global regex replacement (must match at least once)
//   { id, start, end, to }  replace everything from `start` up to (not including) `end`
//   { id, title }           replace the post title
//   { id, content }         replace the whole content (for posts that were mostly false claims)
// Dates were checked against the site's panchang engine (Pune); Dharmasindhu citations against
// the dharmasindhu_content table.
//
// Usage: node apply_blog_factcheck_2026_09.js            -> dry run, reports every edit
//        node apply_blog_factcheck_2026_09.js --apply    -> backs up touched rows once, then writes
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const APPLY = process.argv.includes('--apply');
const DIR = path.join(__dirname, 'blog_factcheck');
const FIXES = fs.readdirSync(DIR).filter(f => f.endsWith('.js')).sort()
  .flatMap(f => require(path.join(DIR, f)).map(x => ({ ...x, file: f })));

const readTime = html => Math.max(3, Math.round(html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 180));
const count = (s, sub) => s.split(sub).length - 1;

(async () => {
  const ids = [...new Set(FIXES.map(f => f.id))];
  const [rows] = await pool.query(
    'SELECT id, slug, title, content, read_time, is_published FROM blog_posts WHERE id IN (?)', [ids]);
  const byId = Object.fromEntries(rows.map(r => [r.id, { ...r, newTitle: r.title, newContent: r.content }]));

  const problems = [];
  let edits = 0;
  for (const f of FIXES) {
    const row = byId[f.id];
    const where = `${f.file} id=${f.id}`;
    if (!row) { problems.push(`${where}: row not found`); continue; }
    if (!row.is_published) problems.push(`${where}: post is unpublished`);
    if (f.title) { row.newTitle = f.title; edits++; }
    if (f.content) { row.newContent = f.content; row.fullRewrite = true; edits++; continue; }
    if (f.start !== undefined) {
      const a = row.newContent.indexOf(f.start);
      const b = a < 0 ? -1 : row.newContent.indexOf(f.end, a);
      if (count(row.newContent, f.start) !== 1 || b < 0) { problems.push(`${where}: start/end span not found once: ${f.start.slice(0, 70)}`); continue; }
      row.newContent = row.newContent.slice(0, a) + f.to + row.newContent.slice(b);
      edits++;
    } else if (f.from !== undefined) {
      const n = count(row.newContent, f.from);
      if (n !== 1) { problems.push(`${where}: "from" found ${n} times: ${f.from.slice(0, 70)}`); continue; }
      row.newContent = row.newContent.replace(f.from, () => f.to);
      edits++;
    } else if (f.re) {
      const re = new RegExp(f.re, 'g');
      if (!re.test(row.newContent)) { problems.push(`${where}: regex matched nothing: ${f.re.slice(0, 70)}`); continue; }
      row.newContent = row.newContent.replace(new RegExp(f.re, 'g'), f.to);
      edits++;
    } else if (!f.title) {
      problems.push(`${where}: entry has no from/re/start/title/content`);
    }
  }

  const changed = Object.values(byId).filter(r => r.newContent !== r.content || r.newTitle !== r.title);
  for (const r of changed) {
    if (r.fullRewrite) {
      for (const tag of ['p', 'ul', 'ol', 'li', 'h2', 'h3', 'strong', 'em']) {
        const o = (r.newContent.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;
        const c = (r.newContent.match(new RegExp(`</${tag}>`, 'g')) || []).length;
        if (o !== c) problems.push(`id=${r.id}: rewritten content has unbalanced <${tag}> (${o}/${c})`);
      }
      continue;
    }
    for (const tag of ['p', 'ul', 'ol', 'li', 'h2', 'h3', 'strong', 'em', 'table', 'tr', 'td']) {
      const o = (r.newContent.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;
      const c = (r.newContent.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      const o0 = (r.content.match(new RegExp(`<${tag}[ >]`, 'g')) || []).length;
      const c0 = (r.content.match(new RegExp(`</${tag}>`, 'g')) || []).length;
      if (o - c !== o0 - c0) problems.push(`id=${r.id}: edit changed <${tag}> balance (${o0}/${c0} -> ${o}/${c})`);
    }
  }

  console.log(`fix entries: ${FIXES.length}, edits ok: ${edits}, posts changed: ${changed.length}`);
  if (problems.length) {
    console.log(`PROBLEMS (${problems.length}):\n  ` + problems.join('\n  '));
    process.exit(1);
  }
  const preview = (process.argv.find(a => a.startsWith('--preview=')) || '').slice(10).split(',').filter(Boolean).map(Number);
  for (const id of preview) {
    console.log(`\n===== ${id} | ${byId[id].newTitle}\n${byId[id].newContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 1500)}`);
  }
  if (!APPLY) { console.log('dry run only — pass --apply to write'); process.exit(0); }

  const backupFile = path.join(__dirname, 'backups', 'blog_factcheck_before_2026_09.json');
  if (!fs.existsSync(backupFile)) {
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    const [orig] = await pool.query('SELECT id, slug, title, content, read_time FROM blog_posts WHERE id IN (?)', [changed.map(r => r.id)]);
    fs.writeFileSync(backupFile, JSON.stringify(orig, null, 1), 'utf8');
    console.log(`BACKUP: ${orig.length} rows -> ${path.relative(process.cwd(), backupFile)}`);
  } else {
    console.log('backup already exists, keeping the original one');
  }

  for (const r of changed) {
    await pool.query('UPDATE blog_posts SET title=?, content=?, read_time=? WHERE id=?',
      [r.newTitle, r.newContent, readTime(r.newContent), r.id]);
  }
  console.log(`updated ${changed.length} posts`);
  try {
    const { delCachePattern } = require('../utils/redis');
    await delCachePattern('blog:*');
    console.log('redis blog cache cleared');
  } catch (e) { console.log('redis clear skipped:', e.message); }
  process.exit(0);
})().catch(e => { console.error('FACTCHECK ERROR:', e.message); process.exit(1); });
