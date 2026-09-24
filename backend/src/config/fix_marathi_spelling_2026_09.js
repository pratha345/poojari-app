'use strict';
// fix_marathi_spelling_2026_09.js — mechanical Marathi fixes found by a full-text scan
// of blogs and poojas: standard spellings (महत्त्व, आध्यात्मिक, दृष्टिकोन, सन्मान …),
// English letters that leaked into Devanagari words, doubled vowel signs, Hindi words
// (दुल्हन/दूल्हा), a fabricated Mirabai bhajan pair and a garbled saptapadi mantra.
// Writes the affected rows to backups/ before changing them. Idempotent.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./db');

// [regex, replacement]; applied in order to every text field listed in TARGETS
const RULES = [
  [/महत्व/g, 'महत्त्व'],
  [/अध्यात्मिक/g, 'आध्यात्मिक'],
  [/दृष्टीकोन/g, 'दृष्टिकोन'],
  [/सम्मान/g, 'सन्मान'],
  [/सुचना/g, 'सूचना'],
  [/पध्दत/g, 'पद्धत'],
  [/सु(?:य़|य़)ोग्य/g, 'सुयोग्य'],   // precomposed or decomposed य़
  [/त्र्यAMBकेश्वर/g, 'त्र्यंबकेश्वर'],
  [/रukमणी/g, 'रुक्मिणी'],
  [/शUBH/g, 'शुभ'],
  [/जगदodharा विठठला/g, 'जगदोद्धारा विठ्ठला'],
  [/प्रarambha/g, 'प्रारंभ'],
  [/प Pushkarinी तीर्थ/g, 'पुष्करिणी तीर्थ'],
  [/"मुझे ना कोई दिखाई दे" आणि "पayette गुंजे"/g, '"मेरे तो गिरिधर गोपाल, दूसरो न कोई" आणि "पायोजी मैंने राम रतन धन पायो"'],
  [/सखाSयुSष्टे गमेयम्\.\.\./g, 'सखे सप्तपदा भव… सख्यं ते गमेयम्…'],   // inside JSON the quotes are escaped
  [/विकासााठी/g, 'विकासासाठी'],
  [/इतिहाात/g, 'इतिहासात'],
  [/वििध/g, 'विविध'],
  [/पूजेे/g, 'पूजेने'],
  [/दुल्हन णि/g, 'वधू आणि'],
  [/दुल्हनच्या/g, 'वधूच्या'],
  [/दूल्ह्याच्या/g, 'वराच्या'],
  [/दुल्हन/g, 'वधू'],
  [/दूल्हा/g, 'वर'],
  [/(^|[^ऀ-ॿ])ही विधी/g, '$1हा विधी'],
  [/विधी केली जाते/g, 'विधी केला जातो'],
];

const TARGETS = [
  ['blog_posts', ['title', 'excerpt', 'content', 'tags']],
  ['poojas', ['name_mr', 'short_desc', 'description', 'steps']],
  ['aartis', ['meaning', 'occasion', 'source_note']],   // lyrics are original text: untouched
];

const fix = s => RULES.reduce((acc, [rx, rep]) => acc.replace(rx, rep), s);

(async () => {
  // Pass 1: compute every change and back up the originals before writing anything
  const changes = [];
  for (const [table, cols] of TARGETS) {
    // JSON columns come back parsed from mysql2; read them as text so they round-trip
    const sel = cols.map(c => ['tags', 'steps'].includes(c) ? `CAST(\`${c}\` AS CHAR) AS \`${c}\`` : `\`${c}\``).join(', ');
    const [rows] = await pool.query(`SELECT id, ${sel} FROM \`${table}\``);
    for (const r of rows) {
      const upd = {}, before = {};
      for (const c of cols) {
        if (r[c] == null) continue;
        const v = String(r[c]);
        const f = fix(v);
        if (f !== v) { upd[c] = f; before[c] = v; }
      }
      if (Object.keys(upd).length) changes.push({ table, id: r.id, upd, before });
    }
  }
  if (!changes.length) { console.log('DONE — nothing to change'); process.exit(0); }
  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `marathi_spelling_before_${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(changes.map(({ table, id, before }) => ({ table, id, before })), null, 1), 'utf8');
  console.log('BACKUP ->', path.relative(process.cwd(), file));

  // Pass 2: apply
  for (const { table, id, upd } of changes) {
    const set = Object.keys(upd).map(c => `\`${c}\`=?`).join(', ');
    await pool.query(`UPDATE \`${table}\` SET ${set} WHERE id=?`, [...Object.values(upd), id]);
    console.log(`FIXED ${table}#${id}: ${Object.keys(upd).join(',')}`);
  }
  console.log(`DONE — rows changed: ${changes.length}`);
  process.exit(0);
})().catch(e => { console.error('FIX ERROR:', e.message); process.exit(1); });
