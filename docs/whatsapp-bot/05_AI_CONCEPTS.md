# 🔬 AI Concepts Deep-Dive — Embeddings, Vector Search आणि संबंधित सगळं

> **Doc 5/5** — Theory reference: embedding models, vector search, hybrid retrieval, rerankers, evaluation, LLM inference. प्रत्येक concept: **काय → कसं चालतं → आपण कुठे वापरलं → interview depth.**

---

## 1. Embeddings — पूर्ण समज

### 1.1 काय आहे
Embedding = मजकुराचं **dense vector** रूप (आपलं: 768 floats). गुणधर्म: **अर्थाने जवळचे मजकूर → भूमितीने जवळचे vectors.** म्हणजे "किती खर्च येईल?" आणि "price काय आहे?" — शब्द वेगळे, vectors जवळ.

### 1.2 कसे बनतात
Transformer encoder → प्रत्येक token चं contextual representation → **pooling** (mean/CLS) → एक vector → normalize. Training: **contrastive learning** — (query, relevant doc) जोड्या जवळ खेचायच्या, negatives दूर ढकलायचे. InfoNCE loss:

```
L = -log[ exp(sim(q,d+)/τ) / Σ exp(sim(q,d)/τ) ]
```
मोठ्या batch मधले इतर सगळे docs = in-batch negatives. **Hard negatives** (जवळचे पण चुकीचे) quality घडवतात.

### 1.3 Similarity मोजणं

```
cosine(a,b) = (a·b) / (|a| |b|)     ∈ [-1, 1]
```
- **Cosine** = फक्त दिशा (length normalize) — text retrieval चा default
- **Dot product** = direction + magnitude; normalized vectors वर दोन्ही एकच
- **Euclidean** = अंतर; normalized वर cosine शीच monotone संबंध

आपला code (brute-force, 4k vectors वर ~15ms):
```js
function cosineSimilarity(a, b) {
  let dot=0, na=0, nb=0;
  for (let i=0; i<len; i++) { dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
  return dot / (Math.sqrt(na)*Math.sqrt(nb));
}
```

### 1.4 Dimensions आणि MRL (Matryoshka Representation Learning)
जास्त dims = जास्त क्षमता, पण memory/compute linear वाढतो. **MRL-trained models** (gemini-embedding-001) मध्ये माहिती **पहिल्या dims मध्ये केंद्रित** केलेली असते — रशियन बाहुलीसारखी nested. म्हणून 3072 → truncate 768 → ~99% quality, **4x बचत.** (आपण `outputDimensionality: 768`.)

गणित: 4,029 chunks × 768 × 4 bytes (Float32) = **12.4 MB** | 3072 असते तर 49.5 MB.

### 1.5 Asymmetric Embeddings (taskType)
प्रश्न लहान-अपूर्ण असतात, documents मोठे-घोषणात्मक. Asymmetric models दोघांना **वेगवेगळ्या "lens" ने** encode करतात पण एकाच space मध्ये:
```
chunks  → taskType: RETRIEVAL_DOCUMENT
queries → taskType: RETRIEVAL_QUERY
```
इतर taskTypes: SEMANTIC_SIMILARITY (दोन्ही समान), CLASSIFICATION, CLUSTERING. **चुकीचा taskType = फुकट quality गमावणं** — retrieval साठी नेहमी हे जोडलेलं वापरा.

### 1.6 Embedding storage engineering (आपले धडे)
- **Float32Array** (typed) — JS array पेक्षा निम्मी RAM, cache-friendly loop
- Redis त: **base64(raw bytes)** — JSON numbers पेक्षा ~7x लहान (v3 चं JSON cache 84MB → v4 ~12MB)
- **Content-hash keys** (`sha1(text)` → vector) — मजकूर तोच तर embedding तीच; re-chunking नंतरही जुने vectors परत मिळतात
- आणखी compression हवं तर: **int8 quantization** (4x अजून लहान, ~1% loss), binary embeddings (32x!, rough)

---

## 2. Vector Search — Brute Force ते ANN

### 2.1 Scale ladder (कधी काय)

