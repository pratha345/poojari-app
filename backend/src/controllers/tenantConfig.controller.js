// src/controllers/tenantConfig.controller.js
// Tenant franchise configuration — puja price/enable overrides, custom samagri, pujari management
// Global tables (poojas, samagri_items) are NEVER modified here.

'use strict';
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

// ════════════════════════════════════════════════════════════════════
// SECTION A: PUJA CONFIG (price / enable overrides per tenant)
// ════════════════════════════════════════════════════════════════════

/**
 * GET /api/tenant-config/puja
 * Returns all poojas with tenant override applied (price, enabled).
 * Fallback → global pooja values if no override exists.
 */
exports.getPujaConfig = async (req, res) => {
  const tenantId = req.tenantId;
  try {
    const [rows] = await pool.query(`
      SELECT
        p.id,
        p.name_mr,
        p.name_en,
        p.slug,
        p.image_url,
        p.is_active          AS global_is_active,
        p.price              AS global_price,
        p.samagri_price      AS global_samagri_price,
        c.name_mr            AS category_name,

        -- Tenant overrides (NULL = no override set yet)
        tc.id                AS config_id,
        tc.custom_price,
        tc.custom_samagri_price,
        tc.is_enabled,
        tc.custom_desc_mr,

        -- Effective values (tenant override wins, else global)
        COALESCE(tc.custom_price,        p.price)         AS effective_price,
        COALESCE(tc.custom_samagri_price, p.samagri_price) AS effective_samagri_price,
        COALESCE(tc.is_enabled,          p.is_active)     AS effective_is_enabled
      FROM poojas p
      LEFT JOIN pooja_categories c  ON p.category_id = c.id
      LEFT JOIN tenant_puja_config tc
             ON tc.pooja_id = p.id AND tc.tenant_id = ?
      WHERE p.is_active = 1
        AND (c.slug IS NULL OR (
          c.slug NOT LIKE '%consultation%' AND
          c.slug NOT LIKE '%jyotish%' AND
          c.slug NOT LIKE '%salla%' AND
          c.slug NOT LIKE '%kundali%'
        ))
        AND p.name_mr NOT LIKE '%सल्लामसलत%'
      ORDER BY c.sort_order, p.is_featured DESC, p.name_mr
    `, [tenantId]);

    return success(res, rows);
  } catch (err) {
    console.error('getPujaConfig error:', err);
    return error(res, 'पूजा config मिळवता आली नाही.');
  }
};

/**
 * PUT /api/tenant-config/puja/:poojaId
 * Upsert tenant override for one pooja.
 * Body: { custom_price, custom_samagri_price, is_enabled, custom_desc_mr }
 */
exports.upsertPujaConfig = async (req, res) => {
  const tenantId = req.tenantId;
  const poojaId  = parseInt(req.params.poojaId);
  if (!poojaId) return error(res, 'Invalid pooja ID', 400);

  const {
    custom_price,
    custom_samagri_price,
    is_enabled,
    custom_desc_mr,
  } = req.body;

  try {
    await pool.query(`
      INSERT INTO tenant_puja_config
        (tenant_id, pooja_id, custom_price, custom_samagri_price, is_enabled, custom_desc_mr)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        custom_price         = VALUES(custom_price),
        custom_samagri_price = VALUES(custom_samagri_price),
        is_enabled           = VALUES(is_enabled),
        custom_desc_mr       = VALUES(custom_desc_mr),
        updated_at           = NOW()
    `, [
      tenantId, poojaId,
      custom_price         != null ? parseFloat(custom_price)         : null,
      custom_samagri_price != null ? parseFloat(custom_samagri_price) : null,
      is_enabled           != null ? (is_enabled ? 1 : 0)             : null,
      custom_desc_mr       || null,
    ]);

    return success(res, {}, 'पूजा config जतन केला! ✅');
  } catch (err) {
    console.error('upsertPujaConfig error:', err);
    return error(res, 'पूजा config जतन करता आला नाही.');
  }
};

/**
 * DELETE /api/tenant-config/puja/:poojaId
 * Remove override → pooja reverts to global defaults.
 */
