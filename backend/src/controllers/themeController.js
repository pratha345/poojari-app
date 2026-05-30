'use strict';
// src/controllers/themeController.js

const pool   = require('../config/db');
const path   = require('path');
const fs     = require('fs');
const multer = require('multer');
const { success, error } = require('../utils/response.util');
const { getFestivalsForYear }          = require('../services/hinduFestivals');
const { generateFestivalImage, generateMultipleImages } = require('../services/stabilityService');
const { generateWhatsAppCaption }      = require('../services/whatsappCaption.service');

// ── Resolve active theme based on mode & date ─────────────────
async function resolveTheme(tenantId = null) {
  // Tenant-aware: use tenant's own settings, fallback to id=1
  let settings;
  if (tenantId) {
    const [[row]] = await pool.query('SELECT * FROM site_settings WHERE tenant_id = ?', [tenantId]);
    settings = row;
  }
  if (!settings) {
    const [[row]] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    settings = row;
  }
  if (!settings) return { theme: 'saffron-divine', mode: 'manual', festival_name: null };

  const { active_theme, theme_mode } = settings;
  if (theme_mode === 'manual') {
    return { theme: active_theme, mode: theme_mode, festival_name: null };
  }

  const today = new Date().toISOString().split('T')[0];

  // Check DB festival_themes
  const [festivals] = await pool.query(
    `SELECT * FROM festival_themes
     WHERE is_active = TRUE AND start_date <= ? AND end_date >= ?
     ORDER BY start_date DESC LIMIT 1`,
    [today, today]
  );

  if (festivals.length > 0) {
    return {
      theme:              festivals[0].theme_name,
      mode:               theme_mode,
      festival_name:      festivals[0].festival_name,
      festival_id:        festivals[0].id,
      festival_image_url: festivals[0].image_url || null,
    };
  }

  // DB has no match — fallback: check hinduFestivals.js for today
  try {
    const { getFestivalsForYear } = require('../services/hinduFestivals');
    const year = new Date().getFullYear();
    const jsFestivals = getFestivalsForYear(year);
    const match = jsFestivals.find(f => f.is_active !== false && f.start_date <= today && f.end_date >= today);
    if (match) {
      return {
        theme:              match.theme_name,
        mode:               theme_mode,
        festival_name:      match.festival_name,
        festival_image_url: null,
      };
    }
  } catch {}

  return { theme: active_theme, mode: theme_mode, festival_name: null };
}

// ── GET /api/theme ────────────────────────────────────────────
exports.getTheme = async (req, res) => {
  try {
    // Tenant via middleware (X-Tenant-ID header) or ?tenant_slug query param
    let tenantId = req.tenantId || null;
    if (!tenantId && req.query.tenant_slug) {
      const [[t]] = await pool.query(
        'SELECT id FROM tenants WHERE slug = ? AND is_active = TRUE', [req.query.tenant_slug]
      );
      if (t) tenantId = t.id;
    }
    return success(res, await resolveTheme(tenantId));
  } catch (err) {
    return error(res, 'थीम मिळवताना त्रुटी झाली.');
  }
};

// ── POST /api/theme/admin ─────────────────────────────────────
exports.updateTheme = async (req, res) => {
  try {
    const { active_theme, theme_mode } = req.body;
    const validModes = ['manual', 'festival', 'auto'];
    if (theme_mode && !validModes.includes(theme_mode)) {
      return error(res, 'अवैध थीम मोड.', 400);
    }
    const fields = [];
    const values = [];
    if (active_theme) { fields.push('active_theme = ?'); values.push(active_theme); }
    if (theme_mode)   { fields.push('theme_mode = ?');   values.push(theme_mode);   }
    if (!fields.length) return error(res, 'अपडेट करण्यासाठी काहीही नाही.', 400);

    const tenantId = req.user?.tenant_id || 1;
    await pool.query(
      `INSERT INTO site_settings (tenant_id, active_theme, theme_mode)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE ${fields.join(', ')}`,
      [tenantId, active_theme || 'saffron-divine', theme_mode || 'auto', ...values]
    );
    return success(res, await resolveTheme(tenantId), 'थीम अपडेट केली.');
  } catch (err) {
    return error(res, 'थीम अपडेट करताना त्रुटी झाली.');
  }
};

// ── GET /api/theme/admin/festivals ───────────────────────────
exports.getFestivalThemes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM festival_themes ORDER BY start_date ASC');
    const [[settings]] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    return success(res, { festivals: rows, settings });
  } catch (err) {
    return error(res, 'डेटा मिळवताना त्रुटी झाली.');
  }
};

