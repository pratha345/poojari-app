-- ════════════════════════════════════════════════════════════
-- कुंडली मिलान टेबल — Migration
-- Run this once against pojjari_db
-- ════════════════════════════════════════════════════════════

USE pojjari_db;

CREATE TABLE IF NOT EXISTS kundali_matches (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id        INT DEFAULT 1,

  -- Bride (वधू)
  bride_name       VARCHAR(100) NOT NULL,
  bride_dob        DATE         NOT NULL,
  bride_tob        TIME,
  bride_city       VARCHAR(100),
  bride_nak_idx    TINYINT      COMMENT '0-26 nakshatra index',
  bride_rashi_idx  TINYINT      COMMENT '0-11 rashi index',

  -- Groom (वर)
  groom_name       VARCHAR(100) NOT NULL,
  groom_dob        DATE         NOT NULL,
  groom_tob        TIME,
  groom_city       VARCHAR(100),
  groom_nak_idx    TINYINT,
  groom_rashi_idx  TINYINT,

  -- Result
  total_gun        TINYINT      NOT NULL,
  match_result     VARCHAR(100) NOT NULL,
  grade            CHAR(2)      NOT NULL,
  details          JSON         NOT NULL  COMMENT 'Array of 8 koota objects',
  doshas           JSON                   COMMENT 'Array of dosha names found',
  recommendation   TEXT,

  -- Audit
  created_by       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='कुंडली मिलान (Ashta Koota Gun Milan) नोंदी';