| Vectors | पद्धत | का |
|---------|-------|-----|
| < 50k | **Brute-force** (आपण इथे) | O(N·d) पण 4k×768 = 3M ops ≈ ms; शून्य infra |
| 50k–1M | HNSW in-process (hnswlib) / pgvector | Approximate, पण recall ~99% |
| 1M+ | Dedicated: FAISS-IVF, Qdrant, Milvus, Pinecone | Sharding, GPU, filtering at scale |

### 2.2 ANN Algorithms (interview मध्ये विचारतात)

**HNSW (Hierarchical Navigable Small World):** Multi-layer graph — वरचे थर विरळ (highways), खालचे घन (streets). Search वरून खाली greedy navigate. O(log N), high recall; memory-hungry (graph links). Params: `M` (links/node), `efSearch` (search width — जास्त = अचूक पण हळू).

**IVF (Inverted File):** k-means ने corpus चे clusters; query फक्त जवळच्या `nprobe` clusters मध्ये शोधतो. Memory हलकं; recall क्लस्टर सीमांवर घसरतो.

**PQ (Product Quantization):** Vector चे sub-vectors → प्रत्येकाचा codebook code → 32x compression; IVF+PQ combo मोठ्या scale चा standard.

### 2.3 "Vector DB लागतो का?" — निर्णय framework
```
< 50k vectors + single node  → in-memory brute force (आपण)   ✓ शून्य ops खर्च
आधीच Postgres आहे            → pgvector                        ✓ एकच DB
Scale/filtering/multi-tenant → Qdrant/Milvus/Pinecone
```
**Resume-driven engineering टाळा** — 4k vectors ला Pinecone म्हणजे सायकलला जेट इंजिन.

---

## 3. Keyword Search — BM25 (Sparse Retrieval)

### 3.1 उत्क्रांती: Boolean → TF-IDF → BM25
- **TF-IDF:** `tf × log(N/df)` — शब्द जितका जास्त तितका महत्त्वाचा (नुकसान: linear tf) × जितका दुर्मीळ तितका खास
- **BM25:** दोन दुरुस्त्या — (1) **tf saturation** (k1): 10 वेळा आलेला शब्द 10x महत्त्वाचा नाही; (2) **length normalization** (b): मोठ्या docs चं अन्यायकारक फायदे रद्द

```
BM25 = Σ ln((N-df+0.5)/(df+0.5)+1) × tf(k1+1)/(tf + k1(1-b+b·dl/avgdl))
k1=1.5, b=0.75 (standards; आपणही हेच)
```

### 3.2 Sparse vs Dense — मूलभूत फरक

| | Sparse (BM25) | Dense (embeddings) |
|---|---|---|
| Representation | vocabulary-size vector, बहुतेक शून्य | 768 dense floats |
| पकडतं | **exact tokens** | **अर्थ** |
| अजेय कुठे | codes, नावं, numbers, rare terms | paraphrase, synonyms, cross-lingual |
| आंधळं कुठे | synonym/paraphrase | rare proper nouns, exact codes |
| खर्च | शून्य (local index) | API/GPU |

**म्हणूनच hybrid** — failure modes परस्परपूरक. (Learned sparse "SPLADE" हा मधला रस्ता — माहीत असणं पुरे.)

### 3.3 Multilingual sparse चा प्रश्न — आपलं transliteration solution
Standard stemmers (Porter) फक्त English. आपली pipeline: **देवनागरी→Roman char-map + मराठी suffix strip + phonetic folding** — index आणि query दोन्हींवर सारखीच. मुख्य सिद्धांत पुन्हा: **consistency > correctness** ("ekadashi"→"ekad" विचित्र आहे, पण दोन्ही बाजूंनी सारखं आहे → match).

---

## 4. Hybrid Retrieval आणि Fusion

### 4.1 RRF (Reciprocal Rank Fusion) — आपली निवड
```
RRF(d) = Σ_retrievers  w_r / (k + rank_r(d))       k = 60
```
Score-free (फक्त क्रम) → normalization चा प्रश्नच नाही; एक retriever मेला तरी दुसरा वाहतो. आपले weights: BM25 1.0, semantic 1.3.

