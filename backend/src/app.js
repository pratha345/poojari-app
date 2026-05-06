// src/app.js — Main Express Application
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const path    = require('path');
const { resolveTenant, attachTenant } = require('./middleware/tenant.middleware');

const app = express();

// ── Core Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Attach tenant from subdomain/header on every request (public fallback)
app.use(resolveTenant);

// For authenticated routes, attachTenant is called per-router (see admin/superadmin routes)

// ── SEO ───────────────────────────────────────────────────────
app.use('/sitemap.xml',     require('./routes/sitemap.routes'));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/poojas',      require('./routes/pooja.routes'));
app.use('/api/pujari',      require('./routes/pujari.routes'));
app.use('/api/bookings',    require('./routes/booking.routes'));
app.use('/api/admin',       require('./routes/admin.routes'));
app.use('/api/contact',     require('./routes/contact.routes'));
app.use('/api/theme',       require('./routes/theme.routes'));
app.use('/api/panchang',    require('./routes/panchang.routes'));
app.use('/api/kundali',     require('./routes/kundali.routes'));
app.use('/api/home',        require('./routes/home.routes'));
app.use('/api/superadmin',  require('./routes/superadmin.routes'));
app.use('/api/halls',       require('./routes/hall.routes'));

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', tenant: req.tenant?.slug || 'unknown', message: 'पूजारी सर्व्हर चालू आहे 🙏' });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: 'मार्ग सापडला नाही.' }));

// ── Global Error ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'सर्व्हर त्रुटी झाली.' });
});

// ── Wire attachTenant into admin routes ───────────────────────
// (done inside each route file that needs req.tenantId)

// Only bind the port when running directly (not when required by tests)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 पूजारी सर्व्हर पोर्ट ${PORT} वर सुरू आहे`));
}

module.exports = app;
