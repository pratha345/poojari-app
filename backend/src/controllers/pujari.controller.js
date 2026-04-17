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

// ── Register as Pujari ────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { full_name, experience_yrs, city, district, address,
            languages, bio, specializations } = req.body;
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
        languages, photo_url, certificate_url, bio)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [user_id, full_name, experience_yrs || 0, city, district, address,
       JSON.stringify(languages || []), photo_url, certificate_url, bio]
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
    const p = rows[0];
    return success(res, { ...p, photo_url: resolveImageUrl(p.photo_url) });
  } catch (err) {
    return error(res, 'प्रोफाईल मिळवताना त्रुटी झाली.');
  }
};
