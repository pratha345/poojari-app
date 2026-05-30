'use strict';
// controllers/galleryController.js — Poster gallery CRUD

const pool   = require('../config/db');
const fs     = require('fs');
const path   = require('path');
const { success, error } = require('../utils/response.util');

const UPLOADS_DIR = path.join(__dirname, '../../uploads/festivals');

// ── GET /api/gallery ──────────────────────────────────────────
// Public: list published gallery items with filters
exports.getGallery = async (req, res) => {
  try {
    const {
      festival, theme_type, style, search,
      page = 1, limit = 24,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where  = ['is_published = TRUE'];
    const params = [];

    if (festival)   { where.push('festival_slug = ?');  params.push(festival); }
    if (theme_type) { where.push('theme_type = ?');     params.push(theme_type); }
    if (style)      { where.push('style = ?');          params.push(style); }
    if (search)     { where.push('festival_name LIKE ?'); params.push(`%${search}%`); }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM poster_gallery ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT id, festival_name, festival_slug, image_url, thumb_url, filename,
              theme_type, style, variant, is_selected, colors, mood, created_at
       FROM poster_gallery ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    return success(res, {
      items: rows,
      total,
      page:  parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('getGallery error:', err);
    return error(res, 'Gallery लोड करताना त्रुटी झाली.');
  }
};

// ── GET /api/gallery/admin ────────────────────────────────────
// Admin: list all gallery items (including unpublished)
exports.getAdminGallery = async (req, res) => {
  try {
    const {
      festival, theme_type, style, search,
      page = 1, limit = 24,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where  = ['1=1'];
    const params = [];

    if (festival)   { where.push('festival_slug = ?');  params.push(festival); }
    if (theme_type) { where.push('theme_type = ?');     params.push(theme_type); }
    if (style)      { where.push('style = ?');          params.push(style); }
    if (search)     { where.push('festival_name LIKE ?'); params.push(`%${search}%`); }

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM poster_gallery ${whereSql}`,
      params
    );

    const [rows] = await pool.query(
      `SELECT * FROM poster_gallery ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Get unique festivals and types for filter dropdowns
    const [festivals] = await pool.query(
      'SELECT DISTINCT festival_name, festival_slug FROM poster_gallery ORDER BY festival_name'
    );
    const [themeTypes] = await pool.query(
      'SELECT DISTINCT theme_type FROM poster_gallery'
    );
    const [styles] = await pool.query(
      'SELECT DISTINCT style FROM poster_gallery'
    );

    return success(res, {
      items: rows, total,
      page: parseInt(page), limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
      filters: { festivals, themeTypes: themeTypes.map(r => r.theme_type), styles: styles.map(r => r.style) },
    });
  } catch (err) {
    console.error('getAdminGallery error:', err);
    return error(res, 'Gallery लोड करताना त्रुटी झाली.');
  }
};

// ── GET /api/gallery/:id ──────────────────────────────────────
exports.getGalleryItem = async (req, res) => {
  try {
    const [[item]] = await pool.query('SELECT * FROM poster_gallery WHERE id = ?', [req.params.id]);
    if (!item) return error(res, 'Image सापडली नाही.', 404);
    return success(res, item);
  } catch (err) {
    return error(res, 'Image लोड करताना त्रुटी झाली.');
  }
};

// ── PATCH /api/gallery/:id/select ────────────────────────────
// Mark an image as selected (best image)
exports.selectImage = async (req, res) => {
  try {
    const { id } = req.params;
    const [[item]] = await pool.query('SELECT * FROM poster_gallery WHERE id = ?', [id]);
    if (!item) return error(res, 'Image सापडली नाही.', 404);

    // Unselect others for same festival+type
    await pool.query(
      'UPDATE poster_gallery SET is_selected = FALSE WHERE festival_slug = ? AND theme_type = ?',
      [item.festival_slug, item.theme_type]
    );
    await pool.query('UPDATE poster_gallery SET is_selected = TRUE WHERE id = ?', [id]);

    return success(res, { id, is_selected: true }, '✅ Image select केली.');
  } catch (err) {
    return error(res, 'Select करताना त्रुटी झाली.');
  }
};

// ── PATCH /api/gallery/:id/publish ───────────────────────────
exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const [[item]] = await pool.query('SELECT is_published FROM poster_gallery WHERE id = ?', [id]);
    if (!item) return error(res, 'Image सापडली नाही.', 404);

    const newVal = !item.is_published;
    await pool.query('UPDATE poster_gallery SET is_published = ? WHERE id = ?', [newVal, id]);
    return success(res, { is_published: newVal }, newVal ? 'Published' : 'Unpublished');
  } catch (err) {
    return error(res, 'Toggle करताना त्रुटी झाली.');
  }
};

// ── DELETE /api/gallery/:id ───────────────────────────────────
exports.deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const [[item]] = await pool.query('SELECT * FROM poster_gallery WHERE id = ?', [id]);
    if (!item) return error(res, 'Image सापडली नाही.', 404);

    // Delete physical files
    const imgPath   = path.join(UPLOADS_DIR, item.filename);
    const thumbPath = path.join(UPLOADS_DIR, 'thumbs', item.filename.replace('.webp', '-thumb.webp'));

    try { if (fs.existsSync(imgPath))   fs.unlinkSync(imgPath);   } catch (_) {}
    try { if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath); } catch (_) {}

    await pool.query('DELETE FROM poster_gallery WHERE id = ?', [id]);
    return success(res, {}, 'Image काढली.');
  } catch (err) {
    console.error('deleteGalleryItem error:', err);
    return error(res, 'Image काढताना त्रुटी झाली.');
  }
};

// ── DELETE /api/gallery/festival/:slug ───────────────────────
// Delete all images for a festival
exports.deleteByFestival = async (req, res) => {
  try {
    const { slug } = req.params;
    const [items] = await pool.query('SELECT * FROM poster_gallery WHERE festival_slug = ?', [slug]);

    for (const item of items) {
      const imgPath   = path.join(UPLOADS_DIR, item.filename);
      const thumbPath = path.join(UPLOADS_DIR, 'thumbs', item.filename.replace('.webp', '-thumb.webp'));
      try { if (fs.existsSync(imgPath))   fs.unlinkSync(imgPath);   } catch (_) {}
      try { if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath); } catch (_) {}
    }

    await pool.query('DELETE FROM poster_gallery WHERE festival_slug = ?', [slug]);
    return success(res, { deleted: items.length }, `${items.length} images काढल्या.`);
  } catch (err) {
    return error(res, 'Images काढताना त्रुटी झाली.');
  }
};

// ── GET /api/gallery/stats ────────────────────────────────────
exports.getGalleryStats = async (req, res) => {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        COUNT(*) as total,
        SUM(is_selected) as selected,
        SUM(is_published) as published,
        SUM(file_size) as total_size
      FROM poster_gallery
    `);

    const [byFestival] = await pool.query(`
      SELECT festival_name, festival_slug, COUNT(*) as count
      FROM poster_gallery
      GROUP BY festival_slug, festival_name
      ORDER BY count DESC
      LIMIT 10
    `);

    const [byType] = await pool.query(`
      SELECT theme_type, COUNT(*) as count
      FROM poster_gallery
      GROUP BY theme_type
      ORDER BY count DESC
    `);

    return success(res, { totals, byFestival, byType });
  } catch (err) {
    return error(res, 'Stats लोड करताना त्रुटी झाली.');
  }
};
