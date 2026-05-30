// src/controllers/superadmin.controller.js
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');
const { success, error } = require('../utils/response.util');

// ── Platform-wide Stats ───────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [[tenants]]  = await pool.query('SELECT COUNT(*) AS total FROM tenants WHERE is_active=TRUE');
    const [[users]]    = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role != "super_admin"');
    const [[pujaris]]  = await pool.query('SELECT COUNT(*) AS total FROM pujari_profiles WHERE status="approved"');
    const [[bookings]] = await pool.query('SELECT COUNT(*) AS total FROM bookings');
    const [[revenue]]  = await pool.query('SELECT SUM(total_amount) AS total FROM bookings WHERE payment_status="paid"');
    return success(res, {
      tenants: tenants.total,
      users: users.total,
      pujaris: pujaris.total,
      bookings: bookings.total,
      revenue: revenue.total || 0,
    });
  } catch (err) {
    return error(res, 'आकडेवारी मिळवताना त्रुटी झाली.');
  }
};

// ── List All Tenants ──────────────────────────────────────────
exports.getTenants = async (req, res) => {
  try {
    const [tenants] = await pool.query(
      `SELECT t.*,
         (SELECT COUNT(*) FROM users u WHERE u.tenant_id=t.id AND u.role='user')   AS user_count,
         (SELECT COUNT(*) FROM pujari_profiles pp WHERE pp.tenant_id=t.id)          AS pujari_count,
         (SELECT COUNT(*) FROM bookings b WHERE b.tenant_id=t.id)                   AS booking_count,
         (SELECT u.email FROM users u WHERE u.tenant_id=t.id AND u.role='admin' LIMIT 1) AS admin_email
       FROM tenants t
       ORDER BY t.created_at DESC`
    );
    return success(res, tenants);
  } catch (err) {
    return error(res, 'Tenants मिळवताना त्रुटी झाली.');
  }
};

// ── Get Single Tenant ─────────────────────────────────────────
exports.getTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const [[tenant]] = await pool.query('SELECT * FROM tenants WHERE id=?', [id]);
    if (!tenant) return error(res, 'Tenant सापडला नाही.', 404);
    return success(res, tenant);
  } catch (err) {
    return error(res, 'Tenant मिळवताना त्रुटी झाली.');
  }
};

// ── Create Tenant + Admin ─────────────────────────────────────
exports.createTenant = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { name, slug, domain, plan, admin_name, admin_email, admin_phone, admin_password } = req.body;

    if (!name || !slug || !admin_email || !admin_phone || !admin_password)
      return error(res, 'name, slug, admin_email, admin_phone, admin_password आवश्यक आहेत.', 400);

    // Check slug uniqueness
    const [[exists]] = await conn.query('SELECT id FROM tenants WHERE slug=?', [slug]);
    if (exists) return error(res, 'हे slug आधीच वापरले आहे.', 400);

    // Create tenant
    const [tenantResult] = await conn.query(
      'INSERT INTO tenants (name, slug, domain, plan) VALUES (?,?,?,?)',
      [name, slug, domain || null, plan || 'trial']
    );
    const tenantId = tenantResult.insertId;

    // Create admin user for this tenant
    const hashed = await bcrypt.hash(admin_password, 10);
    await conn.query(
      `INSERT INTO users (tenant_id, name, phone, email, password, role, is_verified)
       VALUES (?,?,?,?,?,'admin',TRUE)`,
      [tenantId, admin_name || name, admin_phone, admin_email, hashed]
    );

    // Create default site_settings row for this tenant
    await conn.query(
      'INSERT INTO site_settings (tenant_id, active_theme, theme_mode) VALUES (?,?,?)',
      [tenantId, 'saffron-divine', 'manual']
    );

    await conn.commit();
    return success(res, { tenant_id: tenantId }, 'Tenant यशस्वीरित्या तयार केला! 🎉', 201);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return error(res, 'Tenant तयार करताना त्रुटी झाली.');
  } finally {
    conn.release();
  }
};

