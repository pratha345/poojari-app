// src/controllers/dharmasindhu.controller.js
// Dharmasindhu शंका समाधान — RAG (semantic) + FULLTEXT fallback + Wikipedia + Groq
const pool = require('../config/db');
const { success, error }               = require('../utils/response.util');
const { getCache, setCache }           = require('../utils/redis');
const crypto                           = require('crypto');

const DS_TTL     = 24 * 60 * 60;
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const CHAT_MODEL = 'llama-3.1-8b-instant'; // 500k TPD limit vs 100k for 70b
const RAG_URL    = process.env.RAG_SERVICE_URL || 'http://localhost:8765';

// ── RAG microservice call (semantic search + Wikipedia) ───────────────────────
async function searchWithRAG(question) {
  try {
    const resp = await fetch(`${RAG_URL}/search`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ question, n_results: 5 }),
      signal:  AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.ds_chunks?.length && !data.wiki_chunks?.length) return null;
    return data;
  } catch {
    return null; // RAG not running → FULLTEXT fallback kicks in
  }
}

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

// ── Step 1: Extract expanded Marathi keywords + related terms ────────────────
async function extractMarathiKeywords(question, apiKey) {
  try {
    const resp = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       CHAT_MODEL,
        max_tokens:  120,
        temperature: 0,
        messages: [{
          role: 'user',
          content: `You are a dharmashastra scholar. Extract Marathi/Sanskrit search keywords from this question to search the Dharmasindhu text.

Rules:
- Return ONLY Devanagari script words, comma separated, no explanation
- Include the main topic + ALL SPECIFIC RELATED TERMS that would appear in the dharmashastra text
- For nakshatra questions: include individual nakshatra names in that group
- For ritual questions: include ritual steps, objects, related terms
- Maximum 8 keywords

Examples:
"पंचक नक्षत्र" → "पंचक, धनिष्ठा, शतभिषा, शततारका, रेवती, पूर्वाभाद्रपदा, उत्तराभाद्रपदा"
"त्रिपाद नक्षत्र" → "त्रिपाद, पूर्ववसु, उत्तराषाढा, कृत्तिका, उत्तरा, विशाखा"
"विवाह मुहूर्त" → "विवाह, मुहूर्त, लग्न, पाणिग्रहण, वर, वधू"
"गणपती पूजा" → "गणपती, गणेश, पूजा, षोडशोपचार, मोदक, दूर्वा"
"shraddha" → "श्राद्ध, पिंडदान, तर्पण, पितृ"
"ganpati puja" → "गणपती, गणेश, पूजा, षोडशोपचार"

Question: "${question}"
Keywords:`,
        }],
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const raw  = data.choices?.[0]?.message?.content?.trim() || '';
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

    // Cache — same question gives same answer
    const qHash  = crypto.createHash('md5').update(question.trim().toLowerCase()).digest('hex');
    const dsKey  = `ds:ask:${qHash}`;
    const cached = await getCache(dsKey);
    if (cached) return success(res, cached);

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM dharmasindhu_content');

    // ── 1. Parallel: RAG semantic search + keyword extraction ─────
    const [ragResult, searchKeywords] = await Promise.all([
      total > 0 ? searchWithRAG(question) : Promise.resolve(null),
      extractMarathiKeywords(question, apiKey),
    ]);

    // ── 2. FULLTEXT search with expanded keywords (ALWAYS, not just fallback) ─
    let ftSources = [];
    if (total > 0 && searchKeywords) {
      const ftRows = await searchDharmasindhu(searchKeywords, question);
      ftSources = ftRows.map(r => ({
        content: r.content,
        page_no: r.page_no,
        score:   r.score || 0.4,
      }));
    }

    // ── 3. Merge RAG + FULLTEXT (RAG first for relevance, FULLTEXT adds unique pages) ─
    const ragDS      = ragResult?.ds_chunks || [];
    const ragPageNos = new Set(ragDS.map(r => r.page_no));
    const ftExtras   = ftSources.filter(r => !ragPageNos.has(r.page_no));

    let dsSources   = [...ragDS, ...ftExtras].slice(0, 8);
    let wikiSources = ragResult?.wiki_chunks || [];
    const usedRAG   = ragResult !== null;

    // ── 3. Build context ──────────────────────────────────────────
    const dsContext = dsSources.length
      ? dsSources.slice(0, 5).map(r => {
          const snippet = r.content.length > 450 ? r.content.substring(0, 450) + '...' : r.content;
          return `[DS:पान ${r.page_no}]:\n${snippet}`;
        }).join('\n\n---\n\n')
      : null;

    const wikiContext = wikiSources.length
      ? `=== Wikipedia ===\n` + wikiSources.map(w => {
          // Find lines that contain main question noun (first noun-like word >= 3 chars)
          const stopWords = new Set(['म्हणजे', 'काय', 'कसे', 'केव्हा', 'कधी', 'कोण', 'काय?', 'कसा', 'ते', 'किती']);
          const qWords = question.trim().split(/\s+/).filter(x => x.length >= 2);
          const mainTopic = qWords.find(x => x.length >= 3 && !stopWords.has(x)) || qWords[0];

          const lines = w.content.split('\n').filter(s => s.trim().length > 15);
          // Lines with mainTopic (highest relevance)
          const withTopic = lines.filter(s => s.includes(mainTopic));
          // If we found topiclines, use top 3; else fallback to first 2 lines
          const chosen = withTopic.length > 0 ? withTopic.slice(0, 3) : lines.slice(0, 2);
          return `[WIKI:${w.title}]:\n${chosen.join('\n')}`;
        }).join('\n\n---\n\n')
      : null;

    const fullContext = [dsContext, wikiContext].filter(Boolean).join('\n\n═══\n\n');

    // ── 4. Groq answer ────────────────────────────────────────────
    const systemPrompt = fullContext
      ? `You are a Dharmasindhu scholar. Answer the question using ONLY the provided passages.

STRICT RULES:
1. NEVER invent, expand, or paraphrase beyond what is literally in the passages
2. [DS:पान X] = Dharmasindhu page X text. [WIKI:Title] = Wikipedia article text.
3. In **📖 धर्मसिंधु सांगतो:** — quote ONLY from [DS:पान X] sections. Do NOT use Wikipedia content here.
4. If the WIKI section has a direct definition, quote it in **🌐 Wikipedia सांगतो:**
5. NEVER label Wikipedia content as if it came from Dharmasindhu pages.
6. NEVER say "माहिती नाही" — use Wikipedia or general knowledge if DS passages don't contain the answer.
7. Keep answer under 250 words total.

FORMAT:

**📖 धर्मसिंधु सांगतो:**
(Direct quote from [DS:पान X] that is relevant, or write "[सामान्य धर्मज्ञान]" if DS pages don't cover this)

**🌐 Wikipedia सांगतो:** (only if wiki passages exist AND are relevant)
(Direct quote from [WIKI:Title])

**🔤 मराठी अनुवाद:**
(Simple Marathi explanation in your own words — 2-3 sentences)

**✅ सारांश:**
(Key facts in Marathi — bullet points if multiple items)

**🇬🇧 English Summary:**
(2-3 plain English sentences)

**📌 संदर्भ:** (list the source pages/wiki articles used)

PASSAGES:
${fullContext}`
      : `You are a scholar of the Dharmasindhu text (Kashinath Upadhyaya, Sanskrit; Bapu Shastri Moghe, Marathi 1886).

**📖 धर्मसिंधु सांगतो:**
(Relevant verse or rule)

**🔤 मराठी अनुवाद:**
(Simple modern Marathi)

**✅ सारांश:**
(Direct answer in Marathi)

**🇬🇧 English Summary:**
(Plain English, 2-3 lines)

(Note: Answer based on general knowledge of the text.)`;

    const groqRes = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHAT_MODEL, temperature: 0.3, max_tokens: 1200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: question },
        ],
      }),
    });

    if (!groqRes.ok) {
      console.error('Groq error:', await groqRes.text());
      return error(res, 'AI सेवा उपलब्ध नाही. नंतर प्रयत्न करा.', 503);
    }

    const groqData = await groqRes.json();
    const answer   = groqData.choices?.[0]?.message?.content?.trim() || 'उत्तर मिळाले नाही.';

    // ── 5. Respond ────────────────────────────────────────────────
    const dsData = {
      answer,
      sources: dsSources.map(r => ({
        page_no: r.page_no,
        excerpt: r.content.substring(0, 1200) + (r.content.length > 1200 ? '...' : ''),
      })),
      wiki_sources: wikiSources.map(w => ({
        title:   w.title,
        url:     w.url,
        excerpt: w.content.substring(0, 200) + (w.content.length > 200 ? '...' : ''),
      })),
      has_db_content:  total > 0,
      search_mode:     usedRAG && ftSources.length > 0 ? 'hybrid' : usedRAG ? 'semantic' : 'fulltext',
      search_keywords: searchKeywords || null,
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
