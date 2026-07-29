# �"मी WhatsApp RAG Bot बांधला" — संपूर्ण Interview Preparation

> **Doc 4/5** — Interviewer च्या डोक्यातून विचार करून बनवलेली प्रश्नोत्तरं. प्रश्न English मध्ये (interview तसेच होतात), उत्तराची strategy मराठीत, बोलायचं ते English मध्ये. **Junior पासून Senior/System-design round पर्यंत सगळे स्तर.**

---

## भाग 0: तुझी 60-Second Project Pitch (पाठ कर)

> *"I built a production WhatsApp chatbot for a Marathi pooja-booking platform. It handles two kinds of interactions: deterministic booking flows built as a Redis-backed state machine, and open-domain Q&A powered by a custom hybrid RAG engine — BM25 keyword search plus Gemini embeddings fused with Reciprocal Rank Fusion, then re-ranked by a Groq LLM judge. The knowledge base is 4,000+ chunks including an 841-page Sanskrit-Marathi scripture. The hardest problems were multilingual retrieval — users type the same word in Devanagari or roman script five different ways, so I built a transliteration-normalizing tokenizer — and surviving free-tier API quotas, which I solved with batch embedding, content-hash caching, and graceful degradation. I measured retrieval accuracy with a labeled eval set: 70.8% → 87.5% hit@3. It runs on a 1-vCPU box serving real users."*

यात मुद्दाम पेरलेले hooks (interviewer यावर खोदणारच): state machine, hybrid RAG, RRF, transliteration, quota engineering, eval methodology, resource constraints. **प्रत्येक hook चं खोल उत्तर खाली तयार आहे.**

---

## भाग 1: RAG / Retrieval प्रश्न (सर्वात जास्त इथेच विचारतील)

### Q1. "Walk me through your RAG pipeline end-to-end."
**बोलायचं:** Query येते → cache check (2h) → BM25 scoring with query expansion → parallel semantic scoring (cached query embedding × 4k chunk vectors, cosine) → RRF fusion with intent-type soft boost → top-12 → LLM re-ranker (Groq 8B, temperature 0, JSON indices) → top-4 → parent-document context building with dedup → persona LLM generates grounded answer → cache.
**खोदलं तर:** प्रत्येक stage चा latency सांग: BM25 ~10ms, embed 0-400ms, cosine ~15ms, rerank ~400ms; cached path ~2ms.

### Q2. "Why hybrid search? Why not just embeddings?"
**उत्तर:** Embeddings semantic similarity पकडतात पण **exact/rare tokens वर कमजोर** — booking codes, proper nouns ("Karnavedha"), किमती. BM25 exact matching मध्ये अजेय पण paraphrase ("किती पैसे" vs "खर्च काय") वर आंधळा. दोन्ही **complementary failure modes** — म्हणून hybrid. आमच्या मोजमापात hybrid ने BM25-only पेक्षा ~15-20 points जास्त दिले.
**Follow-up "when would you NOT use hybrid?":** Corpus पूर्ण structured असेल (SQL पुरतं) किंवा पूर्ण conversational असेल (pure semantic पुरतं).

### Q3. "Explain BM25. What do k1 and b do?"
**उत्तर:** TF-IDF चं sophisticated रूप. `score = IDF × tf(k1+1)/(tf + k1(1-b+b·dl/avgdl))`. **k1 (1.5)** = term-frequency saturation — शब्द 10 वेळा आला म्हणजे 10x relevant नाही, curve flatten होतो. **b (0.75)** = length normalization — मोठ्या document मध्ये term सापडणं सोपं, त्याची भरपाई. **IDF** = दुर्मीळ शब्दांना जास्त वजन.
**Senior twist:** "आमच्या weighted expansion मध्ये synonym tokens ला 0.6 weight देतो — मूळ term dilute होऊ नये म्हणून."

### Q4. "Why RRF over weighted score combination?"
**उत्तर:** BM25 scores unbounded (0-30+), cosine [-1,1] — combine करायला normalization लागते आणि ती **fragile** असते (एक outlier स्केल बिघडवतो). RRF फक्त **rank** वापरतो: `Σ w/(60+rank)` — scale-free, robust, आणि एक retriever मेला तरी दुसरा चालू राहतो (graceful degradation built-in). k=60 हा empirical standard — तो लहान केला तर top-heavy, मोठा केला तर flat.

