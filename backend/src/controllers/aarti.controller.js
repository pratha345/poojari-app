// src/controllers/aarti.controller.js
const fs   = require('fs');
const path = require('path');
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');
const { success, error } = require('../utils/response.util');
const { getCache, setCache, delCache, delCachePattern } = require('../utils/redis');
const { getTodayFestival } = require('../services/aartiFestivalService');
const { resolveEnglishTerms } = require('../utils/aartiSearchMap');

const CAT_KEY  = 'aarti:categories';
const CAT_TTL  = 10 * 60;   // 10 min
const LIST_TTL = 5  * 60;   // 5 min
const SLUG_TTL = 10 * 60;   // 10 min

// Traditional pooja sequence, NOT alphabetical/count order — user-specified:
// गणपती (अग्रपूजेचा मान) → शिव → विठ्ठल-पांडुरंग → देवी → विष्णु (सत्यनारायण) →
// इतर देवता (दत्त) → राम → कृष्ण → संत आरत्या → सामान्य last (generic closing
// prayers/mantras, not tied to one deity). Used for BOTH the sidebar
// (categories endpoint) and the default browsing grid (list endpoint) so
// they show the same sequence — previously the sidebar sorted by count DESC
// while the grid sorted alphabetically, two different orders that made the
// category grouping feel arbitrary/inconsistent.
const CATEGORY_ORDER = [
  'गणपती', 'शिव', 'विठ्ठल-पांडुरंग', 'देवी', 'विष्णु', 'इतर देवता',
  'राम', 'कृष्ण', 'संत आरत्या', 'सामान्य',
];
const CATEGORY_FIELD = `FIELD(deity_category, ${CATEGORY_ORDER.map(() => '?').join(',')})`;

