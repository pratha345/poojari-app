# 💬 WhatsApp Bot शून्यातून बांधायचा — संपूर्ण Chat Logic Guide

> **Doc 3/5** — "आपल्याला असा bot बनवायचा झाला तर काय काय करावं लागेल" — infrastructure पासून conversation design पर्यंत, आपल्या अनुभवातल्या चुकांसह.

---

## PART A: पायाभूत गोष्टी (Infrastructure Checklist)

### A.1 काय काय लागतं

| # | गोष्ट | आपण काय वापरलं | पर्याय |
|---|-------|----------------|--------|
| 1 | Server (public HTTPS) | DigitalOcean droplet + nginx | Railway, AWS, Render |
| 2 | Meta Developer Account + App | developers.facebook.com | — |
| 3 | WhatsApp Business API access | Meta test number (आधी), production number (नंतर) | Twilio/360dialog (BSP) |
| 4 | Database | MySQL (poojas, bookings, users...) | Postgres |
| 5 | Session store + cache | Redis | — |
| 6 | LLM API | Groq (llama-3.1-8b + gpt-oss-120b) | OpenAI, Claude, Gemini |
| 7 | Embeddings API | Gemini embedding-001 | OpenAI, Voyage, local |
| 8 | Domain-specific APIs | Prokerala (panchang/kundali) | — |
| 9 | Process manager | pm2 | systemd, Docker |

### A.2 Meta WhatsApp Setup — नेमके steps

1. **App बनवा:** developers.facebook.com → Create App → Business type → WhatsApp product add करा
2. **Test number मिळतं:** Meta फुकट देतं (`+1 555-...`) — पण **फक्त 5 verified recipients** ना पाठवता येतं ("To" list मध्ये add करावे लागतात)
3. **Webhook जोडा:** Callback URL = `https://तुमचा-domain/webhook`, Verify Token = तुमचा secret. Meta GET पाठवतं — `hub.challenge` echo करा (Doc 1 §4)
4. **Subscribe करा:** webhook fields मध्ये `messages` निवडा
5. **Token चं राजकारण (महत्त्वाचं!):**
   - Dashboard चा token = **temporary, 24 तासांत मरतो** — आम्ही यावर दोनदा आपटलो!
   - **कायमचा उपाय:** Business Settings → System Users → Add → app assign → **Generate Token (Expiration: Never)** + `whatsapp_business_messaging` permission
6. **Production साठी:** स्वतःचा number register करा + display name approval — तेव्हाच खऱ्या ग्राहकांना unrestricted messaging

### A.3 Message पाठवण्याच्या मर्यादा (Meta rules — तोंडपाठ हव्या)

| गोष्ट | Limit |
|-------|-------|
| Interactive list rows | **एकूण 10** (sections कितीही असले तरी!) — आम्ही 30 पाठवत होतो → error 131009 |
| Reply buttons | max **3**, title ≤ 20 chars |
| List row title | ≤ 24 chars, description ≤ 72 |
| Text message | ≤ 4096 chars |
| **24-hour window** | User ने message केल्यापासून 24h आत मुक्त reply; नंतर फक्त pre-approved **template** |
| Webhook response | **< 5 sec** मध्ये 200 — नाहीतर Meta retry करतं (duplicates!) |

---

## PART B: Conversation Architecture — दोन जग

### B.1 मूलभूत निर्णय: Structured Flows + AI Fallback

```
                       incoming message
                             │
              ┌──────────────┴──────────────┐
              │  session.step मध्ये आहे का?   │
              ▼ हो                        ▼ नाही/start/ai_chat
     ┌─────────────────┐         ┌────────────────────┐
     │ STRUCTURED FLOW │         │   AI (LLM) LAYER   │
     │ deterministic   │         │ intent classify →  │
     │ state machine   │         │ RAG → persona LLM  │
     │ (booking, कुंडली)│         │ (प्रश्नोत्तरं)        │
     └─────────────────┘         └────────────────────┘
```

**का दोन्ही:** Booking सारख्या transactions मध्ये **LLM वर विश्वास ठेवायचा नाही** — किंमत, तारीख, address हे deterministic steps नेच घ्यायचे. पण open प्रश्न ("मंगळ दोष म्हणजे काय?") स्टेप्समध्ये बसत नाहीत — तिथे LLM. **Transactions = state machine; conversations = AI.**

### B.2 Session State Machine Design

```js
// Redis: session:pojjari:+919xxxx → { step, ...flow data }
// प्रत्येक incoming message = "सध्याच्या step चा input"

// नियम 1: प्रत्येक step एकच गोष्ट विचारते आणि एकच input process करते
// नियम 2: चुकीचा input → त्याच step वर राहा + format पुन्हा सांगा (उदा. "DD/MM/YYYY मध्ये टाका")
// नियम 3: प्रत्येक step मधून escape hatch — '0'=menu, 'back'=मागे, 'cancel'=बाहेर
// नियम 4: flow पूर्ण/रद्द → session clear
```

