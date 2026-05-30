-- halls_migration.sql: Run this once to create and update the halls table

-- Step 1: Create table with all columns (idempotent)
CREATE TABLE IF NOT EXISTS halls (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255)   NOT NULL,
  phone         VARCHAR(20)    NOT NULL,
  whatsapp      VARCHAR(20),
  district      VARCHAR(100),
  taluka        VARCHAR(100),
  city          VARCHAR(100),
  address       TEXT,
  capacity      INT,
  price_per_day DECIMAL(10,2),
  latitude      DECIMAL(10,8)  NULL,
  longitude     DECIMAL(11,8)  NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Add location columns if table already existed without them
-- Safe on MySQL 5.7+ — ignores the ALTER if column already exists via procedure

DROP PROCEDURE IF EXISTS halls_add_location_cols;
DELIMITER $$
CREATE PROCEDURE halls_add_location_cols()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'halls'
      AND COLUMN_NAME  = 'latitude'
  ) THEN
    ALTER TABLE halls ADD COLUMN latitude  DECIMAL(10,8) NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'halls'
      AND COLUMN_NAME  = 'longitude'
  ) THEN
    ALTER TABLE halls ADD COLUMN longitude DECIMAL(11,8) NULL;
  END IF;
END$$
DELIMITER ;

CALL halls_add_location_cols();
DROP PROCEDURE IF EXISTS halls_add_location_cols;

-- Step 3: Add district and taluka columns if not already present
DROP PROCEDURE IF EXISTS halls_add_district_cols;
DELIMITER $$
CREATE PROCEDURE halls_add_district_cols()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'halls'
      AND COLUMN_NAME  = 'district'
  ) THEN
    ALTER TABLE halls ADD COLUMN district VARCHAR(100) NULL AFTER whatsapp;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'halls'
      AND COLUMN_NAME  = 'taluka'
  ) THEN
    ALTER TABLE halls ADD COLUMN taluka VARCHAR(100) NULL AFTER district;
  END IF;
END$$
DELIMITER ;

CALL halls_add_district_cols();
DROP PROCEDURE IF EXISTS halls_add_district_cols;