### Q5. "How did you chunk the scripture? Why those numbers?"
**उत्तर:** आधी data मोजला — pages avg 2,541 chars (जुना code 500 वर truncate करत होता = 80% अदृश्य!). Sentence-boundary-aware sliding window: 1000 chars, 150 overlap, वाक्य दंड (।/॥) वर तोडणं. **Overlap का:** उत्तर सीमेवर पडलं तर दोन्ही chunks मध्ये पूर्ण राहतं. **Small-to-big pattern:** matching लहान chunk वर (precise embedding), LLM ला पूर्ण पान (parent_text) — retrieval precision आणि generation context दोन्ही मिळतात.
**हे वाक्य बोल:** *"Chunking decisions should come from measuring your data, not from tutorial defaults."*

### Q6. "What is parent-document retrieval and why did you need it?"
**उत्तर:** Index लहान chunks वर, पण उत्तरात chunk चा **parent** (पूर्ण पान) inject करतो. शास्त्रातलं उत्तर बहुधा एका paragraph पलीकडे झिरपतं. Dedup-by-parent पण करतो — एकाच पानाचे 3 chunks top-4 मध्ये आले तर पान एकदाच जातं.

### Q7. "Tell me about the multilingual problem. This is unusual."
**हा तुझा STAR प्रश्न आहे — इथे चमकायचं:**
*"Users type the same word five ways: पूजा, pooja, puja, pujechi (inflected), even IAST. For BM25 these are five different terms. My solution: a normalization pipeline applied identically to both index and queries — Devanagari→Roman character mapping, Marathi suffix stripping (पूजेची→puja), vowel folding (aa→a, ee→i, oo→u), w→v, double-consonant collapse, trailing-schwa removal (ganesha→ganesh). The key insight: the normalized form doesn't need to be linguistically correct, it needs to be **consistent** — ekadashi becomes 'ekad' on both sides, which is ugly but matches perfectly."*
**Follow-up "why not just use multilingual embeddings?":** ते hybrid च्या semantic बाजूला आहेतच; पण BM25 exact-match layer पण multilingual हवा — दोन्ही थरांत उपाय लागतो. आणि deterministic normalization free + debuggable आहे.

### Q8. "Why an LLM re-ranker instead of a cross-encoder?"
**उत्तर:** Cross-encoder (query+doc एकत्र encode) अचूक असतो पण **local inference** लागते — माझा server 1 vCPU/2GB, आधीच 3 processes. Groq-hosted 8B judge: शून्य RAM, ~400ms, free tier. ColBERT बाद कारण token-level embeddings चा index corpus च्या कित्येक पट. **Trade-offs सांगणं हे senior signal आहे:** *"On a bigger box I'd benchmark a cross-encoder like bge-reranker; on this box the LLM judge was the right call."*
**Follow-up "rerank prompt कसा":** numbered snippets (8 × 150 chars — TPM budget!), temperature 0, "return JSON array of indices", regex-parse, invalid → fail-open to hybrid order.

### Q9. "How do you evaluate your RAG? How do you know it improved?"
**Killer उत्तर:** *"I built a labeled eval set — 24 real queries across all intents, mixed Devanagari/roman/Hinglish, each with expected chunk types and keywords. Metric: hit@3. Baseline BM25-only scored 70.8%, v4 scored 87.5%. Two of the three remaining misses turned out to be a **data gap** — the flagship pooja had zero samagri rows in the DB — which retrieval can't fix; eval caught a data problem, not a code problem. Excluding impossible cases: 95.5%."*
**हे वाक्य:** *"An eval set converts 'it feels better' into 'it measurably improved' — and it catches data bugs too."*

