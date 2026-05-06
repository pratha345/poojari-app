// seed-super-admin.js — Run once: node seed-super-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./src/config/db');

async function seed() {
  const email    = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@pojjari.com';
  const phone    = process.env.SUPER_ADMIN_PHONE    || '9999999999';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
  const name     = 'Super Admin';

  const hashed = await bcrypt.hash(password, 10);

  // super_admin has tenant_id = NULL
  await pool.query(
    `INSERT INTO users (tenant_id, name, phone, email, password, role, is_verified, is_active)
     VALUES (NULL, ?, ?, ?, ?, 'super_admin', TRUE, TRUE)
     ON DUPLICATE KEY UPDATE password=?, role='super_admin'`,
    [name, phone, email, hashed, hashed]
  );

  console.log('✅ Super Admin created!');
  console.log(`   Email: ${email}`);
  console.log(`   Phone: ${phone}`);
  console.log(`   Pass:  ${password}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
