// src/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../env') });

const pool = mysql.createPool({
  host:               process.env.DB_HOST || 'localhost',
  port:               process.env.DB_PORT || 3306,
  user:               process.env.DB_USER || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME || 'pojjari_db',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  charset:            'utf8mb4',  // Marathi Unicode support
});

// Test connection + auto-migrate on startup
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');

    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'halls'`
    );
    const existing = cols.map(c => c.COLUMN_NAME);

    if (!existing.includes('district')) {
      await conn.query('ALTER TABLE halls ADD COLUMN district VARCHAR(100) NULL AFTER whatsapp');
      console.log('✅ halls.district column added');
    }
    if (!existing.includes('taluka')) {
      await conn.query('ALTER TABLE halls ADD COLUMN taluka VARCHAR(100) NULL AFTER district');
      console.log('✅ halls.taluka column added');
    }

    // Auto-add brahmin_tradition to pujari_profiles if missing
    const [ppCols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pujari_profiles'`
    );
    const ppExisting = ppCols.map(c => c.COLUMN_NAME);
    if (!ppExisting.includes('brahmin_tradition')) {
      await conn.query('ALTER TABLE pujari_profiles ADD COLUMN brahmin_tradition VARCHAR(100) NULL AFTER bio');
      console.log('✅ pujari_profiles.brahmin_tradition column added');
    }
    if (!ppExisting.includes('lat')) {
      await conn.query('ALTER TABLE pujari_profiles ADD COLUMN lat DECIMAL(10,8) NULL');
      console.log('✅ pujari_profiles.lat column added');
    }
    if (!ppExisting.includes('lng')) {
      await conn.query('ALTER TABLE pujari_profiles ADD COLUMN lng DECIMAL(11,8) NULL');
      console.log('✅ pujari_profiles.lng column added');
    }

    // Auto-add preferred_pujari_id to bookings if missing
    const [bkCols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings'`
    );
    const bkExisting = bkCols.map(c => c.COLUMN_NAME);
    if (bkExisting.length > 0 && !bkExisting.includes('preferred_pujari_id')) {
      await conn.query('ALTER TABLE bookings ADD COLUMN preferred_pujari_id INT NULL');
      console.log('✅ bookings.preferred_pujari_id column added');
    }

    // Auto-add bg_image to home_content if missing
    const [hcCols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'home_content'`
    );
    const hcExisting = hcCols.map(c => c.COLUMN_NAME);
    if (hcExisting.length > 0 && !hcExisting.includes('bg_image')) {
      await conn.query('ALTER TABLE home_content ADD COLUMN bg_image VARCHAR(500) NULL');
      console.log('✅ home_content.bg_image column added');
    }

    // Auto-add image_url to festival_themes
    const [ftCols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'festival_themes'`
    );
    const ftExisting = ftCols.map(c => c.COLUMN_NAME);
    if (ftExisting.length > 0 && !ftExisting.includes('image_url')) {
      await conn.query('ALTER TABLE festival_themes ADD COLUMN image_url VARCHAR(500) NULL');
      console.log('✅ festival_themes.image_url column added');
    }

    // ── Support Ticket Tables ───────────────────────────────
    const [[{ stExists }]] = await conn.query(
      `SELECT COUNT(*) AS stExists FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='support_tickets'`
    );
    if (!stExists) {
      await conn.query(`
        CREATE TABLE support_tickets (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          ticket_code VARCHAR(20) UNIQUE NOT NULL,
          user_id     INT NULL,
          phone       VARCHAR(20) NULL,
          name        VARCHAR(100) NULL,
          subject     VARCHAR(255) NULL,
          status      ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
          priority    ENUM('low','normal','high','urgent') DEFAULT 'normal',
          assigned_to INT NULL,
          tenant_id   INT NULL,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ support_tickets table created');
    }

    const [[{ tmExists }]] = await conn.query(
      `SELECT COUNT(*) AS tmExists FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ticket_messages'`
    );
    if (!tmExists) {
      await conn.query(`
        CREATE TABLE ticket_messages (
          id          INT AUTO_INCREMENT PRIMARY KEY,
          ticket_id   INT NOT NULL,
          sender_type ENUM('user','admin') NOT NULL,
          sender_id   INT NULL,
          sender_name VARCHAR(100) NULL,
          message     TEXT NOT NULL,
          is_read     TINYINT(1) DEFAULT 0,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ ticket_messages table created');
    }

    // ── Dharmasindhu Content Tables ─────────────────────────────
    const [[{ dsExists }]] = await conn.query(
      `SELECT COUNT(*) AS dsExists FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='dharmasindhu_content'`
    );
    if (!dsExists) {
      await conn.query(`
        CREATE TABLE dharmasindhu_content (
          id         INT AUTO_INCREMENT PRIMARY KEY,
          page_no    INT NOT NULL,
          content    LONGTEXT NOT NULL,
          word_count INT DEFAULT 0,
          UNIQUE KEY uq_page (page_no),
          FULLTEXT KEY ft_ds (content)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ dharmasindhu_content table created');
    }
    const [[{ dsProgExists }]] = await conn.query(
      `SELECT COUNT(*) AS dsProgExists FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='dharmasindhu_ocr_progress'`
    );
    if (!dsProgExists) {
      await conn.query(`
        CREATE TABLE dharmasindhu_ocr_progress (
          id              INT AUTO_INCREMENT PRIMARY KEY,
          total_pages     INT DEFAULT 841,
          processed_pages INT DEFAULT 0,
          status          ENUM('idle','running','completed','error') DEFAULT 'idle',
          started_at      TIMESTAMP NULL,
          completed_at    TIMESTAMP NULL,
          error_msg       TEXT NULL,
          updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      await conn.query(`INSERT INTO dharmasindhu_ocr_progress (id, total_pages, processed_pages, status) VALUES (1, 841, 0, 'idle')`);
      console.log('✅ dharmasindhu_ocr_progress table created');
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } finally {
    conn?.release();
  }
};

testConnection();

module.exports = pool;
