// src/controllers/booking.controller.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../utils/response.util');

// Generate short booking code
const genCode = () => 'POJ' + Date.now().toString(36).toUpperCase().slice(-6);

// ── Create Booking ────────────────────────────────────────────
exports.createBooking = async (req, res) => {
  try {
    const { pooja_id, booking_date, booking_time, address, city, district, special_notes } = req.body;
    const user_id = req.user.id;

    if (!pooja_id || !booking_date || !booking_time || !address)
      return error(res, 'सर्व आवश्यक माहिती भरा.', 400);

    // Get pooja price
    const [poojas] = await pool.query('SELECT * FROM poojas WHERE id = ?', [pooja_id]);
    if (!poojas.length) return error(res, 'पूजा सापडली नाही.', 404);

    const pooja = poojas[0];
    const platform_fee = Math.round(pooja.price * 0.05); // 5% platform fee
    const pujari_amount = pooja.price - platform_fee;
    const booking_code = genCode();

    const [result] = await pool.query(
      `INSERT INTO bookings
       (booking_code, user_id, pooja_id, booking_date, booking_time,
        address, city, district, special_notes, total_amount,
        platform_fee, pujari_amount)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [booking_code, user_id, pooja_id, booking_date, booking_time,
       address, city, district, special_notes, pooja.price,
       platform_fee, pujari_amount]
    );

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
              pp.full_name AS pujari_name, pp.phone AS pujari_phone
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.id
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
              pp.full_name AS pujari_name, pp.phone AS pujari_phone, pp.photo_url AS pujari_photo
       FROM bookings b
       JOIN poojas p ON b.pooja_id = p.id
       LEFT JOIN pujari_profiles pp ON b.pujari_id = pp.id
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
      `INSERT INTO reviews (booking_id, user_id, pujari_id, pooja_id, rating, comment)
       VALUES (?,?,?,?,?,?)`,
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

    return success(res, {}, 'अभिप्राय पाठवला. धन्यवाद! 🙏', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return error(res, 'आपण आधीच अभिप्राय दिला आहे.', 400);
    return error(res, 'अभिप्राय पाठवताना त्रुटी झाली.');
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

    // TODO: Integrate actual Razorpay SDK
    // const Razorpay = require('razorpay');
    // const instance = new Razorpay({ key_id, key_secret });
    // const order = await instance.orders.create({ amount: booking[0].total_amount * 100, currency: 'INR' });

    const mockOrder = {
      order_id: 'order_' + uuidv4().replace(/-/g, '').slice(0, 14),
      amount: booking[0].total_amount * 100,
      currency: 'INR',
    };

    await pool.query(
      'UPDATE bookings SET razorpay_order_id = ? WHERE id = ?',
      [mockOrder.order_id, booking_id]
    );

    return success(res, mockOrder, 'पेमेंट ऑर्डर तयार केला.');
  } catch (err) {
    return error(res, 'पेमेंट ऑर्डर तयार करताना त्रुटी झाली.');
  }
};

// ── Razorpay: Verify Payment ──────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { booking_id, payment_id } = req.body;
    // TODO: Verify Razorpay signature here

    await pool.query(
      'UPDATE bookings SET payment_status="paid", payment_id=?, status="confirmed" WHERE id=?',
      [payment_id, booking_id]
    );
    return success(res, {}, 'पेमेंट यशस्वी झाले! 🙏');
  } catch (err) {
    return error(res, 'पेमेंट पडताळताना त्रुटी झाली.');
  }
};
