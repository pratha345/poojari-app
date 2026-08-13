'use strict';
// migrate_aarti_priority.js — adds aartis.priority (nullable rank). Lower
// number = shown first, across ALL categories (overrides the default
// category-sequence ordering); NULL = no manual override, falls back to
// is_featured + traditional category order as before. Idempotent.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');

(async () => {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='aartis'`
  );
  const existing = cols.map(c => c.COLUMN_NAME);
  if (!existing.includes('priority')) {
    await pool.query('ALTER TABLE aartis ADD COLUMN priority INT NULL DEFAULT NULL AFTER is_featured');
    console.log('✅ aartis.priority column added');
  } else {
    console.log('priority column already exists, skipping');
  }
  process.exit(0);
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