// ── POST /api/theme/admin/festivals ──────────────────────────
exports.addFestivalTheme = async (req, res) => {
  try {
    const { festival_name, theme_name, start_date, end_date, is_active } = req.body;
    if (!festival_name || !theme_name || !start_date || !end_date) {
      return error(res, 'सर्व आवश्यक फील्ड भरा.', 400);
    }
    const [result] = await pool.query(
      'INSERT INTO festival_themes (festival_name, theme_name, start_date, end_date, is_active) VALUES (?, ?, ?, ?, ?)',
      [festival_name, theme_name, start_date, end_date, is_active !== false]
    );
    return success(res, { id: result.insertId }, 'सण थीम जोडली.');
  } catch (err) {
    return error(res, 'सण थीम जोडताना त्रुटी झाली.');
  }
};

// ── PUT /api/theme/admin/festivals/:id ───────────────────────
exports.updateFestivalTheme = async (req, res) => {
  try {
    const { festival_name, theme_name, start_date, end_date, is_active } = req.body;
    await pool.query(
      `UPDATE festival_themes SET festival_name=?, theme_name=?, start_date=?, end_date=?, is_active=? WHERE id=?`,
      [festival_name, theme_name, start_date, end_date, is_active !== false, req.params.id]
    );
    return success(res, {}, 'सण थीम अपडेट केली.');
  } catch (err) {
    return error(res, 'सण थीम अपडेट करताना त्रुटी झाली.');
  }
};

// ── DELETE /api/theme/admin/festivals/:id ─────────────────────
exports.deleteFestivalTheme = async (req, res) => {
  try {
    await pool.query('DELETE FROM festival_themes WHERE id=?', [req.params.id]);
    return success(res, {}, 'सण थीम काढली.');
  } catch (err) {
    return error(res, 'सण थीम काढताना त्रुटी झाली.');
  }
};

