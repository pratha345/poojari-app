// backend/src/config/seed_pujaris.js
// Run: node src/config/seed_pujaris.js
const pool   = require('./db');
const bcrypt = require('bcryptjs');

const pujaris = [
  {
    name: 'पं. रामचंद्र शास्त्री', phone: '9800000001', city: 'पुणे',      district: 'पुणे',      experience: 22, bio: 'वैदिक पूजा आणि संस्कारांमध्ये २२ वर्षांचा अनुभव.',                   langs: ['मराठी','हिंदी','संस्कृत'], specs: [1,2],
  },
  {
    name: 'पं. विश्वनाथ जोशी',    phone: '9800000002', city: 'नागपूर',    district: 'नागपूर',    experience: 15, bio: 'नागपूर येथे गणपती व लक्ष्मी पूजा विधीत तज्ञ.',                         langs: ['मराठी','हिंदी'],            specs: [1,3],
  },
  {
    name: 'पं. केशव भट्ट',         phone: '9800000003', city: 'नाशिक',    district: 'नाशिक',    experience: 18, bio: 'ग्रहशांती, वास्तुशांती आणि विवाह संस्कारांत विशेष प्रावीण्य.',        langs: ['मराठी','संस्कृत'],          specs: [2,4],
  },
  {
    name: 'पं. दत्तात्रेय कुलकर्णी', phone: '9800000004', city: 'औरंगाबाद', district: 'छत्रपती संभाजीनगर', experience: 12, bio: 'देवी पूजा, भजन व कथा कार्यक्रमांत अनुभवी.',                         langs: ['मराठी','हिंदी'],            specs: [3,5],
  },
  {
    name: 'पं. श्रीकृष्ण देशपांडे', phone: '9800000005', city: 'कोल्हापूर', district: 'कोल्हापूर', experience: 20, bio: 'अंबाबाई पूजा व महालक्ष्मी विधीत २० वर्षांचा अनुभव.',                 langs: ['मराठी','कन्नड'],             specs: [3,1],
  },
  {
    name: 'पं. माधव पाटील',        phone: '9800000006', city: 'सोलापूर',   district: 'सोलापूर',   experience: 10, bio: 'सत्यनारायण पूजा व कुलाचार विधीत प्रशिक्षित.',                         langs: ['मराठी','हिंदी'],            specs: [1,2,5],
  },
  {
    name: 'पं. गणेश उपाध्याय',     phone: '9800000007', city: 'ठाणे',      district: 'ठाणे',      experience: 8,  bio: 'मुंबई-ठाणे परिसरात सर्व प्रकारच्या पूजा विधी.',                       langs: ['मराठी','हिंदी','गुजराती'], specs: [2,4],
  },
  {
    name: 'पं. नारायण वैद्य',      phone: '9800000008', city: 'सांगली',    district: 'सांगली',    experience: 25, bio: 'आयुर्वेद व ज्योतिष ज्ञानासह पूजाविधींचे जाणकार.',                     langs: ['मराठी','संस्कृत'],          specs: [4,5],
  },
  {
    name: 'पं. सुधाकर गोडसे',      phone: '9800000009', city: 'रत्नागिरी', district: 'रत्नागिरी', experience: 14, bio: 'कोकणी परंपरेनुसार गणपती व गृहप्रवेश विधी.',                           langs: ['मराठी','कोकणी'],            specs: [1,3],
  },
  {
    name: 'पं. प्रकाश अग्निहोत्री', phone: '9800000010', city: 'अमरावती',  district: 'अमरावती',   experience: 16, bio: 'यज्ञ, होम व हवन यांमध्ये विशेष कौशल्य.',                              langs: ['मराठी','हिंदी','संस्कृत'], specs: [2,5],
  },
];

async function seed() {
  const hash = await bcrypt.hash('Pujari@123', 10);

  // Get existing category IDs so we only use valid ones
  const [cats] = await pool.query('SELECT id FROM pooja_categories ORDER BY id LIMIT 5');
  const catIds  = cats.map(c => c.id);

  for (const p of pujaris) {
    // Skip if phone already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE phone=?', [p.phone]);
    if (existing.length) { console.log(`⚠️  ${p.name} already exists, skipping.`); continue; }

    // Insert user
    const [uRes] = await pool.query(
      `INSERT INTO users (name, phone, password, role, is_verified, is_active, tenant_id)
       VALUES (?,?,?,'pujari',1,1,1)`,
      [p.name, p.phone, hash]
    );
    const userId = uRes.insertId;

    // Insert pujari profile
    const [ppRes] = await pool.query(
      `INSERT INTO pujari_profiles
       (user_id, full_name, experience_yrs, city, district, address, languages, bio, status, is_available, tenant_id)
       VALUES (?,?,?,?,?,?,?,?,'approved',1,1)`,
      [userId, p.name, p.experience, p.city, p.district, `${p.city}, महाराष्ट्र`,
       JSON.stringify(p.langs), p.bio]
    );
    const pujariId = ppRes.insertId;

    // Insert specializations using actual category IDs
    const specIds = p.specs
      .map(i => catIds[i - 1])
      .filter(Boolean);

    if (specIds.length) {
      const rows = specIds.map(cid => [pujariId, cid]);
      await pool.query('INSERT IGNORE INTO pujari_specializations (pujari_id, category_id) VALUES ?', [rows]);
    }

    console.log(`✅ Created pujari: ${p.name} (user_id=${userId}, pujari_id=${pujariId})`);
  }

  console.log('\n🎉 Seed complete! 10 pujaris added.');
  await pool.end();
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
