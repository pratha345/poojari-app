-- ═══════════════════════════════════════════════════════════════
-- Tenant Franchise Tables — Reference / Dummy Structure
-- Run on server: mysql -u pojjari_user -p pojjari_db < tenant_config_tables.sql
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tenant Puja Config ──────────────────────────────────────
-- Global poojas table ला TOUCH नाही.
-- Tenant ने price/enable override केलं तर इथे row येतो.
-- Override नसेल तर → global poojas table fallback.

CREATE TABLE IF NOT EXISTS tenant_puja_config (
  id               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id        INT          NOT NULL,
  pooja_id         INT          NOT NULL,

  -- Price override (NULL = global price वापर)
  custom_price     DECIMAL(10,2) NULL DEFAULT NULL,
  custom_samagri_price DECIMAL(10,2) NULL DEFAULT NULL,

  -- Enable/Disable this pooja for this tenant
  -- NULL = follow global is_active
  is_enabled       TINYINT(1)   NULL DEFAULT NULL,

  -- Custom description (optional)
  custom_desc_mr   TEXT         NULL,

  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_tenant_pooja (tenant_id, pooja_id),
  KEY idx_tenant_id (tenant_id),
  KEY idx_pooja_id  (pooja_id),

  CONSTRAINT fk_tpc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tpc_pooja  FOREIGN KEY (pooja_id)  REFERENCES poojas(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tenant-specific puja price & enable overrides. Global table untouched.';


-- ── 2. Tenant Samagri Config ───────────────────────────────────
-- Global samagri table ला TOUCH नाही.
-- Tenant ने custom samagri add केली तर इथे येते.
-- Rows असतील तर → हे दाखव (global ignore).
-- Rows नसतील तर → global samagri fallback.

CREATE TABLE IF NOT EXISTS tenant_samagri_config (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id   INT          NOT NULL,
  pooja_id    INT          NOT NULL,

  name_mr     VARCHAR(200) NOT NULL,
  name_en     VARCHAR(200) NULL,
  quantity    VARCHAR(50)  NULL,
  unit        VARCHAR(30)  NULL,
  note        TEXT         NULL,
  sort_order  INT          NOT NULL DEFAULT 0,

  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_tsc_tenant_pooja (tenant_id, pooja_id),

  CONSTRAINT fk_tsc_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tsc_pooja  FOREIGN KEY (pooja_id)  REFERENCES poojas(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tenant-specific samagri list per pooja. Replaces global samagri for that tenant+pooja combo.';


-- ── 3. Tenant Pujari Assignments ──────────────────────────────
-- Pujaris जे या tenant च्या under काम करतात.
-- एक pujari फक्त एका tenant ला assign होतो.

CREATE TABLE IF NOT EXISTS tenant_pujari_assignments (
  id          INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id   INT       NOT NULL,
  pujari_id   INT       NOT NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_pujari_tenant (pujari_id),          -- 1 pujari → 1 tenant only
  KEY idx_tenant (tenant_id),

  CONSTRAINT fk_tpa_tenant FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
  CONSTRAINT fk_tpa_pujari FOREIGN KEY (pujari_id)  REFERENCES pujaris(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps pujaris to their franchise tenant. 1 pujari = 1 tenant.';


-- ── Verify tables created ──────────────────────────────────────
SELECT TABLE_NAME, TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
    'tenant_puja_config',
    'tenant_samagri_config',
    'tenant_pujari_assignments'
  );
