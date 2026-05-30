/**
 * Update puja images — assigns Wikimedia Commons free images
 * to all 53 pujas that have no image_url
 */
const mysql = require('mysql2/promise');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './env' });

// ─── Wikimedia source images ───────────────────────────────────────────────
const SRC = {
  puja_general  : 'https://upload.wikimedia.org/wikipedia/commons/c/c6/Puja_ceremony_in_Varanasi.jpg',
  yagna         : 'https://upload.wikimedia.org/wikipedia/commons/2/24/Yagna.jpg',
  ganesh        : 'https://upload.wikimedia.org/wikipedia/commons/8/84/Ganesh_puja.jpg',
  lakshmi       : 'https://upload.wikimedia.org/wikipedia/commons/b/b6/Lakshmi_puja.jpg',
  shiva         : 'https://upload.wikimedia.org/wikipedia/commons/3/32/Lord_Shiva.jpg',
  dhanvantari   : 'https://upload.wikimedia.org/wikipedia/commons/0/05/Dhanvantari.jpg',
  hanuman       : 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Hanuman_temple.jpg',
  nag_panchami  : 'https://upload.wikimedia.org/wikipedia/commons/6/62/Nag_Panchami.jpg',
  dattatreya    : 'https://upload.wikimedia.org/wikipedia/commons/8/83/Dattatreya.jpg',
  gauri         : 'https://upload.wikimedia.org/wikipedia/commons/b/be/Gauri_puja.jpg',
  shani         : 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Shani_dev.jpg',
  holi          : 'https://upload.wikimedia.org/wikipedia/commons/0/04/Holi_bonfire.jpg',
  swami_samarth : 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Swami_Samarth.jpg',
  tulsi_vivah   : 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Tulsi_Vivah.jpg',
  trimbakeshwar : 'https://upload.wikimedia.org/wikipedia/commons/8/82/Trimbakeshwar_temple.jpg',
  durga         : 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Durga_idol.jpg',
  kaal_bhairav  : 'https://upload.wikimedia.org/wikipedia/commons/1/19/Kaal_Bhairav.jpg',
  tukaram       : 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Tukaram.jpg',
  navratri      : 'https://upload.wikimedia.org/wikipedia/commons/5/56/Navratri_puja.jpg',
  krishna       : 'https://upload.wikimedia.org/wikipedia/commons/8/87/Krishna_janmashtami.jpg',
  upanayana     : 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Upanayana.jpg',
  wedding       : 'https://upload.wikimedia.org/wikipedia/commons/7/72/Hindu_wedding.jpg',
};

