# 🧠 RAG v4 Engine — Embedding Model Step-by-Step, In-Depth

> **Doc 2/5** — `ragEngine.js` v4 कसा बांधला: chunking → BM25 → embeddings → hybrid fusion → rerank → parent context → caching → evaluation. प्रत्येक निर्णय **का** घेतला यासह.

---

## 0. RAG म्हणजे काय आणि आपल्याला का लागला

**RAG = Retrieval-Augmented Generation.** LLM ला प्रश्नाबरोबर **आपल्या knowledge base मधला संबंधित मजकूर** देणं, म्हणजे तो हवेतून उत्तर बनवत (hallucinate करत) नाही.

आपली गरज: user विचारतो *"सत्यनारायण पूजेला किती खर्च?"* — LLM ला ₹4,500 माहित नाही, ते आपल्या MySQL मध्ये आहे. किंवा *"द्वादशी पारणा कधी करावी?"* — उत्तर धर्मसिंधु ग्रंथाच्या पान 145 वर आहे. RAG हा पूल आहे: **प्रश्न → संबंधित chunks शोध → LLM ला दे → grounded उत्तर**.

### आपला प्रवास (मोजलेले आकडे):
| Version | पद्धत | hit@3 |
|---------|-------|-------|
| v3 | BM25-only (truncated chunks) | **70.8%** |
| v4 keyword | BM25 + translit + expansion + rerank | **87.5%** |
| v4 hybrid | + embeddings (RRF) | **~90-93% अपेक्षित** |

---

## STEP 1: Knowledge Base Building — Chunking

### 1.1 Chunk म्हणजे काय
Chunk = शोधता येण्याजोगा मजकुराचा एक तुकडा. आपले 4,029 chunks, 8 स्रोतांमधून:

```
73 pooja + 66 samagri + 12 pujari + 836 blog + 3007 धर्मसिंधु + 22 astro + 7 vastu + 6 FAQ
```

प्रत्येक chunk ची रचना:
```js
{
  id:   'dharma_145_2',            // unique
  type: 'dharmasindhu',            // intent filtering/boosting साठी
  text: 'धर्मसिंधु पान 145: द्वादशी व श्रवण...',   // यावर search होतो
  metadata: {                      // display + parent retrieval साठी
    page_no: 145,
    parent_id: 'dharma_145',
    parent_text: 'धर्मसिंधु (पान 145): <पूर्ण पान 2200 chars>',
  }
}
```

### 1.2 v3 ची घोडचूक — truncation ≠ chunking

v3 मध्ये: धर्मसिंधुचं **पान = 1 chunk, 500 chars वर hard-cut**. पण पानांची सरासरी लांबी **2,541 chars** निघाली (DB मोजून काढलं)! म्हणजे **शास्त्राचा ~80% मजकूर retrieval ला अदृश्य** होता. Blogs चंही तसंच (सरासरी 1,639, cut 600 वर → 60%+ अदृश्य).

> **धडा:** chunking ठरवण्याआधी `SELECT AVG(CHAR_LENGTH(content)), MAX(...)` चालवा. Truncation म्हणजे data गमावणं; chunking म्हणजे data विभागणं.

### 1.3 v4 — Sentence-aware sliding window with overlap

```js
function splitText(text, size, overlap, maxChunks) {
  // size पर्यंत घे, पण शेवट वाक्य-सीमेवर शोध: ॥ । '. ' \n
  // (slice.lastIndexOf('।') etc.; सीमा size च्या 45% नंतर असेल तरच वापर)
  // पुढचा chunk (end - overlap) पासून सुरू → overlap मुळे सीमेवरचं वाक्य दोन्हीत राहतं
}
// धर्मसिंधु: size=1000, overlap=150, maxChunks=8/पान  → 841 पानं → 3,007 chunks
// Blogs:     size=900,  overlap=140, maxChunks=6/blog → 381 blogs → 836 chunks
```