### Q10. "What are embeddings? Explain to a non-technical person, then technically."
**Non-tech:** "प्रत्येक वाक्याला अर्थाच्या नकाशावरचा एक पत्ता मिळतो — सारख्या अर्थाची वाक्यं शेजारी राहतात."
**Tech:** Transformer encoder चं pooled output — 768-dim dense vector; similarity = cosine. Training contrastive (similar pairs जवळ, dissimilar दूर). आमचं: gemini-embedding-001, **taskType asymmetric** (RETRIEVAL_QUERY vs RETRIEVAL_DOCUMENT — प्रश्न आणि उत्तर वेगळ्या स्वरूपाचे असतात), **MRL truncation 3072→768** (पहिले dims सर्वात informative — 4x RAM/compute बचत, ~1% quality किंमत).

### Q11. "Why brute-force cosine? Why no vector database?"
**उत्तर:** 4k vectors × 768 dims = 12MB RAM; brute-force scan ~15ms. HNSW/IVF (approximate nearest neighbor) चा फायदा 100k+ vectors नंतर सुरू होतो. *"A vector DB here would be resume-driven engineering — the simplest thing that works at this scale is a typed array and a for-loop."* **Scale question आलाच तर:** 100k+ chunks → pgvector/FAISS HNSW, embedding shards, incremental index.

### Q12. "How do you prevent hallucination?"
**उत्तर:** (1) RAG grounding — "REAL DATA (use EXACTLY)" section, (2) scripture persona चा नियम: quote फक्त `[DS:पान X]` मधून, नसेल तर स्पष्ट "[या पानांमध्ये थेट उल्लेख नाही]" म्हणायचं, (3) deterministic gadgets — तिथी नावं, राशी गणित LLM ला करू देत नाही (API + mapping tables), (4) guardrails — रत्न सल्ला बंदी, exact भविष्य बंदी. **"LLM narrates, engine calculates."**

---

## भाग 2: System Design प्रश्न

### Q13. "Design a WhatsApp bot backend. Whiteboard it."
Meta webhook → **ack < 5s आधी, process नंतर** (नाहीतर duplicate delivery) → dedup by message-id → session store (Redis, phone-keyed state machine) → router: structured flow steps vs AI layer → responders (Cloud API senders with rate limits) → data layer (MySQL transactions, Redis cache). **आपल्या bot चा block diagram काढ (Doc 1 §1)** — खरा production अनुभव लगेच दिसतो.

### Q14. "Your bot runs on 1 vCPU / 2GB. How does that constrain design?"
**गोल्डन प्रश्न — सगळे निर्णय इथून निघतात:**
- No local ML inference → LLM/embeddings API-hosted (Groq/Gemini)
- 768 dims (12MB) not 3072 (49MB); binary base64 storage not JSON (v3 चं JSON cache 84MB होतं!)
- BM25 index in-memory, brute-force cosine — दोन्ही 1 core वर मावतात
- Boot design: BM25 blocking (5s), embeddings background — bot लगेच उठतो
- Capped fuzzy scan (O(V) × 3 tokens max)

### Q15. "How would you scale this to 100x users?"
**उत्तर (क्रमाने):** (1) Bottleneck मोजा आधी — बहुधा LLM TPM, CPU नाही. (2) Paid API tiers + request queueing (BullMQ). (3) Node cluster/multi-instance — session Redis मध्येच आहे so stateless scaling; sticky sessions नकोत. (4) Embeddings → pgvector, read replicas. (5) Webhook → queue → workers (ack instant, process async). (6) Observability: p95 latency, cache hit rates, intent distribution dashboards.

### Q16. "Why Redis for sessions and not MySQL?"
**उत्तर:** Session = hot, small, TTL-friendly, per-message read+write — Redis चा sweet spot (sub-ms). MySQL = durable transactions (bookings). **दोन्हींचं काम वेगळं:** conversation state क्षणभंगुर आहे, booking कायमची. TTL मुळे abandoned sessions आपोआप साफ.

### Q17. "What happens if Redis dies? MySQL dies? Groq dies?"
Fail-open philosophy: Redis मेला → sessions जातील (users परत 'Hi' करतील), cache miss → थोडं महाग पण चालू. MySQL मेला → booking थांबेल पण Q&A चालेल (KB in-memory!). Groq मेला → polite fallback message; RAG-retrieval अजून चालतो. Gemini मेला → BM25-only 87.5%. **कोणताही single dependency संपूर्ण bot मारत नाही.**

