// src/controllers/pujari.controller.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

const resolveImageUrl = (url) => {
  if (!url) return null;
  try {
    return new URL(url).pathname;
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
};

// Silently geocode a city to lat/lng via Nominatim (non-blocking, best-effort)
async function geocodeCity(city, district) {
  try {
    const q = [city, district, 'Maharashtra', 'India'].filter(Boolean).join(', ');
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`,
      { headers: { 'User-Agent': 'PojjariApp/1.0 contact@pojjari.com' } }
    );
    const data = await r.json();
    if (data?.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return null;
}

// ── Startup: geocode all pujaris that don't have lat/lng yet ──
// Rate-limited to 1 req/sec to respect Nominatim's ToS
exports.geocodeAllPujaris = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT id, city, district FROM pujari_profiles
       WHERE (lat IS NULL OR lng IS NULL) AND city IS NOT NULL AND city != ''
       ORDER BY id`
    );
    if (!rows.length) return;
    console.log(`🗺️  Geocoding ${rows.length} pujari(s) in background...`);
    for (const p of rows) {
      const coords = await geocodeCity(p.city, p.district);
      if (coords) {
        await pool.query('UPDATE pujari_profiles SET lat=?, lng=? WHERE id=?',
          [coords.lat, coords.lng, p.id]);
        console.log(`  ✅ ${p.city} → ${coords.lat},${coords.lng}`);
      }
      await new Promise(r => setTimeout(r, 1200)); // respect Nominatim 1 req/sec limit
    }
    console.log('🗺️  Pujari geocoding complete.');
  } catch (err) {
    console.error('Geocoding error:', err.message);
  }
};

// ── Register as Pujari ────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { full_name, experience_yrs, city, district, address,
            languages, bio, brahmin_tradition, specializations } = req.body;
    const user_id = req.user.id;

    // Check if already registered
    const [exists] = await pool.query(
      'SELECT id FROM pujari_profiles WHERE user_id = ?', [user_id]
    );
    if (exists.length)
      return error(res, 'आपण आधीच पुजारी म्हणून नोंदणी केली आहे.', 400);

    const photo_url = req.files?.photo?.[0]
      ? `/${req.files.photo[0].path.replace(/\\/g, '/')}` : null;
    const certificate_url = req.files?.certificate?.[0]
      ? `/${req.files.certificate[0].path.replace(/\\/g, '/')}` : null;

    const [result] = await pool.query(
      `INSERT INTO pujari_profiles
       (user_id, full_name, experience_yrs, city, district, address,
        languages, photo_url, certificate_url, bio, brahmin_tradition)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [user_id, full_name, experience_yrs || 0, city, district, address,
       JSON.stringify(languages || []), photo_url, certificate_url, bio,
       brahmin_tradition || null]
    );

    const pujari_id = result.insertId;

    // Update user role to pujari
    await pool.query('UPDATE users SET role = "pujari" WHERE id = ?', [user_id]);

    // Save specializations
    if (specializations?.length) {
      const specRows = specializations.map(cat_id => [pujari_id, cat_id]);
      await pool.query(
        'INSERT IGNORE INTO pujari_specializations (pujari_id, category_id) VALUES ?',
        [specRows]
      );
    }

    // Geocode city to lat/lng (non-blocking)
    geocodeCity(city, district).then(coords => {
      if (coords) pool.query('UPDATE pujari_profiles SET lat=?, lng=? WHERE id=?',
        [coords.lat, coords.lng, pujari_id]).catch(() => {});
    });

    return success(res, { pujari_id }, 'पुजारी नोंदणी यशस्वी! मंजुरीसाठी प्रतीक्षा करा.', 201);
  } catch (err) {
    console.error(err);
    return error(res, 'नोंदणी करताना त्रुटी झाली.');
  }
};

// ── Get My Profile ────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pp.*, GROUP_CONCAT(pc.name_mr) AS specialization_names
       FROM pujari_profiles pp
       LEFT JOIN pujari_specializations ps ON pp.id = ps.pujari_id
       LEFT JOIN pooja_categories pc ON ps.category_id = pc.id
       WHERE pp.user_id = ?
       GROUP BY pp.id`,
      [req.user.id]
    );
    if (!rows.length) return error(res, 'प्रोफाईल सापडली नाही.', 404);
    const p = rows[0];
    return success(res, { ...p, photo_url: resolveImageUrl(p.photo_url), certificate_url: resolveImageUrl(p.certificate_url) });
  } catch (err) {
    return error(res, 'प्रोफाईल मिळवताना त्रुटी झाली.');
  }
};