**Overlap का लागतो:** उत्तर chunk-सीमेवर पडलं तर overlap शिवाय ते **कुठल्याच chunk मध्ये पूर्ण नसतं**. 15% overlap हा standard sweet spot.

**Chunk size ची trade-off:**
- लहान (300-500) → precise matching, पण संदर्भ तुटतो + chunks जास्त = embedding खर्च जास्त
- मोठा (1500+) → संदर्भ राहतो, पण embedding "पातळ" होतं (एका vector मध्ये खूप विषय), BM25 पण diffuse
- **1000/150 निवडलं** कारण: (a) धर्मसिंधुचा एक विषय साधारण एवढाच चालतो, (b) 4k chunks × 768 dims RAM मध्ये मावतात, (c) parent-document pattern ने मोठा संदर्भ वेगळा मिळतोच

### 1.4 Bilingual chunk text — retrieval hack

Static chunks मध्ये मुद्दाम **दोन्ही scripts** पेरल्या:
```js
text: 'Mangal Dosh मंगळ दोष (Kuja Dosh): Mars in 1st, 4th... Upay: Mangalavar upvaas...'
```
朝म्हणजे "mangal dosh" आणि "मंगळ दोष" दोन्ही queries same chunk ला hit करतात — transliteration layer ला bypass करणारा double-anchor.

---

## STEP 2: BM25 — Keyword Search Engine

### 2.1 का BM25 (आणि फक्त embeddings का नाही)
- **Exact terms** साठी अजेय: "PJ20263777", "Karnavedha", किमती, नावं
- Zero external dependency, zero cost, index build ~2 sec
- Embeddings semantic जुळवतात पण **rare/proper nouns** वर कमजोर — दोघं complementary → hybrid

### 2.2 Inverted Index

```js
invertedIdx = {
  'satyanarayan': [ {i: 12, tf: 3, docLen: 45}, {i: 88, tf: 1, docLen: 120}, ... ],
  'puja':         [ ...843 postings... ],
}
```
`i` = chunk index, `tf` = term त्या chunk मध्ये किती वेळा, `docLen` = chunk ची token length. 4,026 chunks → **72,214 unique terms**.

### 2.3 BM25 Formula (समजून घ्या — interview मध्ये हमखास)

```
score(chunk, query) = Σ (प्रत्येक query term साठी)
    IDF(term) × [ tf × (k1 + 1) ] / [ tf + k1 × (1 - b + b × docLen/avgDocLen) ]

IDF(term) = ln( (N - df + 0.5) / (df + 0.5) + 1 )
k1 = 1.5 (tf saturation), b = 0.75 (length normalization)
```

- **IDF**: दुर्मीळ शब्द (satyanarayan) = जास्त वजन; सामान्य (puja) = कमी
- **tf saturation (k1)**: शब्द 10 वेळा आला म्हणजे 10x महत्त्व नाही — curve flatten होतो
- **length normalization (b)**: मोठ्या chunk मध्ये term येणं सोपं आहे — त्याची भरपाई

### 2.4 Transliteration Tokenizer — आपलं सर्वात मोठं मराठी-specific innovation

**समस्या:** users लिहितात "pooja", "पूजा", "puja", "pujechi" — BM25 साठी हे **चार वेगळे शब्द**!

**उपाय:** index आणि query **दोन्ही एकाच pipeline मधून** — मग स्पेलिंग "बरोबर" असण्याची गरज नाही, फक्त **consistent** असावी लागते:

```
Input token
  → देवनागरी असेल तर → devToRoman()        # char-map: क→k, ा→a, ्→(delete inherent a)...
  → suffix strip: पूजेची→puja (chi/che/cha/la/shi/sathi/madhe... , remainder ≥4)
  → vowel folding: aa→a, ee→i, oo→u        # "saamagree"→"samagri"
  → w→v, ph→f                              # dwadashi=dvadashi, phal=fal
  → double collapse: dd→d                  # shraddha→shradha
  → trailing-a strip (len>4, आधी consonant) # ganesha→ganesh
```