### Q18. "Idempotency — what if Meta delivers the same message twice?"
Message-id dedup (Redis set). हे नसेल तर confirm-step ला double booking! **Payments आले तर:** idempotency keys, DB unique constraints on external txn id.

---

## भाग 3: Debugging War Stories (Behavioral + Technical एकत्र)

**हे प्रश्न आले की गोष्ट सांगायची — STAR format. आमच्या ख्रुऱ्या 8 stories:**

### Story 1: "[object Promise]" on WhatsApp
*Situation:* Booking नंतर samagri message मध्ये literal "[object Promise]" गेलं.
*Root cause:* `const msg = ragEngine.getSamagriDirect(...)` — **missing await**; Promise object template string मध्ये गेला. `if (msg)` पण pass झाला कारण Promise truthy!
*Lesson:* async function चा return वापरताना await; truthiness checks Promise वर निरुपयोगी. **Interviewer ला हे आवडतं कारण हे JS fundamentals + production impact एकत्र आहे.**

### Story 2: RAG engine that was never wired
1402-chunk RAG engine अस्तित्वात होता, "90% accurate" — पण main router सगळे LLM calls **रिकाम्या context ने** करत होता. RAG कधी उत्तरांपर्यंत पोहोचलाच नव्हता!
*Lesson:* *"A component working in isolation means nothing — trace the actual data flow end-to-end."*

### Story 3: The token that kept dying
.env मध्ये नवीन token, तरी 401. कारण: **pm2 stored env + dotenv doesn't override existing vars** — process जुनाच token वापरत होता. उपाय: sourced restart (`set -a && . ./.env && set +a && pm2 restart --update-env`).
*Lesson:* config चं **precedence order** समजून घ्या (shell env > .env). "Where does this process actually get its config?" हा debug चा पहिला प्रश्न.

### Story 4: Silent bot (greeting bug)
User "Hii" पाठवतो, काहीच येत नाही, error पण नाही. Code मध्ये मुद्दाम silent return होता ("main menu वर आहे तर re-welcome नको").
*Lesson:* Logs मध्ये **inbound आहे पण outbound नाही आणि error नाही** = कुठेतरी intentional swallow. UX rule: silence is never a valid response.

### Story 5: The 10-row massacre
Meta list limit **एकूण 10 rows** (आम्ही sections मध्ये 30 पाठवत होतो) → 131009 → 10+ पूजांची कुठलीही यादी silently fail.
*Lesson:* Platform limits दस्तऐवजातून नाही, **error codes मधून** शिकायला लागू नयेत — पण लागले तर ते नोंदवून ठेवा.

### Story 6: Wrong moon sign (boundary case)
Bot कर्क सांगायचा, खरी रास सिंह. जन्म 22:10 चा; panchang API day-level — दिवसाच्या **सुरुवातीचं** नक्षत्र द्यायचं. चंद्र त्या रात्री आश्लेषा→मघा सीमा ओलांडत होता. Fix: birth-details endpoint (exact time+place).
*Lesson:* API निवडताना **granularity** तपासा; boundary cases नेच चुका उघड होतात. Domain accuracy साठी संदर्भ-सत्य (reference app) शी ताडून बघा.

### Story 7: Quota wars
एकाच Gemini key वर तीन ग्राहक: bot embeddings, OCR process, आणि एक **zombie crash-looping जुना bot** जो प्रत्येक restart ला sequential embedder चालवायचा! Fix: zombie थांबवला, batch API (25x कपात), content-hash cache, query cache, circuit breaker.
*Lesson:* Quota हा shared resource आहे — कोण कोण खातंय याचा नकाशा आधी काढा.

### Story 8: LLM writing in IAST
"Reply in pure Marathi" म्हटल्यावर model ने **IAST diacritics** मध्ये लिहायला सुरुवात केली ("Bṛhaspativar upvāsa")! Fix: "देवनागरी लिपीतच लिहा, roman transliteration नको" — with example of right and wrong.
*Lesson:* Prompts मध्ये **script vs language** वेगळं सांगावं लागतं; निगेटिव्ह उदाहरण देणं शक्तिशाली आहे.

---

## भाग 4: LLM Engineering प्रश्न

