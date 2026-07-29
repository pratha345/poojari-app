# 📱 Pojjari WhatsApp Bot — संपूर्ण Structure आणि प्रत्येक File चा Code Explained

> **Doc 1/5** — संपूर्ण architecture, प्रत्येक file काय करते, महत्त्वाचा code आणि तो का तसा लिहिलाय.
> Server: DigitalOcean droplet `64.227.152.85` (1 vCPU, 2GB RAM) | Location: `/var/www/pojjari-bot/`

---

## 1. High-Level Architecture

```
                                   ┌─────────────────────────────────────────────┐
  User (WhatsApp)                  │            DigitalOcean Server              │
       │                           │                                             │
       ▼                           │  ┌──────────┐    ┌──────────────────────┐   │
  Meta Cloud API ──── webhook ────►│  │ server.js│───►│ routes/webhook.js    │   │
  (graph.facebook.com)   POST      │  │ (Express │    │ (parse Meta payload) │   │
       ▲                           │  │ port 4000)    └──────────┬───────────┘   │
       │                           │  └──────────┘               ▼               │
       │ sendText/List/Buttons     │                   ┌──────────────────┐      │
       └───────────────────────────│───────────────────│   chatLogic.js   │      │
                                   │                   │ (session router) │      │
                                   │                   └───┬────┬────┬────┘      │
                                   │        ┌──────────────┘    │    └────────┐  │
                                   │        ▼                   ▼             ▼  │
                                   │  ┌───────────┐   ┌────────────────┐ ┌─────────────┐
                                   │  │botService │   │ decisionEngine │ │consultation/│
                                   │  │(booking   │   │ (AI intent     │ │kundaliFlow  │
                                   │  │ steps)    │   │  router)       │ │(ज्योतिष)     │
                                   │  └─────┬─────┘   └───┬───────┬────┘ └──────┬──────┘
                                   │        │             ▼       ▼             │
                                   │        │      ┌──────────┐ ┌──────────┐    │
                                   │        │      │ragEngine │ │llmService│    │
                                   │        │      │(RAG v4)  │ │(Groq LLM)│    │
                                   │        │      └────┬─────┘ └────┬─────┘    │
                                   │        ▼           ▼            ▼          │
                                   │  ┌─────────────────────────────────────┐   │
                                   │  │  MySQL (remote 159.89.167.218)      │   │
                                   │  │  Redis (localhost — sessions/cache) │   │
                                   │  └─────────────────────────────────────┘   │
                                   └─────────────────────────────────────────────┘
  External APIs: Gemini (embeddings) | Groq (LLM) | Prokerala (panchang/kundali) | Meta (WhatsApp)
```

**Design तत्त्व:** प्रत्येक layer **fail-open** आहे — RAG मेला तर LLM रिकाम्या context ने चालतो, LLM मेला तर polite fallback message, panchang API मेला तर "data unavailable" — bot कधीही पूर्ण मुका होत नाही.

---

## 2. File Tree

```
/var/www/pojjari-bot/
├── server.js                  # Express boot, routes mount, RAG init
├── chatLogic.js               # Central message router (session step machine)
├── consultationFlow.js        # ज्योतिष consultation flow (Guruji Q&A)
├── kundaliFlow.js             # कुंडली + वार्षिक तिथी calculator
├── chatSim.js                 # "Act as human" testing harness
├── .env                       # Secrets (tokens, API keys, DB creds)
├── routes/
│   ├── webhook.js             # Meta webhook (GET verify + POST messages)
│   ├── api.js                 # REST API (services, bookings...)
│   ├── aiRoutes.js            # Admin dashboard AI routes
│   └── debug.js               # Redis session inspector (dev only)
├── services/
│   ├── botService.js          # Booking flow steps + WhatsApp booking creation
│   ├── decisionEngine.js      # AI intent routing + RAG+LLM orchestration
│   ├── ragEngine.js           # RAG v4 (BM25 + embeddings + rerank) — Doc 2 मध्ये सविस्तर
│   ├── llmService.js          # Groq LLM (personas, intent classify)
│   ├── cacheService.js        # Redis cache layer (LLM/RAG/samagri)
│   ├── panchangService.js     # Prokerala API (panchang, birth-details)
│   ├── muhurtService.js       # मुहूर्त rules engine
│   ├── kundaliMilanService.js # 36 गुण मिलन
│   ├── dbService.js           # DB helpers + bot event logging
│   ├── websocketService.js    # Admin dashboard live updates
│   └── evalRag.js             # RAG accuracy eval (24 labeled queries)
├── utils/
│   └── whatsapp.js            # Meta Cloud API senders (text/list/buttons)
└── config/
    ├── db.js                  # MySQL pool
    └── redis.js               # Redis client + session helpers
```