### 4.2 पर्याय
- **Weighted score sum** (v3 करत होतो: 0.4/0.6) — normalization fragile
- **CombSUM/CombMNZ** — जुने IR fusion
- **Learned fusion / LTR** — features वर model; enterprise scale ला
- **Cascade** — स्वस्त retriever → महाग reranker फक्त top-k वर (आपलं rerank हेच)

### 4.3 Intent-aware retrieval
आपलं: intent (LLM classify) → chunk type **soft boost ×1.6** (hard filter नाही — data gap असेल तर hard filter भलतंच उत्तर वर आणतो). Metadata filtering हे vector DBs चं मोठं feature — आपण application-level केलं.

---

## 5. Re-ranking — दुसरा गियर

### 5.1 का लागतो
Retrieval **recall साठी** (जाळं रुंद — top-12), reranking **precision साठी** (त्यातले खरे 4). Bi-encoder query-doc ला स्वतंत्र बघतो; reranker **एकत्र** बघतो — जास्त contextual निर्णय.

### 5.2 तीन प्रकार

| प्रकार | कसं | खर्च | कधी |
|-------|-----|------|-----|
| **Cross-encoder** (bge-reranker, ms-marco-MiniLM) | (query+doc) एकत्र encode → score | local GPU/CPU inference | स्वतःचं hardware असेल तर सर्वोत्तम |
| **ColBERT** (late interaction) | प्रत्येक token चा vector; MaxSim | index प्रचंड (token-level!) | मोठं infra |
| **LLM judge** (आपण — Groq 8B) | prompt मध्ये candidates → indices JSON | API tokens | hardware नाही, hosted स्वस्त LLM आहे |

आपला निर्णय पुन्हा: 1 vCPU/2GB → local inference बाद → LLM judge. Fail-open अनिवार्य (JSON चुकला → hybrid order).

---

## 6. Chunking — Science + Craft

### 6.1 Strategies spectrum
1. **Fixed-size** — सोपं, वाक्यं तोडतं
2. **Sentence/paragraph-aware sliding window + overlap** ← **आपण** (दंड ।॥ सीमा; 1000/150)
3. **Structural** (headings, HTML) — blogs ना अंशतः
4. **Semantic chunking** — embedding-shift वर तोडणं (महाग, marginal)
5. **Late chunking / long-context embedding** — नवीन संशोधन दिशा

### 6.2 Small-to-big (parent-document) pattern ← आपण
लहान chunk index करा (embedding pointed), LLM ला parent (पूर्ण पान) द्या. Index precision + generation context — दोन्ही. LlamaIndex मध्ये "sentence-window retrieval" त्याच कुटुंबातलं.

### 6.3 अनुभवाने आलेले नियम
- **आधी corpus मोजा** (`AVG(CHAR_LENGTH)`) — आमचं truncation-disaster यानेच सापडलं
- Overlap 10-20%
- **Chunk मध्ये स्वतःचा संदर्भ ठेवा** — आम्ही प्रत्येक chunk ला "धर्मसिंधु पान 145:" prefix आणि blog title जोडतो; standalone chunk ambiguous असतो
- Bilingual corpus → chunk मध्ये दोन्ही scripts चे anchors (आमचे static chunks)

---

## 7. Evaluation — Retrieval + Generation

### 7.1 Retrieval metrics
```
hit@k  (आपलं) : top-k मध्ये relevant आहे का — binary, सोपं
MRR          : 1/rank of first relevant — स्थानाचं वजन
nDCG@k       : graded relevance + log-discount — रँकिंग quality चं पूर्ण चित्र
Recall@k     : एकूण relevant पैकी किती सापडले
```
आपला eval: 24 labeled queries (type + keyword match), v3 70.8% → v4 87.5%; miss-analysis ने **data gap शोधला** (retrieval bug नव्हता!). **Eval चा दुसरा उपयोग: regression suite** — प्रत्येक बदलानंतर चालवा.

### 7.2 Generation (RAG answer) evaluation — पुढची पायरी
- **Faithfulness** — उत्तर context शी प्रामाणिक आहे का (LLM-as-judge)
- **Answer relevance**, **context precision/recall** (RAGAS framework हेच मोजतो)
- आपलं proxy: scholar persona ला "[DS:पान X] बाहेरचं quote करू नको" — faithfulness prompt-enforced

