'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');

(async () => {
  const [cols] = await pool.query('SHOW COLUMNS FROM aartis');
  if (cols.some(c => c.Field === 'image_url')) {
    console.log('image_url COLUMN ALREADY EXISTS');
  } else {
    await pool.query('ALTER TABLE aartis ADD COLUMN image_url VARCHAR(255) NULL AFTER lyrics');
    console.log('image_url COLUMN ADDED');
  }
  process.exit(0);
})().catch(e => { console.error('MIGRATION ERROR:', e.message); process.exit(1); });