// ── Update Profile ────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { full_name, experience_yrs, city, district, address, languages, bio } = req.body;
    const photo_url = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : undefined;

    const updateData = { full_name, experience_yrs, city, district, address,
      languages: JSON.stringify(languages || []), bio };
    if (photo_url) updateData.photo_url = photo_url;

    await pool.query(
      'UPDATE pujari_profiles SET ? WHERE user_id = ?',
      [updateData, req.user.id]
    );

    // Re-geocode if city updated (non-blocking)
    if (city) {
      geocodeCity(city, district).then(coords => {
        if (coords) pool.query('UPDATE pujari_profiles SET lat=?, lng=? WHERE user_id=?',
          [coords.lat, coords.lng, req.user.id]).catch(() => {});
      });
    }

    return success(res, {}, 'प्रोफाईल अद्यतनित केली.');
  } catch (err) {
    return error(res, 'प्रोफाईल अद्यतन करताना त्रुटी झाली.');
  }
};

// ── Set Availability ──────────────────────────────────────────
exports.setAvailability = async (req, res) => {
  try {
    const { dates } = req.body; // [{ date: 'YYYY-MM-DD', is_available: true/false }]

    const [pujari] = await pool.query(
      'SELECT id FROM pujari_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!pujari.length) return error(res, 'प्रोफाईल सापडली नाही.', 404);

    const pujari_id = pujari[0].id;
    const rows = dates.map(d => [pujari_id, d.date, d.is_available]);
    await pool.query(
      `INSERT INTO pujari_availability (pujari_id, avail_date, is_available) VALUES ?
       ON DUPLICATE KEY UPDATE is_available=VALUES(is_available)`,
      [rows]
    );
    return success(res, {}, 'उपलब्धता सेट केली.');
  } catch (err) {
    return error(res, 'उपलब्धता सेट करताना त्रुटी झाली.');
  }
};

// ── Get My Bookings (Pujari's view) ──────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const [pujari] = await pool.query(
      'SELECT id FROM pujari_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!pujari.length) return error(res, 'प्रोफाईल सापडली नाही.', 404);

    let where = 'b.pujari_id = ?';
    const params = [pujari[0].id];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const [bookings] = await pool.query(
      `SELECT b.*, p.name_mr AS pooja_name, u.name AS user_name, u.phone AS user_phone
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       JOIN users u ON b.user_id = u.id
       WHERE ${where}
       ORDER BY b.booking_date DESC`,
      params
    );
    return success(res, bookings);
  } catch (err) {
    return error(res, 'बुकिंग मिळवताना त्रुटी झाली.');
  }
};

// ── Accept / Reject Booking ───────────────────────────────────
exports.respondToBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'confirm' | 'cancel'

    const [pujari] = await pool.query(
      'SELECT id FROM pujari_profiles WHERE user_id = ?', [req.user.id]
    );
    if (!pujari.length) return error(res, 'प्रोफाईल सापडली नाही.', 404);

    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND pujari_id = ?',
      [id, pujari[0].id]
    );
    if (!booking.length) return error(res, 'बुकिंग सापडली नाही.', 404);

    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    await pool.query(
      'UPDATE bookings SET status=?, cancelled_by=?, cancel_reason=? WHERE id=?',
      [newStatus, action === 'cancel' ? 'pujari' : null, reason || null, id]
    );
    return success(res, {}, `बुकिंग ${action === 'confirm' ? 'स्वीकारली' : 'नाकारली'}.`);
  } catch (err) {
    return error(res, 'बुकिंगला प्रतिसाद देताना त्रुटी झाली.');
  }
};

