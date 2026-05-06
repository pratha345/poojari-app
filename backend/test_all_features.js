/**
 * Comprehensive API Test — Pojjari Backend
 * Tests all major features: Auth, Pooja, Booking, Pujari, Kundali,
 * Panchang, Admin, Hall, Samagri, Janam Patrika, Theme, Home, Contact
 */

const http = require('http');
const https = require('https');

const BASE = 'http://localhost:5000/api';
let adminToken = '';
let userToken  = '';
let testUserId = null;

const TEST_PHONE  = '9' + Date.now().toString().slice(-9);
const ADMIN_PHONE = '9000000000';
const ADMIN_PASS  = 'Admin@123';

// ── Colours ──────────────────────────────────────────────────────
const green  = (s) => `\x1b[32m✔ ${s}\x1b[0m`;
const red    = (s) => `\x1b[31m✘ ${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m⚠ ${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;

// ── HTTP helper ───────────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve) => {
    const url     = path.startsWith('http') ? new URL(path) : new URL(BASE + path);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': payload ? Buffer.byteLength(payload) : 0,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, body: { error: 'timeout' } }); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Result tracker ────────────────────────────────────────────────
const results = [];
function log(section, label, status, detail = '') {
  const ok = status >= 200 && status < 300;
  const warn = status === 401 || status === 403 || status === 404;
  let icon;
  if (ok)   icon = green(`[${status}] ${label}`);
  else if (warn) icon = yellow(`[${status}] ${label}`);
  else icon = red(`[${status}] ${label}`);
  console.log(`  ${icon}${detail ? '  ' + detail : ''}`);
  results.push({ section, label, status, ok });
}

// ── Test sections ─────────────────────────────────────────────────

async function testAuth() {
  console.log(bold(cyan('\n══ 1. AUTH ══════════════════════════════')));

  // Register new user
  let r = await request('POST', '/auth/register', {
    name: 'Test User', phone: TEST_PHONE, password: 'Test@1234'
  });
  log('Auth', 'POST /register (new user)', r.status);
  if (r.body?.data?.token) userToken = r.body.data.token;

  // Duplicate register
  r = await request('POST', '/auth/register', {
    name: 'Test User', phone: TEST_PHONE, password: 'Test@1234'
  });
  log('Auth', 'POST /register (duplicate → 400)', r.status === 400 ? 200 : r.status,
    r.status === 400 ? 'correctly rejected' : 'unexpected status');

  // Login with correct creds
  r = await request('POST', '/auth/login', { phone: TEST_PHONE, password: 'Test@1234' });
  log('Auth', 'POST /login (valid)', r.status);
  if (r.body?.data?.token) userToken = r.body.data.token;

  // Login with wrong password
  r = await request('POST', '/auth/login', { phone: TEST_PHONE, password: 'wrongpass' });
  log('Auth', 'POST /login (bad password → 401)', r.status === 401 ? 200 : r.status,
    r.status === 401 ? 'correctly rejected' : 'unexpected');

  // GET /me
  r = await request('GET', '/auth/me', null, userToken);
  log('Auth', 'GET /me (authenticated)', r.status, r.body?.data?.name || '');
  if (r.body?.data?.id) testUserId = r.body.data.id;

  // GET /me without token
  r = await request('GET', '/auth/me');
  log('Auth', 'GET /me (no token → 401)', r.status === 401 ? 200 : r.status,
    r.status === 401 ? 'correctly blocked' : 'unexpected');

  // Forgot password
  r = await request('POST', '/auth/forgot-password', { phone: TEST_PHONE });
  log('Auth', 'POST /forgot-password', r.status);

  // Reset password
  r = await request('POST', '/auth/reset-password', {
    phone: TEST_PHONE, new_password: 'New@5678'
  });
  log('Auth', 'POST /reset-password', r.status);

  // Login with new password
  r = await request('POST', '/auth/login', { phone: TEST_PHONE, password: 'New@5678' });
  log('Auth', 'POST /login (after reset)', r.status);
  if (r.body?.data?.token) userToken = r.body.data.token;
}

async function testAdminLogin() {
  console.log(bold(cyan('\n══ 2. ADMIN LOGIN ═══════════════════════')));
  const r = await request('POST', '/auth/login', { phone: ADMIN_PHONE, password: ADMIN_PASS });
  log('Admin', `POST /login (admin: ${ADMIN_PHONE})`, r.status, r.body?.data?.user?.role || r.body?.message || '');
  if (r.body?.data?.token) {
    adminToken = r.body.data.token;
    console.log('  ' + green('Admin token acquired'));
  } else {
    console.log('  ' + yellow('No admin token — admin-only tests will be skipped or show 401'));
  }
}

async function testPanchang() {
  console.log(bold(cyan('\n══ 3. PANCHANG ═════════════════════════')));
  const r = await request('GET', '/panchang?date=2026-05-06&lat=18.52&lon=73.85&tz=5.5');
  log('Panchang', 'GET /panchang (with date+coords)', r.status,
    r.body?.data?.tithi || r.body?.data?.nakshatra || '');

  const r2 = await request('GET', '/panchang');
  log('Panchang', 'GET /panchang (no params — defaults)', r2.status);
}

async function testPooja() {
  console.log(bold(cyan('\n══ 4. POOJA ════════════════════════════')));

  let r = await request('GET', '/poojas/categories');
  log('Pooja', 'GET /poojas/categories', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} categories` : '');

  r = await request('GET', '/poojas');
  log('Pooja', 'GET /poojas (all)', r.status,
    Array.isArray(r.body?.data?.poojas) ? `${r.body.data.poojas.length} poojas` : '');

  r = await request('GET', '/poojas?featured=true');
  log('Pooja', 'GET /poojas?featured=true', r.status);

  r = await request('GET', '/poojas?search=ganesh');
  log('Pooja', 'GET /poojas?search=ganesh', r.status);

  r = await request('GET', '/poojas?page=1&limit=5');
  log('Pooja', 'GET /poojas?page=1&limit=5 (pagination)', r.status);

  // Try to get first pooja slug
  const poojas = r.body?.data?.poojas || [];
  if (poojas.length) {
    const slug = poojas[0].slug;
    r = await request('GET', `/poojas/${slug}`);
    log('Pooja', `GET /poojas/${slug} (by slug)`, r.status, poojas[0].name || '');
  } else {
    r = await request('GET', '/poojas/test-pooja-slug');
    log('Pooja', 'GET /poojas/:slug (no poojas in DB)', r.status);
  }

  // Create pooja (admin only — no multipart, just check auth)
  r = await request('POST', '/poojas', { name: 'Test', price: 100 });
  log('Pooja', 'POST /poojas (no token → 401)', r.status === 401 ? 200 : r.status,
    r.status === 401 ? 'correctly blocked' : '');
}