// ── Public: List published aartis (filter by deity, search) ──────────────────
exports.list = async (req, res) => {
  try {
    const { deity, search, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Festival-aware ordering: on गणेशोत्सव the गणपती aartis float to the top,
    // during नवरात्र the देवी aartis, etc. — resolved from the panchang engine.
    const festival = await getTodayFestival().catch(() => null);

    const listKey = `aarti:list:v2:${JSON.stringify({ deity, search, page, limit, fd: festival?.deity || '' })}`;
    const cached = await getCache(listKey);
    if (cached) return success(res, cached);

    let where = ['is_published = 1'];
    const params = [];
    if (deity)  { where.push('deity_category = ?'); params.push(deity); }
    if (search) {
      // English/Hinglish query ("ganpati") → also match its Marathi equivalents
      // ("गणपती","गणेश") since titles/lyrics are pure Devanagari — see aartiSearchMap.
      const extraTerms = resolveEnglishTerms(search);
      const cols = ['title', 'lyrics', 'deity_category', 'occasion'];
      const conds = [];
      const searchParams = [];
      for (const term of [search, ...extraTerms]) {
        for (const col of cols) { conds.push(`${col} LIKE ?`); searchParams.push(`%${term}%`); }
      }
      where.push(`(${conds.join(' OR ')})`);
      params.push(...searchParams);
    }
    const whereClause = where.join(' AND ');

    const festOrder  = festival ? '(deity_category = ?) DESC,' : '';
    const orderParams = festival ? [festival.deity] : [];

    // Manual priority is a deliberate admin override — it must win outright,
    // not just break ties within the festival-matched group. Earlier this
    // sat AFTER festOrder, so during श्रावण (शिव auto-boosted all month) a
    // priority-1 गणपती aarti still landed 6th, behind every शिव aarti —
    // exactly backwards from what setting a priority is supposed to mean.
    const [rows] = await pool.query(
      `SELECT id, title, slug, deity_category, occasion, image_url, is_featured, priority, views, created_at
       FROM aartis WHERE ${whereClause}
       ORDER BY (priority IS NULL) ASC, priority ASC, ${festOrder} is_featured DESC, ${CATEGORY_FIELD} ASC, title ASC LIMIT ? OFFSET ?`,
      [...params, ...orderParams, ...CATEGORY_ORDER, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM aartis WHERE ${whereClause}`, params
    );

    const data = { aartis: rows, total, festival };
    await setCache(listKey, data, LIST_TTL);
    return success(res, data);
  } catch (err) {
    console.error('aarti.list error:', err);
    return error(res, 'आरत्या मिळवताना त्रुटी झाली.');
  }
};

// ── Public: Deity categories with counts (for sidebar filter) ────────────────
exports.categories = async (req, res) => {
  try {
    const cached = await getCache(CAT_KEY);
    if (cached) return success(res, cached);

    const [rows] = await pool.query(
      `SELECT deity_category, COUNT(*) AS count FROM aartis
       WHERE is_published = 1 GROUP BY deity_category ORDER BY ${CATEGORY_FIELD} ASC`,
      CATEGORY_ORDER
    );
    await setCache(CAT_KEY, rows, CAT_TTL);
    return success(res, rows);
  } catch (err) {
    console.error('aarti.categories error:', err);
    return error(res, 'श्रेणी मिळवताना त्रुटी झाली.');
  }
};

// ── Public: Get single aarti by slug ──────────────────────────────────────────
exports.getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const cacheKey = `aarti:slug:${slug}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      pool.query('UPDATE aartis SET views = views + 1 WHERE slug = ?', [slug]).catch(() => {});
      return success(res, cached);
    }

    const [[row]] = await pool.query(
      `SELECT * FROM aartis WHERE slug = ? AND is_published = 1`, [slug]
    );
    if (!row) return error(res, 'आरती सापडली नाही.', 404);

    await setCache(cacheKey, row, SLUG_TTL);
    pool.query('UPDATE aartis SET views = views + 1 WHERE slug = ?', [slug]).catch(() => {});
    return success(res, row);
  } catch (err) {
    console.error('aarti.getBySlug error:', err);
    return error(res, 'आरती मिळवताना त्रुटी झाली.');
  }
};

// ── Public: Personalized recommendations from the user's pooja bookings ──────
// "सत्यनारायण पूजा book केली → आरती विभागात सत्यनारायणाची आरती वर दिसावी."
// Auth is OPTIONAL — without a (valid) token this just returns an empty list.
// Order = match priority (first regex that hits wins) — kept in the sequence
// the user asked for: सत्यनारायण → देवी/नवरात्र → शिव → विठ्ठल → दत्त → ...
// "नवरात्र" added to the देवी trigger — a booking literally named "नवरात्र
// पूजा" (not "देवी पूजा"/"दुर्गा पूजा") previously matched NOTHING, since
// none of देवी|दुर्गा|अंबा|भवानी appear as substrings of "नवरात्र" itself.
const POOJA_AARTI_KEYWORDS = [
  [/सत्यनारायण/,                          'om-jai-lakshmi-ramana-satyanarayan-aarti'],
  [/देवी|दुर्गा|अंबा|भवानी|नवरात्र/,       'durge-durghat-bhari-devi-aarti'],
  [/शिव|रुद्र|महादेव/,                    'lavthavati-vikrala-shankar-aarti'],
  [/विठ्ठल|पांडुरंग/,                     'yuge-atthavis-vitevari-ubha-vitthal-aarti'],
  [/दत्त/,                                'trigunatmak-traimurti-datta-aarti'],
  [/गणपती|गणेश/,                          'sukhkarta-dukhharta-ganpati-aarti'],
  [/लक्ष्मी/,                             'jai-devi-mahalakshmi-kolhapur-aarti'],
  [/हनुमान|मारुती/,                       'satrane-uddane-hunkar-vadani-hanuman-aarti'],
  [/राम/,                                 'shriram-jairam-jay-jay-ram-aarti'],
  [/कृष्ण|गोकुळ/,                         'ovalu-aarti-madangopala-krishna'],
];

exports.recommended = async (req, res) => {
  try {
    let userId = null;
    const h = req.headers.authorization;
    if (h && h.startsWith('Bearer ')) {
      try { userId = jwt.verify(h.slice(7), process.env.JWT_SECRET).id; } catch { /* guest */ }
    }
    if (!userId) return success(res, { aartis: [] });

    // Upcoming bookings + poojas done in the last 30 days
    const [bookings] = await pool.query(
      `SELECT b.booking_date, p.name_mr, p.related_aarti_slug
       FROM bookings b JOIN poojas p ON p.id = b.pooja_id
       WHERE b.user_id = ?
         AND b.status IN ('pending','confirmed','in_progress','completed')
         AND b.booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       ORDER BY b.booking_date DESC LIMIT 5`,
      [userId]
    );
    if (!bookings.length) return success(res, { aartis: [] });

    // pooja → aarti: admin-set slug wins; else keyword match on the pooja name
    const picks = new Map();
    for (const b of bookings) {
      let slug = b.related_aarti_slug;
      if (!slug) {
        const hit = POOJA_AARTI_KEYWORDS.find(([re]) => re.test(b.name_mr || ''));
        if (hit) slug = hit[1];
      }
      if (slug && !picks.has(slug)) picks.set(slug, b.name_mr);
    }
    if (!picks.size) return success(res, { aartis: [] });

    const slugs = [...picks.keys()].slice(0, 3);
    const [rows] = await pool.query(
      `SELECT id, title, slug, deity_category, occasion, image_url, is_featured, views
       FROM aartis WHERE slug IN (?) AND is_published = 1`,
      [slugs]
    );
    return success(res, { aartis: rows.map(r => ({ ...r, reason: picks.get(r.slug) })) });
  } catch (err) {
    console.error('aarti.recommended error:', err);
    return success(res, { aartis: [] });   // recommendations are best-effort — never break the page
  }
};

// ── Admin: photo-OCR / raw-text intake — both funnel into one Gemini cleaner ──
// Uses Gemini (same model family that OCR'd all 841 Dharmasindhu pages).
// Returns a SUGGESTION for the form — admin always reviews before saving.
const DEITY_OPTIONS = ['गणपती', 'शिव', 'देवी', 'विठ्ठल-पांडुरंग', 'कृष्ण', 'राम', 'विष्णु', 'संत आरत्या', 'इतर देवता', 'सामान्य'];

// Model fallback chain — 2.5-flash first (best Devanagari quality) and,
// crucially, a SEPARATE free-tier quota pool from gemini-2.0-flash which the
// dharmasindhu-ocr batch job consumes all day.
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite'];

// parts = Gemini `contents[0].parts` array — either [{inline_data},{text}] for a
// photo, or [{text}] alone for pasted text. Both callers get identical
// model-fallback, JSON-parse-with-salvage, and error handling.
async function callGeminiClean(apiKey, parts) {
  const payload = JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      temperature: 0,                          // transcription/cleanup, not creativity
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  let resp = null, lastStatus = 0;
  for (const model of MODELS) {
    resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    payload,
        signal:  AbortSignal.timeout(45000),
      }
    );
    if (resp.ok) break;
    lastStatus = resp.status;
    const body = await resp.text();
    console.error(`aarti.clean ${model} error:`, resp.status, body.slice(0, 200));
    if (resp.status !== 429 && resp.status !== 503) break;   // quota errors → try next model; hard errors → stop
    resp = null;
  }

  if (!resp || !resp.ok) {
    const err = new Error('gemini_failed');
    err.status = (lastStatus === 429 || lastStatus === 503) ? 503 : 502;
    throw err;
  }

  const data = await resp.json();
  const raw  = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  try {
    return JSON.parse(raw);
  } catch {
    // Model returned non-JSON despite responseMimeType — salvage as plain lyrics
    return { title: '', deity_category: 'सामान्य', lyrics: raw.trim() };
  }
}