// ── Get My Pooja Services ─────────────────────────────────────
exports.getMyPoojaServices = async (req, res) => {
  try {
    const [pujari] = await pool.query('SELECT id FROM pujari_profiles WHERE user_id=?', [req.user.id]);
    if (!pujari.length) return error(res, 'प्रोफाईल सापडली नाही.', 404);

    const [rows] = await pool.query(
      `SELECT p.id, p.name_mr, p.price AS default_price, p.duration_hrs,
              pps.id AS service_id, pps.custom_price,
              IF(pps.id IS NOT NULL, TRUE, FALSE) AS is_offered
       FROM poojas p
       LEFT JOIN pujari_pooja_services pps ON pps.pooja_id=p.id AND pps.pujari_id=?
       WHERE p.is_active=TRUE
       ORDER BY p.name_mr`,
      [pujari[0].id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'सेवा यादी मिळवताना त्रुटी झाली.');
  }
};

// ── Save My Pooja Services ────────────────────────────────────
exports.saveMyPoojaServices = async (req, res) => {
  try {
    const { services } = req.body; // [{ pooja_id, custom_price }]
    const [pujari] = await pool.query('SELECT id FROM pujari_profiles WHERE user_id=?', [req.user.id]);
    if (!pujari.length) return error(res, 'प्रोफाईल सापडली नाही.', 404);

    const pujari_id = pujari[0].id;
    await pool.query('DELETE FROM pujari_pooja_services WHERE pujari_id=?', [pujari_id]);

    if (services?.length) {
      const rows = services.map(s => [pujari_id, s.pooja_id, s.custom_price || null]);
      await pool.query(
        'INSERT INTO pujari_pooja_services (pujari_id, pooja_id, custom_price) VALUES ?',
        [rows]
      );
    }
    return success(res, {}, 'सेवा यादी जतन केली.');
  } catch (err) {
    return error(res, 'सेवा जतन करताना त्रुटी झाली.');
  }
};

// ── Get Nearby Pujaris ────────────────────────────────────────
exports.getNearbyPujaris = async (req, res) => {
  try {
    const { city, district, lat, lng, limit = 6 } = req.query;
    const lim = parseInt(limit, 10);

    // Tenant isolation — subdomain tenant sees only their pujaris
    const tenantFilter = (req.tenantId && req.tenantId > 1)
      ? `AND pp.tenant_id = ${parseInt(req.tenantId)}`
      : '';

    const PUJARI_SELECT = `
      SELECT pp.id, pp.full_name, pp.city, pp.district,
             pp.photo_url, pp.avg_rating, pp.total_reviews,
             pp.experience_yrs, pp.is_available, pp.lat, pp.lng,
             GROUP_CONCAT(DISTINCT pc.name_mr SEPARATOR ', ') AS specializations`;
    const PUJARI_JOINS = `
      FROM pujari_profiles pp
      LEFT JOIN pujari_specializations ps ON pp.id = ps.pujari_id
      LEFT JOIN pooja_categories pc ON ps.category_id = pc.id`;
    const mapRow = p => ({ ...p, photo_url: resolveImageUrl(p.photo_url) });

    // ── GPS / coordinate-based search (Haversine) ─────────────
    if (lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);

      const distExpr = `ROUND(6371 * ACOS(LEAST(1.0,
          COS(RADIANS(?)) * COS(RADIANS(pp.lat)) * COS(RADIANS(pp.lng) - RADIANS(?))
        + SIN(RADIANS(?)) * SIN(RADIANS(pp.lat))
      )), 1)`;

      for (const km of [50, 150]) {
        const [rows] = await pool.query(
          `${PUJARI_SELECT}, ${distExpr} AS distance_km
           ${PUJARI_JOINS}
           WHERE pp.status = 'approved' AND pp.lat IS NOT NULL AND pp.lng IS NOT NULL ${tenantFilter}
           GROUP BY pp.id
           HAVING distance_km <= ?
           ORDER BY distance_km ASC
           LIMIT ?`,
          [uLat, uLng, uLat, km, lim]
        );
        if (rows.length > 0) return res.json({ success: true, data: rows.map(mapRow) });
      }

      // No pujaris with coordinates at all → fall through to city search
    }

    // ── City/district text search — tiered ────────────────────
    if (city || district) {
      // Tier 1: city match (most specific)
      if (city) {
        const [rows] = await pool.query(
          `${PUJARI_SELECT}
           ${PUJARI_JOINS}
           WHERE pp.status = 'approved' AND pp.city LIKE ? ${tenantFilter}
           GROUP BY pp.id
           ORDER BY pp.avg_rating DESC, pp.total_reviews DESC
           LIMIT ?`,
          [`%${city}%`, lim]
        );
        if (rows.length > 0) return res.json({ success: true, data: rows.map(mapRow) });
      }

      // Tier 2: district match (same jilla — broader but still local)
      if (district) {
        const [rows] = await pool.query(
          `${PUJARI_SELECT}
           ${PUJARI_JOINS}
           WHERE pp.status = 'approved' AND pp.district LIKE ? ${tenantFilter}
           GROUP BY pp.id
           ORDER BY pp.avg_rating DESC, pp.total_reviews DESC
           LIMIT ?`,
          [`%${district}%`, lim]
        );
        if (rows.length > 0) return res.json({ success: true, data: rows.map(mapRow) });
      }
    }

    // ── No local pujaris found ─────────────────────────────────
    const [anyPujaris] = await pool.query(
      `${PUJARI_SELECT}
       ${PUJARI_JOINS}
       WHERE pp.status = 'approved' ${tenantFilter}
       GROUP BY pp.id
       ORDER BY pp.avg_rating DESC, pp.total_reviews DESC
       LIMIT ?`,
      [lim]
    );
    return res.json({ success: true, data: anyPujaris.map(mapRow), fallback: true });
  } catch (err) {
    return res.json({ success: true, data: [] });
  }
};

