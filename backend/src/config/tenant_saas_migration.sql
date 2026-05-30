-- Tenant SaaS Migration — Trial + Plan Expiry support
-- Safe to run multiple times

USE pojjari_db;

-- Add trial_ends_at column
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='tenants' AND COLUMN_NAME='trial_ends_at'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE tenants ADD COLUMN trial_ends_at DATETIME NULL AFTER plan',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add plan_expires_at column
SET @col_exists2 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='tenants' AND COLUMN_NAME='plan_expires_at'
);
SET @sql2 = IF(@col_exists2 = 0,
  'ALTER TABLE tenants ADD COLUMN plan_expires_at DATETIME NULL AFTER trial_ends_at',
  'SELECT 1'
);
PREPARE stmt2 FROM @sql2; EXECUTE stmt2; DEALLOCATE PREPARE stmt2;

-- Add phone, city, contact_name columns
SET @col_exists3 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='tenants' AND COLUMN_NAME='phone'
);
SET @sql3 = IF(@col_exists3 = 0,
  'ALTER TABLE tenants ADD COLUMN phone VARCHAR(20) NULL AFTER domain',
  'SELECT 1'
);
PREPARE stmt3 FROM @sql3; EXECUTE stmt3; DEALLOCATE PREPARE stmt3;

SET @col_exists4 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='tenants' AND COLUMN_NAME='city'
);
SET @sql4 = IF(@col_exists4 = 0,
  'ALTER TABLE tenants ADD COLUMN city VARCHAR(100) NULL AFTER phone',
  'SELECT 1'
);
PREPARE stmt4 FROM @sql4; EXECUTE stmt4; DEALLOCATE PREPARE stmt4;

SET @col_exists5 = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='pojjari_db' AND TABLE_NAME='tenants' AND COLUMN_NAME='contact_name'
);
SET @sql5 = IF(@col_exists5 = 0,
  'ALTER TABLE tenants ADD COLUMN contact_name VARCHAR(255) NULL AFTER city',
  'SELECT 1'
);
PREPARE stmt5 FROM @sql5; EXECUTE stmt5; DEALLOCATE PREPARE stmt5;

-- Set existing tenant 1 as premium (no expiry)
UPDATE tenants SET plan='premium', trial_ends_at=NULL, plan_expires_at=NULL WHERE id=1;

SELECT 'Migration complete' AS status;
SELECT id, name, slug, plan, trial_ends_at, plan_expires_at FROM tenants;