function shapeResult(parsed) {
  const lyrics = (parsed.lyrics || '').trim();
  if (!lyrics) return null;
  return {
    title:          (parsed.title || '').trim(),
    deity_category: DEITY_OPTIONS.includes(parsed.deity_category) ? parsed.deity_category : 'सामान्य',
    lyrics,
    note: 'हा स्वयंचलितपणे काढलेला मजकूर आहे — जतन करण्यापूर्वी शब्द तपासून घ्या.',
  };
}

// ── Admin: OCR — photo of a printed/handwritten aarti → extracted text ────────
exports.ocrExtract = async (req, res) => {
  try {
    if (!req.file) return error(res, 'फोटो अपलोड करा.', 400);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return error(res, 'GEMINI_API_KEY set नाही.', 500);

    const b64  = req.file.buffer.toString('base64');
    const mime = req.file.mimetype || 'image/jpeg';

    const prompt =
      `या फोटोमध्ये एक मराठी/हिंदी आरती किंवा स्तोत्र छापलेले/लिहिलेले आहे.\n` +
      `काम: फोटोतील आरतीचा मजकूर जसाच्या तसा, ओळी-ओळीने उतरवा.\n\n` +
      `कठोर नियम:\n` +
      `1. फोटोत जे लिहिले आहे तेच लिहा — स्वतःहून काहीही जोडू नका, दुरुस्त करू नका, वगळू नका.\n` +
      `2. ओळींचे विभाजन (line breaks) फोटोप्रमाणेच ठेवा; कडव्यांमध्ये रिकामी ओळ ठेवा.\n` +
      `3. एखादा शब्द अस्पष्ट असेल तर तो [अस्पष्ट] असा लिहा — अंदाजाने भरू नका.\n` +
      `4. देवनागरी लिपीतच लिहा.\n` +
      `5. deity_category यापैकीच एक निवडा: ${DEITY_OPTIONS.join(' | ')}\n\n` +
      `उत्तर फक्त या JSON स्वरूपात द्या:\n` +
      `{"title": "आरतीचे नाव (पहिल्या ओळीवरून)", "deity_category": "...", "lyrics": "संपूर्ण मजकूर\\nओळी-ओळीने"}`;

    const parsed = await callGeminiClean(apiKey, [
      { inline_data: { mime_type: mime, data: b64 } },
      { text: prompt },
    ]);
    const shaped = shapeResult(parsed);
    if (!shaped) return error(res, 'फोटोमधून मजकूर वाचता आला नाही. स्पष्ट, सरळ फोटो घेऊन पुन्हा प्रयत्न करा.', 422);
    return success(res, shaped);
  } catch (err) {
    if (err.message === 'gemini_failed')
      return error(res, err.status === 503 ? 'OCR सेवा व्यस्त आहे (quota). थोड्या वेळाने पुन्हा प्रयत्न करा.' : 'OCR सेवेत त्रुटी झाली. पुन्हा प्रयत्न करा.', err.status);
    console.error('aarti.ocr error:', err);
    if (err.name === 'TimeoutError' || err.name === 'AbortError')
      return error(res, 'OCR ला वेळ लागला — लहान/स्पष्ट फोटो वापरून पुन्हा प्रयत्न करा.', 504);
    return error(res, 'OCR करताना त्रुटी झाली.');
  }
};

