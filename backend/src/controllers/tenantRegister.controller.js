// src/controllers/tenantRegister.controller.js
// Public endpoint — no auth required
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');
const { success, error } = require('../utils/response.util');

// Slugify business name to URL-safe slug
function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// POST /api/register-tenant
exports.registerTenant = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const {
      business_name,   // "पुजारी सेवा नाशिक"
      contact_name,    // "Rajesh Sharma"
      phone,           // "9876543210"
      email,           // "rajesh@example.com"
      password,        // min 8 chars
      city,            // "नाशिक"
      slug: reqSlug,   // optional custom slug
    } = req.body;

    // ── Validation ────────────────────────────────────────────
    if (!business_name || !contact_name || !phone || !email || !password || !city)
      return error(res, 'business_name, contact_name, phone, email, password, city — सर्व आवश्यक आहेत.', 400);

    if (password.length < 8)
      return error(res, 'Password किमान 8 अक्षरांचा असावा.', 400);

    if (!/^[6-9]\d{9}$/.test(phone))
      return error(res, 'Phone number valid नाही.', 400);

    // ── Slug ────────────────────────────────────────────────────
    let slug = reqSlug ? makeSlug(reqSlug) : makeSlug(city + '-' + business_name);
    if (!slug) slug = 'tenant-' + Date.now();

    // Ensure slug uniqueness
    const [[slugExists]] = await conn.query('SELECT id FROM tenants WHERE slug=?', [slug]);
    if (slugExists) slug = slug + '-' + Date.now().toString().slice(-4);

    // Check email uniqueness
    const [[emailExists]] = await conn.query('SELECT id FROM users WHERE email=?', [email]);
    if (emailExists) return error(res, 'हा email आधीच नोंदणीकृत आहे.', 409);

    // ── Trial: 30 days from now ──────────────────────────────
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);

    // ── Create Tenant ──────────────────────────────────────────
    const [tenantResult] = await conn.query(
      `INSERT INTO tenants
         (name, slug, phone, city, contact_name, plan, trial_ends_at, is_active)
       VALUES (?, ?, ?, ?, ?, 'trial', ?, TRUE)`,
      [business_name, slug, phone, city, contact_name, trialEnds]
    );
    const tenantId = tenantResult.insertId;

    // ── Create Admin User ─────────────────────────────────────
    const hashed = await bcrypt.hash(password, 10);
    await conn.query(
      `INSERT INTO users (tenant_id, name, phone, email, password, role, is_verified)
       VALUES (?, ?, ?, ?, ?, 'admin', TRUE)`,
      [tenantId, contact_name, phone, email, hashed]
    );

    // ── Default site_settings for this tenant ─────────────────
    try {
      await conn.query(
        'INSERT INTO site_settings (tenant_id, active_theme, theme_mode) VALUES (?, ?, ?)',
        [tenantId, 'saffron-divine', 'manual']
      );
    } catch {
      // ignore if site_settings doesn't have tenant_id yet
    }

    await conn.commit();

    return success(res, {
      tenant_id:    tenantId,
      slug,
      trial_ends:   trialEnds.toISOString().split('T')[0],
      login_email:  email,
      subdomain:    `${slug}.pojjari.com`,
    }, `नोंदणी यशस्वी! तुमचा 30 दिवसांचा Trial सुरू झाला. 🎉`, 201);

  } catch (err) {
    await conn.rollback();
    console.error('registerTenant error:', err);
    return error(res, 'नोंदणी करताना त्रुटी झाली. कृपया पुन्हा प्रयत्न करा.');
  } finally {
    conn.release();
  }
};
