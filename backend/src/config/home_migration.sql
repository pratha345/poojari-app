-- ════════════════════════════════════════════════════════════
--  पूजारी • Home Page Dynamic Content — Migration
--  Run: mysql -u root -p pojjari_db < home_migration.sql
-- ════════════════════════════════════════════════════════════

-- 1. Home Content (single-row settings table)
CREATE TABLE IF NOT EXISTS home_content (
  id            INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255)  NOT NULL DEFAULT 'आपल्या सर्व पूजा सेवांसाठी एक विश्वासार्ह स्थान',
  subtitle      VARCHAR(255)  NOT NULL DEFAULT 'घरी पूजा, मनासारखी',
  description   TEXT,
  button_text_1 VARCHAR(100)  NOT NULL DEFAULT 'पूजा बुक करा',
  button_text_2 VARCHAR(100)  NOT NULL DEFAULT 'अधिक जाणून घ्या',
  hero_image    VARCHAR(500)           DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Hero / Banner Slider Images
CREATE TABLE IF NOT EXISTS home_slider (
  id          INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  image_url   VARCHAR(500)  NOT NULL,
  title       VARCHAR(255)           DEFAULT NULL,
  description TEXT,
  sort_order  INT           NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2b. Add stats columns (run if upgrading existing DB)
ALTER TABLE home_content
  ADD COLUMN IF NOT EXISTS stat_bookings VARCHAR(30) NOT NULL DEFAULT '५,०००+',
  ADD COLUMN IF NOT EXISTS stat_pujaris  VARCHAR(30) NOT NULL DEFAULT '५००+',
  ADD COLUMN IF NOT EXISTS stat_cities   VARCHAR(30) NOT NULL DEFAULT '३५+',
  ADD COLUMN IF NOT EXISTS stat_years    VARCHAR(30) NOT NULL DEFAULT '५+',
  ADD COLUMN IF NOT EXISTS bg_image      VARCHAR(500)         DEFAULT NULL;

-- 3. Seed default content row (runs only if table is empty)
INSERT INTO home_content (title, subtitle, description, button_text_1, button_text_2)
SELECT
  'आपल्या सर्व पूजा सेवांसाठी एक विश्वासार्ह स्थान',
  'घरी पूजा, मनासारखी',
  'घरबसल्या पूजा बुक करा, अनुभवी पुजारी मिळवा, आणि सर्व धार्मिक विधी सहज पूर्ण करा.',
  'पूजा बुक करा',
  'अधिक जाणून घ्या'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM home_content LIMIT 1);
