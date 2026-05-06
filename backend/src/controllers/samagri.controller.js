const pool = require('../config/db');

exports.getByPooja = async (req, res) => {
  try {
    const { pooja_id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM samagri_items WHERE pooja_id = ? ORDER BY sort_order',
      [pooja_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getByPooja error:', err);
    res.status(500).json({ success: false, message: 'साहित्य मिळवता आली नाही.' });
  }
};

exports.create = async (req, res) => {
  try {
    const { pooja_id, name_mr, name_en, quantity, unit, note, sort_order } = req.body;
    if (!pooja_id || !name_mr)
      return res.status(400).json({ success: false, message: 'पूजा आणि नाव आवश्यक आहे.' });

    const [r] = await pool.query(
      'INSERT INTO samagri_items (pooja_id, name_mr, name_en, quantity, unit, note, sort_order) VALUES (?,?,?,?,?,?,?)',
      [pooja_id, name_mr, name_en || null, quantity || null, unit || null, note || null, sort_order || 0]
    );
    res.json({ success: true, message: 'साहित्य जोडले.', id: r.insertId });
  } catch (err) {
    console.error('create samagri error:', err);
    res.status(500).json({ success: false, message: 'साहित्य जोडता आले नाही.' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name_mr, name_en, quantity, unit, note, sort_order } = req.body;
    await pool.query(
      'UPDATE samagri_items SET name_mr=?, name_en=?, quantity=?, unit=?, note=?, sort_order=? WHERE id=?',
      [name_mr, name_en || null, quantity || null, unit || null, note || null, sort_order || 0, id]
    );
    res.json({ success: true, message: 'साहित्य अपडेट केले.' });
  } catch (err) {
    console.error('update samagri error:', err);
    res.status(500).json({ success: false, message: 'साहित्य अपडेट करता आले नाही.' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM samagri_items WHERE id=?', [id]);
    res.json({ success: true, message: 'साहित्य हटवले.' });
  } catch (err) {
    console.error('remove samagri error:', err);
    res.status(500).json({ success: false, message: 'साहित्य हटवता आले नाही.' });
  }
};