async function testBooking() {
  console.log(bold(cyan('\n══ 5. BOOKING ══════════════════════════')));

  // Get my bookings
  let r = await request('GET', '/bookings/my', null, userToken);
  log('Booking', 'GET /bookings/my', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} bookings` : '');

  // Try booking (likely to fail without valid pooja/pujari IDs — that's ok)
  r = await request('POST', '/bookings', {
    pooja_id: 1, booking_date: '2026-06-01', booking_time: '10:00',
    address: 'Test Address', city: 'Pune'
  }, userToken);
  log('Booking', 'POST /bookings (create, may fail w/o valid IDs)', r.status,
    r.body?.message || '');

  // No token
  r = await request('GET', '/bookings/my');
  log('Booking', 'GET /bookings/my (no token → 401)', r.status === 401 ? 200 : r.status,
    r.status === 401 ? 'correctly blocked' : '');
}

async function testKundali() {
  console.log(bold(cyan('\n══ 6. KUNDALI ══════════════════════════')));

  const payload = {
    bride: { name: 'Priya', dob: '1998-05-15', tob: '08:00', city: 'Pune' },
    groom: { name: 'Rahul', dob: '1995-03-20', tob: '10:30', city: 'Mumbai' }
  };

  // Match (calculate only)
  let r = await request('POST', '/kundali/match', payload, adminToken || userToken);
  log('Kundali', 'POST /kundali/match (gun milan)', r.status,
    r.body?.data?.total_gun != null ? `${r.body.data.total_gun} guns` : r.body?.message || '');

  // Save
  r = await request('POST', '/kundali/save', payload, adminToken || userToken);
  log('Kundali', 'POST /kundali/save', r.status, r.body?.message || '');
  const savedId = r.body?.data?.id;

  // List
  r = await request('GET', '/kundali', null, adminToken || userToken);
  log('Kundali', 'GET /kundali (list)', r.status,
    Array.isArray(r.body?.data?.matches) ? `${r.body.data.matches.length} records` : '');

  // Get by ID
  if (savedId) {
    r = await request('GET', `/kundali/${savedId}`, null, adminToken || userToken);
    log('Kundali', `GET /kundali/${savedId}`, r.status);

    // Delete
    r = await request('DELETE', `/kundali/${savedId}`, null, adminToken || userToken);
    log('Kundali', `DELETE /kundali/${savedId}`, r.status);
  }
}

async function testHall() {
  console.log(bold(cyan('\n══ 7. HALL ═════════════════════════════')));

  let r = await request('GET', '/halls');
  log('Hall', 'GET /halls (all)', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} halls` : '');

  r = await request('GET', '/halls?city=Pune');
  log('Hall', 'GET /halls?city=Pune', r.status);

  r = await request('GET', '/halls/nearby?lat=18.52&lng=73.85');
  log('Hall', 'GET /halls/nearby (lat/lng)', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} nearby halls` : r.body?.message || '');
}

async function testAdmin() {
  console.log(bold(cyan('\n══ 8. ADMIN ════════════════════════════')));

  const tok = adminToken || '';

  let r = await request('GET', '/admin/stats', null, tok);
  log('Admin', 'GET /admin/stats', r.status, r.body?.data ? JSON.stringify(Object.keys(r.body.data)) : r.body?.message || '');

  r = await request('GET', '/admin/pujaris/pending', null, tok);
  log('Admin', 'GET /admin/pujaris/pending', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} pending` : r.body?.message || '');

  r = await request('GET', '/admin/pujaris', null, tok);
  log('Admin', 'GET /admin/pujaris (approved)', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} pujaris` : r.body?.message || '');

  r = await request('GET', '/admin/bookings', null, tok);
  log('Admin', 'GET /admin/bookings', r.status,
    Array.isArray(r.body?.data?.bookings) ? `${r.body.data.bookings.length} bookings` : r.body?.message || '');

  r = await request('GET', '/admin/users', null, tok);
  log('Admin', 'GET /admin/users', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} users` : r.body?.message || '');

  r = await request('GET', '/admin/halls', null, tok);
  log('Admin', 'GET /admin/halls', r.status);

  // No token
  r = await request('GET', '/admin/stats');
  log('Admin', 'GET /admin/stats (no token → 401)', r.status === 401 ? 200 : r.status,
    r.status === 401 ? 'correctly blocked' : '');
}