// ── Get Pujari Public Profile ─────────────────────────────────
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT pp.id, pp.full_name, pp.experience_yrs, pp.city, pp.district,
              pp.languages, pp.photo_url, pp.bio, pp.avg_rating, pp.total_reviews,
              pp.total_bookings, pp.is_available,
              GROUP_CONCAT(pc.name_mr SEPARATOR ', ') AS specializations
       FROM pujari_profiles pp
       LEFT JOIN pujari_specializations ps ON pp.id = ps.pujari_id
       LEFT JOIN pooja_categories pc ON ps.category_id = pc.id
       WHERE pp.id = ? AND pp.status = 'approved'
       GROUP BY pp.id`,
      [id]
    );
    if (!rows.length) return error(res, 'पुजारी सापडला नाही.', 404);

    // Last 5 completed pujas
    const [pastPujas] = await pool.query(
      `SELECT p.name_mr AS pooja_name, b.booking_date
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       WHERE b.pujari_id = ? AND b.status = 'completed'
       ORDER BY b.booking_date DESC LIMIT 5`,
      [id]
    );

    const p = rows[0];
    return success(res, { ...p, photo_url: resolveImageUrl(p.photo_url), past_pujas: pastPujas });
  } catch (err) {
    return error(res, 'प्रोफाईल मिळवताना त्रुटी झाली.');
  }
};

// ── Get Public Reviews for a Pujari ──────────────────────────
// ── Top Reviews (Homepage Testimonials) ──────────────────────
exports.getTopReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.name        AS user_name,
              p.name_mr     AS pooja_name,
              pp.full_name  AS pujari_name,
              pp.city       AS pujari_city,
              pp.id         AS pujari_id
       FROM reviews r
       JOIN users u            ON r.user_id   = u.id
       JOIN poojas p           ON r.pooja_id  = p.id
       JOIN pujari_profiles pp ON r.pujari_id = pp.id
       WHERE r.is_approved = 1
         AND r.comment IS NOT NULL
         AND CHAR_LENGTH(r.comment) >= 20
       ORDER BY r.rating DESC, r.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return success(res, reviews);
  } catch (err) {
    return error(res, 'अभिप्राय मिळवताना त्रुटी झाली.');
  }
};

// ── Public Reviews for one Pujari ────────────────────────────
exports.getPublicReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const [reviews] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at,
              u.name AS user_name,
              p.name_mr AS pooja_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN poojas p ON r.pooja_id = p.id
       WHERE r.pujari_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC`,
      [id]
    );
    return success(res, reviews);
  } catch (err) {
    return error(res, 'अभिप्राय मिळवताना त्रुटी झाली.');
  }
};