### Q19. "How do you control LLM costs/latency?"
Layered: (1) **Model routing** — classification ला 8B (10 tokens), generation ला 120B; (2) **Response caching** 6h by normalized query+intent; (3) **max_tokens budgets** प्रत्येक task ला वेगळे (10/900/2000); (4) rerank prompt compression (8×150 chars); (5) history trimming (शेवटचे 8 turns).

### Q20. "Prompt engineering — what actually worked?"
(1) **Persona + hard rules** ("NEVER exact predictions") — tone आपोआप येतो; (2) **Structured output formats** with emoji section markers; (3) **Negative examples** ("ट्रायटिया — ASA NAKO"); (4) **Script instruction** separate from language; (5) पण **सर्वात विश्वसनीय = prompt वर अवलंबूनच न राहणं** — तिथी नावं deterministic map ने बदलतो, LLM ला ती जबाबदारी दिलीच नाही.

### Q21. "Devanagari is token-heavy. Implications?"
1 मराठी शब्द ≈ 3-6 tokens (English ≈ 1.3). परिणाम: (a) same max_tokens मध्ये कमी मजकूर → truncation → `finishSentence()` trim; (b) TPM budgets लवकर संपतात → prompt compression; (c) embedding char-limits आधी हिशोब करा.

### Q22. "Temperature? Why 0 for reranking?"
Rerank/classification = deterministic tasks — सर्जनशीलता नको, consistency हवी → temp 0. Guruji persona = default (काहीशी विविधता चालते).

---

## भाग 5: Node.js / Backend प्रश्न

### Q23. "Event loop — why is Node good for this bot?"
Bot I/O-bound आहे (API calls, DB, Redis) — Node चा single-threaded event loop असल्या workload ला परफेक्ट; CPU-bound काम (BM25 build) फक्त boot ला. Blocking loop ठेवला असता तर webhook ack चुकले असते.

### Q24. "How did you test without sending real WhatsApp messages?"
`require.cache` injection — module load होण्याआधी `utils/whatsapp` च्या जागी stub: खरी संपूर्ण pipeline चालते (routing→RAG→LLM→DB), फक्त शेवटचं HTTP दार बंद. **DI framework शिवाय dependency injection.** हे सांगितलं की Node internals ची समज दिसते.

### Q25. "Promise.all vs Promise.allSettled — where did you use which?"
Panchang मध्ये `allSettled` — दोन API calls (panchang + rahu-kaal) पैकी एक मेला तरी दुसऱ्याचा data वापरायचा. Kundali मध्ये `Promise.all` + प्रत्येकाला स्वतःचा `.catch(() => null)` + timeout race: `Promise.race([p, timeout(8000)])`.

### Q26. "Float32Array and Buffer usage?"
Embeddings `new Float32Array(768)` — plain array पेक्षा निम्मी memory, cosine loop जलद. Redis storage: `Buffer.from(vec.buffer).toString('base64')`; परत: `new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength/4)`. JSON numbers पेक्षा ~7x लहान.

---

## भाग 6: Database प्रश्न

### Q27. "Schema for the booking system?"
`bookings(id, tenant_id, booking_code UNIQUE, user_id, pooja_id FK, pujari_id FK, booking_date, booking_time, address, status ENUM, payment_status, total_amount, platform_fee, created_at...)` — multi-tenant (tenant_id), status machine (pending→confirmed→completed/cancelled), money split fields.
**War story:** INSERT मध्ये 14 columns पण 13 values — tenant_id गायब! Column-value mismatch हा classic.

### Q28. "Redis data structures you used?"
STRING (sessions JSON, caches), **HASH** (`rag_emb:v4:768` — 4k embedding fields एकाच key खाली; hmGet ने एकाच roundtrip मध्ये सगळे), TTLs सगळीकडे (2h ते 60d — प्रत्येक cache चा स्वतःचा re-validation rhythm). `--scan --pattern` production वर (`keys` blocking आहे).

---

## भाग 7: API Integration प्रश्न

### Q29. "OAuth patterns you handled?"
तीन प्रकार: Meta (long-lived bearer + System User permanent tokens), Prokerala (**client-credentials flow** — token expiry track करून 30s आधी refresh), Groq/Gemini (static keys). Retry design: 429 vs 401 वेगळे — 429 = backoff-and-retry, 401 = थांब आणि आरडाओरडा कर (retry निरर्थक).