async function testTheme() {
  console.log(bold(cyan('\n══ 9. THEME ════════════════════════════')));

  let r = await request('GET', '/theme');
  log('Theme', 'GET /theme (public)', r.status, r.body?.data ? 'theme data received' : '');

  r = await request('GET', '/theme/admin/festivals', null, adminToken || userToken);
  log('Theme', 'GET /theme/admin/festivals', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} festivals` : r.body?.message || '');
}

async function testHome() {
  console.log(bold(cyan('\n══ 10. HOME CONTENT ════════════════════')));

  const r = await request('GET', '/home');
  log('Home', 'GET /home (public)', r.status, r.body?.data ? 'home data received' : '');
}

async function testContact() {
  console.log(bold(cyan('\n══ 11. CONTACT ════════════════════════')));

  const r = await request('POST', '/contact', {
    name: 'Test User', email: 'test@example.com',
    phone: TEST_PHONE, message: 'API test message from test suite'
  });
  log('Contact', 'POST /contact', r.status, r.body?.message || '');
}

async function testJanamPatrika() {
  console.log(bold(cyan('\n══ 12. JANAM PATRIKA ═══════════════════')));

  const payload = {
    name: 'Test Person', dob: '1995-08-15', tob: '10:30', city: 'Pune',
    lat: 18.52, lon: 73.85
  };

  let r = await request('POST', '/admin/janam-patrika/generate', payload, adminToken || userToken);
  log('JanamPatrika', 'POST /admin/janam-patrika/generate', r.status, r.body?.message || '');

  r = await request('GET', '/admin/janam-patrika', null, adminToken || userToken);
  log('JanamPatrika', 'GET /admin/janam-patrika (list)', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} records` : r.body?.message || '');
}

async function testSamagri() {
  console.log(bold(cyan('\n══ 13. SAMAGRI ════════════════════════')));

  // Get samagri for pooja 1
  const r = await request('GET', '/admin/samagri/1', null, adminToken || userToken);
  log('Samagri', 'GET /admin/samagri/1', r.status,
    Array.isArray(r.body?.data) ? `${r.body.data.length} items` : r.body?.message || '');
}

async function testSitemap() {
  console.log(bold(cyan('\n══ 14. SITEMAP ════════════════════════')));

  const r = await new Promise((resolve) => {
    const req = http.get('http://localhost:5000/sitemap.xml', (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
  });
  log('Sitemap', 'GET /sitemap.xml', r.status,
    r.body?.includes('<?xml') ? 'valid XML' : r.body?.slice(0, 60) || '');
}

async function testSendOtp() {
  console.log(bold(cyan('\n══ 15. OTP ════════════════════════════')));

  const r = await request('POST', '/auth/send-otp', { phone: TEST_PHONE });
  log('OTP', 'POST /auth/send-otp', r.status, r.body?.message || '');
}

// ── Summary ───────────────────────────────────────────────────────
function printSummary() {
  console.log(bold(cyan('\n══ SUMMARY ════════════════════════════')));
  const passed  = results.filter((r) => r.ok).length;
  const failed  = results.filter((r) => !r.ok).length;
  console.log(`  Total: ${results.length}  ${green(passed + ' passed')}  ${failed ? red(failed + ' failed') : '0 failed'}`);

  const failures = results.filter((r) => !r.ok);
  if (failures.length) {
    console.log(bold('\n  Failed tests:'));
    failures.forEach((f) => console.log(`    ${red('[' + f.status + '] ' + f.section + ' — ' + f.label)}`));
  }
  console.log('');
}

// ── Run all ───────────────────────────────────────────────────────
(async () => {
  console.log(bold(cyan('═══════════════════════════════════════════')));
  console.log(bold(cyan('   Pojjari API — Full Feature Test Suite   ')));
  console.log(bold(cyan('═══════════════════════════════════════════')));

  await testAuth();
  await testAdminLogin();
  await testPanchang();
  await testPooja();
  await testBooking();
  await testKundali();
  await testHall();
  await testAdmin();
  await testTheme();
  await testHome();
  await testContact();
  await testJanamPatrika();
  await testSamagri();
  await testSitemap();
  await testSendOtp();

  printSummary();
})();