// ── Update Tenant ─────────────────────────────────────────────
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, plan, is_active, logo_url, city, phone, contact_name } = req.body;

    await pool.query(
      `UPDATE tenants SET
         name         = COALESCE(?, name),
         domain       = COALESCE(?, domain),
         plan         = COALESCE(?, plan),
         is_active    = COALESCE(?, is_active),
         logo_url     = COALESCE(?, logo_url),
         city         = COALESCE(?, city),
         phone        = COALESCE(?, phone),
         contact_name = COALESCE(?, contact_name)
       WHERE id = ?`,
      [name, domain, plan, is_active, logo_url, city, phone, contact_name, id]
    );
    return success(res, {}, 'Tenant अपडेट केला.');
  } catch (err) {
    return error(res, 'Tenant अपडेट करताना त्रुटी झाली.');
  }
};

// ── Update Plan (manual, no payment) ─────────────────────────
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, months } = req.body;

    if (!['trial', 'basic', 'premium'].includes(plan))
      return error(res, 'Plan trial / basic / premium असावा.', 400);

    const [[tenant]] = await pool.query('SELECT id FROM tenants WHERE id=?', [id]);
    if (!tenant) return error(res, 'Tenant सापडला नाही.', 404);

    const now = new Date();
    let trial_ends_at   = null;
    let plan_expires_at = null;

    if (plan === 'trial') {
      const days = months ? months * 30 : 30;
      trial_ends_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    } else if (plan === 'basic' || plan === 'premium') {
      const m = parseInt(months) || 1;
      plan_expires_at = new Date(now);
      plan_expires_at.setMonth(plan_expires_at.getMonth() + m);
    }

    await pool.query(
      `UPDATE tenants SET plan=?, trial_ends_at=?, plan_expires_at=?, is_active=TRUE WHERE id=?`,
      [plan, trial_ends_at, plan_expires_at, id]
    );

    return success(res, {
      plan,
      trial_ends_at:   trial_ends_at   ? trial_ends_at.toISOString().split('T')[0]   : null,
      plan_expires_at: plan_expires_at ? plan_expires_at.toISOString().split('T')[0] : null,
    }, `Plan "${plan}" यशस्वीरित्या update केला.`);
  } catch (err) {
    console.error(err);
    return error(res, 'Plan update करताना त्रुटी झाली.');
  }
};

// ── Delete Tenant ─────────────────────────────────────────────
exports.deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    if (id == 1) return error(res, 'Default tenant काढता येत नाही.', 400);
    await pool.query('DELETE FROM tenants WHERE id=?', [id]);
    return success(res, {}, 'Tenant काढला.');
  } catch (err) {
    return error(res, 'Tenant काढताना त्रुटी झाली.');
  }
};

// ── Tenant-level stats (for super_admin viewing one tenant) ───
exports.getTenantStats = async (req, res) => {
  try {
    const tid = req.params.id;
    const [[users]]    = await pool.query('SELECT COUNT(*) AS total FROM users WHERE tenant_id=? AND role="user"', [tid]);
    const [[pujaris]]  = await pool.query('SELECT COUNT(*) AS total FROM pujari_profiles WHERE tenant_id=? AND status="approved"', [tid]);
    const [[pending]]  = await pool.query('SELECT COUNT(*) AS total FROM pujari_profiles WHERE tenant_id=? AND status="pending"', [tid]);
    const [[bookings]] = await pool.query('SELECT COUNT(*) AS total FROM bookings WHERE tenant_id=?', [tid]);
    const [[revenue]]  = await pool.query('SELECT SUM(total_amount) AS total FROM bookings WHERE tenant_id=? AND payment_status="paid"', [tid]);
    return success(res, {
      users: users.total, pujaris: pujaris.total,
      pending_pujaris: pending.total, bookings: bookings.total,
      revenue: revenue.total || 0,
    });
  } catch (err) {
    return error(res, 'आकडेवारी मिळवताना त्रुटी झाली.');
  }
};

