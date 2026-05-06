// src/controllers/themeController.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

// ── Resolve active theme based on mode & date ─────────────────
async function resolveTheme() {
  const [[settings]] = await pool.query('SELECT * FROM site_settings WHERE id = 1');
  if (!settings) return { theme: 'saffron-divine', mode: 'manual', festival_name: null };

  const { active_theme, theme_mode } = settings;

  if (theme_mode === 'manual') {
    return { theme: active_theme, mode: theme_mode, festival_name: null };
  }

  // festival or auto: check today's date
  const today = new Date().toISOString().split('T')[0];
  const [festivals] = await pool.query(
    `SELECT * FROM festival_themes
     WHERE is_active = TRUE AND start_date <= ? AND end_date >= ?
     ORDER BY start_date DESC LIMIT 1`,
    [today, today]
  );

  if (festivals.length > 0) {
    return {
      theme: festivals[0].theme_name,
      mode: theme_mode,
      festival_name: festivals[0].festival_name,
      festival_id: festivals[0].id,
    };
  }

  // No matching festival → fallback to manual theme
  return { theme: active_theme, mode: theme_mode, festival_name: null };
}

// ── GET /api/theme ────────────────────────────────────────────
exports.getTheme = async (req, res) => {
  try {
    const result = await resolveTheme();
    return success(res, result);
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
    if (fields.length === 0) return error(res, 'अपडेट करण्यासाठी काहीही नाही.', 400);

    await pool.query(
      `INSERT INTO site_settings (id, active_theme, theme_mode)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE ${fields.join(', ')}`,
      [active_theme || 'saffron-divine', theme_mode || 'auto', ...values]
    );

    const result = await resolveTheme();
    return success(res, result, 'थीम अपडेट केली.');
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
    const { id } = req.params;
    const { festival_name, theme_name, start_date, end_date, is_active } = req.body;
    await pool.query(
      `UPDATE festival_themes
       SET festival_name=?, theme_name=?, start_date=?, end_date=?, is_active=?
       WHERE id=?`,
      [festival_name, theme_name, start_date, end_date, is_active !== false, id]
    );
    return success(res, {}, 'सण थीम अपडेट केली.');
  } catch (err) {
    return error(res, 'सण थीम अपडेट करताना त्रुटी झाली.');
  }
};

// ── DELETE /api/theme/admin/festivals/:id ─────────────────────
exports.deleteFestivalTheme = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM festival_themes WHERE id=?', [id]);
    return success(res, {}, 'सण थीम काढली.');
  } catch (err) {
    return error(res, 'सण थीम काढताना त्रुटी झाली.');
  }
};
