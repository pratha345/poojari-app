// backend/src/services/groqRashifalService.js
// Groq API — उद्या + आठवडा राशिभविष्य (Marathi)

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL        = 'llama-3.3-70b-versatile';

// ── Simple in-memory cache ─────────────────────────────────────
// key: "tomorrow-{rashiId}-{YYYY-MM-DD}"  or "weekly-{rashiId}-{weekKey}"
const cache = new Map();

function todayIST() {
  const now = new Date(Date.now() + 330 * 60000);
  return now.toISOString().slice(0, 10);
}
function tomorrowIST() {
  const now = new Date(Date.now() + 330 * 60000 + 86400000);
  return now.toISOString().slice(0, 10);
}
function weekKeyIST() {
  const now = new Date(Date.now() + 330 * 60000);
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

const RASHI_NAMES = [
  'मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या',
  'तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'
];

const MONTHS_MR = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
                   'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
const DAYS_MR   = ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

function formatDateMR(isoDate) {
  const d = new Date(isoDate + 'T00:00:00Z');
  return `${d.getUTCDate()} ${MONTHS_MR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

async function callGroq(prompt) {
  const res = await fetch(GROQ_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:       MODEL,
      temperature: 0.7,
      max_tokens:  1200,
      messages: [
        {
          role:    'system',
          content: 'तुम्ही एक अनुभवी वैदिक ज्योतिषी आहात. तुम्ही नेहमी मराठीत उत्तर देता. JSON format मध्येच उत्तर द्या, बाकी काही लिहू नका.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data   = await res.json();
  const raw    = data.choices?.[0]?.message?.content || '';
  // Strip markdown code fences if present
  const clean  = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  return JSON.parse(clean);
}

// ── Get tomorrow prediction ────────────────────────────────────
async function getTomorrowPrediction(rashiId) {
  const cacheKey = `tomorrow-${rashiId}-${todayIST()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const rashiName  = RASHI_NAMES[rashiId];
  const tomorrowDT = tomorrowIST();
  const tomorrowMR = formatDateMR(tomorrowDT);

  const prompt = `${rashiName} राशीसाठी ${tomorrowMR} (उद्या) चे राशिभविष्य लिहा.
फक्त खालील JSON द्या (मराठीत):
{
  "general": "सर्वसाधारण भविष्य 2-3 वाक्यांत",
  "love": "प्रेम/संसार 2 वाक्यांत",
  "career": "कार्य/व्यवसाय 2 वाक्यांत",
  "health": "आरोग्य 2 वाक्यांत",
  "guru": "गुरू ग्रहाचा प्रभाव 1-2 वाक्यांत",
  "shani": "शनी ग्रहाचा प्रभाव 1-2 वाक्यांत",
  "sunEffect": "सूर्य गोचराचा मासिक प्रभाव 1 वाक्य",
  "tip": "उद्याचा उपाय 1 वाक्य",
  "score": 7,
  "scoreLabel": "चांगला",
  "quality": "good"
}
quality फक्त: "best"(९-१०), "good"(७-८), "neutral"(५-६), "caution"(१-४)`;

  const result = await callGroq(prompt);
  cache.set(cacheKey, result);
  return result;
}

// ── Get weekly prediction ──────────────────────────────────────
async function getWeeklyPrediction(rashiId) {
  const cacheKey = `weekly-${rashiId}-${weekKeyIST()}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const rashiName = RASHI_NAMES[rashiId];

  // Build 7 dates starting from today
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + 330 * 60000 + i * 86400000);
    return {
      iso:     d.toISOString().slice(0, 10),
      mr:      formatDateMR(d.toISOString().slice(0, 10)),
      dayName: DAYS_MR[d.getUTCDay()],
    };
  });

  const datesStr = days.map((d, i) => `दिवस ${i}: ${d.dayName} ${d.mr}`).join('\n');

  const prompt = `${rashiName} राशीसाठी पुढील ७ दिवसांचे राशिभविष्य लिहा:
${datesStr}

फक्त खालील JSON array द्या (मराठीत, ७ items):
[
  {
    "dayIndex": 0,
    "general": "त्या दिवसाचे भविष्य 2 वाक्यांत",
    "tip": "त्या दिवसाचा उपाय",
    "score": 7,
    "scoreLabel": "चांगला",
    "quality": "good"
  }
]
quality फक्त: "best"(९-१०), "good"(७-८), "neutral"(५-६), "caution"(१-४)`;

  const result = await callGroq(prompt);
  // Attach date info
  const enriched = result.map((item, i) => ({
    ...item,
    dayName:   days[i]?.dayName || '',
    dateNum:   parseInt(days[i]?.iso?.split('-')[2] || 0),
    monthName: MONTHS_MR[parseInt(days[i]?.iso?.split('-')[1] || 1) - 1] || '',
    isToday:   i === 0,
  }));
  cache.set(cacheKey, enriched);
  return enriched;
}

module.exports = { getTomorrowPrediction, getWeeklyPrediction };
