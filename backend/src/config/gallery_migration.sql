-- ════════════════════════════════════════════════════════════
-- Poster Gallery Migration
-- Run this on your MySQL database
-- ════════════════════════════════════════════════════════════
USE pojjari_db;

-- Add image_url column to festival_themes if not exists
ALTER TABLE festival_themes
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS thumb_url VARCHAR(255) NULL;

-- Main gallery table for all generated posters
CREATE TABLE IF NOT EXISTS poster_gallery (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  festival_id    INT          NULL REFERENCES festival_themes(id) ON DELETE SET NULL,
  festival_name  VARCHAR(150) NOT NULL,
  festival_slug  VARCHAR(100) NOT NULL,
  image_url      VARCHAR(255) NOT NULL,
  thumb_url      VARCHAR(255) NULL,
  filename       VARCHAR(255) NOT NULL,
  theme_type     VARCHAR(50)  NOT NULL DEFAULT 'poster',
  style          VARCHAR(50)  NOT NULL DEFAULT 'realistic',
  variant        TINYINT      NOT NULL DEFAULT 1,
  prompt         TEXT         NULL,
  file_size      INT          NULL,
  is_selected    BOOLEAN      DEFAULT FALSE,
  is_published   BOOLEAN      DEFAULT TRUE,
  whatsapp_caption TEXT        NULL,
  colors         JSON         NULL,
  mood           VARCHAR(100) NULL,
  generated_by   VARCHAR(50)  DEFAULT 'stability-ai',
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_festival_slug (festival_slug),
  INDEX idx_theme_type    (theme_type),
  INDEX idx_style         (style),
  INDEX idx_is_published  (is_published),
  INDEX idx_created_at    (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