// ─── puja_id → image URL mapping ──────────────────────────────────────────
const PUJA_IMAGES = {
  2:  SRC.puja_general,    // बाळ शॉवर पूजा
  3:  SRC.puja_general,    // वाढदिवस पूजा
  5:  SRC.upanayana,       // मुंज / उपनयन संस्कार
  6:  SRC.shiva,           // महा मृत्युंजय जाप
  8:  SRC.dhanvantari,     // धन्वंतरी हवन
  9:  SRC.yagna,           // लक्ष्मी कुबेर हवन
  10: SRC.yagna,           // सरस्वती हवन
  11: SRC.ganesh,          // गणपती अथर्वशीर्ष हवन
  12: SRC.durga,           // नवचंडी याग
  15: SRC.gauri,           // मंगळागौरी पूजा
  16: SRC.shiva,           // सोमवार पूजा
  17: SRC.hanuman,         // सुंदरकांड पाठ
  20: SRC.puja_general,    // तेरावे विधी
  22: SRC.puja_general,    // भरणी श्राद्ध
  23: SRC.puja_general,    // त्रिपिंडी श्राद्ध
  25: SRC.ganesh,          // गणपती विसर्जन पूजा
  27: SRC.krishna,         // कृष्ण जन्माष्टमी
  28: SRC.navratri,        // नवरात्री घटस्थापना
  29: SRC.holi,            // होळी पूजन
  30: SRC.tulsi_vivah,     // तुळशी विवाह
  33: SRC.puja_general,    // कार्यालय शुभारंभ पूजा
  58: SRC.lakshmi,         // लक्ष्मी हवन
  59: SRC.yagna,           // गायत्री हवन
  60: SRC.yagna,           // सुदर्शन हवन
  61: SRC.durga,           // चंडी हवन
  62: SRC.shiva,           // महारुद्र हवन
  63: SRC.gauri,           // स्वयंवर पार्वती हवन
  64: SRC.yagna,           // कुबेर हवन
  65: SRC.kaal_bhairav,    // काल भैरव हवन
  66: SRC.shiva,           // लघुरुद्र हवन
  67: SRC.lakshmi,         // श्री सूक्त हवन
  68: SRC.yagna,           // पुरुष सूक्त हवन
  69: SRC.puja_general,    // गर्भाधान संस्कार
  70: SRC.puja_general,    // पुंसवन संस्कार
  71: SRC.puja_general,    // सीमंतोन्नयन संस्कार
  72: SRC.puja_general,    // जातकर्म संस्कार
  73: SRC.upanayana,       // विद्यारंभ संस्कार
  74: SRC.puja_general,    // कर्णवेध संस्कार
  75: SRC.upanayana,       // समावर्तन संस्कार
  76: SRC.puja_general,    // वटसावित्री पूजा
  77: SRC.lakshmi,         // महालक्ष्मी व्रत पूजा
  79: SRC.gauri,           // हरतालिका पूजा
  80: SRC.gauri,           // गौरी पूजन
  81: SRC.puja_general,    // चंपाषष्ठी पूजा
  82: SRC.dattatreya,      // दत्तजयंती विधी
  83: SRC.nag_panchami,    // नागपंचमी पूजा विधी
  84: SRC.puja_general,    // वारी / पालखी विधी
  85: SRC.swami_samarth,   // अक्कलकोट स्वामी समर्थ पूजा
  86: SRC.shani,           // शनी शिंगणापूर पूजा विधी
  87: SRC.tukaram,         // तुकाराम बीज पूजन
  88: SRC.trimbakeshwar,   // त्र्यंबकेश्वर विशेष विधी
  89: SRC.puja_general,    // पाळणा / बारसे विधी
  90: SRC.puja_general,    // सटवाई पूजा
};

// ─── download helper ───────────────────────────────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      // follow one redirect (Wikimedia uses redirects)
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlink(dest, () => {});
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', err => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// ─── main ──────────────────────────────────────────────────────────────────
async function run() {
  const uploadDir = path.join(__dirname, 'uploads', 'poojas');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  // Step 1: download unique images once
  const downloaded = {};
  const uniqueUrls = [...new Set(Object.values(PUJA_IMAGES))];

  console.log(`\n📥 Downloading ${uniqueUrls.length} unique images...\n`);
  for (const url of uniqueUrls) {
    const filename = path.basename(url).replace(/%2C/g, ',').replace(/%20/g, '_');
    const dest = path.join(uploadDir, filename);
    if (fs.existsSync(dest)) {
      console.log(`  ⏭  Already exists: ${filename}`);
      downloaded[url] = `/uploads/poojas/${filename}`;
      continue;
    }
    try {
      await download(url, dest);
      downloaded[url] = `/uploads/poojas/${filename}`;
      console.log(`  ✅ ${filename}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${filename} — ${err.message}`);
    }
  }

  // Step 2: update DB
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('\n📊 Updating database...\n');
  let updated = 0, skipped = 0;

  for (const [id, url] of Object.entries(PUJA_IMAGES)) {
    const localPath = downloaded[url];
    if (!localPath) { skipped++; continue; }
    const [res] = await conn.query(
      'UPDATE poojas SET image_url=? WHERE id=? AND (image_url IS NULL OR image_url="")',
      [localPath, id]
    );
    if (res.affectedRows > 0) {
      updated++;
      console.log(`  ✅ ID ${id.toString().padStart(2)} → ${localPath}`);
    } else {
      console.log(`  ⏭  ID ${id.toString().padStart(2)} — already has image, skipped`);
    }
  }

  const [cnt] = await conn.query('SELECT COUNT(*) as total, SUM(image_url IS NULL OR image_url="") as no_img FROM poojas');
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ DB updated: ${updated} pujas`);
  console.log(`⏭  Skipped  : ${skipped} (download failed)`);
  console.log(`📊 Total pujas: ${cnt[0].total} | Still no image: ${cnt[0].no_img}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  await conn.end();
}

run().catch(console.error);