// ── Admin: paste-any-text intake — WhatsApp forwards, PDF-copy, mixed
//    script/spelling, stray symbols, English transliteration mixed in, etc.
//    Whatever the admin pastes, this normalizes it into the same clean shape. ──
exports.textExtract = async (req, res) => {
  try {
    const raw = (req.body?.raw_text || '').trim();
    if (!raw) return error(res, 'आधी मजकूर पेस्ट करा.', 400);
    if (raw.length > 8000) return error(res, 'मजकूर खूप मोठा आहे (कमाल 8000 अक्षरे).', 400);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return error(res, 'GEMINI_API_KEY set नाही.', 500);

    const prompt =
      `खाली एक आरती/स्तोत्राचा मजकूर दिला आहे — तो कुठूनही आलेला असू शकतो ` +
      `(WhatsApp फॉरवर्ड, PDF मधून copy-paste, हाताने टाईप केलेला, इंग्रजी लिपीत ` +
      `लिहिलेला मराठी/हिंदी मजकूर, विस्कळीत ओळी, जोडाक्षरांच्या चुका, अनावश्यक चिन्हे इ.).\n\n` +
      `काम — हा मजकूर साफ करून व्यवस्थित आरतीच्या स्वरूपात मांडा:\n` +
      `1. मूळ अर्थ/शब्द बदलू नका — फक्त लिपी/स्वरूप साफ करा. रोमन लिपीत असेल तरच देवनागरीत रूपांतर करा.\n` +
      `2. जोडाक्षरे, अनुस्वार, विरामचिन्हे (।, ॥) योग्य त्या ठिकाणी दुरुस्त करा.\n` +
      `3. प्रत्येक ओळ स्वतंत्र ठेवा; कडव्यांमध्ये (धृपद पुनरावृत्तीसह) रिकामी ओळ ठेवा.\n` +
      `4. जाहिराती, वॉटरमार्क, अनावश्यक इमोजी/चिन्हे असतील तर वगळा — पण आरतीचा एकही शब्द वगळू नका.\n` +
      `5. deity_category यापैकीच एक निवडा: ${DEITY_OPTIONS.join(' | ')}\n\n` +
      `उत्तर फक्त या JSON स्वरूपात द्या:\n` +
      `{"title": "आरतीचे नाव (पहिल्या ओळीवरून)", "deity_category": "...", "lyrics": "साफ केलेला मजकूर\\nओळी-ओळीने"}\n\n` +
      `मूळ मजकूर:\n"""${raw}"""`;

    const parsed = await callGeminiClean(apiKey, [{ text: prompt }]);
    const shaped = shapeResult(parsed);
    if (!shaped) return error(res, 'मजकूर साफ करता आला नाही. पुन्हा प्रयत्न करा.', 422);
    return success(res, shaped);
  } catch (err) {
    if (err.message === 'gemini_failed')
      return error(res, err.status === 503 ? 'सेवा व्यस्त आहे (quota). थोड्या वेळाने पुन्हा प्रयत्न करा.' : 'सेवेत त्रुटी झाली. पुन्हा प्रयत्न करा.', err.status);
    console.error('aarti.textExtract error:', err);
    return error(res, 'मजकूर साफ करताना त्रुटी झाली.');
  }
};

