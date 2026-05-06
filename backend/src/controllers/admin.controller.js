// src/controllers/admin.controller.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

// tenant_id helper — super_admin with no X-Tenant-ID gets all data
const tid = (req) => req.tenantId || null;
const tenantFilter = (req, alias = '') => {
  const col = alias ? `${alias}.tenant_id` : 'tenant_id';
  return tid(req) !== null ? `${col} = ${pool.escape(tid(req))}` : '1=1';
};

// ── Dashboard Stats ───────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const tf  = tenantFilter(req);
    const tfu = tenantFilter(req, 'u');
    const tfp = tenantFilter(req, 'pp');
    const tfb = tenantFilter(req, 'b');

    const [[users]]    = await pool.query(`SELECT COUNT(*) AS total FROM users u WHERE u.role='user' AND ${tfu}`);
    const [[pujaris]]  = await pool.query(`SELECT COUNT(*) AS total FROM pujari_profiles pp WHERE pp.status='approved' AND ${tfp}`);
    const [[pending]]  = await pool.query(`SELECT COUNT(*) AS total FROM pujari_profiles pp WHERE pp.status='pending' AND ${tfp}`);
    const [[bookings]] = await pool.query(`SELECT COUNT(*) AS total FROM bookings b WHERE ${tfb}`);
    const [[revenue]]  = await pool.query(`SELECT SUM(total_amount) AS total FROM bookings b WHERE b.payment_status='paid' AND ${tfb}`);

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
    const tf = tenantFilter(req, 'pp');
    const [rows] = await pool.query(
      `SELECT pp.*, u.phone, u.email
       FROM pujari_profiles pp JOIN users u ON pp.user_id = u.id
       WHERE pp.status = 'pending' AND ${tf}
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
    const { action, reason } = req.body;
    const status = action === 'approve' ? 'approved' : 'rejected';

    // Ensure pujari belongs to this tenant
    const tf = tenantFilter(req);
    await pool.query(
      `UPDATE pujari_profiles SET status=?, rejection_reason=? WHERE id=? AND ${tf}`,
      [status, reason || null, id]
    );

    if (action === 'approve') {
      const [pp] = await pool.query('SELECT user_id FROM pujari_profiles WHERE id=?', [id]);
      if (pp.length) await pool.query('UPDATE users SET role="pujari" WHERE id=?', [pp[0].user_id]);
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
    const tf = tenantFilter(req, 'b');
    let where = tf;
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
    const tf = tenantFilter(req);
    await pool.query(
      `UPDATE bookings SET pujari_id=?, status='confirmed' WHERE id=? AND ${tf}`,
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
    const tf = tenantFilter(req);
    await pool.query(`UPDATE reviews SET is_approved=TRUE WHERE id=? AND ${tf}`, [id]);
    return success(res, {}, 'अभिप्राय मंजूर केला.');
  } catch (err) {
    return error(res, 'अभिप्राय मंजूर करताना त्रुटी झाली.');
  }
};

// ── Get All Approved Pujaris ──────────────────────────────────
exports.getApprovedPujaris = async (req, res) => {
  try {
    const tf = tenantFilter(req, 'pp');
    const [rows] = await pool.query(
      `SELECT pp.*, u.phone, u.email
       FROM pujari_profiles pp JOIN users u ON pp.user_id = u.id
       WHERE pp.status = 'approved' AND ${tf}
       ORDER BY pp.created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'डेटा मिळवताना त्रुटी झाली.');
  }
};

// ── Get All Users ─────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const tf = tenantFilter(req, 'u');
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.phone, u.email, u.role, u.is_active, u.created_at
       FROM users u WHERE ${tf}
       ORDER BY u.created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'वापरकर्ते मिळवताना त्रुटी झाली.');
  }
};
