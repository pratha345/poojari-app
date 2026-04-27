// src/app.js — Main Express Application
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const path       = require('path');

const app = express();

// ── Middleware ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/poojas',   require('./routes/pooja.routes'));
app.use('/api/pujari',   require('./routes/pujari.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));
app.use('/api/contact',  require('./routes/contact.routes'));
app.use('/api/panchang', require('./routes/panchang.routes'));
app.use('/api/kundali',  require('./routes/kundali.routes'));
app.use('/api/home',     require('./routes/home.routes'));

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'पूजारी सर्व्हर चालू आहे 🙏' });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'मार्ग सापडला नाही.' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'सर्व्हर त्रुटी झाली. कृपया पुन्हा प्रयत्न करा.',
  });
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 पूजारी सर्व्हर पोर्ट ${PORT} वर सुरू आहे`);
});

module.exports = app;