// ── Admin: List all (including unpublished) ───────────────────────────────────
exports.adminList = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, title, slug, deity_category, image_url, is_published, is_featured, priority, views, created_at
       FROM aartis ORDER BY (priority IS NULL) ASC, priority ASC, is_featured DESC, id DESC`
    );
    return success(res, rows);
  } catch (err) {
    console.error('aarti.adminList error:', err);
    return error(res, 'आरत्या मिळवताना त्रुटी झाली.');
  }
};

// ── Admin: Create ──────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { title, slug, deity_category, lyrics, meaning, occasion, source_note, author_name, is_published, is_featured } = req.body;
    if (!title || !slug || !deity_category || !lyrics)
      return error(res, 'शीर्षक, slug, देवता आणि शब्द आवश्यक आहेत.', 400);

    const image_url = req.file ? `/uploads/aarti/${req.file.filename}` : null;
    // FormData sends booleans as strings — "false" must not be truthy
    const toBit = v => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO aartis (title, slug, deity_category, lyrics, image_url, meaning, occasion, source_note, author_name, is_published, is_featured)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [title, slug, deity_category, lyrics, image_url, meaning || null, occasion || null, source_note || null,
       author_name || null, toBit(is_published), toBit(is_featured)]
    );
    await Promise.all([delCachePattern('aarti:list:*'), delCache(CAT_KEY)]);
    return success(res, { id: result.insertId }, 'आरती यशस्वीरित्या जोडली.', 201);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return error(res, 'हा slug आधीच वापरला आहे.', 400);
    console.error('aarti.create error:', err);
    return error(res, 'आरती जोडताना त्रुटी झाली.');
  }
};

// ── Admin: Update ──────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, deity_category, lyrics, meaning, occasion, source_note, author_name, is_published, is_featured } = req.body;

    const [[existing]] = await pool.query('SELECT slug, image_url FROM aartis WHERE id = ?', [id]);
    if (!existing) return error(res, 'आरती सापडली नाही.', 404);

    const toBit = v => (v === true || v === 1 || v === '1' || v === 'true') ? 1 : 0;
    const fields = ['title=?','slug=?','deity_category=?','lyrics=?','meaning=?','occasion=?','source_note=?','author_name=?','is_published=?','is_featured=?'];
    const values = [title, slug, deity_category, lyrics, meaning || null, occasion || null, source_note || null,
      author_name || null, toBit(is_published), toBit(is_featured)];
    if (req.file) { fields.push('image_url=?'); values.push(`/uploads/aarti/${req.file.filename}`); }
    values.push(id);

    await pool.query(`UPDATE aartis SET ${fields.join(',')} WHERE id=?`, values);

    if (req.file && existing.image_url) {
      fs.unlink(path.join(__dirname, '../..', existing.image_url), () => {});
    }
    await Promise.all([
      delCachePattern('aarti:list:*'), delCache(CAT_KEY),
      delCache(`aarti:slug:${existing.slug}`), delCache(`aarti:slug:${slug}`),
    ]);
    return success(res, {}, 'आरती अद्ययावत झाली.');
  } catch (err) {
    console.error('aarti.update error:', err);
    return error(res, 'आरती अद्ययावत करताना त्रुटी झाली.');
  }
};

// ── Admin: Quick image-only upload (list-row thumbnail — no other fields touched) ──
exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return error(res, 'इमेज निवडा.', 400);

    const [[existing]] = await pool.query('SELECT slug, image_url FROM aartis WHERE id = ?', [id]);
    if (!existing) return error(res, 'आरती सापडली नाही.', 404);

    const image_url = `/uploads/aarti/${req.file.filename}`;
    await pool.query('UPDATE aartis SET image_url = ? WHERE id = ?', [image_url, id]);
    if (existing.image_url) fs.unlink(path.join(__dirname, '../..', existing.image_url), () => {});

    await Promise.all([delCachePattern('aarti:list:*'), delCache(`aarti:slug:${existing.slug}`)]);
    return success(res, { image_url }, 'इमेज अपलोड झाली.');
  } catch (err) {
    console.error('aarti.updateImage error:', err);
    return error(res, 'इमेज अपलोड करताना त्रुटी झाली.');
  }
};

// ── Admin: Set/clear manual display priority (lower number = shown first,
//    across ALL categories — overrides the default category-sequence order;
//    empty/null clears the override, falling back to is_featured+category) ──
exports.updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    let { priority } = req.body;
    priority = (priority === '' || priority === null || priority === undefined) ? null : parseInt(priority, 10);
    if (priority !== null && (!Number.isInteger(priority) || priority < 1))
      return error(res, 'Priority ही १ किंवा त्याहून मोठी संख्या असावी.', 400);

    const [[row]] = await pool.query('SELECT slug FROM aartis WHERE id = ?', [id]);
    if (!row) return error(res, 'आरती सापडली नाही.', 404);

    await pool.query('UPDATE aartis SET priority = ? WHERE id = ?', [priority, id]);
    await Promise.all([delCachePattern('aarti:list:*'), delCache(`aarti:slug:${row.slug}`)]);
    return success(res, { priority }, 'प्राधान्यक्रम अद्ययावत झाला.');
  } catch (err) {
    console.error('aarti.updatePriority error:', err);
    return error(res, 'त्रुटी झाली.');
  }
};

// ── Admin: Bulk-set priority after a drag-and-drop reorder in the admin list —
//    body: { items: [{id, priority}, ...] }. Only the rows the UI actually
//    touched (the dragged item plus everything above its new position) are
//    sent, so untouched rows keep whatever ordering they already had. ──
exports.reorder = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0)
      return error(res, 'items यादी रिकामी आहे.', 400);
    for (const it of items) {
      if (!Number.isInteger(it?.id) || !Number.isInteger(it?.priority) || it.priority < 1)
        return error(res, 'अवैध क्रम डेटा.', 400);
    }

    for (const { id, priority } of items) {
      await pool.query('UPDATE aartis SET priority = ? WHERE id = ?', [priority, id]);
    }
    await delCachePattern('aarti:list:*');
    return success(res, { updated: items.length }, 'क्रम बदलला.');
  } catch (err) {
    console.error('aarti.reorder error:', err);
    return error(res, 'क्रम बदलताना त्रुटी झाली.');
  }
};

// ── Admin: Toggle featured (लोकप्रिय — shown first on the public list) ────────
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const [[row]] = await pool.query('SELECT is_featured, slug FROM aartis WHERE id = ?', [id]);
    if (!row) return error(res, 'आरती सापडली नाही.', 404);

    await pool.query('UPDATE aartis SET is_featured = ? WHERE id = ?', [row.is_featured ? 0 : 1, id]);
    await Promise.all([delCachePattern('aarti:list:*'), delCache(`aarti:slug:${row.slug}`)]);
    return success(res, { is_featured: row.is_featured ? 0 : 1 }, 'स्थिती बदलली.');
  } catch (err) {
    console.error('aarti.toggleFeatured error:', err);
    return error(res, 'त्रुटी झाली.');
  }
};

// ── Admin: Toggle publish ────────────────────────────────────────────────────
exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const [[row]] = await pool.query('SELECT is_published, slug FROM aartis WHERE id = ?', [id]);
    if (!row) return error(res, 'आरती सापडली नाही.', 404);

    await pool.query('UPDATE aartis SET is_published = ? WHERE id = ?', [row.is_published ? 0 : 1, id]);
    await Promise.all([delCachePattern('aarti:list:*'), delCache(CAT_KEY), delCache(`aarti:slug:${row.slug}`)]);
    return success(res, {}, 'स्थिती बदलली.');
  } catch (err) {
    console.error('aarti.togglePublish error:', err);
    return error(res, 'त्रुटी झाली.');
  }
};

// ── Admin: Delete ────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [[row]] = await pool.query('SELECT slug, image_url FROM aartis WHERE id = ?', [id]);
    if (!row) return error(res, 'आरती सापडली नाही.', 404);

    await pool.query('DELETE FROM aartis WHERE id = ?', [id]);
    if (row.image_url) {
      fs.unlink(path.join(__dirname, '../..', row.image_url), () => {});
    }
    await Promise.all([delCachePattern('aarti:list:*'), delCache(CAT_KEY), delCache(`aarti:slug:${row.slug}`)]);
    return success(res, {}, 'आरती काढून टाकली.');
  } catch (err) {
    console.error('aarti.remove error:', err);
    return error(res, 'आरती काढताना त्रुटी झाली.');
  }
};
