# 📚 Pojjari WhatsApp Bot — Documentation Index

संपूर्ण bot चं in-depth documentation — 5 भाग:

| # | File | काय आहे | कोणासाठी |
|---|------|---------|----------|
| 1 | [01_BOT_STRUCTURE.md](01_BOT_STRUCTURE.md) | संपूर्ण architecture, प्रत्येक file चा code explained, 8 production gotchas, deployment runbook | Codebase समजून घ्यायला / नवीन developer onboarding |
| 2 | [02_RAG_EMBEDDINGS.md](02_RAG_EMBEDDINGS.md) | RAG v4 engine step-by-step: chunking → BM25 → embeddings → RRF → rerank → eval (70.8% → 87.5% चा प्रवास) | RAG कसा बांधला/का तसा हे शिकायला |
| 3 | [03_CHAT_LOGIC.md](03_CHAT_LOGIC.md) | असा bot शून्यातून बांधायचा तर: Meta setup, session state machine, conversation design, reliability, build order | नवीन bot project सुरू करताना |
| 4 | [04_INTERVIEW_PREP.md](04_INTERVIEW_PREP.md) | 35+ interview प्रश्न उत्तरांसह (RAG, system design, debugging war stories, behavioral STAR, rapid-fire) | Interview तयारी |
| 5 | [05_AI_CONCEPTS.md](05_AI_CONCEPTS.md) | Theory: embeddings, MRL, vector search (HNSW/IVF), BM25 गणित, RRF, rerankers, chunking science, eval metrics, multilingual NLP | Concepts पक्के करायला |
| 6 | [06_WEBSITE_DHARMASINDHU.md](06_WEBSITE_DHARMASINDHU.md) | Website धर्मसिंधु Q&A (admin panel): Python ChromaDB microservice + Node pipeline, v1→v2 upgrades, LLM keyword expansion, Groq deprecation migration, bot-vs-website stack तुलना | Website feature समजायला / दुसरं RAG design बघायला |

**वाचण्याचा क्रम:** नवीन असाल तर 1 → 3 → 2 → 6 → 5 → 4. Interview जवळ असेल तर 4 → 2 → 5.

> तयार केलं: 2026-07-04 | Bot: `/var/www/pojjari-bot/` (DigitalOcean) | RAG v4.1
