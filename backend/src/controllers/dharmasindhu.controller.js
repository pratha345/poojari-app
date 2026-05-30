// src/controllers/dharmasindhu.controller.js
// Dharmasindhu शंका समाधान — FULLTEXT search + Groq Chat AI
const pool = require('../config/db');
const { success, error }               = require('../utils/response.util');
const { getCache, setCache }           = require('../utils/redis');
const crypto                           = require('crypto');

const DS_TTL = 24 * 60 * 60; // 24 hours — same question gives same answer

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const CHAT_MODEL = 'llama-3.3-70b-versatile';

// ── OCR Progress Status ───────────────────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const [[prog]] = await pool.query('SELECT * FROM dharmasindhu_ocr_progress WHERE id = 1');
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM dharmasindhu_content');

    return success(res, {
      total_pages:     prog?.total_pages     || 841,
      processed_pages: prog?.processed_pages || total,
      status:          prog?.status          || 'idle',
      started_at:      prog?.started_at      || null,
      completed_at:    prog?.completed_at    || null,
      content_rows:    total,
      ready:           total > 0,
    });
  } catch (err) {
    return error(res, 'Status मिळवताना त्रुटी.');
  }
};

// ── Step 1: Extract Marathi search keywords from any language query ───────────
async function extractMarathiKeywords(question, apiKey) {
  try {
    const resp = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       CHAT_MODEL,
        max_tokens:  80,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `Convert the following question into 4-6 Marathi search keywords that would appear in a Dharmasindhu religious text (the text is in Marathi/Sanskrit Devanagari script).

Rules:
- Return ONLY Marathi/Sanskrit words in Devanagari script
- Comma separated, no explanation
- Focus on nouns and ritual terms
- If question is in English/Hinglish, translate to Marathi equivalents
- Examples: "shraddha" → "श्राद्ध", "marriage muhurat" → "विवाह, मुहूर्त, लग्न", "ganpati puja" → "गणपती, पूजा, गणेश"

Question: "${question}"

Keywords:`,
        }],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() || '';
    // Clean up — extract only Devanagari words
    return raw.replace(/[a-zA-Z\[\]\(\)]/g, '').replace(/,+/g, ',').trim();
  } catch (_) {
    return null;
  }
}

// ── Step 2: Multi-strategy search ────────────────────────────────────────────
async function searchDharmasindhu(marathiKeywords, originalQuestion) {
  let sources = [];

  // Strategy A: FULLTEXT with Marathi keywords (most accurate)
  if (marathiKeywords) {
    try {
      const [rows] = await pool.query(
        `SELECT page_no, content,
                MATCH(content) AGAINST (? IN BOOLEAN MODE) AS score
         FROM dharmasindhu_content
         WHERE MATCH(content) AGAINST (? IN BOOLEAN MODE)
         ORDER BY score DESC
         LIMIT 6`,
        [marathiKeywords, marathiKeywords]
      );
      sources = rows.filter(r => r.score > 0);
    } catch (_) {}
  }

  // Strategy B: FULLTEXT with original question words (catches Marathi typed questions)
  if (sources.length < 3) {
    const qWords = originalQuestion.trim().split(/\s+/).filter(w => w.length >= 2).join(' ');
    try {
      const [rows] = await pool.query(
        `SELECT page_no, content,
                MATCH(content) AGAINST (? IN BOOLEAN MODE) AS score
         FROM dharmasindhu_content
         WHERE MATCH(content) AGAINST (? IN BOOLEAN MODE)
         ORDER BY score DESC
         LIMIT 6`,
        [qWords, qWords]
      );
      const newRows = rows.filter(r => r.score > 0 && !sources.find(s => s.page_no === r.page_no));
      sources = [...sources, ...newRows].slice(0, 6);
    } catch (_) {}
  }

  // Strategy C: LIKE fallback — each keyword individually
  if (sources.length < 2 && marathiKeywords) {
    const words = marathiKeywords.split(/[,\s]+/).filter(w => w.length >= 2).slice(0, 4);
    for (const word of words) {
      const [rows] = await pool.query(
        `SELECT page_no, content, 0 AS score
         FROM dharmasindhu_content
         WHERE content LIKE ?
         ORDER BY page_no ASC
         LIMIT 3`,
        [`%${word}%`]
      );
      const newRows = rows.filter(r => !sources.find(s => s.page_no === r.page_no));
      sources = [...sources, ...newRows];
      if (sources.length >= 5) break;
    }
    sources = sources.slice(0, 6);
  }

  return sources;
}

