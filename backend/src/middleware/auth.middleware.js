// src/middleware/auth.middleware.js
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');
const { error } = require('../utils/response.util');

// ── Verify JWT Token ──────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'प्रमाणीकरण आवश्यक आहे.', 401);
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      'SELECT id, name, phone, email, role, is_active FROM users WHERE id = ?',
      [decoded.id]
    );
    if (!rows.length || !rows[0].is_active) {
      return error(res, 'वापरकर्ता सापडला नाही.', 401);
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return error(res, 'अवैध टोकन.', 401);
  }
};

// ── Role Guard ────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return error(res, 'परवानगी नाही.', 403);
  }
  next();
};

module.exports = { authenticate, authorize };
