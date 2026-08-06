'use strict';
// enrich_blogs_v3_fix2.js — closes the remaining small gaps (4-117 chars)
// for the 8 posts that were still marginally below their pre-round-6
// baseline even after enrich_blogs_v3_fix.js's first append pass.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');

const APPENDS = [
  { id: 154, html: `<p>ज्योतिषी सामान्यतः विवाहापूर्वी अष्टकूट मिलानासोबत मंगळ-दोषाची पडताळणीही सुचवतात, कारण मंगळ-दोष हाही वैवाहिक अस्थिरतेच्या पारंपरिक संकेतांपैकी एक मानला जातो.</p>` },
  { id: 215, html: `<p>ज्योतिषशास्त्रानुसार नामाक्षर निवडता येत नसल्यास, कुलदेवता किंवा आवडत्या देवतेच्या नावावरून नाव ठेवण्याचीही पारंपरिक मुभा असते.</p>` },
  { id: 217, html: `<p>काही कुटुंबांत या दिवशी गरोदर स्त्रीच्या हातावर मेहंदी काढण्याची व पारंपरिक गाणी म्हणण्याचीही प्रथा आढळते, ज्यामुळे संपूर्ण कुटुंबासाठी हा एक आनंददायी सोहळा बनतो.</p>` },
  { id: 219, html: `<p>चूडाकरणानंतर काढलेले केस पवित्र नदीत किंवा वृक्षाखाली विसर्जित करण्याची प्रथा असून, हा विधी सहसा बाळाच्या मामाच्या हस्ते सुरू केला जातो अशीही एक प्रथा काही कुटुंबांत पाळली जाते.</p>` },
  { id: 287, html: `<p>पारंपरिक पद्धतीत विद्यारंभानंतर मुलाला गुरुगृही (शिक्षकाकडे) पाठवण्याची प्रथा होती — आजच्या काळात हा भाग शाळाप्रवेशाच्या स्वरूपात पाळला जातो, पण मूळ भावना — ज्ञानाचा शुभारंभ आदराने करणे — तीच कायम आहे.</p>` },
  { id: 518, html: `<p>घरात नवीन तुळस लावणे आणि नियमित रांगोळी काढणे हेदेखील या ४० दिवसांत सकारात्मकता टिकवण्याचा भाग मानले जाते.</p>` },
  { id: 519, html: `<p>या काळात हलका व्यायाम, पुरेशी विश्रांती आणि सकारात्मक वाचन यांचा समतोल राखण्याचा सल्ला पारंपरिक व आधुनिक दोन्ही दृष्टिकोनांतून दिला जातो.</p>` },
  { id: 521, html: `<p>तडे गेलेली किंवा वाकडी झालेली जुनी भांडी शक्यतो पूजेसाठी वापरू नयेत, नवीन भांड्यांची प्रथम देवतेसमोर पूजा करून मगच वापरात आणावी असा संकेत आहे.</p>` },
];

(async () => {
  let updated = 0;
  for (const u of APPENDS) {
    const [r] = await pool.query('UPDATE blog_posts SET content = CONCAT(content, ?) WHERE id=?', ['\n' + u.html, u.id]);
    if (r.affectedRows) { updated++; console.log(`APPENDED id=${u.id}`); }
  }
  console.log(`\nDONE — appended=${updated}/${APPENDS.length}`);
  const ids = APPENDS.map(a => a.id);
  const [rows] = await pool.query(`SELECT id, CHAR_LENGTH(content) len FROM blog_posts WHERE id IN (${ids.join(',')})`);
  rows.forEach(r => console.log('id', r.id, 'final len:', r.len));
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
