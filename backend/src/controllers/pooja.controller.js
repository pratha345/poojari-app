// src/controllers/pooja.controller.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

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
    const [rows] = await pool.query(
      'SELECT * FROM pooja_categories WHERE is_active=TRUE ORDER BY sort_order'
    );
    return success(res, resolveImages(rows));
  } catch (err) {
    return error(res, 'श्रेणी मिळवताना त्रुटी झाली.');
  }
};

// ── Get All Poojas (with filter) ──────────────────────────────
exports.getPoojas = async (req, res) => {
  try {
    const { category, featured, search, min_price, max_price, page = 1, limit = 12 } = req.query;
    let where = ['p.is_active = TRUE'];
    const params = [];

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
              p.price, p.duration_hrs, p.image_url, p.is_featured,
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

    return success(res, {
      poojas: resolveImages(rows),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    return error(res, 'पूजा यादी मिळवताना त्रुटी झाली.');
  }
};

// ── Get Pooja by Slug ─────────────────────────────────────────
exports.getPoojaBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

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

    return success(res, { ...pooja, image_url: resolveImageUrl(pooja.image_url), samagri, reviews });
  } catch (err) {
    return error(res, 'पूजा तपशील मिळवताना त्रुटी झाली.');
  }
};

// ── Admin: Create Pooja ───────────────────────────────────────
exports.createPooja = async (req, res) => {
  try {
    const { category_id, name_mr, name_en, slug, description, short_desc,
            price, duration_hrs, steps, is_featured } = req.body;
    if (!category_id || !name_mr || !slug || !price)
      return error(res, 'सर्व आवश्यक माहिती भरा.', 400);

    const image_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;
    const [result] = await pool.query(
      `INSERT INTO poojas (category_id, name_mr, name_en, slug, description,
       short_desc, price, duration_hrs, image_url, steps, is_featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [category_id, name_mr, name_en, slug, description, short_desc,
       price, duration_hrs, image_url, JSON.stringify(steps || []), is_featured || false]
    );
    return success(res, { id: result.insertId }, 'पूजा यशस्वीरित्या जोडली.', 201);
  } catch (err) {
    return error(res, 'पूजा जोडताना त्रुटी झाली.');
  }
};

// ── Admin: Delete Pooja ───────────────────────────────────────
exports.deletePooja = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE poojas SET is_active=FALSE WHERE id=?', [id]);
    return success(res, {}, 'पूजा यशस्वीरित्या काढली.');
  } catch (err) {
    return error(res, 'पूजा काढताना त्रुटी झाली.');
  }
};

// ── Admin: Update Pooja ───────────────────────────────────────
exports.updatePooja = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    if (req.file) fields.image_url = `/${req.file.path.replace(/\\/g, '/')}`;
    if (fields.steps) fields.steps = JSON.stringify(fields.steps);

    const setClause = Object.keys(fields).map(k => `${k}=?`).join(', ');
    await pool.query(`UPDATE poojas SET ${setClause} WHERE id=?`,
      [...Object.values(fields), id]);
    return success(res, {}, 'पूजा अद्यतनित केली.');
  } catch (err) {
    return error(res, 'पूजा अद्यतन करताना त्रुटी झाली.');
  }
};