---

## 3. `server.js` — Boot Sequence

```js
require('dotenv').config();          // .env → process.env (आधीच असलेलं OVERRIDE करत नाही! — खाली Gotcha #1)
const express = require('express');
// ...
app.use('/webhook', require('./routes/webhook'));
app.use('/api',     require('./routes/api'));
app.use('/debug',   require('./routes/debug'));

server.listen(4000, async () => {
  const ragEngine = require('./services/ragEngine');
  await ragEngine.initKnowledgeBase();   // BM25 लगेच ready; embeddings background मध्ये
});
```

**का असं:** KB build ~5 sec घेतो (4000+ chunks चा BM25 index), पण embeddings कित्येक मिनिटं/तास घेऊ शकतात (API quota). म्हणून **BM25 blocking, embeddings non-blocking** — bot लगेच सुरू होतो, hybrid mode मागून आपोआप upgrade होतो.

> **⚠️ Gotcha #1 (आम्हाला चावलेला):** `dotenv.config()` process.env मध्ये **आधीच असलेली** variable बदलत नाही. pm2 आपल्या dump मध्ये जुनं env साठवतो — म्हणजे `.env` बदलून `pm2 restart` केलं तरी **जुनाच token/key** चालू राहतो! उपाय:
> ```bash
> cd /var/www/pojjari-bot && set -a && . ./.env && set +a && pm2 restart 1 --update-env
> ```
> या bug ने आमचे दोन bळी घेतले: expired WHATSAPP_TOKEN (190 errors) आणि dead GROQ_API_KEY (401 errors).

---

## 4. `routes/webhook.js` — Meta चं दार

### GET / — Verification Handshake
Meta app setup करताना Meta एक GET पाठवतं — आपण `hub.verify_token` तपासून `hub.challenge` परत करायचं:

```js
router.get('/', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    return res.status(200).send(req.query['hub.challenge']);
  }
  return res.sendStatus(403);
});
```

### POST / — Incoming Messages

```js
router.post('/', async (req, res) => {
  res.sendStatus(200);   // ← सर्वात आधी! Meta ला <5s मध्ये 200 लागतो, नाहीतर retry करत राहतं
  // body.entry[].changes[].value.messages[] मधून प्रत्येक message:
  //   msg.from  = "919561903219" (E.164 शिवाय +)
  //   msg.type  = 'text' | 'interactive' | image/audio...
  //   text: msg.text.body | button: msg.interactive.button_reply.id | list: list_reply.id
  handleChat(`+${phone}`, text, msgId).catch(err => console.error(...));
});
```

**3 महत्त्वाच्या गोष्टी:**
1. **Ack आधी, process नंतर** — Meta चा 5-second timeout आहे; उशीर = duplicate delivery
2. **Buttons/Lists चे reply `id` म्हणून येतात** — text नाही; म्हणून button ids हे "commands" सारखे design केलेत (`book_pooja`, `confirm_yes`)
3. **Non-text (image/audio)** ला polite rejection जातं

---

