// src/controllers/admin.controller.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');
const { sendSMS } = require('../services/sms.service');

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
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ success: false, message: 'action "approve" किंवा "reject" असणे आवश्यक आहे.' });
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
              u.phone AS user_phone, pp.full_name AS pujari_name,
              pu.phone AS pujari_phone
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       JOIN users u ON b.user_id = u.id
       LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.id
       LEFT JOIN users pu ON pp.user_id = pu.id
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

// ── Assign / Replace Pujari on Booking ───────────────────────
exports.assignPujari = async (req, res) => {
  try {
    const { id } = req.params;
    const { pujari_id } = req.body;
    const tfJoin = tenantFilter(req, 'b');  // for JOINed SELECT
    const tf     = tenantFilter(req);       // for single-table UPDATE

    // Fetch current booking with user phone and pooja name
    const [[booking]] = await pool.query(
      `SELECT b.pujari_id, b.booking_code, p.name_mr AS pooja_name,
              u.phone AS user_phone, u.name AS user_name,
              b.booking_date
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       JOIN users u ON b.user_id = u.id
       WHERE b.id=? AND ${tfJoin}`, [id]
    );
    if (!booking) return error(res, 'बुकिंग सापडली नाही.', 404);

    const oldPujariId = booking.pujari_id;

    await pool.query(
      `UPDATE bookings SET pujari_id=?, status='confirmed' WHERE id=? AND ${tf}`,
      [pujari_id, id]
    );

    // If replacing an existing assignment, decrement old pujari's counter
    if (oldPujariId && oldPujariId !== pujari_id) {
      await pool.query(
        'UPDATE pujari_profiles SET total_bookings = GREATEST(0, total_bookings - 1) WHERE id=?',
        [oldPujariId]
      );
    }

    // Increment new pujari's counter only on fresh assignment
    if (!oldPujariId || oldPujariId !== pujari_id) {
      await pool.query(
        'UPDATE pujari_profiles SET total_bookings = total_bookings + 1 WHERE id=?',
        [pujari_id]
      );
    }

    // Fetch new pujari's phone for SMS
    const [[newPujari]] = await pool.query(
      `SELECT pp.full_name, u.phone
       FROM pujari_profiles pp JOIN users u ON pp.user_id = u.id
       WHERE pp.id=?`, [pujari_id]
    );

    if (newPujari) {
      const bookingDate = new Date(booking.booking_date).toLocaleDateString('mr-IN');
      // SMS to pujari
      sendSMS(
        newPujari.phone,
        `नमस्ते ${newPujari.full_name}! आपल्याला बुकिंग #${booking.booking_code} नियुक्त केली आहे. पूजा: ${booking.pooja_name}, तारीख: ${bookingDate}, वापरकर्ता: ${booking.user_name} (${booking.user_phone}). - पूजारी टीम`
      );
      // SMS to user
      sendSMS(
        booking.user_phone,
        `नमस्ते ${booking.user_name}! आपल्या #${booking.booking_code} बुकिंगसाठी पुजारी नियुक्त झाले: ${newPujari.full_name} (${newPujari.phone}). पूजा: ${booking.pooja_name}, तारीख: ${bookingDate}. - पूजारी टीम`
      );
    }

    const message = oldPujariId && oldPujariId !== pujari_id
      ? 'पुजारी बदलला. नवीन पुजारी नियुक्त केला. SMS पाठवला.'
      : 'पुजारी नियुक्त केला. SMS पाठवला.';
    return success(res, { pujari_phone: newPujari?.phone }, message);
  } catch (err) {
    return error(res, 'पुजारी नियुक्त करताना त्रुटी झाली.');
  }
};