exports.deletePujaConfig = async (req, res) => {
  const tenantId = req.tenantId;
  const poojaId  = parseInt(req.params.poojaId);
  try {
    await pool.query(
      'DELETE FROM tenant_puja_config WHERE tenant_id = ? AND pooja_id = ?',
      [tenantId, poojaId]
    );
    return success(res, {}, 'Override काढला — global defaults वापरले जातील.');
  } catch (err) {
    console.error('deletePujaConfig error:', err);
    return error(res, 'Override काढता आला नाही.');
  }
};

// ════════════════════════════════════════════════════════════════════
// SECTION B: SAMAGRI CONFIG (custom list per tenant per pooja)
// ════════════════════════════════════════════════════════════════════

/**
 * GET /api/tenant-config/samagri/:poojaId
 * Returns tenant's custom samagri if set, else global samagri_items.
 */
exports.getSamagriConfig = async (req, res) => {
  const tenantId = req.tenantId;
  const poojaId  = parseInt(req.params.poojaId);

  try {
    // Check if tenant has custom samagri for this pooja
    const [tenantItems] = await pool.query(
      'SELECT * FROM tenant_samagri_config WHERE tenant_id = ? AND pooja_id = ? ORDER BY sort_order',
      [tenantId, poojaId]
    );

    if (tenantItems.length > 0) {
      return success(res, { source: 'tenant', items: tenantItems });
    }

    // Fallback → global samagri_items
    const [globalItems] = await pool.query(
      'SELECT * FROM samagri_items WHERE pooja_id = ? ORDER BY sort_order',
      [poojaId]
    );
    return success(res, { source: 'global', items: globalItems });
  } catch (err) {
    console.error('getSamagriConfig error:', err);
    return error(res, 'साहित्य config मिळवता आली नाही.');
  }
};

/**
 * PUT /api/tenant-config/samagri/:poojaId
 * Bulk replace tenant samagri for a pooja.
 * Body: { items: [{ name_mr, name_en, quantity, unit, note, sort_order }] }
 * Sending empty items [] resets to global.
 */