// ── Helper: save image to gallery ─────────────────────────────
async function saveToGallery(festivalId, result) {
  try {
    const caption = generateWhatsAppCaption(result.festivalName);
    const [ins] = await pool.query(
      `INSERT INTO poster_gallery
         (festival_id, festival_name, festival_slug, image_url, thumb_url, filename,
          theme_type, style, variant, prompt, file_size, whatsapp_caption, colors, mood)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        festivalId || null,
        result.festivalName,
        result.slug,
        result.image_url,
        result.thumb_url  || result.image_url,
        result.filename,
        result.type,
        result.style      || 'realistic',
        result.variant    || 1,
        result.prompt?.substring(0, 2000),
        result.size       || 0,
        caption,
        JSON.stringify(result.colors || []),
        result.mood       || '',
      ]
    );
    return ins.insertId;
  } catch (e) {
    console.warn('⚠️ Gallery save failed (table may not exist):', e.message);
    return null;
  }
}

// ── POST /api/theme/admin/festivals/:id/generate ─────────────
// Single image generation with socket.io progress
exports.generateFestivalThemeImage = async (req, res) => {
  try {
    const { id }    = req.params;
    const { type = 'poster', style = 'realistic', variant = 1 } = req.body;

    const [[festival]] = await pool.query('SELECT * FROM festival_themes WHERE id = ?', [id]);
    if (!festival) return error(res, 'सण सापडला नाही.', 404);

    // Get socket.io instance for real-time progress
    const io = req.app.get('io');
    const emit = (msg) => {
      if (io) io.emit('image-progress', { festivalId: id, message: msg, type });
    };

    emit(`${festival.festival_name} साठी image generate होत आहे...`);

    const result = await generateFestivalImage(
      festival.festival_name, type, style, parseInt(variant), emit
    );

    // Update festival_themes with latest image
    await pool.query(
      'UPDATE festival_themes SET image_url = ?, thumb_url = ? WHERE id = ?',
      [result.image_url, result.thumb_url || result.image_url, id]
    );

    // Save to gallery
    const galleryId = await saveToGallery(id, result);

    const caption = generateWhatsAppCaption(festival.festival_name);

    if (io) io.emit('image-complete', {
      festivalId: id,
      image_url:  result.image_url,
      thumb_url:  result.thumb_url,
      galleryId,
    });

    return success(res, { ...result, galleryId, whatsapp_caption: caption },
      `✅ ${festival.festival_name} ची image तयार झाली!`);
  } catch (err) {
    const io = req.app.get('io');
    if (io) io.emit('image-error', { festivalId: req.params.id, message: err.message });
    console.error('generateFestivalThemeImage error:', err.message);
    return error(res, err.message || 'AI image तयार करताना त्रुटी झाली.');
  }
};

// ── POST /api/theme/admin/festivals/:id/generate-multi ───────
// Generate 3 variations of poster/banner/whatsapp
exports.generateMultipleThemeImages = async (req, res) => {
  try {
    const { id }   = req.params;
    const { type = 'poster', style = 'realistic', count = 3 } = req.body;

    const [[festival]] = await pool.query('SELECT * FROM festival_themes WHERE id = ?', [id]);
    if (!festival) return error(res, 'सण सापडला नाही.', 404);

    const io   = req.app.get('io');
    const emit = (msg) => {
      if (io) io.emit('image-progress', { festivalId: id, message: msg, type });
    };

    emit(`${festival.festival_name} साठी ${count} images generate होत आहेत...`);

    const { results, errors } = await generateMultipleImages(
      festival.festival_name, type, style, parseInt(count), emit
    );

    // Save all to gallery and update festival image_url with first result
    const galleryIds = [];
    for (const result of results) {
      const gid = await saveToGallery(id, result);
      if (gid) galleryIds.push(gid);
    }

    if (results.length > 0) {
      await pool.query(
        'UPDATE festival_themes SET image_url = ?, thumb_url = ? WHERE id = ?',
        [results[0].image_url, results[0].thumb_url || results[0].image_url, id]
      );
    }

    if (io) io.emit('multi-generate-complete', { festivalId: id, count: results.length, galleryIds });

    return success(res, {
      results,
      errors,
      galleryIds,
      generated: results.length,
      failed:    errors.length,
    }, `✅ ${results.length}/${count} images तयार झाल्या!`);
  } catch (err) {
    const io = req.app.get('io');
    if (io) io.emit('image-error', { festivalId: req.params.id, message: err.message });
    console.error('generateMultipleThemeImages error:', err.message);
    return error(res, err.message || 'Multi image generation मध्ये त्रुटी झाली.');
  }
};

// ── POST /api/theme/admin/festivals/:id/upload-image ─────────
const _festivalUploadDir = path.join(__dirname, '../../uploads/festivals');
const _festivalStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(_festivalUploadDir, { recursive: true });
    cb(null, _festivalUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `festival-${req.params.id}-${Date.now()}${ext}`);
  },
});
exports.festivalImageUpload = multer({
  storage: _festivalStorage,
  fileFilter: (_req, file, cb) => {
    /image\/(jpeg|jpg|png|gif|webp)/.test(file.mimetype)
      ? cb(null, true)
      : cb(new Error('फक्त JPG, PNG, GIF, WEBP इमेज परवानगी आहे.'), false);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('image');

exports.uploadFestivalImage = async (req, res) => {
  try {
    if (!req.file) return error(res, 'इमेज फाइल आवश्यक आहे.', 400);
    const { id } = req.params;
    const image_url = `/uploads/festivals/${req.file.filename}`;
    await pool.query(
      'UPDATE festival_themes SET image_url = ?, thumb_url = ? WHERE id = ?',
      [image_url, image_url, id]
    );
    return success(res, { image_url, thumb_url: image_url }, 'इमेज यशस्वीरित्या अपलोड केली.');
  } catch (err) {
    console.error('uploadFestivalImage error:', err);
    return error(res, 'इमेज अपलोड करताना त्रुटी झाली.');
  }
};

// ── POST /api/theme/admin/festivals/:id/whatsapp-caption ──────
exports.getWhatsAppCaption = async (req, res) => {
  try {
    const [[festival]] = await pool.query('SELECT * FROM festival_themes WHERE id = ?', [req.params.id]);
    if (!festival) return error(res, 'सण सापडला नाही.', 404);
    const { occasion = 'morning' } = req.body;
    const caption = generateWhatsAppCaption(festival.festival_name, occasion);
    return success(res, { caption, festival_name: festival.festival_name, occasion });
  } catch (err) {
    return error(res, 'Caption मिळवताना त्रुटी झाली.');
  }
};

// ── POST /api/theme/admin/festivals/auto-update ───────────────
exports.autoUpdateFestivals = async (req, res) => {
  try {
    const year      = parseInt(req.query.year) || new Date().getFullYear();
    const festivals = getFestivalsForYear(year);
    if (!festivals.length) return error(res, `${year} वर्षाचे सण उपलब्ध नाहीत.`, 404);

    // Delete only that specific year's festivals (not all years)
    await pool.query('DELETE FROM festival_themes WHERE YEAR(start_date) = ?', [year]);

    const values = festivals.map(f => [
      f.festival_name, f.theme_name, f.start_date, f.end_date, f.is_active !== false,
    ]);
    await pool.query(
      'INSERT INTO festival_themes (festival_name, theme_name, start_date, end_date, is_active) VALUES ?',
      [values]
    );

    const [rows] = await pool.query('SELECT * FROM festival_themes ORDER BY start_date ASC');
    return success(res, { festivals: rows, year, count: festivals.length },
      `✅ ${year} वर्षाचे ${festivals.length} सण यशस्वीरित्या अपडेट केले.`);
  } catch (err) {
    console.error('autoUpdateFestivals error:', err);
    return error(res, 'सण अपडेट करताना त्रुटी झाली.');
  }
};
