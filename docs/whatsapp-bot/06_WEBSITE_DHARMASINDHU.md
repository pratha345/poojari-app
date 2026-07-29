# 🕉️ Website धर्मसिंधु शंका समाधान — संपूर्ण System Explained (v2)

> **Doc 6/6** — `pujari.mydashboard.site/admin/dharmasindhu` मागचं पूर्ण engineering: Python RAG microservice + Node controller pipeline, v1 च्या त्रुटी → v2 चे fixes (2026-07-04 deploy), खरे test results, आणि Groq deprecation migration.
> **टीप:** हे WhatsApp bot च्या RAG पेक्षा **वेगळं, स्वतंत्र system** आहे — तोच ग्रंथ, वेगळा stack.

---

## 1. High-Level Architecture

```
Browser (admin panel)
   │  POST /api/dharmasindhu/ask  { question: "त्रिपाद नक्षत्र म्हणजे काय?" }
   ▼
┌─────────────────────────── pojjari-backend (Node, port 5000) ───────────────────────────┐
│  dharmasindhu.controller.js — orchestrator                                              │
│                                                                                          │
│   1. Cache check (Redis, ds:ask:v2:{md5}, 24h) ──── HIT → 16ms return                    │
│   2. PARALLEL:                                                                           │
│      ├── searchWithRAG(question) ────────► Python microservice (port 8765)              │
│      │                                      ChromaDB semantic search (4,586 chunks)     │
│      └── extractMarathiKeywords(question) ► Groq llama-3.1-8b                            │
│                                             "त्रिपाद" → "त्रिपाद, पूर्ववसु, उत्तराषाढा..."   │
│   3. FULLTEXT search (MySQL ft_ds index) with expanded keywords                          │
│   4. Merge (dedup by page) → Groq RERANK (10 → 6)                          [v2 नवीन]     │
│   5. DS कमजोर (<3 sources) असेल तरच → /wiki (keywords ने)                  [v2 नवीन]     │
│   6. Context build (1100 chars/chunk × 6)                                  [v2: 450→1100]│
│   7. Groq gpt-oss-120b → structured scholar answer                         [v2: 8b→120b] │
│   8. finishSentence trim → cache → respond (sources + search_mode सह)      [v2 नवीन]     │
└──────────────────────────────────────────────────────────────────────────────────────────┘

External: Groq (keywords/rerank/answer) | mr/hi Wikipedia API | MySQL (841 पानं) | Redis
```

**तीन-स्तरीय retrieval का:** एकाच प्रश्नाला तीन वेगळ्या नजरा —
- **Semantic (ChromaDB):** अर्थाने जुळणारे chunks (paraphrase पकडतो)
- **FULLTEXT + LLM keywords:** ग्रंथातल्या *नेमक्या शब्दांनी* शोध — expansion मुळे "पंचक" विचारल्यावर धनिष्ठा/शतभिषा पण सापडतात
- **LIKE fallback:** दोन्ही फसले तर प्रत्येक keyword चा साधा substring शोध

---

## 2. Python Microservice — `scripts/rag_service.py`

```python
# FastAPI, port 8765; pm2: dharmasindhu-rag (~336MB RAM — box वरचा सर्वात मोठा process)
MODEL = "paraphrase-multilingual-MiniLM-L12-v2"   # sentence-transformers, 384-dim, LOCAL
# ChromaDB PersistentClient → collection "dharmasindhu" → 4,586 chunks

@app.post("/search")   # semantic search; v2: include_wiki flag (Node आता false पाठवतो)
def search(body):
    q_emb = _model.encode(body.question)          # query → 384-dim vector (CPU, local)
    cr = _collection.query(query_embeddings=[q_emb], n_results=5)
    # → [{content, page_no, score: 1-distance}]

@app.post("/wiki")     # v2 नवीन: targeted Wikipedia — Node LLM-keywords पाठवतो
def wiki(body):
    return fetch_wikipedia(body.query, "mr") or fetch_wikipedia(body.query, "hi")
```

