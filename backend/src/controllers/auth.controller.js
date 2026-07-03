// src/controllers/auth.controller.js
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../config/db');
const { success, error } = require('../utils/response.util');
const { recordFailedLogin, clearFailedLogin } = require('../middleware/security.middleware');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, tenant_id: user.tenant_id || null },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const safeUser = (u) => ({
  id: u.id, name: u.name, phone: u.phone,
  email: u.email, role: u.role, tenant_id: u.tenant_id || null,
  photo_url: u.photo_url || null,
});

// ── Register ──────────────────────────────────────────────────
const HTML_TAG_RE = /<[^>]*>/;

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, tenant_id } = req.body;
    if (!name || !phone || !password)
      return error(res, 'नाव, फोन आणि पासवर्ड आवश्यक आहे.', 400);
    if (HTML_TAG_RE.test(String(name)))
      return error(res, 'नाव अवैध आहे. HTML टॅग वापरू नका.', 400);
    if (!/^\d{10}$/.test(String(phone).replace(/\D/g, '')))
      return error(res, 'वैध १० अंकी फोन नंबर टाका.', 400);

    const [exists] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (exists.length)
      return error(res, 'हा फोन नंबर आधीच नोंदणीकृत आहे.', 400);

    // Resolve which tenant this user belongs to
    const tid = tenant_id || req.tenantId || 1;

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (tenant_id, name, phone, email, password, is_verified) VALUES (?,?,?,?,?,?)',
      [tid, name, phone, email || null, hashed, true]
    );
    const newUser = { id: result.insertId, name, phone, role: 'user', tenant_id: tid };
    const token = signToken(newUser);
    return success(res, { token, user: safeUser(newUser) }, 'नोंदणी यशस्वी झाली! 🙏', 201);
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
    if (!rows.length) {
      recordFailedLogin(phone, req.ip); // Track failed attempt
      return error(res, 'फोन नंबर किंवा पासवर्ड चुकीचा आहे.', 401);
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailedLogin(phone, req.ip); // Track failed attempt
      return error(res, 'फोन नंबर किंवा पासवर्ड चुकीचा आहे.', 401);
    }

    clearFailedLogin(phone, req.ip); // Success — reset counter
    const token = signToken(user);
    return success(res, { token, user: safeUser(user) }, 'लॉगिन यशस्वी! 🙏');
  } catch (err) {
    return error(res, 'लॉगिन करताना त्रुटी झाली.');
  }
};

// ── Send OTP ──────────────────────────────────────────────────
exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'फोन नंबर आवश्यक आहे.', 400);
    if (!/^\d{10}$/.test(String(phone).replace(/\D/g, '')))
      return error(res, 'वैध १० अंकी फोन नंबर टाका.', 400);

    const otp    = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);
    const tid    = req.tenantId || 1;
    // Always store and send as plain 10-digit number (strips +91 / 91 prefix)
    const cleanPhone = String(phone).replace(/\D/g, '').replace(/^91(\d{10})$/, '$1');

    await pool.query(
      `INSERT INTO users (tenant_id, name, phone, otp_code, otp_expiry, is_verified)
       VALUES (?, ?, ?, ?, ?, FALSE)
       ON DUPLICATE KEY UPDATE otp_code=?, otp_expiry=?`,
      [tid, 'वापरकर्ता', cleanPhone, otp, expiry, otp, expiry]
    );
    // Send OTP via Fast2SMS (route 'q' — no DLT/website verification required)
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (apiKey) {
      try {
        const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: { authorization: apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: 'q',
            message: `${otp} is your Pojjari login OTP. Valid for 10 minutes. Do not share with anyone.`,
            language: 'english',
            flash: 0,
            numbers: cleanPhone,
          }),
        });
        const smsData = await smsRes.json();
        if (!smsData.return) console.error('[SMS] Fast2SMS:', smsData.message);
        else console.log(`[SMS] OTP sent to ${cleanPhone}`);
      } catch (smsErr) {
        console.error('[SMS] Failed:', smsErr.message);
      }
    } else {
      console.log(`[DEV] OTP for ${cleanPhone}: ${otp}`);
    }

    // In dev mode (no SMS key), include OTP in response so it can be tested
    const devOtp = !apiKey ? otp : undefined;
    return success(res, { phone: cleanPhone, ...(devOtp && { dev_otp: devOtp }) }, 'OTP पाठवला आहे.');
  } catch (err) {
    return error(res, 'OTP पाठवताना त्रुटी झाली.');
  }
};

