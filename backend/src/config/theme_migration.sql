-- ════════════════════════════════════════════════════════════
-- Theme System Migration
-- ════════════════════════════════════════════════════════════
USE pojjari_db;

CREATE TABLE IF NOT EXISTS site_settings (
  id           INT PRIMARY KEY DEFAULT 1,
  active_theme VARCHAR(50)  NOT NULL DEFAULT 'saffron-divine',
  theme_mode   ENUM('manual','festival','auto') NOT NULL DEFAULT 'auto',
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO site_settings (id, active_theme, theme_mode)
VALUES (1, 'saffron-divine', 'auto');

CREATE TABLE IF NOT EXISTS festival_themes (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  festival_name VARCHAR(100) NOT NULL,
  theme_name    VARCHAR(50)  NOT NULL,
  start_date    DATE         NOT NULL,
  end_date      DATE         NOT NULL,
  is_active     BOOLEAN      DEFAULT TRUE,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default festival themes (2025 dates — admin can update each year)
INSERT IGNORE INTO festival_themes (festival_name, theme_name, start_date, end_date) VALUES
('गणेश चतुर्थी',  'ganpati',      '2025-08-27', '2025-09-07'),
('दिवाळी',         'diwali',       '2025-10-20', '2025-10-25'),
('नवरात्री',        'navratri',     '2025-09-22', '2025-10-02'),
('पितृपक्ष',        'pitru-paksha', '2025-09-07', '2025-09-21'),
('श्रावण मास',      'shravan',      '2025-07-11', '2025-08-09');
