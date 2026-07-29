'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('./db');

(async () => {
  await pool.query(`CREATE TABLE IF NOT EXISTS aartis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL DEFAULT 1,
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(320) NOT NULL UNIQUE,
    deity_category VARCHAR(100) NOT NULL,
    lyrics TEXT NOT NULL,
    meaning TEXT,
    occasion VARCHAR(500),
    source_note VARCHAR(500),
    author_name VARCHAR(200),
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    views INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FULLTEXT KEY ft_aarti (title, lyrics),
    KEY idx_deity (deity_category),
    KEY idx_published (is_published)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log('TABLE aartis CREATED/EXISTS');
  const [cols] = await pool.query('SHOW COLUMNS FROM aartis');
  console.log(cols.map(c => c.Field).join(', '));
  process.exit(0);
})().catch(e => { console.error('MIGRATION ERROR:', e.message); process.exit(1); });
