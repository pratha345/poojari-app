// src/controllers/blog.controller.js
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');

// ── Public: List published posts ──────────────────────────────
exports.list = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 9 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['is_published = 1'];
    const params = [];

    if (category) { where.push('category = ?'); params.push(category); }
    if (search)   { where.push('(title LIKE ? OR excerpt LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const whereClause = where.join(' AND ');

    const [posts] = await pool.query(
      `SELECT id, title, slug, excerpt, image_url, author_name, category, tags, read_time, views, created_at
       FROM blog_posts WHERE ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM blog_posts WHERE ${whereClause}`, params
    );

    return success(res, { posts, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('blog.list error:', err);
    return error(res, 'ब्लॉग यादी मिळवता आली नाही.');
  }
};

// ── Public: Get single post by slug ──────────────────────────
exports.getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { session_id } = req.query;
    const [rows] = await pool.query(
      'SELECT * FROM blog_posts WHERE slug = ? AND is_published = 1', [slug]
    );
    if (!rows.length) return error(res, 'लेख सापडला नाही.', 404);

    // Increment views by random 1–9 (natural-looking count)
    const viewInc = Math.floor(Math.random() * 9) + 1;
    await pool.query('UPDATE blog_posts SET views = views + ? WHERE id = ?', [viewInc, rows[0].id]);

    // User's existing rating for this session
    let user_rating = null;
    if (session_id) {
      const [[ur]] = await pool.query(
        'SELECT rating FROM blog_ratings WHERE blog_post_id = ? AND session_id = ?',
        [rows[0].id, session_id]
      );
      if (ur) user_rating = ur.rating;
    }

    // Related posts — same category, different slug
    const [related] = await pool.query(
      `SELECT id, title, slug, excerpt, image_url, category, read_time, created_at
       FROM blog_posts WHERE category = ? AND slug != ? AND is_published = 1
       ORDER BY created_at DESC LIMIT 3`,
      [rows[0].category, slug]
    );

    return success(res, { post: rows[0], related, user_rating });
  } catch (err) {
    console.error('blog.getBySlug error:', err);
    return error(res, 'लेख मिळवता आला नाही.');
  }
};

// ── Public: Categories with post count ───────────────────────
exports.categories = async (req, res) => {
  try {
    const [cats] = await pool.query(
      `SELECT category, COUNT(*) AS count
       FROM blog_posts WHERE is_published = 1
       GROUP BY category ORDER BY count DESC`
    );
    return success(res, cats);
  } catch (err) {
    return error(res, 'श्रेणी मिळवता आल्या नाहीत.');
  }
};

// ── Admin: List all posts ─────────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const [posts] = await pool.query(
      `SELECT id, title, slug, excerpt, content, image_url, category, author_name,
              read_time, tags, is_published, views, created_at, updated_at
       FROM blog_posts ORDER BY created_at DESC`
    );
    return success(res, posts);
  } catch (err) {
    return error(res, 'लेख यादी मिळवता आली नाही.');
  }
};

// ── Admin: Create post ────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, slug, excerpt, content, author_name, category, tags, read_time, is_published } = req.body;
    if (!title || !slug || !content) return error(res, 'शीर्षक, slug आणि मजकूर आवश्यक आहे.', 400);

    const image_url = req.file ? `/uploads/blog/${req.file.filename}` : null;
    const tagsJson  = tags ? JSON.stringify(typeof tags === 'string' ? JSON.parse(tags) : tags) : null;

    const [result] = await pool.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, image_url, author_name, category, tags, read_time, is_published)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [title, slug, excerpt || null, content, image_url, author_name || 'पूजारी टीम', category || 'पूजा मार्गदर्शन', tagsJson, read_time || 5, is_published ? 1 : 0]
    );
    return success(res, { id: result.insertId }, 'लेख यशस्वीरित्या जोडला.', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'हा slug आधीच वापरला आहे.', 400);
    console.error('blog.create error:', err);
    return error(res, 'लेख जोडताना त्रुटी झाली.');
  }
};

// ── Admin: Update post ────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, content, author_name, category, tags, read_time, is_published } = req.body;

    const tagsJson = tags ? JSON.stringify(typeof tags === 'string' ? JSON.parse(tags) : tags) : null;
    const image_url = req.file ? `/uploads/blog/${req.file.filename}` : undefined;

    const fields = ['title=?','slug=?','excerpt=?','content=?','author_name=?','category=?','tags=?','read_time=?','is_published=?'];
    const values = [title, slug, excerpt||null, content, author_name||'पूजारी टीम', category||'पूजा मार्गदर्शन', tagsJson, read_time||5, is_published?1:0];

    if (image_url !== undefined) { fields.push('image_url=?'); values.push(image_url); }
    values.push(id);

    await pool.query(`UPDATE blog_posts SET ${fields.join(',')} WHERE id = ?`, values);
    return success(res, {}, 'लेख यशस्वीरित्या अद्यतनित केला.');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'हा slug आधीच वापरला आहे.', 400);
    console.error('blog.update error:', err);
    return error(res, 'लेख अद्यतनित करताना त्रुटी झाली.');
  }
};

// ── Admin: Toggle publish ─────────────────────────────────────
exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE blog_posts SET is_published = NOT is_published WHERE id = ?', [id]);
    const [[post]] = await pool.query('SELECT is_published FROM blog_posts WHERE id = ?', [id]);
    return success(res, { is_published: post.is_published }, post.is_published ? 'प्रकाशित केला.' : 'मसुदा केला.');
  } catch (err) {
    return error(res, 'स्थिती बदलता आली नाही.');
  }
};

// ── Public: Rate a blog post ──────────────────────────────────
exports.rateBlog = async (req, res) => {
  try {
    const { slug } = req.params;
    const { rating, session_id } = req.body;
    if (!rating || rating < 1 || rating > 5) return error(res, 'रेटिंग १ ते ५ दरम्यान असावे.', 400);
    if (!session_id) return error(res, 'session_id आवश्यक आहे.', 400);

    const [[post]] = await pool.query('SELECT id FROM blog_posts WHERE slug = ? AND is_published = 1', [slug]);
    if (!post) return error(res, 'लेख सापडला नाही.', 404);

    await pool.query(
      `INSERT INTO blog_ratings (blog_post_id, session_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [post.id, session_id, rating]
    );

    // Recalculate avg
    await pool.query(
      `UPDATE blog_posts SET
         avg_rating   = (SELECT ROUND(AVG(rating), 2) FROM blog_ratings WHERE blog_post_id = ?),
         rating_count = (SELECT COUNT(*) FROM blog_ratings WHERE blog_post_id = ?)
       WHERE id = ?`,
      [post.id, post.id, post.id]
    );

    const [[updated]] = await pool.query('SELECT avg_rating, rating_count FROM blog_posts WHERE id = ?', [post.id]);
    return success(res, { avg_rating: updated.avg_rating, rating_count: updated.rating_count }, 'रेटिंग दिल्याबद्दल धन्यवाद! 🙏');
  } catch (err) {
    console.error('rateBlog error:', err);
    return error(res, 'रेटिंग देताना त्रुटी झाली.');
  }
};

// ── Admin: Delete post ────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM blog_posts WHERE id = ?', [id]);
    return success(res, {}, 'लेख काढला.');
  } catch (err) {
    return error(res, 'लेख काढताना त्रुटी झाली.');
  }
};