**Global commands step-router च्या आधी** — user कुठेही अडकला तरी `0` ने नेहमी सुटतो. हे नसेल तर user चिडून जातो.

### B.3 Welcome आणि Menu

```
नमस्कार! 🙏 परांजपे गुरुजी पूजा सेवेत आपले स्वागत आहे!
1️⃣ पूजा बुक करा   2️⃣ साहित्य यादी   3️⃣ ज्योतिष सल्लामसलत
4️⃣ माझी बुकिंग    5️⃣ मदत / संपर्क
```

- **आकडे का:** typing कमी, ambiguity शून्य, प्रत्येक भाषेत चालतं
- पण user "pooja book karaychi ahe" असंही लिहू शकतो → number match नाही झाला तर **AI layer intent ओळखून त्याच flow मध्ये** आणतो — दोन्ही दारं एकाच खोलीत उघडतात
- **Greeting ला नेहमी उत्तर द्या.** आमचा bug: "आधीच menu वर आहे तर परत welcome नको" असा silent return — user ला bot मेलेला वाटायचा. **Silence हा कधीच valid response नाही.**

### B.4 Booking Flow — पूर्ण state machine (आमचा खरा flow)

```
main_menu ─'1'→ category_select ──→ service ──→ pandit ──→ date ──→ slot ──→ address ──→ confirm
                (7 श्रेणी,          (पूजा यादी    (LIST,     (DD/MM/  (LIST,   (free      (summary +
                 text menu)         किमतींसह)     max 10)    YYYY +   8 वेळा)   text)      हो/नाही buttons)
                                                            validation)                        │ 'ho'
                                                                                               ▼
                                                                    createBooking() → DB INSERT → PJ code
                                                                    → आपोआप samagri यादी → session clear
```

प्रत्येक step चे बारकावे:
- **date:** `parseDate()` + **past-date reject**; चुकीचा format → उदाहरणासह पुन्हा विचारा
- **confirm:** `['confirm_yes','confirm','yes','हो','ho']` — button id **आणि** typed दोन्ही स्वीकारा (button न दाबता type करणारे भरपूर असतात!)
- **booking code** (PJ20263777) — user ला reference; support साठी अत्यावश्यक
- Post-booking value-add: **samagri यादी आपोआप** — विचारण्याआधीच देणं = delight

### B.5 AI Layer — Intent Classification

```js
// स्वस्त-जलद LLM (llama-3.1-8b), max_tokens: 10, output = एकच शब्द:
booking | samagri | panchang | muhurat | vastu | astrology | patrika | my_bookings | general
```

- Classifier चं output **whitelist validate करा** — LLM काहीही म्हणू शकतो; list बाहेरचं → 'general'
- **Intent → action mapping** मध्ये दोन प्रकार: (a) flow कडे redirect (`booking` → booking state machine!), (b) उत्तर द्या (RAG + persona)
- LLM classify का, regex का नाही: "ghar me katha karwana hai kitna kharcha" — यात booking/price/samagri सगळं आहे; regex मरतो, LLM संदर्भ बघतो

### B.6 Persona Design — "परांजपे गुरुजी"

Bot ला **व्यक्तिमत्त्व** दिलं — 30+ वर्षांचे पुण्यातले शांत ज्योतिषी:

```
- नेहमी "Namaskar 🙏" ने सुरुवात, warm-spiritual tone
- Suggestive भाषा ("...शक्यता आहे") — exact भविष्य कधीच नाही
- भीती कधीच नाही; प्रत्येक समस्येला उपाय (मंत्र/दान/उपवास)
- देवनागरीतच उत्तर; हिंदी शब्द नको; रत्न recommend करायचे नाहीत
- संबंधित असेल तिथे booking CTA
```

**दुसरा persona — धर्मसिंधु scholar:** retrieval मध्ये 2+ धर्मसिंधु chunks आले की स्विच — `[DS:पान X]` citations, structured format (📖 धर्मसिंधु सांगतो / 🔤 सोपे स्पष्टीकरण / ✅ मुख्य मुद्दे / 🇬🇧 English summary). **कधी कोणता persona हे retrieval ठरवते** — हे design elegant आहे कारण "हा प्रश्न शास्त्राचा आहे का" हे वेगळं ओळखावं लागत नाही.

### B.7 Conversation Memory

```js
// Redis session मध्ये ai_history: शेवटचे 16 turns (8 exchanges)
history.push({role:'user', content}, {role:'assistant', content});
ai_history: history.slice(-16)   // अनंत वाढू द्यायचं नाही — LLM context + Redis दोन्ही जपायचे
```
History असल्यामुळे "त्याची किंमत किती?" मधला "त्याची" मागच्या पूजेकडे निर्देश करू शकतो.

### B.8 Domain Flows (ज्योतिष) — API-backed deterministic answers