// ── Verify OTP ────────────────────────────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    if (!phone || !otp) return error(res, 'फोन आणि OTP आवश्यक आहे.', 400);
    if (name && HTML_TAG_RE.test(String(name)))
      return error(res, 'नाव अवैध आहे. HTML टॅग वापरू नका.', 400);

    // Normalize phone: strip all non-digits and remove leading 91 prefix
    const cleanPhone = String(phone).replace(/\D/g, '').replace(/^91(\d{10})$/, '$1');

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE phone = ? AND otp_code = ? AND otp_expiry > NOW()',
      [cleanPhone, otp]
    );
    if (!rows.length) return error(res, 'OTP चुकीचा किंवा कालबाह्य झाला आहे.', 400);

    const user = rows[0];
    await pool.query(
      'UPDATE users SET is_verified=TRUE, otp_code=NULL, otp_expiry=NULL, name=COALESCE(?,name) WHERE id=?',
      [name || null, user.id]
    );

    const token = signToken(user);
    return success(res, { token, user: safeUser({ ...user, name: name || user.name }) }, 'OTP पडताळणी यशस्वी! 🙏');
  } catch (err) {
    return error(res, 'OTP पडताळताना त्रुटी झाली.');
  }
};

// ── Forgot Password — verify phone exists ─────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'फोन नंबर आवश्यक आहे.', 400);

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND is_active = TRUE', [phone]
    );
    if (!rows.length) return error(res, 'हा फोन नंबर नोंदणीकृत नाही.', 404);

    return success(res, { phone, verified: true }, 'फोन नंबर सापडला. नवीन पासवर्ड सेट करा.');
  } catch (err) {
    return error(res, 'त्रुटी झाली.');
  }
};

// ── Reset Password (no OTP) ───────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { phone, new_password } = req.body;
    if (!phone || !new_password)
      return error(res, 'फोन आणि नवीन पासवर्ड आवश्यक आहे.', 400);

    if (new_password.length < 6)
      return error(res, 'पासवर्ड किमान 6 अक्षरांचा असावा.', 400);

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE phone = ? AND is_active = TRUE', [phone]
    );
    if (!rows.length) return error(res, 'वापरकर्ता सापडला नाही.', 404);

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query(
      'UPDATE users SET password = ? WHERE phone = ?',
      [hashed, phone]
    );

    return success(res, {}, 'पासवर्ड यशस्वीरित्या बदलला! आता लॉगिन करा. 🎉');
  } catch (err) {
    return error(res, 'पासवर्ड रीसेट करताना त्रुटी झाली.');
  }
};

// ── Google OAuth ──────────────────────────────────────────────
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return error(res, 'Google credential आवश्यक आहे.', 400);

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { sub: google_id, name, email, picture: photo_url } = ticket.getPayload();

    const tid = req.tenantId || 1;

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE google_id = ? OR (email = ? AND email IS NOT NULL) LIMIT 1',
      [google_id, email || '']
    );

    let user;
    if (rows.length) {
      user = rows[0];
      if (!user.google_id || !user.photo_url) {
        await pool.query(
          'UPDATE users SET google_id = COALESCE(google_id, ?), photo_url = COALESCE(photo_url, ?) WHERE id = ?',
          [google_id, photo_url || null, user.id]
        );
      }
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (tenant_id, name, email, google_id, photo_url, is_verified, role) VALUES (?,?,?,?,?,TRUE,"user")',
        [tid, name, email || null, google_id, photo_url || null]
      );
      user = { id: result.insertId, name, email: email || null, role: 'user', tenant_id: tid };
    }

    const token = signToken(user);
    return success(res, { token, user: safeUser(user) }, `स्वागत आहे, ${user.name || name}! 🙏`);
  } catch (err) {
    console.error('[Google Auth]', err.message);
    return error(res, 'Google लॉगिन करताना त्रुटी झाली.');
  }
};

// ── Get Current User ──────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, phone, email, role, tenant_id, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    return success(res, rows[0]);
  } catch (err) {
    return error(res, 'माहिती मिळवताना त्रुटी झाली.');
  }
};
