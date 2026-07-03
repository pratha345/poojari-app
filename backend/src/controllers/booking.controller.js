// src/controllers/booking.controller.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/response.util');
const { notifyAdminNewBooking } = require('../services/notificationService');
const { delCache, delCachePattern } = require('../utils/redis');

// Generate short booking code
const genCode = () => 'POJ' + Date.now().toString(36).toUpperCase().slice(-6);

// ── Create Booking ────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const { pooja_id, booking_date, booking_time, address, city, district, special_notes, preferred_pujari_id } = req.body;
    const user_id = req.user.id;

    if (!pooja_id || !booking_date || !booking_time || !address?.trim())
      return error(res, 'सर्व आवश्यक माहिती भरा.', 400);

    // Get pooja price
    const [poojas] = await pool.query('SELECT * FROM poojas WHERE id = ?', [pooja_id]);
    if (!poojas.length) return error(res, 'पूजा सापडली नाही.', 404);

    const pooja = poojas[0];
    const platform_fee = Math.round(pooja.price * 0.05); // 5% platform fee
    const pujari_amount = pooja.price - platform_fee;
    const booking_code = genCode();
    const tenant_id = pooja.tenant_id || null;
    const prefPujariId = preferred_pujari_id ? Number(preferred_pujari_id) : null;

    const [result] = await pool.query(
      `INSERT INTO bookings
       (booking_code, user_id, pooja_id, booking_date, booking_time,
        address, city, district, special_notes, total_amount,
        platform_fee, pujari_amount, tenant_id, preferred_pujari_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [booking_code, user_id, pooja_id, booking_date, booking_time,
       address, city, district, special_notes, pooja.price,
       platform_fee, pujari_amount, tenant_id, prefPujariId]
    );

    // Notify admin (non-blocking)
    notifyAdminNewBooking({
      booking_code,
      pooja_name:   pooja.name_mr,
      booking_date,
      booking_time,
      address,
      user_phone:   req.user.phone,
      tenant_id,
      io:           req.app.get('io'),
    }).catch(() => {});

    return success(res, {
      booking_id: result.insertId,
      booking_code,
      total_amount: pooja.price,
      pooja_name: pooja.name_mr,
    }, 'बुकिंग यशस्वी झाली! 🙏', 201);
  } catch (err) {
    console.error(err);
    return error(res, 'बुकिंग करताना त्रुटी झाली.');
  }
};

// ── Get My Bookings (User) ────────────────────────────────────
exports.getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let where = 'b.user_id = ?';
    const params = [req.user.id];
    if (status) { where += ' AND b.status = ?'; params.push(status); }

    const [bookings] = await pool.query(
      `SELECT b.*, p.name_mr AS pooja_name, p.image_url AS pooja_image,
              pp.id AS pujari_profile_id, pp.full_name AS pujari_name,
              pp.photo_url AS pujari_photo, pp.city AS pujari_city,
              pp.avg_rating AS pujari_rating, pp.experience_yrs AS pujari_experience,
              pu.phone AS pujari_phone,
              (SELECT COUNT(*) FROM reviews r WHERE r.booking_id = b.id AND r.user_id = b.user_id) AS has_review
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.id
       LEFT JOIN users pu ON pp.user_id = pu.id
       WHERE ${where}
       ORDER BY b.created_at DESC`,
      params
    );
    return success(res, bookings);
  } catch (err) {
    return error(res, 'बुकिंग मिळवताना त्रुटी झाली.');
  }
};

// ── Get Booking by Code ───────────────────────────────────────
exports.getBookingByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const [rows] = await pool.query(
      `SELECT b.*, p.name_mr AS pooja_name, p.duration_hrs,
              pp.full_name AS pujari_name, pu.phone AS pujari_phone, pp.photo_url AS pujari_photo
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.id
       LEFT JOIN users pu ON pp.user_id = pu.id
       WHERE b.booking_code = ? AND b.user_id = ?`,
      [code, req.user.id]
    );
    if (!rows.length) return error(res, 'बुकिंग सापडली नाही.', 404);
    return success(res, rows[0]);
  } catch (err) {
    return error(res, 'बुकिंग मिळवताना त्रुटी झाली.');
  }
};

// ── Cancel Booking ────────────────────────────────────────────
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?', [id, req.user.id]
    );
    if (!booking.length) return error(res, 'बुकिंग सापडली नाही.', 404);
    if (['completed', 'cancelled'].includes(booking[0].status))
      return error(res, 'ही बुकिंग रद्द करता येत नाही.', 400);

    await pool.query(
      'UPDATE bookings SET status="cancelled", cancelled_by="user", cancel_reason=? WHERE id=?',
      [reason, id]
    );
    return success(res, {}, 'बुकिंग रद्द केली.');
  } catch (err) {
    return error(res, 'बुकिंग रद्द करताना त्रुटी झाली.');
  }
};

// ── Submit Review ─────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;
    const user_id = req.user.id;

    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = "completed"',
      [booking_id, user_id]
    );
    if (!booking.length)
      return error(res, 'पूर्ण झालेली बुकिंग सापडली नाही.', 404);

    await pool.query(
      `INSERT INTO reviews (booking_id, user_id, pujari_id, pooja_id, rating, comment, is_approved)
       VALUES (?,?,?,?,?,?,TRUE)`,
      [booking_id, user_id, booking[0].pujari_id, booking[0].pooja_id, rating, comment]
    );

    // Update pujari avg rating
    await pool.query(
      `UPDATE pujari_profiles SET
       avg_rating = (SELECT AVG(rating) FROM reviews WHERE pujari_id = ? AND is_approved=TRUE),
       total_reviews = (SELECT COUNT(*) FROM reviews WHERE pujari_id = ? AND is_approved=TRUE)
       WHERE id = ?`,
      [booking[0].pujari_id, booking[0].pujari_id, booking[0].pujari_id]
    );

    // Invalidate pujari review caches so fresh data shows immediately
    await Promise.all([
      delCache(`pujari:reviews:${booking[0].pujari_id}`),
      delCachePattern('pujari:top-reviews:*'),
    ]);

    return success(res, {}, 'अभिप्राय पाठवला. धन्यवाद! 🙏', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return error(res, 'आपण आधीच अभिप्राय दिला आहे.', 400);
    return error(res, 'अभिप्राय पाठवताना त्रुटी झाली.');
  }
};

// ── Mark Cash Payment Method ──────────────────────────────────
exports.chooseCash = async (req, res) => {
  try {
    const { booking_id } = req.body;
    await pool.query(
      'UPDATE bookings SET payment_method="cash" WHERE id=? AND user_id=?',
      [booking_id, req.user.id]
    );
    return success(res, {}, 'रोख पेमेंट नोंदवले.');
  } catch (err) {
    return error(res, 'त्रुटी झाली.');
  }
};

// ── Admin: Mark Cash Received ─────────────────────────────────
exports.markCashReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { actual_amount } = req.body;
    await pool.query(
      `UPDATE bookings
       SET payment_status="cash_paid", status="completed",
           actual_amount = ?
       WHERE id=?`,
      [actual_amount || null, id]
    );
    return success(res, {}, 'रोख पेमेंट मिळाले. बुकिंग पूर्ण झाली! ✅');
  } catch (err) {
    return error(res, 'त्रुटी झाली.');
  }
};

// ── Razorpay: Create Order ────────────────────────────────────
exports.createPaymentOrder = async (req, res) => {
  try {
    const { booking_id } = req.body;
    const [booking] = await pool.query(
      'SELECT * FROM bookings WHERE id = ? AND user_id = ?',
      [booking_id, req.user.id]
    );
    if (!booking.length) return error(res, 'बुकिंग सापडली नाही.', 404);

    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount:   Math.round(booking[0].total_amount * 100),
      currency: 'INR',
      receipt:  `booking_${booking_id}`,
      notes:    { booking_id: String(booking_id) },
    });

    await pool.query(
      'UPDATE bookings SET razorpay_order_id = ? WHERE id = ?',
      [order.id, booking_id]
    );

    return success(res, {
      order_id:   order.id,
      amount:     order.amount,
      currency:   order.currency,
      key_id:     process.env.RAZORPAY_KEY_ID,
    }, 'पेमेंट ऑर्डर तयार केला.');
  } catch (err) {
    console.error('Razorpay order error:', err);
    return error(res, 'पेमेंट ऑर्डर तयार करताना त्रुटी झाली.');
  }
};

// ── Razorpay: Verify Payment ──────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const crypto = require('crypto');

    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature)
      return error(res, 'पेमेंट पडताळणी अयशस्वी.', 400);

    await pool.query(
      'UPDATE bookings SET payment_status="paid", payment_id=?, status="confirmed" WHERE id=? AND user_id=?',
      [razorpay_payment_id, booking_id, req.user.id]
    );
    return success(res, {}, 'पेमेंट यशस्वी झाले! 🙏');
  } catch (err) {
    return error(res, 'पेमेंट पडताळताना त्रुटी झाली.');
  }
};