// ── Ask a Question ────────────────────────────────────────────────────────────
exports.ask = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return error(res, 'प्रश्न लिहा.', 400);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return error(res, 'GROQ_API_KEY set नाही.', 500);

    // Check cache first — same question always produces same answer
    const qHash   = crypto.createHash('md5').update(question.trim().toLowerCase()).digest('hex');
    const dsKey   = `ds:ask:${qHash}`;
    const cached  = await getCache(dsKey);
    if (cached) return success(res, cached);

    // ── 1. Check if we have any content ──────────────────────────
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM dharmasindhu_content');

    // ── 2. Parallel: keyword extraction + (if no content, skip search) ───
    // Run keyword extraction in parallel with nothing (fast ~500ms)
    const marathiKeywords = total > 0
      ? await extractMarathiKeywords(question, apiKey)
      : null;

    // ── 3. Multi-strategy search ──────────────────────────────────
    let sources = [];
    if (total > 0) {
      sources = await searchDharmasindhu(marathiKeywords, question);
    }

    // ── 4. Build context from top passages ────────────────────────
    const context = sources.length
      ? sources
          .map(r => {
            const snippet = r.content.length > 700
              ? r.content.substring(0, 700) + '...'
              : r.content;
            return `[पान ${r.page_no}]:\n${snippet}`;
          })
          .join('\n\n---\n\n')
      : null;

    // ── 4. Groq Chat — AI answer in Marathi with Sanskrit translation ────
    const systemPrompt = context
      ? `You are a scholar of the Dharmasindhu text (Bapu Shastri Moghe, Marathi translation, 1886). Answer the question using ONLY the passages from Dharmasindhu provided below.

Answer format (in this exact order):

**📖 धर्मसिंधु सांगतो:**
(Quote the relevant Sanskrit or old Marathi passage exactly as it appears in the excerpt)

**🔤 मराठी अनुवाद:**
(Translate the above into clear, simple modern Marathi)

**✅ सारांश:**
(2-3 line practical summary in simple Marathi that anyone can understand)

**🇬🇧 English Summary:**
(Same summary in plain English — 2-3 lines)

**📌 संदर्भ:** (page number from excerpt)

Rules:
- Use ONLY what is in the provided passages — do not add outside knowledge
- If the passages don't contain the answer, say so clearly in Marathi
- Keep total answer under 250 words
- English section must always be present

Dharmasindhu passages:
${context}`
      : `You are a scholar of the Dharmasindhu text (Kashinath Upadhyaya, Sanskrit original; Bapu Shastri Moghe, Marathi translation 1886).

Answer the question based on Dharmasindhu knowledge.

Answer format:

**📖 धर्मसिंधु सांगतो:**
(Relevant Sanskrit rule or verse from Dharmasindhu)

**🔤 मराठी अनुवाद:**
(Translation in simple modern Marathi)

**✅ सारांश:**
(Practical, direct answer in Marathi)

**🇬🇧 English Summary:**
(Same answer in plain English — 2-3 lines)

(Note: OCR of Dharmasindhu is still in progress. This answer is based on general knowledge of the text.)`;

    const groqRes = await fetch(GROQ_URL, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       CHAT_MODEL,
        temperature: 0.3,
        max_tokens:  1200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: question },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq error:', errText);
      return error(res, 'AI सेवा उपलब्ध नाही. नंतर प्रयत्न करा.', 503);
    }

    const groqData = await groqRes.json();
    const answer   = groqData.choices?.[0]?.message?.content?.trim() || 'उत्तर मिळाले नाही.';

    // ── 5. Return answer + source passages ───────────────────────
    const dsData = {
      answer,
      sources: sources.map(r => ({
        page_no: r.page_no,
        excerpt: r.content.substring(0, 300) + (r.content.length > 300 ? '...' : ''),
      })),
      has_db_content: total > 0,
      search_keywords: marathiKeywords || null,
    };
    await setCache(dsKey, dsData, DS_TTL);
    return success(res, dsData);

  } catch (err) {
    console.error('dharmasindhu ask error:', err);
    return error(res, 'शंका समाधान करताना त्रुटी झाली.');
  }
};

// ── Search Raw (for admin preview) ───────────────────────────────────────────
exports.search = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q?.trim()) return error(res, 'शोध शब्द द्या.', 400);

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT page_no,
              SUBSTRING(content, 1, 400) AS excerpt,
              word_count
       FROM dharmasindhu_content
       WHERE content LIKE ?
       ORDER BY page_no ASC
       LIMIT ? OFFSET ?`,
      [`%${q}%`, parseInt(limit), offset]
    );

    const [[{ total_count }]] = await pool.query(
      'SELECT COUNT(*) AS total_count FROM dharmasindhu_content WHERE content LIKE ?',
      [`%${q}%`]
    );

    return success(res, { rows, total: total_count, page: parseInt(page) });
  } catch (err) {
    return error(res, 'शोध करताना त्रुटी झाली.');
  }
};

// ── Get Single Page Content ───────────────────────────────────────────────────
exports.getPage = async (req, res) => {
  try {
    const { page_no } = req.params;
    const [[row]] = await pool.query(
      'SELECT * FROM dharmasindhu_content WHERE page_no = ?', [page_no]
    );
    if (!row) return error(res, 'हे पान DB मध्ये नाही.', 404);
    return success(res, row);
  } catch (err) {
    return error(res, 'पान मिळवताना त्रुटी झाली.');
  }
};

// ── Stats (how many pages processed) ─────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [[{ total_pages }]] = await pool.query('SELECT COUNT(*) AS total_pages FROM dharmasindhu_content');
    const [[{ total_words }]] = await pool.query('SELECT SUM(word_count) AS total_words FROM dharmasindhu_content');
    const [[prog]]            = await pool.query('SELECT * FROM dharmasindhu_ocr_progress WHERE id = 1');

    return success(res, {
      total_pages,
      total_words:    total_words || 0,
      ocr_status:     prog?.status || 'idle',
      ocr_progress:   prog?.processed_pages || 0,
      ocr_total:      prog?.total_pages || 841,
      percentage:     Math.round(((prog?.processed_pages || 0) / (prog?.total_pages || 841)) * 100),
    });
  } catch (err) {
    return error(res, 'आकडेवारी मिळवताना त्रुटी.');
  }
};