---

## 8. LLM Inference — Concepts आपण हाताळले

### 8.1 Tokens
Subword units (BPE). **देवनागरी महाग:** "सत्यनारायण" ≈ 5-8 tokens vs "Satyanarayan" ≈ 4. परिणाम सगळीकडे: max_tokens budgets, TPM limits, truncation. (आमचे fixes: budgets 900/2000, finishSentence trim, prompt compression.)

### 8.2 Sampling params
- **temperature**: 0 = deterministic (classification/rerank ← आपण), उच्च = creative
- **max_tokens**: hard cap — संपला की **mid-sentence कट** (आमचा "नीलम द" किस्सा)
- top_p/top_k: sampling pool control

### 8.3 Model routing (cost architecture)
```
काम              → model               → का
classify (1 शब्द) → llama-3.1-8b       → स्वस्त, जलद, पुरेसा
rerank (indices)  → llama-3.1-8b, t=0  → deterministic
उत्तरं (persona)   → gpt-oss-120b       → quality इथेच लागते
```
**"प्रत्येक कामाला सर्वात लहान पुरेसा model"** — हे तत्त्व cost 10x वाचवतं.

### 8.4 Caching LLM responses
Key = normalize(query)+intent; TTL 6h. **Prompt बदलला की cache flush** — नाहीतर जुनी उत्तरं भुतासारखी फिरतात (आम्ही भोगलंय). Semantic caching (embedding-similarity ने cache hit) ही पुढची पातळी.

---

## 9. Multilingual NLP — आपल्या domain चे खास प्रश्न

1. **Script vs Language:** मराठी दोन्ही scripts मध्ये लिहिली जाते (देवनागरी + roman) — भाषा एक, लिपी दोन. Retrieval आणि generation दोन्हीकडे हाताळावं लागतं (tokenizer + "देवनागरीत लिहा" prompt नियम)
2. **Transliteration अनेक-अनेक आहे:** pooja/puja/puuja सगळे बरोबर — canonical form अस्तित्वातच नाही → normalization ने *consistency* आणायची
3. **Inflection:** मराठी agglutinative-ish — पूजेची/पूजेला/पूजेसाठी → suffix stripping
4. **LLM transliteration चा घोळ:** English "Tritiya" input → LLM "ट्रायटिया" (भ्रष्ट) — deterministic maps ने बदला, LLM वर सोडू नका
5. **Code-mixing:** "ghar me satyanarayan katha karwana hai kitna kharcha" — मराठी+हिंदी+English एकाच वाक्यात; intent classifier LLM-based असल्यामुळेच हे झेपतं

---

## 10. एकत्रित चित्र — आपल्या system मध्ये सगळे concepts कुठे

```
User query ("सत्यनारायण पूजेची सामग्री?")
   │
   ├─► §9 transliteration normalize ─► §3 BM25 sparse retrieval ──┐
   │                                                              ├─► §4 RRF fusion ─► §5 LLM rerank
   ├─► §1 query embedding (cached, asymmetric, 768-MRL) ─► §2 brute-force cosine ──┘         │
   │                                                                                          ▼
   │                                                    §6 parent-document context ─► §8 persona LLM
   │                                                                                          │
   └────────────────────────────── §7 eval set हे सगळं मोजतो ◄────────────────────────────────┘
```

**शेवटचं तत्त्व:** प्रत्येक थर **मोजता येतो, बदलता येतो, आणि पडला तरी system चालू राहते** — हेच production AI engineering.

---

## पुढचं वाचन (खरे sources)
- BM25: Robertson & Zaragoza, "The Probabilistic Relevance Framework"
- RRF: Cormack et al. 2009 (मूळ paper — 1 पानाचा आहे!)
- HNSW: Malkov & Yashunin 2016
- MRL: Kusupati et al., "Matryoshka Representation Learning"
- ColBERT: Khattab & Zaharia 2020
- RAG: Lewis et al. 2020 (मूळ RAG paper)
- RAGAS: RAG evaluation framework docs