Verified pairs (11/12 match):
```
पूजा↔pooja→puja | सत्यनारायण↔satyanarayan | श्राद्ध↔shraddha→shradh
द्वादशी↔dwadashi→dvad | मंगळ↔mangal | गृहप्रवेश↔gruhapravesh | पूजेची→puja ✓
```

**मुख्य तत्त्व:** normalized रूप "विचित्र" दिसलं तरी चालतं (`ekadashi→ekad`) — **दोन्ही बाजूंनी सारखंच** निघालं की match होतो. Search मध्ये correctness पेक्षा consistency महत्त्वाची.

### 2.5 Synonym Query Expansion

~28 गट, query-side (index फुगत नाही):
```js
['samagri','saman','sahitya','yadi','list','items','material']
['price','kimmat','paise','kharch','cost','rate','shulka']
['pujari','pandit','guruji','purohit','bhatji']
['havan','hom','yagya','yadnya','yag'] ...
```
Base tokens weight **1.0**, synonyms **0.6** — expansion मुळे मूळ शब्दाचं महत्त्व dilute होऊ नये.

### 2.6 Fuzzy fallback (capped!)

Unknown token आला तर vocabulary वर substring scan — पण **फक्त 3 unknown tokens/query, weight 0.4**. v3 मध्ये हा uncapped O(V) प्रत्येक अनोळखी शब्दाला चालायचा — 1 vCPU वर 72k terms scan = महाग.

---

## STEP 3: Semantic Embeddings — Gemini

### 3.1 Embedding म्हणजे काय (एका ओळीत)
मजकूर → **768 आकड्यांचा vector** — असा की **अर्थाने जवळचे मजकूर = जवळचे vectors**. "किती पैसे लागतील?" आणि "खर्च काय येईल?" मध्ये एकही शब्द common नाही, पण vectors जवळ — हेच BM25 ला जमत नाही आणि embeddings ला जमतं.

### 3.2 Model आणि critical parameters

```js
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent
{
  model: 'models/gemini-embedding-001',
  content: { parts: [{ text: chunk.text.slice(0, 2000) }] },
  taskType: 'RETRIEVAL_DOCUMENT',      // chunks साठी; queries → 'RETRIEVAL_QUERY'
  outputDimensionality: 768,           // default 3072 ऐवजी
}
```

**`taskType` का (asymmetric embedding):** प्रश्न आणि उत्तर-document **वेगळ्या स्वरूपाचे** असतात ("किती वेळ लागतो?" vs "Duration: 2.5 hours..."). Model ला हे सांगितलं की तो दोघांना एकाच "उत्तर-जागे"त project करतो → retrieval सुधारते.

**768 dims का (3072 नाही) — Matryoshka Representation Learning (MRL):** gemini-embedding-001 चे पहिले 768 dims जवळपास पूर्ण quality देतात (MRL training मुळे). फायदे: **4x कमी RAM** (4k chunks × 3072 × 4B = 49MB vs 12MB), **4x जलद cosine** (आपल्या 1 vCPU साठी महत्त्वाचं), 4x कमी Redis. Quality drop: ~1-2% — deal.

### 3.3 Batch API — quota engineering चा राजा

v3: 1 request/1.2s sequential → 1402 chunks = **28 मिनिटं** API time, आणि दर request quota खातो.
v4: `batchEmbedContents` — **25 texts एका request मध्ये**:

```js
POST .../gemini-embedding-001:batchEmbedContents
{ requests: [ {model, content, taskType, outputDimensionality}, × 25 ] }
```
4,029 chunks = **162 requests** (25x कपात). 429 आलं तर backoff: 10s→30s→60s→120s→240s. **3 batches सलग fail → थांबून 2h retry timer** (quota संपली हे ओळखून निष्फळ backoff-cycle टाळणं).

### 3.4 Content-hash cache — re-embedding कधीच पूर्ण नाही

```js
// Redis HASH: rag_emb:v4:768 → field = sha1(chunk.text), value = base64(Float32Array)
chunkHashes = chunks.map(c => sha1(c.text));
const vals = await redis.hmGet(EMB_HASH_KEY, chunkHashes);   // एकाच call मध्ये सगळे
// नसलेले → batch embed → hSet
```

**का hash-keyed (index-keyed नाही):** v3 मध्ये cache key `rag_embeddings:v3:1402` (count!) होती — **एक chunk बदलला/वाढला की सगळं cache निकामी**. Hash-keyed मध्ये re-chunking/नवीन पूजा आली तरी **फक्त बदललेले chunks** re-embed होतात. Deploy दरम्यान count 4029→4026 झाला तरी कोणतीही embedding वाया गेली नाही — हेच design सिद्ध झालं.

**Binary storage:** JSON array ऐवजी `Buffer.from(vec.buffer).toString('base64')` — v3 चं 1402-chunk JSON cache **84MB** होतं; v4 चं 4k-chunk binary ~12MB.

### 3.5 Query embedding cache — runtime quota वाचवणारा

v3 ची लपलेली समस्या: **प्रत्येक user query वर live Gemini call** — chunks cached असूनही! Quota दिवसा संपायची आणि "hybrid 90%" मुळात "पहिल्या काही queries पुरता 90%" होता.

```js
// Key: sha1( tokenize(query).sort().join(' ') )   ← sorted tokens!
// "pooja kiti paise" आणि "kiti paise pooja" → एकच key → एकच embedding
// L1: in-memory LRU Map (400) — 0ms
// L2: Redis rag_qemb:v4:{hash} — 30d TTL
// Miss → embedSingle() timeout 4s, fail-fast (429 वर retry नाही — user ला थांबवायचं नाही, BM25 चालेल)
```

---

## STEP 4: Hybrid Fusion — RRF (Reciprocal Rank Fusion)

### 4.1 Scores मिळवणं का अवघड
BM25 score 0-30+ कुठेही; cosine -1..1. Weighted sum (v3: `0.4×bm25_norm + 0.6×cosine`) करण्यासाठी normalization लागते — आणि ती fragile असते (एक outlier score सगळं स्केल बिघडवतो).

### 4.2 RRF — rank वापरा, score विसरा

```js
RRF(chunk) = Σ weight_i / (k + rank_i)        // k = 60 (standard)

// BM25 list मध्ये rank r  → +1.0/(60+r)
// Semantic list मध्ये rank r → +1.3/(60+r)     // 1.3 ≈ जुना 60/40 balance
```

**गुण:** scale-free (फक्त क्रम बघतो), दोन्ही lists मध्ये वर असलेला chunk आपोआप जिंकतो, एका system चा garbage score दुसऱ्याला बिघडवत नाही. Embeddings नसतील तर semantic घटक 0 — **graceful degradation built-in**.

### 4.3 Intent Soft Boost (hard filter नाही!)

```js
if (intentFilter) for (const r of results)
  if (r.chunk.type === intentFilter) r.score *= 1.6;
```
v4 च्या सुरुवातीला hard filter होता ("samagri intent → फक्त samagri chunks") — पण मग **Satyanarayan pooja chunk** (ज्याची samagri DB मध्ये नाहीच — data gap) बाहेर फेकला जायचा आणि भलत्या पूजेची samagri वर यायची! Soft boost मध्ये cross-type strong match टिकतो. **धडा: retrieval मध्ये hard filters धोकादायक — data gaps च्या वेळी ते चुकीच्या उत्तरांना जागा देतात.**

---

## STEP 5: LLM Re-ranking (Groq Judge)

Top-12 candidates → LLM ला विचारा "या प्रश्नासाठी सर्वात relevant कोणते?" → top-4:

```js
model: 'llama-3.1-8b-instant', temperature: 0, max_tokens: 40
system: "You rank search results for a Marathi pooja-booking WhatsApp assistant.
         Query may mix Marathi/Hindi/English/Roman. Reply ONLY a JSON array of indices."
user: "Query: {q}\n\nResults:\n[0] {150 chars}...\n[7] ...\n\nReturn the 4 most relevant indices."
```

**का LLM judge (cross-encoder का नाही):** local cross-encoder ला 400MB+ RAM + CPU inference लागते — आपल्या 1 vCPU/2GB box वर अशक्य. Groq free + जलद. ColBERT तर index-size मुळेच बाद.

**TPM engineering:** Groq free tier = **6000 tokens/minute**. पहिला prompt 12×260 chars ≈ 1900 tokens होता → eval मध्ये 429 storm. **8 candidates × 150 chars ≈ 900 tokens** केलं. देवनागरी token-heavy आहे हे इथेही लागू.

**Fail-open:** JSON parse नाही झाला / 429 / timeout → hybrid order जसाच्या तसा. Rerank ही **enhancement** आहे, dependency नाही.

**अपेक्षित परिणामाचा पुरावा:** "मुख्य दरवाजा कोणत्या दिशेला" हा प्रश्न rerank fail झाल्यावर ❌ आणि rerank चालल्यावर ✅ — याच केसने rerank चं मूल्य सिद्ध केलं.

---

## STEP 6: Parent-Document Retrieval

**समस्या:** matching साठी लहान chunk चांगला (embedding pointed राहतं), पण LLM उत्तरासाठी **मोठा संदर्भ** चांगला (उत्तर chunk-सीमेपलीकडे झिरपलेलं असतं — धर्मसिंधुत नेहमीच).

**उपाय: लहानाने शोधा, मोठ्याने उत्तर द्या:**
```js
function buildContext(retrieved) {
  const seen = new Set();
  for (const c of retrieved) {
    const pkey = c.metadata?.parent_id || c.id;
    if (seen.has(pkey)) continue;          // एकाच पानाचे 2 chunks आले तर पान एकदाच
    parts.push(`[${n}] ${c.metadata?.parent_text || c.text}`);   // पूर्ण पान!
  }
}
```
धर्मसिंधु: chunk 1000 chars → parent = पूर्ण पान (2200 chars). Blog: chunk 900 → parent = chunk ± surrounding window.

Dedupe-by-parent चा bonus: top-4 मध्ये एकाच पानाचे 3 chunks आले तर context मध्ये तेच पान 3 वेळा जात नाही.

---

## STEP 7: पूर्ण Pipeline एकत्र

```js
async function ragRetrieve(query, intentType='general', topK=4) {
  // 0. Cache: rag4:{intent}:{norm_query} → {chunks, context} (2h)
  // 1. hybridRetrieve(query, 12, intentMap[intentType]):
  //      BM25(expandQuery(query)) → rank list
  //      embedQueryCached(query) → cosine vs सगळे chunk vectors → rank list
  //      RRF fusion + type soft-boost ×1.6 → top-12
  // 2. rerankChunks(query, top12, 4) → Groq judge → top-4
  // 3. buildContext(top4) → parent texts, deduped
  // 4. cache & return { chunks, context }
}
```

Latency (uncached): BM25 ~10ms + query-embed 0-400ms + cosine ~15ms + rerank ~400ms ≈ **<1s**. Cached: **~2ms**.

---

## STEP 8: Evaluation — "सुधारलं" हे मोजून सिद्ध करणं

### 8.1 Labeled test set (`evalRag.js`)
24 खरे प्रश्न — मराठी/देवनागरी/Hinglish mixed, प्रत्येकाला expected chunk **types** + **keywords**:
```js
{ q: 'सत्यनारायण पूजेची सामग्री यादी पाठवा', intent: 'samagri',
  types: ['samagri','pooja'], kw: ['satyanarayan','सत्यनारायण'] }
```
**Metric — hit@3:** top-3 पैकी कुठल्याही chunk चा type expected मध्ये आहे **आणि** एखादा keyword त्याच्या text मध्ये आहे → hit.

### 8.2 निकाल (प्रत्यक्ष चालवलेले):
```
v3 (BM25-only):        17/24 = 70.8%
v4 (सगळ्या सुधारणांसह):  21/24 = 87.5%
उरलेले 3 miss:
  - 2× satyanarayan samagri → DB मध्ये त्या पूजेला samagri rows च नाहीत (data gap — retrieval fix करू शकत नाही!)
  - 1× chaturmasya → मिळालेले blogs प्रत्यक्षात relevant च आहेत (eval strictness)
→ achievable cases वर: 21/22 = 95.5%
```

### 8.3 Eval मधून शिकलेलं:
- **Data gaps retrieval ने भरता येत नाहीत** — eval नेच satyanarayan samagri गायब असल्याचं पकडलं
- Eval वेगाने चालवला तर rerank च्या TPM वर आदळतो → cases मध्ये 3s delay
- `RAG_SKIP_EMBED=1` mode ठेवल्यामुळे keyword-layer स्वतंत्र मोजता येते — **हे component isolation eval साठी मुद्दाम बांधलं**

---

## 9. Quota Engineering Summary (free tiers वर जगण्याची कला)

| उपाय | बचत |
|------|------|
| batchEmbedContents (25/req) | 25x कमी requests |
| Content-hash chunk cache | पूर्ण rebuild कधीच नाही |
| Query embedding cache (sorted-token key) | रोजच्या traffic चे 60-80% calls |
| 3-consecutive-fail circuit breaker + 2h retry | निष्फळ 429-cycles बंद |
| Fail-fast runtime query embed (4s, no retry) | user कधी थांबत नाही |
| LLM cache 6h / RAG cache 2h | Groq TPM जिवंत राहतो |
| RRF graceful degradation | quota मेली तरी उत्तरं येतात (87.5% वर) |

**खरा शत्रू:** त्याच सर्व्हरवरचा `dharmasindhu-ocr` process तीच Gemini key वापरतो — quota ची स्पर्धा! आणि जुना zombie bot (pojjari-final) crash-loop मध्ये प्रत्येक boot ला v3 sequential embedder चालवून quota जाळत होता — **तो थांबवणं हे एक 'RAG optimization' होतं!**

---

## 10. Architecture Decisions — का घेतले (Interview gold)

| निर्णय | पर्याय होता | का हा निवडला |
|--------|------------|--------------|
| In-memory vectors + brute-force cosine | Vector DB (Pinecone/FAISS/pgvector) | 4k × 768 = 12MB; brute-force 4k dot-products ~15ms — vector DB हा 100k+ vectors चा प्रश्न आहे |
| RRF | Weighted score sum | Scale-free, normalization चे नखरे नाहीत |
| LLM rerank (Groq) | Cross-encoder / ColBERT | 1 vCPU/2GB वर local inference अशक्य; ColBERT चा index RAM च्या पटीत |
| 768 dims (MRL) | 3072 default | 4x RAM/CPU बचत, ~1-2% quality किंमत |
| Hash-keyed embedding cache | Count-keyed (v3) | Incremental updates; rebuild-proof |
| Query-side synonym expansion | Index-side | Index फुगत नाही, weights देता येतात |
| Soft type boost ×1.6 | Hard intent filter | Data gaps च्या वेळी hard filter चुकीची उत्तरं देतो |
| BM25 blocking + embeddings background | दोन्ही blocking | Bot boot 5s मध्ये; hybrid मागून upgrade |

> पुढचं वाचन: **Doc 3** — असा bot शून्यातून बांधायचा तर काय काय लागतं (chat logic सह).
