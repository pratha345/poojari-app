// src/routes/contact.routes.js
const router = require('express').Router();
const pool   = require('../config/db');
const { success, error } = require('../utils/response.util');

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !message) return error(res, 'नाव आणि संदेश आवश्यक आहे.', 400);
    await pool.query(
      'INSERT INTO contact_inquiries (name, email, phone, subject, message) VALUES (?,?,?,?,?)',
      [name, email, phone, subject, message]
    );
    return success(res, {}, 'संदेश पाठवला. आम्ही लवकरच संपर्क करू. 🙏');
  } catch (err) {
    return error(res, 'संदेश पाठवताना त्रुटी झाली.');
  }
});

module.exports = router;
