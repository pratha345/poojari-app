// src/app.js — Main Express Application
require('dotenv').config({ path: require('path').join(__dirname, '../env') });
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const path     = require('path');
const http     = require('http');
const { Server } = require('socket.io');
const { resolveTenant, attachTenant, subscriptionGate } = require('./middleware/tenant.middleware');

const app    = express();
const server = http.createServer(app);

// ── Socket.IO — real-time image generation progress ──────────
const io = new Server(server, {
  cors: {
    origin:      process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('join_tenant', (tenant_id) => {
    socket.join(`tenant_${tenant_id}`);
  });
  socket.on('disconnect', () => console.log(`🔌 Socket disconnected: ${socket.id}`));
});

// Make io accessible from controllers via req.app.get('io')
app.set('io', io);

// ── Core Middleware ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static Uploads ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  },
}));

// ── Debug: list generated festival images ─────────────────────
app.get('/api/debug/generated-images', (req, res) => {
  const dir = path.join(__dirname, '../uploads/festivals');
  try {
    const files = require('fs').existsSync(dir)
      ? require('fs').readdirSync(dir)
          .filter(f => !require('fs').statSync(path.join(dir, f)).isDirectory())
          .map(f => ({
            file: f,
            url:  `/uploads/festivals/${f}`,
            size: require('fs').statSync(path.join(dir, f)).size,
          }))
      : [];
    res.json({ dir, count: files.length, files });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// ── Tenant Resolution ─────────────────────────────────────────
app.use(resolveTenant);

// ── SEO ───────────────────────────────────────────────────────
app.use('/sitemap.xml', require('./routes/sitemap.routes'));

// ── Routes ────────────────────────────────────────────────────
// Shared public routes — no subscription gate (available to all tenants)
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/panchang',   require('./routes/panchang.routes'));
app.use('/api/blog',       require('./routes/blog.routes'));
app.use('/api/rashifal',   require('./routes/rashifal.routes'));
app.use('/api/superadmin', require('./routes/superadmin.routes'));
app.use('/api',            require('./routes/tenantRegister.routes'));
app.use('/api/subscription', require('./routes/subscription.routes'));

// Tenant-specific routes — gated by subscription
app.use('/api/poojas',     subscriptionGate, require('./routes/pooja.routes'));
app.use('/api/pujari',     subscriptionGate, require('./routes/pujari.routes'));
app.use('/api/bookings',   subscriptionGate, require('./routes/booking.routes'));
app.use('/api/admin',      subscriptionGate, require('./routes/admin.routes'));
app.use('/api/contact',    subscriptionGate, require('./routes/contact.routes'));
app.use('/api/theme',      subscriptionGate, require('./routes/theme.routes'));
app.use('/api/kundali',    subscriptionGate, require('./routes/kundali.routes'));
app.use('/api/home',       subscriptionGate, require('./routes/home.routes'));
app.use('/api/halls',      subscriptionGate, require('./routes/hall.routes'));
app.use('/api/gallery',    subscriptionGate, require('./routes/gallery.routes'));
app.use('/api/cities',     require('./routes/city.routes'));
app.use('/api/chat',         require('./routes/chat.routes'));
app.use('/api/tickets',      require('./routes/ticket.routes'));
app.use('/api/dharmasindhu', require('./routes/dharmasindhu.routes'));

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

// ── Startup Festival Seed — runs every restart, idempotent ────
async function checkNewYearFestivalUpdate() {
  try {
    const pool = require('./config/db');
    const { getFestivalsForYear } = require('./services/hinduFestivals');
    const year = new Date().getFullYear();

    // Check if current year already has festivals in DB
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM festival_themes WHERE YEAR(start_date) = ?',
      [year]
    );
    if (Number(count) > 0) return; // Already seeded — nothing to do

    // Seed current year's festivals
    const festivals = getFestivalsForYear(year);
    if (!festivals.length) return;
    const values = festivals.map(f => [f.festival_name, f.theme_name, f.start_date, f.end_date, f.is_active !== false]);
    await pool.query(
      'INSERT INTO festival_themes (festival_name, theme_name, start_date, end_date, is_active) VALUES ?',
      [values]
    );
    console.log(`✅ ${year} वर्षाचे ${festivals.length} सण आपोआप DB मध्ये जोडले`);
  } catch (e) {
    console.warn('⚠️ Festival auto-seed skipped:', e.message);
  }
}

// ── Start Server ──────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 पूजारी सर्व्हर पोर्ट ${PORT} वर सुरू आहे`);
    console.log(`🔌 Socket.IO ready`);
    setTimeout(checkNewYearFestivalUpdate, 3000);
    // Geocode any pujaris that don't yet have lat/lng (non-blocking, rate-limited)
    setTimeout(() => {
      require('./controllers/pujari.controller').geocodeAllPujaris();
    }, 8000);
  });
}

module.exports = app;
