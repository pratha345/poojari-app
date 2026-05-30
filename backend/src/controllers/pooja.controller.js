// src/controllers/pooja.controller.js
const pool = require('../config/db');
const { success, error }                         = require('../utils/response.util');
const { getCache, setCache, delCache, delCachePattern } = require('../utils/redis');

const CAT_KEY  = 'pooja:categories';
const CAT_TTL  = 60 * 60;       // 1 hour
const LIST_TTL = 30 * 60;       // 30 min
const SLUG_TTL = 30 * 60;       // 30 min

// Return image path as-is (relative); Vite proxies /uploads in dev, nginx in prod
const resolveImageUrl = (image_url) => {
  if (!image_url) return null;
  // Strip any existing base URL prefix, keep only the path
  try {
    const url = new URL(image_url);
    return url.pathname;
  } catch {
    return image_url.startsWith('/') ? image_url : `/${image_url}`;
  }
};

const resolveImages = (rows) =>
  rows.map(r => ({ ...r, image_url: resolveImageUrl(r.image_url) }));

// ── Get All Categories ────────────────────────────────────────
exports.getCategories = async (req, res) => {
  try {
    const cached = await getCache(CAT_KEY);
    if (cached) return success(res, cached);

    const [rows] = await pool.query(
      'SELECT * FROM pooja_categories WHERE is_active=TRUE ORDER BY sort_order'
    );
    const data = resolveImages(rows);
    await setCache(CAT_KEY, data, CAT_TTL);
    return success(res, data);
  } catch (err) {
    return error(res, 'श्रेणी मिळवताना त्रुटी झाली.');
  }
};

// ── Get All Poojas (with filter) ──────────────────────────────
exports.getPoojas = async (req, res) => {
  try {
    const { category, featured, search, min_price, max_price, page = 1, limit = 12, tenant_slug } = req.query;

    // Build a stable cache key from all query params
    const listKey = `pooja:list:${JSON.stringify({ category, featured, search, min_price, max_price, page, limit, tenant_slug, tid: req.tenantId })}`;
    const cachedList = await getCache(listKey);
    if (cachedList) return success(res, cachedList);
    let where = ['p.is_active = TRUE'];
    const params = [];

    // Tenant isolation — subdomain tenant sees only their poojas
    if (req.tenantId && req.tenantId > 1) {
      where.push('p.tenant_id = ?');
      params.push(req.tenantId);
    } else if (tenant_slug) {
      where.push('p.tenant_id = (SELECT id FROM tenants WHERE slug = ? AND is_active = TRUE LIMIT 1)');
      params.push(tenant_slug);
    }

    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (featured === 'true') {
      where.push('p.is_featured = TRUE');
    }
    if (search) {
      where.push('(p.name_mr LIKE ? OR p.short_desc LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (min_price) { where.push('p.price >= ?'); params.push(min_price); }
    if (max_price) { where.push('p.price <= ?'); params.push(max_price); }

    const offset = (page - 1) * limit;
    const whereClause = where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT p.id, p.name_mr, p.name_en, p.slug, p.short_desc,
              p.price, p.samagri_price, p.duration_hrs, p.image_url, p.is_featured,
              c.name_mr AS category_name, c.slug AS category_slug
       FROM poojas p
       JOIN pooja_categories c ON p.category_id = c.id
       WHERE ${whereClause}
       ORDER BY p.is_featured DESC, p.id
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM poojas p
       JOIN pooja_categories c ON p.category_id = c.id
       WHERE ${whereClause}`,
      params
    );

    const listData = {
      poojas: resolveImages(rows),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    };
    await setCache(listKey, listData, LIST_TTL);
    return success(res, listData);
  } catch (err) {
    console.error(err);
    return error(res, 'पूजा यादी मिळवताना त्रुटी झाली.');
  }
};

// ── Get Pooja by Slug ─────────────────────────────────────────
exports.getPoojaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const slugKey  = `pooja:slug:${slug}`;

    const cachedSlug = await getCache(slugKey);
    if (cachedSlug) {
      // Increment view count asynchronously — don't block response
      pool.query('UPDATE poojas SET views = views + 1 WHERE slug = ?', [slug]).catch(() => {});
      return success(res, cachedSlug);
    }

    const [rows] = await pool.query(
      `SELECT p.*, c.name_mr AS category_name, c.slug AS category_slug
       FROM poojas p
       JOIN pooja_categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_active = TRUE`,
      [slug]
    );
    if (!rows.length) return error(res, 'पूजा सापडली नाही.', 404);

    const pooja = rows[0];

    // Get samagri
    const [samagri] = await pool.query(
      'SELECT * FROM samagri_items WHERE pooja_id = ? ORDER BY sort_order',
      [pooja.id]
    );

    // Get reviews
    const [reviews] = await pool.query(
      `SELECT r.*, u.name AS user_name
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.pooja_id = ? AND r.is_approved = TRUE
       ORDER BY r.created_at DESC LIMIT 5`,
      [pooja.id]
    );

    // Increment view count
    await pool.query('UPDATE poojas SET views = views + 1 WHERE id = ?', [pooja.id]);

    const slugData = { ...pooja, image_url: resolveImageUrl(pooja.image_url), samagri, reviews };
    await setCache(slugKey, slugData, SLUG_TTL);
    return success(res, slugData);
  } catch (err) {
    return error(res, 'पूजा तपशील मिळवताना त्रुटी झाली.');
  }
};

// ── Admin: Create Pooja ───────────────────────────────────────
exports.createPooja = async (req, res) => {
  try {
    const { category_id, name_mr, name_en, slug: rawSlug, description, short_desc,
            price, samagri_price, duration_hrs, steps, is_featured } = req.body;
    if (!category_id || !name_mr || !rawSlug || !price)
      return error(res, 'सर्व आवश्यक माहिती भरा.', 400);
    if (Number(price) <= 0)
      return error(res, 'किंमत शून्यपेक्षा जास्त असणे आवश्यक आहे.', 400);

    // Ensure slug uniqueness (soft-deleted rows still hold the slug in the UNIQUE index)
    let slug = rawSlug;
    let suffix = 2;
    while (true) {
      const [existing] = await pool.query('SELECT id FROM poojas WHERE slug = ?', [slug]);
      if (!existing.length) break;
      slug = `${rawSlug}-${suffix++}`;
    }

    const image_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;
    const [result] = await pool.query(
      `INSERT INTO poojas (category_id, name_mr, name_en, slug, description,
       short_desc, price, samagri_price, duration_hrs, image_url, steps, is_featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id, name_mr, name_en, slug, description, short_desc,
       price, samagri_price || 0, duration_hrs, image_url, JSON.stringify(steps || []), is_featured || false]
    );
    await delCachePattern('pooja:list:*');
    await delCache(CAT_KEY);
    return success(res, { id: result.insertId }, 'पूजा यशस्वीरित्या जोडली.', 201);
  } catch (err) {
    console.error(err);
    return error(res, 'पूजा जोडताना त्रुटी झाली.');
  }
};

// ── Admin: Delete Pooja ───────────────────────────────────────
exports.deletePooja = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE poojas SET is_active=FALSE WHERE id=?', [id]);
    await delCachePattern('pooja:list:*');
    await delCachePattern('pooja:slug:*');
    return success(res, {}, 'पूजा यशस्वीरित्या काढली.');
  } catch (err) {
    return error(res, 'पूजा काढताना त्रुटी झाली.');
  }
};

