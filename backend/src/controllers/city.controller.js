// src/controllers/city.controller.js
const pool   = require('../config/db');
const { success, error } = require('../utils/response.util');
const { CITIES, BY_SLUG, BY_STATE } = require('../data/citiesData');

// ── GET /api/cities — list all supported cities ───────────────
exports.list = async (req, res) => {
  try {
    return success(res, CITIES.map(({ slug, name_mr, name_en, state_mr, state_en, tagline, pujari_count, booking_count }) =>
      ({ slug, name_mr, name_en, state_mr, state_en, tagline, pujari_count, booking_count })
    ));
  } catch (err) {
    return error(res, 'शहरे मिळवता आली नाहीत.');
  }
};

// ── GET /api/cities/by-state — cities grouped by state ────────
exports.byState = async (req, res) => {
  try {
    return success(res, Object.values(BY_STATE).map(s => ({
      state_en: s.state_en,
      state_mr: s.state_mr,
      cities: s.cities.map(({ slug, name_mr, name_en, tagline, pujari_count, booking_count }) =>
        ({ slug, name_mr, name_en, tagline, pujari_count, booking_count })
      ),
    })));
  } catch (err) {
    return error(res, 'राज्यांची यादी मिळवता आली नाही.');
  }
};

// ── GET /api/cities/:slug — single city page data ─────────────
exports.getCity = async (req, res) => {
  try {
    const city = BY_SLUG[req.params.slug];
    if (!city) return error(res, 'शहर सापडले नाही.', 404);

    // Fetch available poojas (all active — same for every city)
    const [poojas] = await pool.query(
      `SELECT p.id, p.name_mr, p.name_en, p.slug, p.short_desc, p.price,
              p.duration_hrs, p.image_url, p.is_featured,
              c.name_mr AS category_name
       FROM poojas p
       JOIN pooja_categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE
       ORDER BY p.is_featured DESC, p.views DESC
       LIMIT 12`
    );

    // Count approved pujaris for this city/district
    const [[{ pujari_count_db }]] = await pool.query(
      `SELECT COUNT(*) AS pujari_count_db FROM pujari_profiles
       WHERE status = 'approved' AND (city LIKE ? OR district LIKE ?)`,
      [`%${city.name_en}%`, `%${city.district_mr}%`]
    );

    // Use whichever count is higher (DB count or static seed count)
    const pujari_count = Math.max(parseInt(pujari_count_db), city.pujari_count);

    return success(res, { city: { ...city, pujari_count }, poojas });
  } catch (err) {
    console.error('city.getCity error:', err);
    return error(res, 'शहर माहिती मिळवता आली नाही.');
  }
};