// ── Revenue Report ────────────────────────────────────────────
exports.getRevenueReport = async (req, res) => {
  try {
    const { year, month, tenant_id } = req.query;

    // Build date filter
    let dateFilter = '';
    const dateParams = [];
    if (year && month) {
      dateFilter = 'AND YEAR(b.created_at)=? AND MONTH(b.created_at)=?';
      dateParams.push(year, month);
    } else if (year) {
      dateFilter = 'AND YEAR(b.created_at)=?';
      dateParams.push(year);
    }
    const tenantFilter = tenant_id ? 'AND b.tenant_id=?' : '';
    if (tenant_id) dateParams.push(tenant_id);

    // Summary totals
    const [[summary]] = await pool.query(
      `SELECT
         COUNT(*)                                                      AS total_bookings,
         COUNT(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN 1 END) AS paid_bookings,
         COUNT(CASE WHEN b.payment_status='unpaid' THEN 1 END)        AS unpaid_bookings,
         COUNT(CASE WHEN b.payment_method='cash' THEN 1 END)          AS cash_bookings,
         COUNT(CASE WHEN b.payment_method='online' THEN 1 END)        AS online_bookings,
         COALESCE(SUM(b.total_amount),0)                              AS gross_revenue,
         COALESCE(SUM(CASE WHEN b.payment_status='paid' THEN COALESCE(b.actual_amount, b.total_amount) ELSE 0 END),0)      AS online_collected,
         COALESCE(SUM(CASE WHEN b.payment_status='cash_paid' THEN COALESCE(b.actual_amount, b.total_amount) ELSE 0 END),0) AS cash_collected,
         COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN b.platform_fee ELSE 0 END),0) AS platform_commission
       FROM bookings b WHERE 1=1 ${dateFilter} ${tenantFilter}`,
      dateParams
    );

    // Monthly breakdown
    const [monthly] = await pool.query(
      `SELECT
         YEAR(b.created_at)                          AS year,
         MONTH(b.created_at)                         AS month_num,
         DATE_FORMAT(b.created_at,'%b %Y')           AS month_label,
         COUNT(*)                                    AS total_bookings,
         COUNT(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN 1 END) AS paid_bookings,
         COALESCE(SUM(CASE WHEN b.payment_status='paid'
           THEN COALESCE(b.actual_amount, b.total_amount) ELSE 0 END),0)      AS online_revenue,
         COALESCE(SUM(CASE WHEN b.payment_status='cash_paid'
           THEN COALESCE(b.actual_amount, b.total_amount) ELSE 0 END),0)      AS cash_revenue,
         COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','cash_paid')
           THEN b.platform_fee ELSE 0 END),0)                                 AS platform_fee
       FROM bookings b WHERE 1=1 ${tenantFilter}
       GROUP BY YEAR(b.created_at), MONTH(b.created_at)
       ORDER BY year DESC, month_num DESC
       LIMIT 24`,
      tenant_id ? [tenant_id] : []
    );

    // Per tenant breakdown
    const [byTenant] = await pool.query(
      `SELECT t.id, t.name, t.plan,
         COUNT(b.id)                                          AS total_bookings,
         COUNT(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN 1 END) AS paid_bookings,
         COALESCE(SUM(CASE WHEN b.payment_status='paid'
           THEN COALESCE(b.actual_amount, b.total_amount) ELSE 0 END),0)      AS online_revenue,
         COALESCE(SUM(CASE WHEN b.payment_status='cash_paid'
           THEN COALESCE(b.actual_amount, b.total_amount) ELSE 0 END),0)      AS cash_revenue,
         COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','cash_paid')
           THEN b.platform_fee ELSE 0 END),0)                                 AS platform_commission
       FROM tenants t
       LEFT JOIN bookings b ON b.tenant_id=t.id ${dateFilter ? 'AND '+dateFilter.replace('AND ','') : ''}
       GROUP BY t.id
       ORDER BY (online_revenue + cash_revenue) DESC`,
      dateParams
    );

    // Year list for filter dropdown
    const [years] = await pool.query(
      'SELECT DISTINCT YEAR(created_at) AS y FROM bookings ORDER BY y DESC'
    );

    return success(res, { summary, monthly, byTenant, years: years.map(r => r.y) });
  } catch (err) {
    console.error(err);
    return error(res, 'Revenue report मिळवताना त्रुटी झाली.');
  }
};

// ── List All Users Across Tenants ─────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { tenant_id, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let where = "u.role != 'super_admin'";
    const params = [];
    if (tenant_id) { where += ' AND u.tenant_id = ?'; params.push(tenant_id); }
    if (role)      { where += ' AND u.role = ?';      params.push(role); }

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role, u.is_active, u.created_at,
              t.name AS tenant_name, t.slug AS tenant_slug
       FROM users u
       LEFT JOIN tenants t ON u.tenant_id = t.id
       WHERE ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users u WHERE ${where}`, params
    );

    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return error(res, 'Users मिळवताना त्रुटी झाली.');
  }
};
