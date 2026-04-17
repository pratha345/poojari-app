// seed-admin.js — creates or fixes the admin user
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './env' });

const ADMIN = {
  name:     'Admin',
  email:    'admin@pojjari.com',
  phone:    '9000000000',
  password: 'Admin@123',
  role:     'admin',
};

(async () => {
  const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const hashed = await bcrypt.hash(ADMIN.password, 10);

    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ?', [ADMIN.email]
    );

    if (rows.length) {
      await pool.query(
        `UPDATE users SET name=?, phone=?, password=?, role=?, is_active=1, is_verified=1
         WHERE email=?`,
        [ADMIN.name, ADMIN.phone, hashed, ADMIN.role, ADMIN.email]
      );
      console.log('✅ Admin user updated successfully.');
    } else {
      await pool.query(
        `INSERT INTO users (name, email, phone, password, role, is_active, is_verified)
         VALUES (?, ?, ?, ?, ?, 1, 1)`,
        [ADMIN.name, ADMIN.email, ADMIN.phone, hashed, ADMIN.role]
      );
      console.log('✅ Admin user created successfully.');
    }

    console.log('');
    console.log('Login credentials:');
    console.log('  Email   :', ADMIN.email);
    console.log('  Phone   :', ADMIN.phone);
    console.log('  Password:', ADMIN.password);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();