## 5. `chatLogic.js` — Session State Machine (Bot चा मणका)

### handleChat() — प्रत्येक message इथून जातो

```js
async function handleChat(phone, msgBody, msgId) {
  // 1. DEDUP — Meta कधीकधी तोच message दोनदा पाठवतं
  if (msgId && await isDuplicateMessage(msgId)) return;

  // 2. Session load (Redis: session:pojjari:+91...)
  const session = await getSession(phone);
  const step    = session.step || 'start';

  // 3. GLOBAL commands — कुठल्याही step मधून चालतात
  //    'exit/cancel' → session clear;  '0/menu/मेनू' → main menu;  'back/मागे' → मागची step

  // 4. Greeting → welcome menu
  if (isGreeting(text)) {
    await setSession(phone, { step: 'main_menu' });
    return sendWelcome(phone);
    // ⚠️ Gotcha #2: इथे आधी "main_menu वर असेल तर परत पाठवू नको" असा silent return होता —
    // user ला bot मेल्यासारखा वाटायचा! Greeting ला नेहमी उत्तर द्यावंच.
  }

  // 5. STEP ROUTER — session.step नुसार योग्य handler कडे
  switch (step) {
    case 'start':        return handleAIMessage(...);      // नवीन user → AI
    case 'main_menu':    return handleMainMenu(...);
    case 'category_select': ... case 'service': ... case 'pandit': ...
    case 'date': ... case 'slot': ... case 'address': ... case 'confirm': ...  // booking चे 8 steps
    case 'kundali_date': case 'kundali_time': case 'kundali_place': return handleKundaliFlow(...);
    case 'annual_date':  return handleAnnualDateFlow(...);
    case 'consult_question': return handleConsultQuestion(...);
    case 'ai_chat':      return handleAIMessage(...);      // AI conversation चालू आहे
    default: /* अनोळखी step → welcome ला reset */
  }
}
```

**हे design का:** WhatsApp वर **UI नाही** — फक्त text. म्हणून "आता user कुठे आहे" हे **session.step** मध्ये ठेवतो (Redis, TTL सह). प्रत्येक incoming message = "current step साठी input". हा एक **finite state machine** आहे.

### Session shape (Redis मध्ये):
```json
{
  "step": "slot",
  "pooja_id": 5, "pooja_name": "Karnavedha Sanskar", "price": 2500,
  "pujari_id": 3, "booking_date": "2026-07-20",
  "dob": "2001-05-01", "birth_time": "10:10 PM", "birth_place": "Amravati",
  "ai_history": [{"role":"user","content":"..."}, ...]
}
```

---

## 6. `services/botService.js` — Booking Flow

Booking चे steps (प्रत्येक step = एक function):

```
main_menu → '1' → category_select (7 श्रेणी)
  → service (त्या श्रेणीतल्या पूजा, किमतींसह)
  → pandit  (WhatsApp LIST — max 10 rows!)
  → date    (DD/MM/YYYY, past-date validation)
  → slot    (8 वेळा — LIST)
  → address (free text)
  → confirm (summary + हो/नाही BUTTONS)
  → createBooking() → DB INSERT → booking code (PJ...) → आपोआप samagri यादी
```

Booking confirm झाल्यावर:
```js
const samagriMsg = await ragEngine.getSamagriDirect(session.pooja_name);
// ⚠️ Gotcha #3: हा 'await' आधी विसरला होता → user ला "[object Promise]" गेलं!
// async function चा result string म्हणून वापरायचा असेल तर await विसरू नका.
if (samagriMsg) await sendText(phone, samagriMsg);
```

`getPoojaList()` menu साठी — DB call नाही, RAG engine च्या in-memory chunks मधूनच.

---

## 7. `services/decisionEngine.js` — AI Router (v4.1)

Structured flow मध्ये नसलेला प्रत्येक message इथे येतो:

```js
async function processMessage(phone, text, session) {
  const intent = await classifyIntent(text);   // Groq llama-3.1-8b → एक शब्द

  switch (intent) {
    case 'booking':     return { type: 'booking' };      // chatLogic booking flow कडे परत
    case 'my_bookings': return { type: 'my_bookings' };
    case 'samagri':     // extractPoojaName → DB direct → नाहीतर RAG+LLM
    case 'panchang':    // Prokerala live data + RAG; धर्मसिंधु प्रश्न असेल तर shastra mode
    case 'muhurat':     return { type: 'muhurat_menu' };
    case 'vastu': case 'astrology': default /* general */:
      return smartReply(text, intent, history);
  }
}
```

### smartReply() — v4.1 चा गाभा:

```js
async function smartReply(text, intent, history, extraContext = '') {
  const { chunks, context } = await getRag(text, intent);   // RAG v4 retrieval (fail-open)
  const dsCount = chunks.filter(c => c.type === 'dharmasindhu').length;

  if (dsCount >= 2 && !extraContext) {
    // Retrieval धर्मसिंधु-प्रधान आहे → scholar persona ([DS:पान X] citations)
    return generateShastraResponse(text, toShastraContext(context), history);
  }
  return generateGurujiResponse(text, [extraContext, context].filter(Boolean).join('\n\n'), history, intent);
}
```

> **⚠️ Gotcha #4 (सर्वात मोठा):** v3 मध्ये decisionEngine RAG ला **call च करत नव्हता** — सगळे LLM paths `generateGurujiResponse(text, '', history)` रिकाम्या context ने! 1402-chunk RAG engine बनवला होता पण **तो उत्तरांशी जोडलेलाच नव्हता**. Lesson: retrieval बनवणं वेगळं, ते **pipeline मध्ये wire करणं** वेगळं — end-to-end trace करूनच खात्री होते.

---

## 8. `services/llmService.js` — Groq LLM Layer

### तीन LLM कामं:

| Function | Model | काम |
|----------|-------|-----|
| `classifyIntent()` | `llama-3.1-8b-instant` | Message → एक शब्द (booking/samagri/panchang/...) — स्वस्त, जलद |
| `generateGurujiResponse()` | `openai/gpt-oss-120b` | "परांजपे गुरुजी" persona चं उत्तर, RAG context सह |
| `generateShastraResponse()` | `openai/gpt-oss-120b` | धर्मसिंधु scholar — `[DS:पान X]` quotes, structured format |

### GURUJI_SYSTEM_PROMPT मधले महत्त्वाचे नियम (अनुभवातून आलेले):

```
- Uttar NEHMI देवनागरी लिपीत — Roman/IAST नको      ← LLM ने "Bṛhaspativar upvāsa" द्यायला सुरुवात केली होती
- Hindi शब्द नको: सरसों → मोहरी                      ← असली चूक user ने पकडली
- तिथी नावं शुद्ध: तृतीया (ट्रायटिया नको!)             ← English "Tritiya" चं भ्रष्ट transliteration
- रत्न (नीलम, पुखराज...) कधीही recommend करू नको     ← रत्नसल्ला पूर्ण कुंडलीशिवाय धोकादायक + liability
- NEVER exact predictions / fear-based responses      ← ethical guardrails
- उत्तर पूर्ण वाक्याने संपवा
```

### finishSentence() — truncation safety net:

```js
// LLM max_tokens संपले तर वाक्य मध्येच तुटतं ("...नक्कीच नीलम द")
// शेवटच्या पूर्ण वाक्यापर्यंत मागे कापतो:
function finishSentence(s) {
  const t = s.trim();
  if (/[।॥.!?)\]*_🙏✅]$/u.test(t)) return t;                    // आधीच पूर्ण आहे
  const idx = Math.max(t.lastIndexOf('।'), t.lastIndexOf('॥'),
                       t.lastIndexOf('.'), t.lastIndexOf('!'), t.lastIndexOf('?'));
  if (idx > t.length * 0.4) return t.slice(0, idx + 1).trim();  // 40% पेक्षा जास्त टिकलं तरच कापा
  return t;
}
```

