const mysql = require('mysql2/promise');

mysql.createConnection({
  host: '159.89.167.218',
  port: 3306,
  user: 'pojjari_user',
  password: 'StrongPassword@2024!',
  database: 'pojjari_db'
}).then(c => {
  console.log('✅ Connected!');
  c.end();
}).catch(e => {
  console.log('❌ Error Code:', e.code);
  console.log('❌ Message:', e.message);
});