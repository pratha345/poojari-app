const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'env' });
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  // Show all existing samagri items with pooja name
  const [rows] = await conn.query(`
    SELECT s.id, p.name_mr as pooja, s.name_mr, s.name_en, s.quantity, s.unit, s.note, s.sort_order
    FROM samagri_items s
    JOIN poojas p ON p.id = s.pooja_id
    ORDER BY s.pooja_id, s.sort_order
  `);
  rows.forEach(r => {
    console.log(`[${r.pooja}] ${r.name_mr} | qty: ${r.quantity} | unit: ${r.unit} | note: ${r.note}`);
  });
  await conn.end();
})().catch(e => console.error(e.message));