**Token budgets:** guruji 900, shastra 2000 (देवनागरी token-heavy आहे — 1 मराठी शब्द ≈ 3-6 tokens!), intent 10.

**LLM Response cache:** `llm:{intent}:{normalized_query}` Redis key, 6h TTL — तोच प्रश्न परत आला तर 0ms उत्तर, Groq TPM वाचतो. **Prompt बदलल्यावर cache flush करायलाच हवा** नाहीतर जुनी उत्तरं येत राहतात.

---

## 9. `services/cacheService.js` — Redis Cache Layer

| Cache | Key pattern | TTL | का |
|-------|------------|-----|-----|
| LLM उत्तरं | `llm:{intent}:{query}` | 6h | Groq calls वाचवणं |
| RAG chunks+context | `rag4:{intent}:{query}` | 2h | retrieval+rerank खर्च एकदाच |
| Samagri | `samagri:{pooja}` | 24h | अत्यंत stable data |
| Chunk embeddings | `rag_emb:v4:768` (HASH) | 60d | sha1(text) → base64 vector |
| Query embeddings | `rag_qemb:v4:{sha1}` | 30d | Gemini quota वाचवणं |
| Panchang | `panchang:{date}:{lat}:{lng}` | 24h | Prokerala 1 call/day/date |
| Birth details | `birth_details:{datetime}:{coords}` | 30d | जन्म data बदलत नाही |
| Sessions | `session:pojjari:{phone}` | (flow TTL) | conversation state |

**RAG cache मध्ये v4 पासून context string पण साठतो** — कारण parent_text metadata slim-cache मध्ये नसतं; आधीच build केलेला context च साठवायचा.

---

## 10. `utils/whatsapp.js` — Meta Cloud API Senders

```js
const BASE_URL = () => `https://graph.facebook.com/v22.0/${process.env.PHONE_NUMBER_ID}/messages`;
// Authorization: Bearer WHATSAPP_TOKEN