// ── Admin: Update Pooja ───────────────────────────────────────
const POOJA_UPDATABLE = new Set([
  'category_id','name_mr','name_en','slug','description','short_desc',
  'price','samagri_price','duration_hrs','image_url','steps',
  'is_featured','is_active','sort_order',
]);

exports.updatePooja = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = req.body;
    if (req.file) raw.image_url = `/${req.file.path.replace(/\\/g, '/')}`;
    if (raw.steps) raw.steps = JSON.stringify(raw.steps);

    const fields = Object.keys(raw).filter(k => POOJA_UPDATABLE.has(k));
    if (!fields.length) return error(res, 'बदलण्यासाठी कोणतीही माहिती नाही.', 400);

    const setClause = fields.map(k => `${k}=?`).join(', ');
    await pool.query(`UPDATE poojas SET ${setClause} WHERE id=?`,
      [...fields.map(k => raw[k]), id]);
    await delCachePattern('pooja:list:*');
    await delCachePattern('pooja:slug:*');
    return success(res, {}, 'पूजा अद्यतनित केली.');
  } catch (err) {
    return error(res, 'पूजा अद्यतन करताना त्रुटी झाली.');
  }
};

// ── Admin: Get ALL Poojas (no is_active filter, no pagination) ─
exports.getAllPoojas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.name_mr, p.name_en, p.slug, p.short_desc,
              p.price, p.samagri_price, p.duration_hrs, p.image_url, p.is_featured, p.is_active,
              c.name_mr AS category_name, c.slug AS category_slug
       FROM poojas p
       LEFT JOIN pooja_categories c ON p.category_id = c.id
       ORDER BY c.sort_order, p.is_featured DESC, p.name_mr`
    );
    return success(res, resolveImages(rows));
  } catch (err) {
    console.error(err);
    return error(res, 'पूजा यादी मिळवताना त्रुटी झाली.');
  }
};