exports.saveSamagriConfig = async (req, res) => {
  const tenantId = req.tenantId;
  const poojaId  = parseInt(req.params.poojaId);
  const { items = [] } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Delete existing tenant samagri for this pooja
    await conn.query(
      'DELETE FROM tenant_samagri_config WHERE tenant_id = ? AND pooja_id = ?',
      [tenantId, poojaId]
    );

    // Insert new items (if any)
    if (items.length > 0) {
      const values = items.map((item, i) => [
        tenantId,
        poojaId,
        item.name_mr,
        item.name_en    || null,
        item.quantity   || null,
        item.unit       || null,
        item.note       || null,
        item.sort_order != null ? item.sort_order : i + 1,
      ]);

      await conn.query(`
        INSERT INTO tenant_samagri_config
          (tenant_id, pooja_id, name_mr, name_en, quantity, unit, note, sort_order)
        VALUES ?
      `, [values]);
    }

    await conn.commit();

    const msg = items.length > 0
      ? `${items.length} साहित्य items जतन केले! ✅`
      : 'Tenant साहित्य reset केले — global वापरले जाईल.';

    return success(res, { count: items.length }, msg);
  } catch (err) {
    await conn.rollback();
    console.error('saveSamagriConfig error:', err);
    return error(res, 'साहित्य config जतन करता आली नाही.');
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/tenant-config/samagri/:poojaId
 * Remove all tenant samagri → reverts to global.
 */
exports.resetSamagriConfig = async (req, res) => {
  const tenantId = req.tenantId;
  const poojaId  = parseInt(req.params.poojaId);
  try {
    await pool.query(
      'DELETE FROM tenant_samagri_config WHERE tenant_id = ? AND pooja_id = ?',
      [tenantId, poojaId]
    );
    return success(res, {}, 'साहित्य reset — global defaults वापरले जातील.');
  } catch (err) {
    console.error('resetSamagriConfig error:', err);
    return error(res, 'Reset करता आला नाही.');
  }
};

// ════════════════════════════════════════════════════════════════════
// SECTION C: PUJARI MANAGEMENT (under tenant)
// ════════════════════════════════════════════════════════════════════

/**
 * GET /api/tenant-config/pujaris
 * List all pujaris assigned to this tenant.
 */
exports.getTenantPujaris = async (req, res) => {
  const tenantId = req.tenantId;
  try {
    const [rows] = await pool.query(`
      SELECT
        pp.id,
        pp.full_name        AS name,
        u.phone,
        u.email,
        pp.city,
        pp.avg_rating       AS rating,
        pp.total_bookings,
        pp.is_available     AS is_active,
        tpa.assigned_at,
        tpa.is_active       AS assignment_active
      FROM tenant_pujari_assignments tpa
      JOIN pujari_profiles pp ON tpa.pujari_id = pp.id
      LEFT JOIN users u ON pp.user_id = u.id
      WHERE tpa.tenant_id = ?
      ORDER BY pp.full_name
    `, [tenantId]);

    return success(res, rows);
  } catch (err) {
    console.error('getTenantPujaris error:', err);
    return error(res, 'पुजारी यादी मिळवता आली नाही.');
  }
};

/**
 * POST /api/tenant-config/pujaris
 * Assign an existing pujari (by pujari_id) to this tenant.
 * Body: { pujari_id }
 */
exports.assignPujari = async (req, res) => {
  const tenantId = req.tenantId;
  const { pujari_id } = req.body;

  if (!pujari_id) return error(res, 'pujari_id आवश्यक आहे.', 400);

  try {
    // Check pujari exists and is approved
    const [[pujari]] = await pool.query(
      'SELECT id, full_name AS name FROM pujari_profiles WHERE id = ? AND status = "approved"',
      [pujari_id]
    );
    if (!pujari) return error(res, 'पुजारी सापडला नाही.', 404);

    await pool.query(`
      INSERT INTO tenant_pujari_assignments (tenant_id, pujari_id, is_active)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE is_active = 1, tenant_id = VALUES(tenant_id)
    `, [tenantId, pujari_id]);

    return success(res, { pujari_id, name: pujari.name }, `${pujari.name} assign केला! ✅`);
  } catch (err) {
    console.error('assignPujari error:', err);
    return error(res, 'पुजारी assign करता आला नाही.');
  }
};

/**
 * DELETE /api/tenant-config/pujaris/:pujariId
 * Remove pujari from this tenant.
 */
exports.removePujari = async (req, res) => {
  const tenantId = req.tenantId;
  const pujariId = parseInt(req.params.pujariId);

  try {
    await pool.query(
      'DELETE FROM tenant_pujari_assignments WHERE tenant_id = ? AND pujari_id = ?',
      [tenantId, pujariId]
    );
    return success(res, {}, 'पुजारी tenant मधून काढला.');
  } catch (err) {
    console.error('removePujari error:', err);
    return error(res, 'पुजारी काढता आला नाही.');
  }
};

/**
 * POST /api/tenant-config/pujaris/create
 * Create a brand-new pujari account under this tenant.
 * Body: { name, phone, password, city, email (optional) }
 * → Creates users row (role=pujari, tenant_id) + pujari_profiles row + assignment
 */
exports.createPujari = async (req, res) => {
  const tenantId = req.tenantId;
  const { name, phone, password, city, email } = req.body;

  if (!name || !phone || !password)
    return error(res, 'नाव, फोन आणि password आवश्यक आहेत.', 400);
  if (!/^[6-9]\d{9}$/.test(phone))
    return error(res, 'Valid 10-digit mobile number द्या.', 400);
  if (password.length < 6)
    return error(res, 'Password किमान 6 अक्षरांचा असावा.', 400);

  const bcrypt = require('bcryptjs');
  const conn   = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Check phone uniqueness
    const [[phoneExists]] = await conn.query(
      'SELECT id FROM users WHERE phone = ?', [phone]
    );
    if (phoneExists) return error(res, 'हा phone number आधीच नोंदणीकृत आहे.', 409);

    // Check email uniqueness (if provided)
    if (email) {
      const [[emailExists]] = await conn.query(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      if (emailExists) return error(res, 'हा email आधीच नोंदणीकृत आहे.', 409);
    }

    // Create user account
    const hashed = await bcrypt.hash(password, 10);
    const [userResult] = await conn.query(
      `INSERT INTO users (tenant_id, name, phone, email, password, role, is_verified)
       VALUES (?, ?, ?, ?, ?, 'pujari', 1)`,
      [tenantId, name.trim(), phone, email || null, hashed]
    );
    const userId = userResult.insertId;

    // Create pujari_profiles entry
    const [profileResult] = await conn.query(
      `INSERT INTO pujari_profiles (user_id, full_name, city, status, is_available)
       VALUES (?, ?, ?, 'approved', 1)`,
      [userId, name.trim(), city || null]
    );
    const pujariId = profileResult.insertId;

    // Auto-assign to this tenant
    await conn.query(
      `INSERT INTO tenant_pujari_assignments (tenant_id, pujari_id, is_active)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1`,
      [tenantId, pujariId]
    );

    await conn.commit();

    return success(res, {
      pujari_id: pujariId,
      user_id:   userId,
      name,
      phone,
      login_info: `Phone: ${phone} | Password: (set केला)`,
    }, `${name} — पुजारी account तयार झाला आणि तुमच्या franchise मध्ये जोडला! 🎉`, 201);

  } catch (err) {
    await conn.rollback();
    console.error('createPujari error:', err);
    return error(res, 'पुजारी account तयार करता आला नाही.');
  } finally {
    conn.release();
  }
};

// ════════════════════════════════════════════════════════════════════
// SECTION D: TENANT DASHBOARD STATS
// ════════════════════════════════════════════════════════════════════

/**
 * GET /api/tenant-config/dashboard
 * Returns tenant-specific dashboard stats.
 */
exports.getTenantDashboard = async (req, res) => {
  const tenantId = req.tenantId;
  try {
    const today = new Date().toISOString().split('T')[0];

    const [[stats]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ?)                         AS total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND DATE(created_at) = ?) AS today_bookings,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND status = 'confirmed') AS confirmed_bookings,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = ? AND status = 'pending')   AS pending_bookings,
        (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE tenant_id = ? AND status = 'confirmed') AS total_revenue,
        (SELECT COUNT(*) FROM tenant_pujari_assignments WHERE tenant_id = ? AND is_active = 1)       AS active_pujaris,
        (SELECT COUNT(*) FROM tenant_puja_config WHERE tenant_id = ?)                AS customized_poojas
    `, [tenantId, tenantId, today, tenantId, tenantId, tenantId, tenantId, tenantId]);

    // Recent bookings
    const [recentBookings] = await pool.query(`
      SELECT b.id, b.booking_code, b.status, b.total_amount AS amount, b.booking_date,
             u.name AS user_name, p.name_mr AS pooja_name
      FROM bookings b
      JOIN users u  ON b.user_id  = u.id
      LEFT JOIN poojas p ON b.pooja_id = p.id
      WHERE b.tenant_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10
    `, [tenantId]);

    return success(res, { stats, recentBookings });
  } catch (err) {
    console.error('getTenantDashboard error:', err);
    return error(res, 'Dashboard stats मिळवता आल्या नाहीत.');
  }
};

// ════════════════════════════════════════════════════════════════════
// SECTION E: TENANT FEATURES
// ════════════════════════════════════════════════════════════════════

const DEFAULT_FEATURES = {
  pujariBookings:  false,
  consultations:   false,
  poojaManagement: false,
  halls:           false,
  franchiseConfig: false,
  websiteHome:     false,
  theme:           false,
  kundali:         false,
  blog:            false,
  dharmasindhu:    false,
  granth:          false,
  teamSection:     false,
  whatsapp:        false,
};

// Keys added after initial launch — existing tenants get these as true (backward compat)
const BACKFILL_TRUE = ['pujariBookings', 'consultations', 'poojaManagement',
  'websiteHome', 'teamSection', 'franchiseConfig'];

/**
 * GET /api/tenant-config/features
 * Returns feature flags for current tenant.
 * super_admin gets all features; NULL tenant features = use defaults.
 */
exports.getTenantFeatures = async (req, res) => {
  if (req.user.role === 'super_admin') {
    const all = Object.fromEntries(Object.keys(DEFAULT_FEATURES).map(k => [k, true]));
    return success(res, { ...all, _all: true });
  }
  const tenantId = req.tenantId;
  try {
    const [[tenant]] = await pool.query('SELECT features FROM tenants WHERE id = ?', [tenantId]);
    const stored = tenant?.features
      ? (typeof tenant.features === 'string' ? JSON.parse(tenant.features) : tenant.features)
      : null;
    if (!stored) return success(res, DEFAULT_FEATURES);
    // Backfill: keys not present in older stored objects default to true (existing tenants keep access)
    for (const key of BACKFILL_TRUE) {
      if (stored[key] === undefined) stored[key] = true;
    }
    return success(res, stored);
  } catch (err) {
    console.error('getTenantFeatures error:', err);
    return success(res, DEFAULT_FEATURES);
  }
};