### Q30. "Design a rate-limit-resilient batch job."
आमचा embedding builder हेच आहे: batch requests (25x कपात) → exponential backoff [10,30,60,120,240]s → **circuit breaker** (3 consecutive failures → थांब) → scheduled retry (2h) → progress durable (हर batch नंतर Redis hSet) → restart-safe (content-hash cache). **हे describe करणं = distributed systems maturity.**

---

## भाग 8: Behavioral प्रश्न (STAR तयारी)

### Q31. "Most challenging bug?"
→ Story 3 (token/env precedence) किंवा Story 6 (moon sign boundary). दोन्हीत: methodical narrowing, evidence-first, root cause, systemic fix + documentation.

### Q32. "A time you improved something measurably?"
→ Eval story: baseline 70.8% मोजला → चार सुधारणा (translit, chunking, rerank, wiring) → 87.5% → 3 misses चं analysis → 2 data gaps discovered. **Numbers बोलतात.**

### Q33. "A time you pushed back / made a pragmatic call?"
→ "Vector DB का नाही वापरला" — scale analysis करून सोपं solution निवडलं. किंवा "cross-encoder नाकारला" — resource constraints. *"I optimize for the problem I have, not the problem that's fashionable."*

### Q34. "How do you approach legacy code?"
→ v3→v4: आधी **वाचलं आणि मोजलं** (avg page 2541 chars!), usage grep केला (कोण कुठून call करतं), backup ठेवून incremental बदल, प्रत्येक बदलाला eval ने ताडलं, rollback path कायम तयार.

### Q35. "Explain a technical concept to a non-technical stakeholder."
→ RAG: *"Bot ला open-book परीक्षा द्यायला लावतो — पुस्तकाची योग्य पानं शोधून समोर ठेवतो, मग उत्तर लिहायला सांगतो. पानं शोधणं (retrieval) हे माझं engineering; लिहिणं LLM चं."*

---

## भाग 9: Rapid-Fire (एका वाक्यात)

| प्रश्न | उत्तर |
|--------|-------|
| BM25 vs TF-IDF? | BM25 = TF-IDF + tf-saturation (k1) + length normalization (b) |
| Cosine vs dot product? | Cosine = normalized dot; length बाद, फक्त दिशा |
| hit@k vs MRR? | hit@k = top-k मध्ये आहे का; MRR = कितव्या स्थानी याचंही वजन |
| Bi-encoder vs cross-encoder? | Bi = वेगळे encode, जलद, index-able; cross = एकत्र encode, अचूक, महाग |
| Why k=60 in RRF? | Empirical standard; lower = top-heavy, higher = flat |
| Semantic vs keyword failure? | Semantic: rare tokens चुकतात; keyword: paraphrase चुकतो |
| Idempotency? | तीच request दोनदा = परिणाम एकदाच (msg-id dedup) |
| Why temperature 0 for classify? | Deterministic task — consistency > creativity |
| MRL? | Matryoshka — पहिले dims सर्वात informative; truncate करता येतं |
| Fail-open vs fail-closed? | Enhancement fails → चालू राहा (rerank); security fails → थांबा |

---

## भाग 10: तुला उलट विचारायचे प्रश्न (Interview च्या शेवटी)

1. "How do you evaluate retrieval quality in your production RAG systems?"
2. "What's your approach to multilingual search — do you normalize at index time or query time?"
3. "How does the team handle LLM cost attribution across features?"
4. "What does your eval/regression pipeline look like when prompts change?"

**हे प्रश्न विचारले की तू त्यांच्या स्तरावर विचार करतोस हे सिद्ध होतं.**

---

## शेवटचा मंत्र

Interview मध्ये प्रत्येक उत्तराची रचना: **निर्णय → कारण → trade-off → मोजमाप.**
*"I chose X because Y; the trade-off was Z; I verified it with W."*
हे चारही आपल्या project मध्ये प्रत्येक ठिकाणी खरे आहेत — म्हणूनच हा project interview gold आहे.

> पुढचं वाचन: **Doc 5** — Embeddings, Vector Search आणि AI concepts ची theory.