// ── Mark Booking as Completed ─────────────────────────────────
exports.markBookingComplete = async (req, res) => {
  try {
    const { id } = req.params;
    const tf = tenantFilter(req);

    const [[booking]] = await pool.query(
      `SELECT id, status, pujari_id FROM bookings WHERE id = ? AND ${tf}`, [id]
    );
    if (!booking) return error(res, 'बुकिंग सापडली नाही.', 404);
    if (booking.status === 'completed')
      return error(res, 'ही बुकिंग आधीच पूर्ण झाली आहे.', 400);
    if (booking.status === 'cancelled')
      return error(res, 'रद्द झालेली बुकिंग पूर्ण करता येत नाही.', 400);

    await pool.query(
      `UPDATE bookings SET status = 'completed' WHERE id = ? AND ${tf}`, [id]
    );
    return success(res, {}, 'बुकिंग पूर्ण झाली! आता वापरकर्ता अभिप्राय देऊ शकतो. 🎉');
  } catch (err) {
    return error(res, 'बुकिंग पूर्ण करताना त्रुटी झाली.');
  }
};

// ── Get All Reviews (admin) ───────────────────────────────────
exports.getReviews = async (req, res) => {
  try {
    const tf = tenantFilter(req, 'r');
    const { status = 'all' } = req.query;
    let where = tf;
    if (status === 'pending')  where += ' AND r.is_approved = FALSE';
    if (status === 'approved') where += ' AND r.is_approved = TRUE';

    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.is_approved, r.created_at,
              u.phone AS user_phone,
              pp.full_name AS pujari_name,
              p.name_mr AS pooja_name
       FROM reviews r
       LEFT JOIN users u            ON r.user_id   = u.id
       LEFT JOIN pujari_profiles pp ON r.pujari_id = pp.id
       LEFT JOIN poojas p           ON r.pooja_id  = p.id
       WHERE ${where}
       ORDER BY r.created_at DESC`,
    );
    return success(res, rows);
  } catch (err) {
    console.error('getReviews error:', err);
    return error(res, 'अभिप्राय यादी मिळवताना त्रुटी झाली.');
  }
};

// ── Approve Review ────────────────────────────────────────────
exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const tf = tenantFilter(req);
    const [[existing]] = await pool.query(`SELECT id FROM reviews WHERE id=? AND ${tf}`, [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'अभिप्राय सापडला नाही.' });
    await pool.query(`UPDATE reviews SET is_approved=TRUE WHERE id=? AND ${tf}`, [id]);
    return success(res, {}, 'अभिप्राय मंजूर केला.');
  } catch (err) {
    return error(res, 'अभिप्राय मंजूर करताना त्रुटी झाली.');
  }
};

// ── Bulk Approve Reviews ──────────────────────────────────────
exports.bulkApproveReviews = async (req, res) => {
  try {
    const { ids } = req.body; // array of review ids
    if (!Array.isArray(ids) || ids.length === 0)
      return error(res, 'Review IDs आवश्यक आहेत.', 400);

    const tf = tenantFilter(req);
    await pool.query(`UPDATE reviews SET is_approved=TRUE WHERE id IN (?) AND ${tf}`, [ids]);

    // Recalculate avg for all affected pujaris
    const [affected] = await pool.query(
      'SELECT DISTINCT pujari_id FROM reviews WHERE id IN (?)', [ids]
    );
    for (const { pujari_id } of affected) {
      await pool.query(
        `UPDATE pujari_profiles SET
         avg_rating    = (SELECT COALESCE(AVG(rating),0) FROM reviews WHERE pujari_id=? AND is_approved=TRUE),
         total_reviews = (SELECT COUNT(*) FROM reviews WHERE pujari_id=? AND is_approved=TRUE)
         WHERE id=?`,
        [pujari_id, pujari_id, pujari_id]
      );
    }
    return success(res, {}, `${ids.length} अभिप्राय मंजूर केले.`);
  } catch (err) {
    console.error('bulkApprove error:', err);
    return error(res, 'Bulk approve करताना त्रुटी झाली.');
  }
};

// ── Delete Review ─────────────────────────────────────────────
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const tf = tenantFilter(req);

    // Get pujari_id before deleting (to recalculate avg)
    const [[rev]] = await pool.query(`SELECT pujari_id FROM reviews WHERE id=? AND ${tf}`, [id]);
    if (!rev) return error(res, 'अभिप्राय सापडला नाही.', 404);

    await pool.query(`DELETE FROM reviews WHERE id=? AND ${tf}`, [id]);

    // Recalculate pujari avg_rating after deletion
    await pool.query(
      `UPDATE pujari_profiles SET
       avg_rating    = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE pujari_id=? AND is_approved=TRUE),
       total_reviews = (SELECT COUNT(*) FROM reviews WHERE pujari_id=? AND is_approved=TRUE)
       WHERE id=?`,
      [rev.pujari_id, rev.pujari_id, rev.pujari_id]
    );

    return success(res, {}, 'अभिप्राय काढला गेला.');
  } catch (err) {
    console.error('deleteReview error:', err);
    return error(res, 'अभिप्राय काढताना त्रुटी झाली.');
  }
};

// ── Get All Approved Pujaris ──────────────────────────────────
exports.getApprovedPujaris = async (req, res) => {
  try {
    const tf = tenantFilter(req, 'pp');
    const { sort = 'rating', page = 1, limit = 12, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const orderMap = {
      rating:   'pp.avg_rating DESC, pp.total_reviews DESC',
      bookings: 'pp.total_bookings DESC',
      name:     'pp.full_name ASC',
      newest:   'pp.created_at DESC',
    };
    const orderBy = orderMap[sort] || orderMap.rating;

    let where = `pp.status = 'approved' AND ${tf}`;
    const params = [];
    if (search) {
      where += ` AND (pp.full_name LIKE ? OR pp.city LIKE ? OR pp.district LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pujari_profiles pp WHERE ${where}`, params
    );
    const [rows] = await pool.query(
      `SELECT pp.*, u.phone, u.email
       FROM pujari_profiles pp JOIN users u ON pp.user_id = u.id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    return res.json({ success: true, data: rows, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    return error(res, 'डेटा मिळवताना त्रुटी झाली.');
  }
};

// ── Admin Update Pujari Profile ───────────────────────────────
exports.updatePujari = async (req, res) => {
  try {
    const { id } = req.params;
    const tf = tenantFilter(req, 'pp');
    const {
      full_name, experience_yrs, city, district, state,
      address, languages, bio, brahmin_tradition, is_available,
    } = req.body;

    const [[existing]] = await pool.query(
      `SELECT pp.id FROM pujari_profiles pp WHERE pp.id = ? AND ${tf}`, [id]
    );
    if (!existing) return error(res, 'पुजारी सापडला नाही.', 404);

    const langsJson = languages
      ? JSON.stringify(Array.isArray(languages) ? languages : languages.split(',').map(l => l.trim()).filter(Boolean))
      : undefined;

    const fields = [];
    const vals   = [];
    if (full_name        !== undefined) { fields.push('full_name = ?');        vals.push(full_name); }
    if (experience_yrs   !== undefined) { fields.push('experience_yrs = ?');   vals.push(parseInt(experience_yrs) || 0); }
    if (city             !== undefined) { fields.push('city = ?');             vals.push(city); }
    if (district         !== undefined) { fields.push('district = ?');         vals.push(district); }
    if (state            !== undefined) { fields.push('state = ?');            vals.push(state); }
    if (address          !== undefined) { fields.push('address = ?');          vals.push(address); }
    if (langsJson        !== undefined) { fields.push('languages = ?');        vals.push(langsJson); }
    if (bio              !== undefined) { fields.push('bio = ?');              vals.push(bio); }
    if (brahmin_tradition!== undefined) { fields.push('brahmin_tradition = ?');vals.push(brahmin_tradition); }
    if (is_available     !== undefined) { fields.push('is_available = ?');     vals.push(is_available ? 1 : 0); }

    if (!fields.length) return error(res, 'बदलण्यासाठी कोणतीही माहिती नाही.', 400);

    vals.push(id);
    await pool.query(`UPDATE pujari_profiles SET ${fields.join(', ')} WHERE id = ?`, vals);
    return success(res, {}, 'पुजारी माहिती अद्यतनित केली. ✅');
  } catch (err) {
    console.error('updatePujari error:', err);
    return error(res, 'माहिती अद्यतनित करताना त्रुटी झाली.');
  }
};

// ── Admin Report ──────────────────────────────────────────────
exports.getReport = async (req, res) => {
  try {
    const tf  = tenantFilter(req);
    const tfb = tenantFilter(req, 'b');
    const tfu = tenantFilter(req, 'u');
    const tfp = tenantFilter(req, 'pp');

    const { year, month } = req.query;
    let dateFilter = '';
    const dateParams = [];
    if (year)  { dateFilter += ' AND YEAR(b.created_at) = ?';  dateParams.push(parseInt(year)); }
    if (month) { dateFilter += ' AND MONTH(b.created_at) = ?'; dateParams.push(parseInt(month)); }

    // ── Summary KPIs ──────────────────────────────────────────
    const [[kpi]] = await pool.query(`
      SELECT
        COUNT(*)                                                    AS total_bookings,
        COUNT(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN 1 END) AS paid_bookings,
        COUNT(CASE WHEN b.payment_status = 'paid'      THEN 1 END) AS online_bookings,
        COUNT(CASE WHEN b.payment_status = 'cash_paid' THEN 1 END) AS cash_bookings,
        COUNT(CASE WHEN b.payment_status = 'unpaid'    THEN 1 END) AS unpaid_bookings,
        COUNT(CASE WHEN b.status = 'completed'         THEN 1 END) AS completed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled'         THEN 1 END) AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.payment_status = 'paid'      THEN b.total_amount END), 0) AS online_revenue,
        COALESCE(SUM(CASE WHEN b.payment_status = 'cash_paid' THEN COALESCE(b.actual_amount, b.total_amount) END), 0) AS cash_revenue,
        COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN b.total_amount END), 0) AS gross_revenue
      FROM bookings b
      WHERE ${tfb} ${dateFilter}`,
      dateParams
    );

    // ── Monthly breakdown ─────────────────────────────────────
    const [monthly] = await pool.query(`
      SELECT
        YEAR(b.created_at)  AS yr,
        MONTH(b.created_at) AS mo,
        COUNT(*)            AS total_bookings,
        COUNT(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN 1 END) AS paid_bookings,
        COALESCE(SUM(CASE WHEN b.payment_status='paid'      THEN b.total_amount END),0) AS online_revenue,
        COALESCE(SUM(CASE WHEN b.payment_status='cash_paid' THEN COALESCE(b.actual_amount,b.total_amount) END),0) AS cash_revenue
      FROM bookings b
      WHERE ${tfb}
      GROUP BY yr, mo
      ORDER BY yr DESC, mo DESC
      LIMIT 12`,
      []
    );

    // ── Top Pujaris ───────────────────────────────────────────
    const [topPujaris] = await pool.query(`
      SELECT
        pp.id, pp.full_name, pp.city, pp.avg_rating, pp.total_reviews,
        COUNT(b.id)         AS booking_count,
        COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN b.total_amount END),0) AS revenue
      FROM pujari_profiles pp
      LEFT JOIN bookings b ON b.pujari_id = pp.id AND ${tenantFilter(req,'b')}
      WHERE pp.status='approved' AND ${tfp}
      GROUP BY pp.id
      ORDER BY booking_count DESC, revenue DESC
      LIMIT 10`,
      []
    );

    // ── Booking status breakdown ──────────────────────────────
    const [statusBreakdown] = await pool.query(`
      SELECT b.status, COUNT(*) AS cnt
      FROM bookings b WHERE ${tfb} ${dateFilter}
      GROUP BY b.status`,
      dateParams
    );

    // ── Top Poojas ────────────────────────────────────────────
    const [topPoojas] = await pool.query(`
      SELECT p.name_mr, COUNT(b.id) AS cnt,
        COALESCE(SUM(CASE WHEN b.payment_status IN ('paid','cash_paid') THEN b.total_amount END),0) AS revenue
      FROM bookings b
      JOIN poojas p ON b.pooja_id = p.id
      WHERE ${tfb} ${dateFilter}
      GROUP BY p.id ORDER BY cnt DESC LIMIT 5`,
      dateParams
    );

    // ── User & Pujari counts ──────────────────────────────────
    const [[userCount]]   = await pool.query(`SELECT COUNT(*) AS c FROM users u WHERE u.role='user' AND ${tfu}`);
    const [[pujariCount]] = await pool.query(`SELECT COUNT(*) AS c FROM pujari_profiles pp WHERE pp.status='approved' AND ${tfp}`);
    const [[pendingCount]]= await pool.query(`SELECT COUNT(*) AS c FROM pujari_profiles pp WHERE pp.status='pending' AND ${tfp}`);

    // ── Available years ───────────────────────────────────────
    const [years] = await pool.query(
      `SELECT DISTINCT YEAR(created_at) AS yr FROM bookings WHERE ${tf} ORDER BY yr DESC`,
      []
    );

    return success(res, {
      kpi, monthly, topPujaris, statusBreakdown, topPoojas,
      counts: { users: userCount.c, pujaris: pujariCount.c, pending: pendingCount.c },
      years: years.map(y => y.yr),
    });
  } catch (err) {
    console.error('getReport error:', err);
    return error(res, 'Report मिळवताना त्रुटी झाली.');
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

// ── Get All Abhyasak (Blog Editors) ──────────────────────────
exports.getAbhyasakUsers = async (req, res) => {
  try {
    const tf = tenantFilter(req, 'u');
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.phone, u.email, u.is_active, u.created_at
       FROM users u WHERE u.role = 'abhyasak' AND ${tf}
       ORDER BY u.created_at DESC`
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'अभ्यासक यादी मिळवताना त्रुटी झाली.');
  }
};

// ── Create Abhyasak ───────────────────────────────────────────
exports.createAbhyasak = async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password)
      return error(res, 'नाव, फोन आणि पासवर्ड आवश्यक आहे.', 400);
    if (password.length < 6)
      return error(res, 'पासवर्ड किमान 6 अक्षरांचा असावा.', 400);

    const [exists] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (exists.length) return error(res, 'हा फोन नंबर आधीच नोंदणीकृत आहे.', 400);

    const tenantId = tid(req) || req.user.tenant_id;
    const hashed   = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (tenant_id, name, phone, email, password, role, is_verified, is_active)
       VALUES (?, ?, ?, ?, ?, 'abhyasak', TRUE, TRUE)`,
      [tenantId, name, phone, email || null, hashed]
    );
    return success(res, { id: result.insertId }, 'अभ्यासक यशस्वीरित्या जोडला.', 201);
  } catch (err) {
    console.error('createAbhyasak error:', err);
    return error(res, 'अभ्यासक जोडताना त्रुटी झाली.');
  }
};

// ── Delete Abhyasak ───────────────────────────────────────────
exports.deleteAbhyasak = async (req, res) => {
  try {
    const { id } = req.params;
    const tf = tenantFilter(req);
    const [[user]] = await pool.query(
      `SELECT role FROM users WHERE id = ? AND ${tf}`, [id]
    );
    if (!user || user.role !== 'abhyasak')
      return error(res, 'अभ्यासक सापडला नाही.', 404);

    await pool.query(`DELETE FROM users WHERE id = ? AND ${tf}`, [id]);
    return success(res, {}, 'अभ्यासक काढला.');
  } catch (err) {
    return error(res, 'अभ्यासक काढताना त्रुटी झाली.');
  }
};

// ── Consultation Management ───────────────────────────────────
exports.getConsultations = async (req, res) => {
  try {
    const tf     = tenantFilter(req, 'b');
    const { status } = req.query;

    // Consultation pooja IDs: 94=Phone, 95=Home, 96=Full Kundali
    const consultIds = [94, 95, 96];

    let where = `b.pooja_id IN (${consultIds.join(',')}) AND ${tf}`;
    if (status && status !== 'all') where += ` AND b.status = ${pool.escape(status)}`;

    const [rows] = await pool.query(`
      SELECT
        b.id, b.booking_code, b.pooja_id, b.booking_date, b.booking_time,
        b.address, b.total_amount, b.status, b.payment_status,
        b.special_notes, b.admin_notes, b.created_at,
        u.name  AS user_name,  u.phone AS user_phone,
        p.name_mr AS pooja_name
      FROM bookings b
      JOIN users  u ON u.id = b.user_id
      JOIN poojas p ON p.id = b.pooja_id
      WHERE ${where}
      ORDER BY b.created_at DESC
      LIMIT 200
    `);

    return success(res, rows);
  } catch (err) {
    console.error('[Consult] getConsultations error:', err.message);
    return error(res, 'सल्लामसलत डेटा लोड करताना त्रुटी.');
  }
};

exports.updateConsultationNote = async (req, res) => {
  try {
    const { id }   = req.params;
    const { note } = req.body;
    const tf       = tenantFilter(req, 'b');

    // Verify it's a consultation booking
    const [[booking]] = await pool.query(
      `SELECT id FROM bookings b WHERE b.id = ? AND b.pooja_id IN (94,95,96) AND ${tf}`,
      [id]
    );
    if (!booking) return error(res, 'सल्लामसलत सापडली नाही.', 404);

    await pool.query(
      'UPDATE bookings SET admin_notes = ? WHERE id = ?',
      [note, id]
    );
    return success(res, {}, 'नोट जतन केली.');
  } catch (err) {
    return error(res, 'नोट जतन करताना त्रुटी.');
  }
};

// ── Consultation Services (Parameterized) ────────────────────
const CONSULT_CATEGORY_SLUG = 'jyotish-consultation';

exports.getConsultationServices = async (req, res) => {
  try {
    const [[cat]] = await pool.query(
      `SELECT id FROM pooja_categories WHERE slug = ?`, [CONSULT_CATEGORY_SLUG]
    );
    if (!cat) return success(res, []);

    const [rows] = await pool.query(
      `SELECT id, name_mr, name_en, short_desc, price, samagri_price, duration_hrs, is_active
       FROM poojas WHERE category_id = ? ORDER BY price ASC`,
      [cat.id]
    );
    return success(res, rows);
  } catch (err) {
    return error(res, 'सेवा लोड करताना त्रुटी.');
  }
};

exports.createConsultationService = async (req, res) => {
  try {
    const { name_mr, name_en, short_desc, price, duration_hrs } = req.body;
    if (!name_mr || !price) return error(res, 'नाव आणि किंमत आवश्यक आहे.', 400);

    const [[cat]] = await pool.query(
      `SELECT id FROM pooja_categories WHERE slug = ?`, [CONSULT_CATEGORY_SLUG]
    );
    if (!cat) return error(res, 'सल्लामसलत श्रेणी सापडली नाही.', 404);

    const slug = `consult-${Date.now()}`;
    const [result] = await pool.query(
      `INSERT INTO poojas (category_id, name_mr, name_en, slug, short_desc, price, samagri_price, duration_hrs, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, 1)`,
      [cat.id, name_mr, name_en || name_mr, slug, short_desc || '', price, duration_hrs || 1]
    );
    return success(res, { id: result.insertId }, 'सेवा जोडली.');
  } catch (err) {
    return error(res, 'सेवा जोडताना त्रुटी.');
  }
};

exports.updateConsultationService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_mr, name_en, short_desc, price, duration_hrs } = req.body;

    const [[cat]] = await pool.query(
      `SELECT id FROM pooja_categories WHERE slug = ?`, [CONSULT_CATEGORY_SLUG]
    );
    if (!cat) return error(res, 'श्रेणी सापडली नाही.', 404);

    await pool.query(
      `UPDATE poojas SET name_mr=?, name_en=?, short_desc=?, price=?, duration_hrs=?
       WHERE id=? AND category_id=?`,
      [name_mr, name_en || name_mr, short_desc || '', price, duration_hrs || 1, id, cat.id]
    );
    return success(res, {}, 'सेवा अद्यतनित केली.');
  } catch (err) {
    return error(res, 'सेवा अद्यतन करताना त्रुटी.');
  }
};

exports.toggleConsultationService = async (req, res) => {
  try {
    const { id } = req.params;
    const [[row]] = await pool.query(`SELECT is_active FROM poojas WHERE id=?`, [id]);
    if (!row) return error(res, 'सेवा सापडली नाही.', 404);
    await pool.query(`UPDATE poojas SET is_active=? WHERE id=?`, [row.is_active ? 0 : 1, id]);
    return success(res, { is_active: !row.is_active }, row.is_active ? 'सेवा बंद केली.' : 'सेवा सुरू केली.');
  } catch (err) {
    return error(res, 'त्रुटी झाली.');
  }
};