**कुंडली:** date → time → **place** → Prokerala birth-details → रास/नक्षत्र/साडेसाती → LLM फक्त **explain** करतो, **calculate नाही**. गणित API चं, भाषा LLM ची — jargon: **"LLM narrates, engine calculates."**

**वार्षिक तिथी:** मागच्या वर्षीची तारीख → त्या दिवसाची तिथी (API) → पुढच्या वर्षी तीच तिथी शोध (lunar year ~11 दिवस लहान — offset -11 पासून fan-out) → booking CTA.

**Detection चा धडा:** "Varshik puja tarik" (roman) आमच्या देवनागरी-only regex ने miss केला → चुकीचा flow. **प्रत्येक keyword रोमन + देवनागरी दोन्हीत ठेवा.**

---

## PART C: Reliability Engineering

### C.1 Fail-Open Philosophy — प्रत्येक थर पडू शकतो, bot नाही

```
RAG fail        → रिकाम्या context ने LLM (उत्तर सामान्य पण येतं)
LLM fail        → "Namaskar 🙏 Saddhya uttara deu shaklo nahi. Parat try kara."
Rerank fail     → hybrid order जसाच्या तसा
Embeddings नाहीत → BM25-only (87.5% वर चालतं!)
Panchang fail   → "data unavailable, थोड्या वेळाने try करा"
Send fail       → error log (मुख्य flow थांबत नाही)
```

### C.2 Dedup आणि Idempotency

- Meta कधीकधी तोच message दोनदा देतं (5s ack चुकला की हमखास) → `msgId` Redis मध्ये, duplicate skip
- Confirm step re-entry ला sensitive आहे — dedup नसेल तर **double booking**

### C.3 Truncation Safety

देवनागरी token-heavy आहे — LLM उत्तर "…नक्कीच नीलम द" असं तुटलं होतं. उपाय दुहेरी: (a) पुरेसे max_tokens (900/2000), (b) `finishSentence()` — शेवटच्या पूर्ण वाक्यापर्यंत trim.

### C.4 Testing — chatSim pattern

```js
// require.cache मध्ये whatsapp utils चा stub → खरी संपूर्ण pipeline, शून्य खरे messages:
require.cache[require.resolve('./utils/whatsapp')] = { exports: { sendText: capture, ... } };
const { handleChat } = require('./chatLogic');
// scripted conversation चालवा, replies तपासा
```
हे **integration test** आहे — chatLogic + decisionEngine + RAG + LLM + DB सगळं खरं. फक्त शेवटचं दार (Meta) बंद. Production वर deploy करण्याआधी प्रत्येक flow इथून काढला. **Test bookings DB मधून delete करायला विसरू नका.**

### C.5 Observability

```js
console.log(`[WH] ... msgs: 1 {from, id, text}`)      // प्रत्येक inbound
console.log(`[Decision] ${phone} → intent: ${intent}`) // प्रत्येक routing निर्णय
console.log(`[WA] Sending to: ... | type: text`)       // प्रत्येक outbound
console.log(`[Cache] LLM HIT: ...`)                    // cache वर्तन
```
Debug क्रम ठरलेला: **inbound आला? → intent काय लागला? → outbound गेला? → error काय?** — या चार प्रश्नांनी आमचे सगळे production प्रश्न सुटले (token 190, list 131009, greeting silence — सगळे याच logs नी सापडले).

---

## PART D: शून्यातून बांधायचा क्रम (Build Order)

```
आठवडा 1 — पाया:
  1. Express + webhook verify (GET) + echo bot (POST → sendText परत)
  2. Meta app + test number + स्वतःचा number allowed list मध्ये
  3. Redis sessions + welcome menu + global commands ('0', 'cancel')

आठवडा 2 — Transactions:
  4. Booking state machine (category→...→confirm) + MySQL schema
  5. Interactive lists/buttons (10-row limit लक्षात!)
  6. my_bookings + booking codes

आठवडा 3 — AI:
  7. Intent classifier (स्वस्त LLM, whitelist validation)
  8. Persona system prompt (भाषा/लिपी नियम, guardrails)
  9. RAG: आधी BM25-only (Doc 2 §2) — हे एकटंच 70%+ देतं!
  10. LLM/RAG caching (Redis)

आठवडा 4 — Depth:
  11. Embeddings + hybrid + rerank (Doc 2 §3-5)
  12. Domain flows (कुंडली, panchang APIs)
  13. chatSim + eval set + मोजून सुधारा
  14. Production hardening: dedup, fail-open, finishSentence, backups, runbook
```

**सर्वात महत्त्वाचा सल्ला:** आधी **BM25-only RAG + चांगले prompts** ship करा — ते 70-80% देतं. Embeddings/rerank हे optimization आहेत, पाया नाहीत. आणि **eval set पहिल्या दिवसापासून** ठेवा — "सुधारलं वाटतंय" आणि "hit@3 70.8→87.5" यात जमीन-अस्मानाचा फरक आहे.

> पुढचं वाचन: **Doc 4** — या project वर interviewer काय काय विचारेल (उत्तरांसह).