**Bot पेक्षा वेगळं काय:** इथे embeddings **local model** ने बनतात (API नाही — quota चा प्रश्नच नाही, पण RAM खातो आणि model जुना/paraphrase-tuned आहे); vectors ChromaDB मध्ये persistent (bot: Redis hash + in-memory).

**Wikipedia integration:** mr.wikipedia → नसेल तर hi.wikipedia; article extract [:2000]. **v2 सुधारणा:** आधी *प्रत्येक* प्रश्नाला प्रश्नाच्या पहिल्या 2-3 शब्दांनी wiki शोध व्हायचा ("श्राद्ध कधी करावे?" → "श्राद्ध कधी" = वाईट title match). आता (a) फक्त DS sources < 3 असतील तेव्हाच, (b) LLM-extracted keywords ने ("श्राद्ध, पिंडदान" = अचूक title match).

---

## 3. Node Controller — Pipeline चा प्रत्येक टप्पा

### 3.1 Keyword Extraction — या system चा हुशार भाग

```js
// Groq llama-3.1-8b, temperature 0, few-shot examples सह:
// "पंचक नक्षत्र"  → "पंचक, धनिष्ठा, शतभिषा, शततारका, रेवती, पूर्वाभाद्रपदा, उत्तराभाद्रपदा"
// "shraddha"     → "श्राद्ध, पिंडदान, तर्पण, पितृ"        ← roman input चं Devanagari रूपांतर पण!
```

हे तीन कामं एकात करतं: (1) **query expansion** — विषयाशी संबंधित ग्रंथातले शब्द, (2) **transliteration bridge** — roman प्रश्न → देवनागरी शोध, (3) **नक्षत्र-गट unfolding** — गटाचं नाव → सदस्य नक्षत्रं. Bot मध्ये हेच काम synonym table + translit tokenizer करतो — इथे LLM one-shot करतो (जास्त लवचीक, पण प्रत्येक प्रश्नाला एक LLM call).

### 3.2 Multi-Strategy MySQL Search

```
Strategy A: MATCH(content) AGAINST(expanded_keywords IN BOOLEAN MODE)  ← FULLTEXT index (ft_ds)
Strategy B: (A ने <3 दिलं तर) प्रश्नाच्याच शब्दांनी FULLTEXT
Strategy C: (अजून <2 तर) प्रत्येक keyword चा LIKE '%शब्द%' — शेवटचा आधार
```

### 3.3 Merge + Rerank (v2 नवीन)

```js
// RAG chunks + FULLTEXT extras (page dedup) → 10 candidates
dsSources = await rerankSources(question, dsSources, 6, apiKey);
// Groq 8b judge: numbered snippets (120 chars) → "JSON array of indices" → top-6
// Fail-open: 429/parse-fail → मूळ क्रम
```
**का लागला:** v1 मध्ये merge क्रम arbitrary होता (RAG आधी, FULLTEXT ला ठोकळ score 0.4) — दोन स्रोतांची खरी तुलना होतच नव्हती. त्रिपाद test मध्ये rerank नेच पान 792 (खरी व्याख्या) वर आणलं.

### 3.4 Answer Generation (v2 चा गाभा-बदल)

| | v1 | v2 |
|---|---|---|
| Model | `llama-3.1-8b-instant` | **`openai/gpt-oss-120b`** |
| max_tokens | 1200 | **2000** (देवनागरी ≈ 3-6 tokens/शब्द!) |
| Context/chunk | 450 chars (वचन तुटायचं!) | **1100 chars** |
| Chunks | 5 | 6 |
| Truncation guard | नाही | **finishSentence()** trim |

**Prompt चा rule-conflict fix (v2 मधला सर्वात सूक्ष्म पण महत्त्वाचा):**
v1 मध्ये दोन नियम भांडायचे — *"NEVER invent beyond passages"* ↔ *"NEVER say माहिती नाही — use general knowledge"*. 8B अशा contradiction मध्ये general knowledge ला **DS पानाचं खोटं label** लावू शकायचा. v2 नियम स्पष्ट escape-hatch देतो:

```
Rule 2: DS passages मध्ये थेट उत्तर नसेल तर 📖 section मध्ये नेमकं हे लिहा:
  "[या पानांमध्ये थेट उल्लेख नाही — सामान्य धर्मशास्त्र ज्ञानावर आधारित]"
  आणि general knowledge फक्त नंतरच्या sections मध्ये वापर.
Rule 3: General/Wikipedia मजकुराला DS पान क्रमांक कधीही चिकटवू नको.
```
Deploy नंतरच्या पहिल्या test मध्येच model ने हा fallback प्रामाणिकपणे वापरला — म्हणजे नियम काम करतोय.

### 3.5 Cache (v2 fix)

```js
// v1: md5(question) — "करावे" vs "करावे?" = वेगळे keys = फुकट cache miss!
// v2: punctuation/whitespace normalize करून md5 → ds:ask:v2:{hash}
// मोजलेलं: "करावी???" variant → 16ms cache HIT ✓
```

---

## 4. खरे Test Results (deploy नंतर लगेच, 2026-07-04)

### Test 1: "त्रिपाद नक्षत्र म्हणजे काय?" — 2.4s ✅ आदर्श केस
```
KEYWORDS: त्रिपाद, पूर्ववसु, उत्तराषाढा, कृत्तिका, उत्तरा, विशाखा, पंचक...
PAGES (rerank नंतर): 546, 792, 746, 577, 574, 356
उत्तर: 📖 धर्मसिंधु सांगतो: (पान 792)
  "त्रिपाद नक्षत्रे तर—पूर्ववसु, उत्तराषाढा, कृत्तिका, उत्तरा, पूर्वभाद्रपदा, विशाखा."
```
**ग्रंथातलं थेट vachan, page citation सह** — hallucination नाही; सगळी 6 नक्षत्रं नावानिशी (मूळ scholar-prompt चा rule 10 पाळला).

### Test 2: "द्वादशी पारणा कधी करावी?" — 3.7s ✅ प्रामाणिक-fallback केस
Retrieved pages मध्ये थेट उत्तर नव्हतं → model ने "[या पानांमध्ये थेट उल्लेख नाही...]" लिहून मगच general dharmashastra ज्ञानाने पूर्ण उत्तर दिलं — **खोटं attribution शून्य.** Wiki योग्यरीत्या skip (DS sources 6 होते).

### v1 vs v2 फरक एका दृष्टीत
v1 8B उत्तरं: format अर्धवट, "ट्रायटिया"-टाइप भ्रष्ट शब्द, 450-char तुटलेली वचनं, प्रत्येक प्रश्नाला off-topic wiki.
v2: पूर्ण structured उत्तर, शुद्ध देवनागरी, थेट quotes, targeted wiki, sentence-complete.

---

## 5. Groq Model Deprecation Migration (त्याच दिवशी)

Groq notice: **Llama 3.3 70B Versatile deprecated → decommission 2026-08-16.** पूर्ण codebase inventory काढला:

| Model | कुठे होतं | कृती |
|-------|----------|------|
| `llama-3.3-70b-versatile` ☠️ | `groqRashifalService.js` (उद्या/आठवडा राशिभविष्य) | ✅ → `openai/gpt-oss-120b` migrate |
| `llama-3.1-8b-instant` | bot classify/rerank + DS keywords/rerank | Safe — पण lightweight कामांसाठीच ठेवलाय |
| `openai/gpt-oss-120b` | सगळी final उत्तरं (bot + website) | Groq recommended ✓ |
| `llama-4-scout-17b-16e` | samagri.controller.js | Notice मध्ये नाही; watch list वर |

**धडा:** Provider deprecation emails आल्यावर लगेच `grep -rn "model-name"` inventory काढा — decommission date ला silent failures येण्यापेक्षा एक sed-ओळ स्वस्त आहे. (राशिभविष्य 16 ऑगस्टला न सांगता मेलं असतं!)

---

## 6. दोन RAG Stacks — तुलना आणि भविष्य

