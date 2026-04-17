// src/controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const { success, error } = require('../utils/response.util');

// ── Generate OTP ──────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Register ──────────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !password)
      return error(res, 'नाव, फोन आणि पासवर्ड आवश्यक आहे.', 400);

    const [exists] = await pool.query(
      'SELECT id FROM users WHERE phone = ?', [phone]
    );
    if (exists.length)
      return error(res, 'हा फोन नंबर आधीच नोंदणीकृत आहे.', 400);

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, phone, email, password, is_verified) VALUES (?,?,?,?,?)',
      [name, phone, email || null, hashed, true]
    );
    const newUser = { id: result.insertId, name, phone, role: 'user' };
    const token = signToken(newUser);
    return success(res, { token, user: newUser }, 'नोंदणी यशस्वी झाली! 🙏', 201);
  } catch (err) {
    console.error(err);
    return error(res, 'नोंदणी करताना त्रुटी झाली.');
  }
};

// ── Login ─────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return error(res, 'फोन नंबर आणि पासवर्ड आवश्यक आहे.', 400);

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE (phone = ? OR email = ?) AND is_active = TRUE', [phone, phone]
    );
    if (!rows.length)
      return error(res, 'फोन नंबर किंवा पासवर्ड चुकीचा आहे.', 401);

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return error(res, 'फोन नंबर किंवा पासवर्ड चुकीचा आहे.', 401);

    const token = signToken(user);
    return success(res, {
      token,
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role }
    }, 'लॉगिन यशस्वी! 🙏');
  } catch (err) {
    return error(res, 'लॉगिन करताना त्रुटी झाली.');
  }
};

// ── Send OTP (SMS service placeholder) ───────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'फोन नंबर आवश्यक आहे.', 400);

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert user with OTP
    await pool.query(
      `INSERT INTO users (name, phone, otp_code, otp_expiry, is_verified)
       VALUES (?, ?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE otp_code=?, otp_expiry=?`,
      ['वापरकर्ता', phone, otp, expiry, otp, expiry]
    );

    // TODO: Send SMS via MSG91 / Fast2SMS
    console.log(`OTP for ${phone}: ${otp}`);

    return success(res, { phone }, 'OTP पाठवला आहे.');
  } catch (err) {
    return error(res, 'OTP पाठवताना त्रुटी झाली.');
  }
};

// ── Verify OTP ────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return error(res, 'फोन आणि OTP आवश्यक आहे.', 400);

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone = ? AND otp_code = ? AND otp_expiry > NOW()',
      [phone, otp]
    );
    if (!rows.length)
      return error(res, 'OTP चुकीचा किंवा कालबाह्य झाला आहे.', 400);

    const user = rows[0];
    await pool.query(
      'UPDATE users SET is_verified=TRUE, otp_code=NULL, otp_expiry=NULL, name=COALESCE(?,name) WHERE id=?',
      [name || null, user.id]
    );

    const token = signToken(user);
    return success(res, {
      token,
      user: { id: user.id, name: name || user.name, phone: user.phone, role: user.role }
    }, 'OTP पडताळणी यशस्वी! 🙏');
  } catch (err) {
    return error(res, 'OTP पडताळताना त्रुटी झाली.');
  }
};

// ── Get Current User ──────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, phone, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return success(res, rows[0]);
  } catch (err) {
    return error(res, 'माहिती मिळवताना त्रुटी झाली.');
  }
};