sendText(to, text, skipMenu)       // साधा text + "(0 टाइप करा → मुख्य मेनू)" hint
sendList(to, header, body, btn, rows)   // Interactive list
sendButtons(to, body, buttons)     // Max 3 reply buttons
sendSamagriList(to, pooja, items)
```

> **⚠️ Gotcha #5:** Meta ची interactive list ची limit **एकूण 10 rows** आहे (sections कितीही असोत!). आधी code 3 sections × 10 = 30 पाठवत होता → error `131009 "Total row count exceed max allowed count: 10"` → **user ला काहीच जात नव्हतं.** Buttons max 3, row title max 24 chars, button title max 20 chars.

Meta error codes जे भेटले:
- `190` = token invalid/expired (Authentication)
- `131009` = parameter invalid (10-row limit)
- `131030` = recipient not in allowed list (test numbers)

---

## 11. `kundaliFlow.js` — कुंडली + वार्षिक तिथी

### कुंडली flow (v4.1 — accurate):
```
kundali_date → kundali_time → kundali_place (नवीन!) → analysis
```

```js
// Prokerala birth-details endpoint — अचूक जन्मवेळ + जन्मस्थानाचे coordinates:
const birthDT = parseBirthDateTimeISO(dob, birthTime);        // "2001-05-01T22:10:00+05:30"
const birthDetails = await getBirthDetails(birthDT, `${place.lat},${place.lng}`);
const moonRashiNum = rashiIndexFromName(birthDetails?.chandra_rasi?.name);   // थेट चंद्र रास!
const nakshatra    = birthDetails?.nakshatra?.name;           // + pada
```

> **⚠️ Gotcha #6 (ज्योतिष अचूकतेचा):** आधी हे panchang API ने व्हायचं — जो **वेळ फेकून देतो** (day-level) आणि दिवसाच्या *सुरुवातीचं* नक्षत्र देतो. 01/05/2001 22:10 Amravati चा जन्म: दिवसभर चंद्र आश्लेषेत (कर्क), रात्री मघात (सिंह) — bot कर्क सांगायचा, बरोबर उत्तर सिंह! Boundary cases मध्ये **जन्मवेळ critical** आहे. `CITY_COORDS` table (~32 शहरं, Devanagari+Roman keys) जन्मगावाचे coordinates देतो.

### वार्षिक तिथी calculator (annual_date flow):
```js
// मागच्या वर्षीची तारीख → त्या दिवसाची तिथी → पुढच्या वर्षी तीच तिथी कधी?
// चांद्र वर्ष सौर वर्षापेक्षा ~11 दिवस लहान — म्हणून शोध offset -11 पासून fan-out:
const offsets = Array.from({length:71},(_,i)=>i-35).sort((a,b)=>Math.abs(a+11)-Math.abs(b+11));
// → सरासरी ~5 API calls (आधी 71 पर्यंत जायचा!)
```

> **⚠️ Gotcha #7:** Prokerala tithi/nakshatra **array of objects** देतं (`[{name, paksha, start, end}]`), string नाही — `.toLowerCase()` थेट लावला की crash. `panchToStr()` normalizer प्रत्येक ठिकाणी.

### शुद्ध मराठी नावं — deterministic mapping (LLM वर विसंबून नाही):
```js
TITHI_MR_MAP     = { tritiya:'तृतीया', ekadashi:'एकादशी', ... }      // 16 तिथी
NAKSHATRA_MR_MAP = { magha:'मघा', shravana:'श्रवण', ... }            // 27 नक्षत्रं
```

---

## 12. `consultationFlow.js` — ज्योतिष सल्लामसलत

```js
// Menu '3' → startGurujiConsult() → "तुमची शंका सांगा"
// handleConsultQuestion(): प्रश्नाचं वर्गीकरण regex ने:
const isAnnual  = /वार्षिक|varshik|श्राद्ध|shraddha|punyatithi|barsi|mrutyu|tithi|.../i;
const isKundali = /kundali|कुंडली|janam|जन्म|graha|ग्रह|दशा|rashifal/i;

if (isAnnual)  → handleAnnualDateFlow    // वार्षिक तिथी calculator
if (isKundali) → handleKundaliFlow        // कुंडली विश्लेषण
else → RAG + Guruji quick answer → मग जन्मतारीख विचारून personalized
```

> **⚠️ Gotcha #8:** हा regex आधी **फक्त देवनागरी** शब्द ओळखायचा — "Varshik puja tarik" (roman) miss होऊन generic flow मध्ये जायचा आणि जन्मतारीख विचारायचा (मृत्यू तारीख ऐवजी!). **Mixed-script users साठी प्रत्येक keyword चे देवनागरी + roman दोन्ही variants लागतात.**

---

## 13. `services/panchangService.js` — Prokerala Integration

```js
// OAuth2 client-credentials token (in-memory, expiry track):
getToken() → POST /token → cache till expiry-30s

// Day-level panchang (कुंडलीसाठी वापरू नका!):
getPanchang(date) → /v2/astrology/panchang?datetime=...&coordinates=...&ayanamsa=1
                  → Redis cache 24h per (date, coords)

// Exact birth chart (v4.1 नवीन):
getBirthDetails(datetime, coordinates) → /v2/astrology/birth-details
  → { nakshatra: {name, pada}, chandra_rasi: {name}, soorya_rasi: {...} }
  → Redis cache 30 दिवस
