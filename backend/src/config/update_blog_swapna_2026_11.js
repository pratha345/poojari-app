'use strict';
// update_blog_swapna_2026_11.js — adds the parts of Dharmasindhu p605 that the dream post
// (swapnanche-phal-shubh-ashubh-swapna-dharmasindhu) did not have: the white/black-objects
// rule, when a dream "bears fruit" by the prahar it was seen in, and the remedies for a bad
// dream. Writes the old row to backups/swapna_blog_before_2026_11_17.json once before changing it.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const SLUG = 'swapnanche-phal-shubh-ashubh-swapna-dharmasindhu';
const MARK = '<h2>स्वप्नांकडे कसे पाहावे?</h2>';

const section = `<h2>पांढरे आणि काळे: एक सोपा नियम</h2>
<p>धर्मसिंधू एक सर्वसाधारण सूत्र देतो: राख, भात आणि ताक सोडून <strong>सर्व पांढऱ्या वस्तू स्वप्नात शुभ</strong>; आणि गाय, हत्ती, देव आणि ब्राह्मण सोडून <strong>सर्व काळ्या वस्तू अशुभ</strong>.</p>

<h2>स्वप्न कधी फळते? रात्रीच्या प्रहरानुसार</h2>
<table>
<tr><th>स्वप्न कधी पडले</th><th>फळ कधी</th></tr>
<tr><td>रात्रीचा पहिला प्रहर</td><td>एका वर्षाने</td></tr>
<tr><td>दुसरा प्रहर</td><td>आठ महिन्यांनी</td></tr>
<tr><td>तिसरा प्रहर</td><td>तीन महिन्यांनी</td></tr>
<tr><td>चौथा प्रहर</td><td>महिन्याच्या आत</td></tr>
<tr><td>अरुणोदय (पहाट)</td><td>दहा दिवसांत</td></tr>
<tr><td>सूर्योदयाच्या वेळी</td><td>लगेच</td></tr>
</table>

<h2>वाईट स्वप्न पडल्यास धर्मसिंधूचे उपाय</h2>
<ul>
<li>ग्रंथात सांगितलेल्या ऋचेने <strong>सूर्याचे उपस्थान</strong> करावे, किंवा दुःस्वप्ननाशक मंत्राचा जप करावा. नेमका मंत्र आपल्या शाखेनुसार गुरुजींकडून घ्यावा.</li>
<li>काही ग्रंथांनुसार दर्शश्राद्धाप्रमाणे श्राद्ध केल्याने दुःस्वप्नाचा नाश होतो.</li>
<li>किंवा <strong>चंडीसप्तशतीचा</strong> पाठ करावा.</li>
<li>किंवा <strong>विष्णुसहस्रनामाचा</strong> जप किंवा पाठ करावा.</li>
</ul>

`;

async function main() {
  const [[row]] = await pool.query('SELECT * FROM blog_posts WHERE slug = ?', [SLUG]);
  if (!row) throw new Error(`no post ${SLUG}`);
  const dir = path.join(__dirname, 'backups');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'swapna_blog_before_2026_11_17.json');
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(row, null, 1), 'utf8');
  if (row.content.includes('रात्रीच्या प्रहरानुसार')) { console.log('already updated'); return; }
  if (!row.content.includes(MARK)) throw new Error('marker heading not found');
  const content = row.content.replace(MARK, section + MARK).replace('पृष्ठे 602-604.', 'पृष्ठे 602-605.');
  await pool.query('UPDATE blog_posts SET content = ?, read_time = 5 WHERE slug = ?', [content, SLUG]);
  console.log(`updated ${SLUG} (id ${row.id}); backup: ${path.relative(process.cwd(), file)}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });
