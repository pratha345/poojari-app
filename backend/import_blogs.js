const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function run() {
  const pool = await mysql.createConnection({
    host:     '159.89.167.218',
    port:     3306,
    user:     'pojjari_user',
    password: 'StrongPassword@2024!',
    database: 'pojjari_db',
    multipleStatements: true,
  });

  const files = [
    path.join(__dirname, 'src/config/blog_articles_1_10.sql'),
    path.join(__dirname, 'src/config/blog_articles_11_20.sql'),
    path.join(__dirname, 'src/config/blog_articles_21_40.sql'),
    path.join(__dirname, 'src/config/blog_articles_49_75.sql'),
  ];

  for (const file of files) {
    console.log(`\nImporting: ${path.basename(file)}`);
    const sql = fs.readFileSync(file, 'utf8');
    try {
      await pool.query(sql);
      console.log(`✅ Done: ${path.basename(file)}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log(`⚠️  Skipped (already imported): ${path.basename(file)}`);
      } else {
        console.error(`❌ Error in ${path.basename(file)}:`, err.message);
      }
    }
  }

  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM blog_posts');
  console.log(`\n📊 Total blog posts in DB: ${rows[0].total}`);

  await pool.end();
}

run().catch(console.error);
