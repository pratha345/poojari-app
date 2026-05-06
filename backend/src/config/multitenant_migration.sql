-- ════════════════════════════════════════════════════════════
-- MULTI-TENANT MIGRATION — पूजारी SaaS Platform
-- MySQL 5.7+ Compatible | Safe to run in phpMyAdmin
-- Skips columns that already exist via INFORMATION_SCHEMA check
-- ════════════════════════════════════════════════════════════

USE pojjari_db;

-- ────────────────────────────────────────────────────────────
-- STEP 1: Create tenants table
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  domain     VARCHAR(255),
  logo_url   VARCHAR(500),
  plan       ENUM('trial','basic','premium') DEFAULT 'trial',
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tenants (id, name, slug, domain, plan, is_active)
VALUES (1, 'Default Tenant', 'default', 'localhost', 'premium', TRUE)
ON DUPLICATE KEY UPDATE name = name;

-- ────────────────────────────────────────────────────────────
-- STEP 2: users — add tenant_id + extend role ENUM
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_users;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_users()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE users ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_users();
DROP PROCEDURE IF EXISTS add_tenant_id_users;

ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin','admin','pujari','user') DEFAULT 'user';

UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Add FK only if it doesn't exist
DROP PROCEDURE IF EXISTS add_fk_users_tenant;
DELIMITER $$
CREATE PROCEDURE add_fk_users_tenant()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA   = 'pojjari_db'
      AND TABLE_NAME     = 'users'
      AND CONSTRAINT_NAME = 'fk_users_tenant'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_tenant
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END$$
DELIMITER ;
CALL add_fk_users_tenant();
DROP PROCEDURE IF EXISTS add_fk_users_tenant;

ALTER TABLE users MODIFY COLUMN tenant_id INT DEFAULT NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 3: pujari_profiles — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_pujari;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_pujari()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'pujari_profiles'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE pujari_profiles ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_pujari();
DROP PROCEDURE IF EXISTS add_tenant_id_pujari;

UPDATE pujari_profiles SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 4: bookings — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_bookings;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_bookings()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'bookings'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_bookings();
DROP PROCEDURE IF EXISTS add_tenant_id_bookings;

UPDATE bookings SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 5: poojas — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_poojas;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_poojas()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'poojas'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE poojas ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_poojas();
DROP PROCEDURE IF EXISTS add_tenant_id_poojas;

UPDATE poojas SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 6: contact_inquiries — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_contact;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_contact()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'contact_inquiries'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE contact_inquiries ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_contact();
DROP PROCEDURE IF EXISTS add_tenant_id_contact;

UPDATE contact_inquiries SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 7: home_content & home_slider — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_home;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_home()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'home_content'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE home_content ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'home_slider'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE home_slider ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_home();
DROP PROCEDURE IF EXISTS add_tenant_id_home;

UPDATE home_content SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE home_slider  SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 8: site_settings — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_settings;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_settings()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'site_settings'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE site_settings ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_settings();
DROP PROCEDURE IF EXISTS add_tenant_id_settings;

UPDATE site_settings SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 9: festival_themes — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_festivals;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_festivals()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'festival_themes'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE festival_themes ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_festivals();
DROP PROCEDURE IF EXISTS add_tenant_id_festivals;

UPDATE festival_themes SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 10: reviews — add tenant_id
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS add_tenant_id_reviews;
DELIMITER $$
CREATE PROCEDURE add_tenant_id_reviews()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'pojjari_db'
      AND TABLE_NAME   = 'reviews'
      AND COLUMN_NAME  = 'tenant_id'
  ) THEN
    ALTER TABLE reviews ADD COLUMN tenant_id INT DEFAULT 1 AFTER id;
  END IF;
END$$
DELIMITER ;
CALL add_tenant_id_reviews();
DROP PROCEDURE IF EXISTS add_tenant_id_reviews;

UPDATE reviews SET tenant_id = 1 WHERE tenant_id IS NULL;

-- ────────────────────────────────────────────────────────────
-- STEP 11: Indexes
-- ────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS create_tenant_indexes;
DELIMITER $$
CREATE PROCEDURE create_tenant_indexes()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='users'           AND INDEX_NAME='idx_users_tenant')    THEN CREATE INDEX idx_users_tenant    ON users(tenant_id);    END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='pujari_profiles' AND INDEX_NAME='idx_pujari_tenant')   THEN CREATE INDEX idx_pujari_tenant   ON pujari_profiles(tenant_id); END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='bookings'        AND INDEX_NAME='idx_bookings_tenant') THEN CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);       END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='poojas'          AND INDEX_NAME='idx_poojas_tenant')   THEN CREATE INDEX idx_poojas_tenant   ON poojas(tenant_id);         END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='reviews'         AND INDEX_NAME='idx_reviews_tenant')  THEN CREATE INDEX idx_reviews_tenant  ON reviews(tenant_id);         END IF;
END$$
DELIMITER ;
CALL create_tenant_indexes();
DROP PROCEDURE IF EXISTS create_tenant_indexes;

-- ────────────────────────────────────────────────────────────
SELECT 'Multi-tenant migration complete ✅' AS status;
-- ────────────────────────────────────────────────────────────