```

`ayanamsa: 1` = Lahiri ayanamsa — भारतीय पंचांगांचा standard.

---

## 14. `chatSim.js` — Testing Harness ("Act as Human")

```js
// युक्ती: require.cache मध्ये utils/whatsapp चा stub घालायचा —
// खरे WhatsApp messages न पाठवता संपूर्ण खरी pipeline चालते:
const waPath = require.resolve('./utils/whatsapp');
require.cache[waPath] = { exports: {
  sendText: async (to, text) => replies.push({kind:'text', text}),
  sendList: ..., sendButtons: ..., sendSamagriList: ...,
}};
const { handleChat } = require('./chatLogic');   // stub नंतर require करायचं!
// मग: प्रत्येक scripted message → handleChat → captured replies प्रिंट
```

वापर: `cd /var/www/pojjari-bot && RAG_SKIP_EMBED=1 node chatSim.js 'Hi' '1' ...`
Fake phone `+919999000111` — खऱ्या sessions शी conflict नाही. Test bookings नंतर DB मधून delete करायच्या!

---

## 15. Environment Variables (.env)

| Variable | काय |
|----------|-----|
| `WHATSAPP_TOKEN` | Meta access token (⚠️ temporary 24h vs System User permanent) |
| `PHONE_NUMBER_ID` | Meta phone number id (11361113...) |
| `VERIFY_TOKEN` | Webhook verification secret |
| `GROQ_API_KEY` | Groq LLM |
| `GEMINI_API_KEY` | Google embeddings |
| `PANCHANG_CLIENT_ID/SECRET` | Prokerala OAuth |
| `PANCHANG_LAT/LNG` | Default coords (Pune) |
| `DB_HOST/USER/PASSWORD/NAME` | MySQL remote |
| `RAG_SKIP_EMBED` | =1 → BM25-only (testing) |

---

## 16. Deployment Runbook

```bash
# Deploy (नेहमी हाच क्रम):
cp file.js file.pre-change.backup.js     # 1. backup
node --check file.js                     # 2. syntax check
set -a && . ./.env && set +a && pm2 restart 1 --update-env   # 3. sourced restart!
pm2 logs pojjari-bot --lines 20 --nostream                   # 4. boot verify

# Prompt बदलला असेल तर LLM cache flush:
redis-cli --scan --pattern 'llm:*' | xargs -r redis-cli del

# Embedding progress:
redis-cli hlen rag_emb:v4:768            # किती chunks embedded

# Rollback: सगळे backups जागेवरच आहेत:
# ragEngine.v3.backup.js, llmService.pre-v4.backup.js, chatLogic.pre-greetfix.backup.js,
# kundaliFlow.pre-tithifix.backup.js, consultationFlow.pre-annualfix.backup.js,
# panchangService.pre-birthfix.backup.js, utils/whatsapp.pre-fix.backup.js
```

**pm2 processes:** `pojjari-bot` (id 1 — खरा, port 4000) | id 0 = जुना zombie (pojjari-final — STOPPED ठेवा, तो port bind करू शकत नाही आणि फक्त quota जाळतो!)

---

## 17. सगळे 8 Production Gotchas एकत्र (सर्वात मौल्यवान भाग)

1. **dotenv override करत नाही** + pm2 stale env → sourced restart अनिवार्य
2. **Greeting silent ignore** → bot मेल्यासारखा दिसतो → नेहमी उत्तर द्या
3. **Missing `await`** → "[object Promise]" user पर्यंत / context नेहमी undefined
4. **RAG बनवला पण wire केला नाही** → accuracy चा भ्रम
5. **WhatsApp list = एकूण 10 rows max** → 131009 → संपूर्ण message fail
6. **Day-level panchang ≠ birth chart** → boundary जन्मांची रास चुकते
7. **Prokerala arrays of objects** देतं → string समजून `.toLowerCase()` = crash
8. **Regex फक्त देवनागरी** → roman-typing users miss होतात

> पुढचं वाचन: **Doc 2** — RAG v4 engine चा प्रत्येक भाग step-by-step.
