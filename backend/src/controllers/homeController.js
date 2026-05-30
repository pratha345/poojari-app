// src/controllers/homeController.js
'use strict';

const pool = require('../config/db');
const fs   = require('fs');
const path = require('path');
const { success, error }               = require('../utils/response.util');
const { getCache, setCache, delCache } = require('../utils/redis');

const HOME_KEY = 'home:data';
const HOME_TTL = 10 * 60; // 10 minutes

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

// Remove old file from disk safely
const deleteFile = (relPath) => {
  if (!relPath) return;
  try {
    const abs = path.join(__dirname, '../../', relPath);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch (_) {}
};

// ─────────────────────────────────────────────────────────────────
// GET /api/home  — public
// ─────────────────────────────────────────────────────────────────
exports.getHome = async (req, res) => {
  try {
    const cached = await getCache(HOME_KEY);
    if (cached) return success(res, cached);

    const [[content]] = await pool.query(
      'SELECT * FROM home_content ORDER BY id DESC LIMIT 1'
    );

    const [sliders] = await pool.query(
      'SELECT * FROM home_slider WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
    );

    const data = { content: content || null, sliders };
    await setCache(HOME_KEY, data, HOME_TTL);
    return success(res, data);
  } catch (err) {
    console.error('❌ getHome:', err.message);
    return error(res, 'होमपेज माहिती मिळवण्यात त्रुटी झाली.');
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/home  — admin: upsert hero content
// ─────────────────────────────────────────────────────────────────
exports.upsertHome = async (req, res) => {
  try {
    const {
      title           = '',
      subtitle        = '',
      description     = '',
      button_text_1   = '',
      button_text_2   = '',
      clear_bg_image  = '0',
      stat_bookings   = '५,०००+',
      stat_pujaris    = '५००+',
      stat_cities     = '३५+',
      stat_years      = '५+',
    } = req.body;

    // req.files: { hero_image: [...], bg_image: [...] }
    const files      = req.files || {};
    const newHero    = files.hero_image?.[0] ? `/uploads/${files.hero_image[0].filename}` : null;
    const newBgImage = files.bg_image?.[0]   ? `/uploads/${files.bg_image[0].filename}`  : null;

    const [[existing]] = await pool.query(
      'SELECT id, hero_image, bg_image FROM home_content ORDER BY id DESC LIMIT 1'
    );

    if (existing) {
      if (newHero    && existing.hero_image) deleteFile(existing.hero_image);
      if (newBgImage && existing.bg_image)   deleteFile(existing.bg_image);

      const shouldClearBg = clear_bg_image === '1';
      if (shouldClearBg && existing.bg_image) deleteFile(existing.bg_image);

      if (shouldClearBg) {
        await pool.query(
          `UPDATE home_content
           SET title=?, subtitle=?, description=?, button_text_1=?, button_text_2=?,
               stat_bookings=?, stat_pujaris=?, stat_cities=?, stat_years=?,
               hero_image = COALESCE(?, hero_image), bg_image = NULL, updated_at = NOW()
           WHERE id = ?`,
          [title, subtitle, description, button_text_1, button_text_2,
           stat_bookings, stat_pujaris, stat_cities, stat_years,
           newHero, existing.id]
        );
      } else {
        await pool.query(
          `UPDATE home_content
           SET title=?, subtitle=?, description=?, button_text_1=?, button_text_2=?,
               stat_bookings=?, stat_pujaris=?, stat_cities=?, stat_years=?,
               hero_image = COALESCE(?, hero_image), bg_image = COALESCE(?, bg_image), updated_at = NOW()
           WHERE id = ?`,
          [title, subtitle, description, button_text_1, button_text_2,
           stat_bookings, stat_pujaris, stat_cities, stat_years,
           newHero, newBgImage, existing.id]
        );
      }
    } else {
      await pool.query(
        `INSERT INTO home_content
           (title, subtitle, description, button_text_1, button_text_2,
            stat_bookings, stat_pujaris, stat_cities, stat_years,
            hero_image, bg_image)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, subtitle, description, button_text_1, button_text_2,
         stat_bookings, stat_pujaris, stat_cities, stat_years,
         newHero, newBgImage]
      );
    }

    await delCache(HOME_KEY);
    return success(res, null, 'होमपेज सामग्री यशस्वीरित्या जतन केली. 🙏');
  } catch (err) {
    console.error('❌ upsertHome:', err.message);
    return error(res, 'होमपेज सामग्री जतन करण्यात त्रुटी झाली.');
  }
};

// ─────────────────────────────────────────────────────────────────
// POST /api/home/slider  — admin: add slider image
// ─────────────────────────────────────────────────────────────────
exports.addSlider = async (req, res) => {
  try {
    if (!req.file) return error(res, 'स्लाइडर इमेज आवश्यक आहे.', 400);

    const { title = '', description = '', sort_order = 0 } = req.body;
    const image_url = `/uploads/${req.file.filename}`;

    const [result] = await pool.query(
      `INSERT INTO home_slider (image_url, title, description, sort_order)
       VALUES (?, ?, ?, ?)`,
      [image_url, title, description, Number(sort_order)]
    );

    await delCache(HOME_KEY);
    return success(
      res,
      { id: result.insertId, image_url, title, description, is_active: 1 },
      'स्लाइडर इमेज यशस्वीरित्या जोडली. 🎉'
    );
  } catch (err) {
    console.error('❌ addSlider:', err.message);
    return error(res, 'स्लाइडर इमेज जोडण्यात त्रुटी झाली.');
  }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /api/home/slider/:id  — admin
// ─────────────────────────────────────────────────────────────────
exports.deleteSlider = async (req, res) => {
  try {
    const { id } = req.params;

    const [[slider]] = await pool.query(
      'SELECT image_url FROM home_slider WHERE id = ?',
      [id]
    );
    if (!slider) return error(res, 'स्लाइडर सापडला नाही.', 404);

    await pool.query('DELETE FROM home_slider WHERE id = ?', [id]);
    deleteFile(slider.image_url);
    await delCache(HOME_KEY);

    return success(res, null, 'स्लाइडर इमेज काढली.');
  } catch (err) {
    console.error('❌ deleteSlider:', err.message);
    return error(res, 'स्लाइडर इमेज काढण्यात त्रुटी झाली.');
  }
};

// ─────────────────────────────────────────────────────────────────
// PATCH /api/home/slider/:id/toggle — admin: toggle active
// ─────────────────────────────────────────────────────────────────
exports.toggleSlider = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE home_slider SET is_active = NOT is_active WHERE id = ?',
      [id]
    );
    await delCache(HOME_KEY);
    return success(res, null, 'स्लाइडर स्थिती बदलली.');
  } catch (err) {
    console.error('❌ toggleSlider:', err.message);
    return error(res, 'स्लाइडर अपडेट करण्यात त्रुटी झाली.');
  }
};
