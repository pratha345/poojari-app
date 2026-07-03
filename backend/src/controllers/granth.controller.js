// src/controllers/granth.controller.js — Granth Library: upload PDF + OCR + Q&A
const pool   = require('../config/db');
const { success, error } = require('../utils/response.util');
const { getCache, setCache, delCache, delCachePattern } = require('../utils/redis');
const path   = require('path');
const fs     = require('fs');
const { spawn } = require('child_process');
const crypto = require('crypto');

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const CHAT_MODEL = 'llama-3.3-70b-versatile';
const UPLOAD_DIR = path.join(__dirname, '../../uploads/granths');
const OCR_SCRIPT = path.join(__dirname, '../../scripts/ocr_granth.py');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ── Upload PDF ────────────────────────────────────────────────────────────────
exports.uploadGranth = async (req, res) => {
  try {
    if (!req.file) return error(res, 'PDF file आवश्यक आहे.', 400);
    const { title, author = '', language = 'marathi', description = '' } = req.body;
    if (!title?.trim()) return error(res, 'ग्रंथाचे नाव द्या.', 400);

    const [result] = await pool.query(
      `INSERT INTO granth_books (title, author, language, description, filename, original_name, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [title.trim(), author.trim(), language, description.trim(), req.file.filename, req.file.originalname]
    );
    const bookId = result.insertId;

    // Start OCR background process
    _startOCR(bookId, req.file.path);

    delCache('granth:list').catch(() => {});
    return success(res, { book_id: bookId, title: title.trim(), message: 'Upload यशस्वी. OCR सुरू होत आहे...' });
  } catch (err) {
    console.error('uploadGranth error:', err);
    return error(res, 'Upload करताना त्रुटी झाली.');
  }
};

function _startOCR(bookId, pdfPath) {
  const apiKey = process.env.GROQ_API_KEY || '';
  const proc = spawn('python3', [OCR_SCRIPT, `--book_id=${bookId}`, `--pdf_path=${pdfPath}`, `--api_key=${apiKey}`], {
    detached: true,
    stdio: ['ignore', fs.openSync(`/tmp/ocr_granth_${bookId}.log`, 'a'), fs.openSync(`/tmp/ocr_granth_${bookId}_err.log`, 'a')],
  });
  proc.unref();
  pool.query('UPDATE granth_books SET status=? WHERE id=?', ['processing', bookId]).catch(() => {});
}

// ── List all books ────────────────────────────────────────────────────────────
exports.listGranths = async (req, res) => {
  try {
    const cached = await getCache('granth:list');
    if (cached) return success(res, cached);

    const [rows] = await pool.query(
      `SELECT id, title, author, language, description, original_name,
              total_pages, processed_pages, status, created_at
       FROM granth_books ORDER BY created_at DESC`
    );
    const data = rows.map(r => ({
      ...r,
      pct: r.total_pages > 0 ? Math.round((r.processed_pages / r.total_pages) * 100) : 0,
    }));

    // Short TTL: 15s — frontend polls every 8s, this halves DB hits while keeping progress fresh
    const anyProcessing = data.some(b => b.status === 'processing' || b.status === 'pending');
    await setCache('granth:list', data, anyProcessing ? 8 : 60);

    return success(res, data);
  } catch (err) {
    return error(res, 'यादी मिळवताना त्रुटी.');
  }
};

// ── Book status ───────────────────────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const [[book]] = await pool.query('SELECT * FROM granth_books WHERE id = ?', [req.params.id]);
    if (!book) return error(res, 'ग्रंथ सापडला नाही.', 404);
    const [[{ page_count }]] = await pool.query('SELECT COUNT(*) AS page_count FROM granth_pages WHERE book_id = ?', [req.params.id]);
    return success(res, {
      ...book,
      page_count,
      pct: book.total_pages > 0 ? Math.round((book.processed_pages / book.total_pages) * 100) : 0,
    });
  } catch (err) {
    return error(res, 'Status मिळवताना त्रुटी.');
  }
};

// ── Ask question ──────────────────────────────────────────────────────────────
exports.ask = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;
    if (!question?.trim()) return error(res, 'प्रश्न लिहा.', 400);

    const [[book]] = await pool.query('SELECT * FROM granth_books WHERE id = ?', [id]);
    if (!book) return error(res, 'ग्रंथ सापडला नाही.', 404);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return error(res, 'GROQ_API_KEY set नाही.', 500);

    const qHash   = crypto.createHash('md5').update(`g${id}:${question.trim().toLowerCase()}`).digest('hex');
    const cacheKey = `granth:ask:${qHash}`;
    const cached   = await getCache(cacheKey);
    if (cached) return success(res, cached);

    const keywords = await _extractKeywords(question, apiKey);
    const sources  = await _searchPages(id, keywords, question);

    if (!sources.length) {
      return success(res, {
        answer: `या ग्रंथात हा विषय सापडला नाही. OCR ${book.processed_pages}/${book.total_pages} पाने पूर्ण झाली आहेत — अजून काही पाने बाकी असतील.`,
        sources: [], book_title: book.title, has_content: false,
      });
    }

    const context = sources
      .map(r => `[पान ${r.page_no}]:\n${r.content.length > 1400 ? r.content.substring(0, 1400) + '...' : r.content}`)
      .join('\n\n---\n\n');

    const systemPrompt = `You are a scholar of "${book.title}"${book.author ? ` (${book.author})` : ''}. Answer using ONLY the passages provided below.

Answer format (in this exact order):

**📖 ${book.title} सांगतो:**
(Quote the relevant passage exactly as it appears)

**🔤 मराठी अनुवाद:**
(Clear, simple modern Marathi translation)

**✅ सारांश:**
(2-3 line practical summary in simple Marathi)

**🇬🇧 English Summary:**
(Same summary in plain English — 2-3 lines)

**📌 संदर्भ:** (page numbers used)

Rules:
- Use ONLY what is in the provided passages
- If answer not found in passages, say clearly in Marathi
- Keep total answer under 400 words
- English section must always be present

Passages from ${book.title}:
${context}`;

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL, temperature: 0.3, max_tokens: 1800,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq error:', await groqRes.text());
      return error(res, 'AI सेवा उपलब्ध नाही.', 503);
    }

    const groqData = await groqRes.json();
    const answer   = groqData.choices?.[0]?.message?.content?.trim() || 'उत्तर मिळाले नाही.';

    const responseData = {
      answer,
      book_title: book.title,
      has_content: true,
      sources: sources
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .map(r => ({
          page_no: r.page_no,
          excerpt: r.content.substring(0, 600) + (r.content.length > 600 ? '...' : ''),
        })),
    };

    await setCache(cacheKey, responseData, 24 * 60 * 60);
    return success(res, responseData);
  } catch (err) {
    console.error('granth ask error:', err);
    return error(res, 'प्रश्न विचारताना त्रुटी झाली.');
  }
};

// ── Delete book ───────────────────────────────────────────────────────────────
exports.deleteGranth = async (req, res) => {
  try {
    const [[book]] = await pool.query('SELECT * FROM granth_books WHERE id = ?', [req.params.id]);
    if (!book) return error(res, 'ग्रंथ सापडला नाही.', 404);

    const pdfPath = path.join(UPLOAD_DIR, book.filename);
    if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

    await pool.query('DELETE FROM granth_books WHERE id = ?', [req.params.id]);

    // Clear this book's Q&A cache + list cache
    await Promise.all([
      delCachePattern(`granth:ask:*`),
      delCache('granth:list'),
    ]);

    return success(res, { message: `"${book.title}" काढला.` });
  } catch (err) {
    return error(res, 'Delete करताना त्रुटी.');
  }
};

// ── Restart OCR (if stuck/error) ──────────────────────────────────────────────
exports.restartOCR = async (req, res) => {
  try {
    const [[book]] = await pool.query('SELECT * FROM granth_books WHERE id = ?', [req.params.id]);
    if (!book) return error(res, 'ग्रंथ सापडला नाही.', 404);

    const pdfPath = path.join(UPLOAD_DIR, book.filename);
    if (!fs.existsSync(pdfPath)) return error(res, 'PDF file सापडली नाही.', 404);

    _startOCR(book.id, pdfPath);
    delCache('granth:list').catch(() => {});
    return success(res, { message: 'OCR पुन्हा सुरू केला.' });
  } catch (err) {
    return error(res, 'Restart करताना त्रुटी.');
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function _extractKeywords(question, apiKey) {
  try {
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL, max_tokens: 80, temperature: 0,
        messages: [{
          role: 'user',
          content: `Convert this question into 4-6 Marathi/Sanskrit search keywords (Devanagari only, comma separated, no explanation):\n"${question}"\nKeywords:`,
        }],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim().replace(/[a-zA-Z\[\]\(\)]/g, '') || null;
  } catch (_) { return null; }
}

async function _searchPages(bookId, keywords, question) {
  let sources = [];

  if (keywords) {
    const kw = keywords.split(/[,\s]+/).filter(w => w.length >= 2);
    const mq = kw.length > 0 ? ('+' + kw[0] + (kw.length > 1 ? ' ' + kw.slice(1).join(' ') : '')) : keywords;
    try {
      const [rows] = await pool.query(
        `SELECT page_no, content, MATCH(content) AGAINST (? IN BOOLEAN MODE) AS score
         FROM granth_pages WHERE book_id = ? AND MATCH(content) AGAINST (? IN BOOLEAN MODE)
         ORDER BY score DESC LIMIT 5`,
        [mq, bookId, mq]
      );
      sources = rows.filter(r => r.score > 0);
    } catch (_) {}
  }

  if (sources.length < 2) {
    const qWords = question.trim().split(/\s+/).filter(w => w.length >= 2).join(' ');
    try {
      const [rows] = await pool.query(
        `SELECT page_no, content, MATCH(content) AGAINST (? IN BOOLEAN MODE) AS score
         FROM granth_pages WHERE book_id = ? AND MATCH(content) AGAINST (? IN BOOLEAN MODE)
         ORDER BY score DESC LIMIT 4`,
        [qWords, bookId, qWords]
      );
      const newRows = rows.filter(r => r.score > 1 && !sources.find(s => s.page_no === r.page_no));
      sources = [...sources, ...newRows].slice(0, 4);
    } catch (_) {}
  }

  return sources;
}
