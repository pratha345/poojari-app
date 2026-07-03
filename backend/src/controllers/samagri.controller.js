const pool = require('../config/db');

exports.getByPooja = async (req, res) => {
  try {
    const { pooja_id } = req.params;
    const tenantId     = req.tenantId || 1;

    // Tenant override → global fallback
    if (tenantId > 1) {
      const [tenantRows] = await pool.query(
        'SELECT * FROM tenant_samagri_config WHERE tenant_id = ? AND pooja_id = ? ORDER BY sort_order',
        [tenantId, pooja_id]
      );
      if (tenantRows.length > 0) {
        return res.json({ success: true, data: tenantRows, source: 'tenant' });
      }
    }

    const [rows] = await pool.query(
      'SELECT * FROM samagri_items WHERE pooja_id = ? ORDER BY sort_order',
      [pooja_id]
    );
    res.json({ success: true, data: rows, source: 'global' });
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

// OCR — extract samagri list from handwritten image using Groq Vision (Llama 4)
exports.ocrImage = async (req, res) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY env मध्ये set नाही.' });
    if (!req.file)
      return res.status(400).json({ success: false, message: 'Image file आवश्यक आहे.' });

    const base64    = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype; // image/jpeg, image/png, image/webp

    const apiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:      'meta-llama/llama-4-scout-17b-16e-instruct',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type:      'image_url',
              image_url: { url: `data:${mediaType};base64,${base64}` },
            },
            {
              type: 'text',
              text: `हे एक हस्तलिखित पूजा साहित्य यादीचे (pooja samagri list) फोटो आहे.
प्रत्येक item वाचा आणि खालील JSON array format मध्ये द्या.

Rules:
- name_mr: मराठीत नाव (जसे लिहिले आहे तसे)
- quantity: फक्त संख्या असेल तर — नाहीतर ""
- unit: एकक जर लिहिले असेल तर (नग/ग्रॅम/किलो/मिली/लिटर/जुडी/gm/kg) — नाहीतर ""
- नारळ, सुपारी, केळी, पान, लिंबू सारखे मोजता येणारे items → unit "नग"

फक्त JSON array द्या, बाकी काहीही नको:
[{"name_mr":"हळद","quantity":"100","unit":"ग्रॅम"},{"name_mr":"नारळ","quantity":"2","unit":"नग"}]`,
            },
          ],
        }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Groq OCR API error:', errText);
      return res.status(500).json({ success: false, message: 'OCR API error. Key तपासा.' });
    }

    const data      = await apiRes.json();
    const text      = data.choices?.[0]?.message?.content || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch)
      return res.status(500).json({ success: false, message: 'Image मधून यादी काढता आली नाही. नीट लिहिलेला फोटो वापरा.' });

    const items = JSON.parse(jsonMatch[0]);
    res.json({ success: true, items });
  } catch (err) {
    console.error('ocrImage error:', err);
    res.status(500).json({ success: false, message: 'OCR करता आले नाही.' });
  }
};

// Bulk create — accepts array of items
exports.bulkCreate = async (req, res) => {
  try {
    const { pooja_id, items } = req.body;
    if (!pooja_id || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'पूजा आणि यादी आवश्यक आहे.' });

    const values = items.map((it, i) => [
      pooja_id,
      it.name_mr,
      it.name_en   || null,
      it.quantity  || null,
      it.unit      || null,
      it.note      || null,
      it.sort_order ?? i + 1,
    ]);

    await pool.query(
      'INSERT INTO samagri_items (pooja_id, name_mr, name_en, quantity, unit, note, sort_order) VALUES ?',
      [values]
    );
    res.json({ success: true, message: `${items.length} साहित्य जोडले.` });
  } catch (err) {
    console.error('bulkCreate samagri error:', err);
    res.status(500).json({ success: false, message: 'Bulk import करता आले नाही.' });
  }
};

// Reorder — bulk update sort_order
exports.reorder = async (req, res) => {
  try {
    const { items } = req.body; // [{id, sort_order}, ...]
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ success: false, message: 'items आवश्यक आहे.' });

    await Promise.all(
      items.map(it => pool.query('UPDATE samagri_items SET sort_order=? WHERE id=?', [it.sort_order, it.id]))
    );
    res.json({ success: true, message: 'क्रम जतन केला.' });
  } catch (err) {
    console.error('reorder samagri error:', err);
    res.status(500).json({ success: false, message: 'क्रम जतन करता आला नाही.' });
  }
};

// Delete all items for a pooja
exports.deleteAllByPooja = async (req, res) => {
  try {
    const { pooja_id } = req.params;
    const [result] = await pool.query('DELETE FROM samagri_items WHERE pooja_id=?', [pooja_id]);
    res.json({ success: true, message: `${result.affectedRows} साहित्य हटवले.`, count: result.affectedRows });
  } catch (err) {
    console.error('deleteAllByPooja error:', err);
    res.status(500).json({ success: false, message: 'सर्व साहित्य हटवता आले नाही.' });
  }
};