| | 📱 WhatsApp Bot (ragEngine v4) | 🌐 Website (dharmasindhu v2) |
|---|---|---|
| Keyword layer | BM25 + translit tokenizer + synonym table | MySQL FULLTEXT + **LLM keyword expansion** |
| Semantic layer | Gemini API embeddings (768-d, quota) | **Local** MiniLM (384-d, RAM 336MB) |
| Vector store | Redis hash + in-memory Float32Array | ChromaDB persistent |
| Chunks (धर्मसिंधु) | 3,007 (1000 chars/150 overlap + parent pages) | 4,586 (setup_rag.py चं chunking) |
| Fusion | RRF (rank-based) | Merge + dedup (RAG-first) |
| Rerank | Groq 8b judge ✓ | Groq 8b judge ✓ (v2) |
| Answer | gpt-oss-120b, shastra persona | gpt-oss-120b, scholar format (v2) |
| Wikipedia | नाही | आहे (targeted, v2) |

**दोन्हींची स्वतःची ताकद:** bot चा translit-BM25 deterministic/फुकट आहे; website चं LLM keyword expansion जास्त लवचीक आहे (नक्षत्र-गट unfolding!). पण **एकाच ग्रंथाचे दोन वेगळे indexes = same प्रश्नाला वेगळी पानं** (द्वादशी: bot ने 145/54, website ने 230-236 दिली — दोन्ही बरोबर, पण inconsistent).

**दीर्घकालीन दिशा (अजून केलेलं नाही):** एक retrieval service, दोन frontends — bot च्या RAG v4 ला `/retrieve` HTTP endpoint द्या, website controller तिकडे point करा → 336MB python process निवृत्त, एकच सत्य, LLM keyword expansion ची कल्पना bot मध्ये merge करता येईल.

---

## 7. Operations Cheat-Sheet

```bash
# Health
curl -s http://localhost:8765/health     # {"chunks": 4586, "model_ready": true...}
pm2 list | grep -E 'dharmasindhu-rag|pojjari-backend'

# Cache flush (prompt बदलल्यावर!)
redis-cli --scan --pattern 'ds:ask:*' | xargs -r redis-cli del

# Test (admin token लागतो)
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"phone":"9000000000","password":"..."}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
curl -s -X POST http://localhost:5000/api/dharmasindhu/ask \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"question":"त्रिपाद नक्षत्र म्हणजे काय?"}'

# Rollback: *.pre-v2.backup.* (controller, rag_service.py), *.pre-migration.backup.js (rashifal)
# Python service restart नंतर model load ~30s घेतो — health लगेच fail होणं normal आहे
```

**File locations:** Server: `/var/www/pojjari/backend/src/controllers/dharmasindhu.controller.js` + `scripts/rag_service.py` | Local repo: `backend/src/controllers/` (synced 2026-07-04)

---

## 8. या System मधून शिकलेले धडे (Doc 1 च्या gotcha-परंपरेत)

1. **छोट्या model ला मोठं format देऊ नका** — 8B + strict structured Marathi output = भ्रष्ट उत्तरं; scholar काम 120B चंच
2. **Prompt मध्ये contradicting rules = hallucination चा राजमार्ग** — प्रत्येक "NEVER" ला स्पष्ट escape-hatch द्या
3. **Context snippets कापताना वचन तुटतं** — 450 chars मध्ये संस्कृत quote मावत नाही; generous ठेवा (1100+)
4. **Wiki सारखे enrichments conditional ठेवा** — गरज नसताना जोडलेला context = latency + off-topic धोका
5. **Cache keys punctuation-proof करा** — "?" च्या फरकाने cache miss होणं मूर्खपणा आहे
6. **LLM keyword expansion हे underrated pattern आहे** — एका स्वस्त call मध्ये expansion + transliteration + domain unfolding
7. **Deprecation notice आला की त्याच दिवशी inventory + migrate** — "नंतर करू" म्हणजे production मध्ये silent death

> **संपूर्ण documentation set:** [README.md](README.md) — Docs 1-6 index
