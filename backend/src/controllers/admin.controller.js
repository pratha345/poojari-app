// src/controllers/admin.controller.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

// ── Dashboard Stats ───────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [[users]]    = await pool.query('SELECT COUNT(*) AS total FROM users WHERE role="user"');
    const [[pujaris]]  = await pool.query('SELECT COUNT(*) AS total FROM pujari_profiles WHERE status="approved"');
    const [[pending]]  = await pool.query('SELECT COUNT(*) AS total FROM pujari_profiles WHERE status="pending"');
    const [[bookings]] = await pool.query('SELECT COUNT(*) AS total FROM bookings');
    const [[revenue]]  = await pool.query('SELECT SUM(total_amount) AS total FROM bookings WHERE payment_status="paid"');
    return success(res, {
      users: users.total, pujaris: pujaris.total,
      pending_pujaris: pending.total, bookings: bookings.total,
      revenue: revenue.total || 0,
    });
  } catch (err) {
    return error(res, 'आकडेवारी मिळवताना त्रुटी झाली.');
  }
};

// ── Pending Pujari Registrations ──────────────────────────────
exports.getPendingPujaris = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pp.*, u.phone, u.email
       FROM pujari_profiles pp JOIN users u ON pp.user_id = u.id
       WHERE pp.status = 'pending'
       ORDER BY pp.created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'डेटा मिळवताना त्रुटी झाली.');
  }
};

// ── Approve / Reject Pujari ───────────────────────────────────
exports.respondToPujari = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject'
    const status = action === 'approve' ? 'approved' : 'rejected';

    await pool.query(
      'UPDATE pujari_profiles SET status=?, rejection_reason=? WHERE id=?',
      [status, reason || null, id]
    );

    if (action === 'approve') {
      const [pp] = await pool.query('SELECT user_id FROM pujari_profiles WHERE id=?', [id]);
      await pool.query('UPDATE users SET role="pujari" WHERE id=?', [pp[0].user_id]);
    }

    return success(res, {}, `पुजारी ${action === 'approve' ? 'मंजूर' : 'नाकारले'}.`);
  } catch (err) {
    return error(res, 'प्रतिसाद देताना त्रुटी झाली.');
  }
};

// ── Get All Bookings ──────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT b.*, p.name_mr AS pooja_name, u.name AS user_name,
              u.phone AS user_phone, pp.full_name AS pujari_name
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       JOIN users u ON b.user_id = u.id
       LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.id
       WHERE ${where}
       ORDER BY b.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'बुकिंग मिळवताना त्रुटी झाली.');
  }
};

// ── Assign Pujari to Booking ──────────────────────────────────
exports.assignPujari = async (req, res) => {
  try {
    const { id } = req.params;
    const { pujari_id } = req.body;
    await pool.query(
      'UPDATE bookings SET pujari_id=?, status="confirmed" WHERE id=?',
      [pujari_id, id]
    );
    await pool.query(
      'UPDATE pujari_profiles SET total_bookings = total_bookings + 1 WHERE id=?',
      [pujari_id]
    );
    return success(res, {}, 'पुजारी नियुक्त केला.');
  } catch (err) {
    return error(res, 'पुजारी नियुक्त करताना त्रुटी झाली.');
  }
};

// ── Approve Review ────────────────────────────────────────────
exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE reviews SET is_approved=TRUE WHERE id=?', [id]);
    return success(res, {}, 'अभिप्राय मंजूर केला.');
  } catch (err) {
    return error(res, 'अभिप्राय मंजूर करताना त्रुटी झाली.');
  }
};

// ── Get All Users ─────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, phone, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'वापरकर्ते मिळवताना त्रुटी झाली.');
  }
};
