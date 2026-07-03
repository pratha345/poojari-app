#!/usr/bin/env python3
"""
rag_service.py  —  FastAPI microservice for Dharmasindhu RAG + Wikipedia search
Port: 8765  (Node.js backend calls this internally)

Start:  python3 rag_service.py
PM2:    pm2 start rag_service.py --interpreter python3 --name dharmasindhu-rag
"""
import os, requests
from fastapi import FastAPI
from pydantic import BaseModel
from contextlib import asynccontextmanager

CHROMA_PATH = os.getenv("CHROMA_PATH", os.path.join(os.path.dirname(__file__), "chroma_db"))
MODEL_NAME  = "paraphrase-multilingual-MiniLM-L12-v2"
PORT        = int(os.getenv("RAG_PORT", 8765))

_model      = None
_collection = None


# ── Startup: load model + ChromaDB once ──────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _collection
    print(f"📥 Loading {MODEL_NAME}...")
    from sentence_transformers import SentenceTransformer
    _model = SentenceTransformer(MODEL_NAME)
    print("✅ Model loaded")

    try:
        import chromadb
        client      = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = client.get_collection("dharmasindhu")
        print(f"✅ ChromaDB: {_collection.count()} chunks")
    except Exception as e:
        _collection = None
        print(f"⚠️  ChromaDB not ready ({e}) — run setup_rag.py first")
        print("   Wikipedia search will still work.")
    yield


app = FastAPI(title="Dharmasindhu RAG", lifespan=lifespan)


# ── Wikipedia helper ──────────────────────────────────────────────────────────
WIKI_HEADERS = {"User-Agent": "DharmasindhuBot/1.0 (https://pujari.mydashboard.site; dharmasindhu-rag)"}

def fetch_wikipedia(query: str, lang: str = "mr") -> list:
    base = f"https://{lang}.wikipedia.org/w/api.php"
    try:
        # Step 1: search
        sr = requests.get(base, params={
            "action": "query", "list": "search",
            "srsearch": query, "format": "json", "srlimit": 2,
        }, headers=WIKI_HEADERS, timeout=5)
        titles = [r["title"] for r in sr.json().get("query", {}).get("search", [])]

        chunks = []
        for title in titles[:2]:
            er = requests.get(base, params={
                "action": "query", "titles": title,
                "prop": "extracts",
                "explaintext": True, "format": "json",
                "exsectionformat": "plain",
            }, headers=WIKI_HEADERS, timeout=5)
            pages = er.json().get("query", {}).get("pages", {})
            for page in pages.values():
                extract = page.get("extract", "").strip()
                if extract and len(extract) > 150:
                    chunks.append({
                        "content": extract[:2000],
                        "title":   title,
                        "url":     f"https://{lang}.wikipedia.org/wiki/{title.replace(' ', '_')}",
                        "lang":    lang,
                    })
        return chunks
    except Exception:
        return []


# ── Routes ────────────────────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    question:  str
    n_results: int = 5


@app.get("/health")
def health():
    return {
        "status":       "ok",
        "model_ready":  _model is not None,
        "chroma_ready": _collection is not None,
        "chunks":       _collection.count() if _collection else 0,
    }


@app.post("/search")
def search(body: SearchRequest):
    result = {"ds_chunks": [], "wiki_chunks": []}

    # 1. Dharmasindhu semantic search
    if _model and _collection:
        q_emb = _model.encode(body.question).tolist()
        cr    = _collection.query(
            query_embeddings=[q_emb],
            n_results=min(body.n_results, _collection.count()),
        )
        for i, doc in enumerate(cr["documents"][0]):
            meta = cr["metadatas"][0][i]
            dist = cr["distances"][0][i]
            result["ds_chunks"].append({
                "content": doc,
                "page_no": meta.get("page_no"),
                "score":   round(1 - dist, 3),
            })

    # 2. Wikipedia — use first 2 words for title match (shorter = better article match)
    words  = body.question.strip().split()
    topic  = " ".join(words[:2])   # e.g. "पंचक नक्षत्र" — best for title match
    short  = " ".join(words[:3])   # e.g. "पंचक नक्षत्र म्हणजे" — fallback
    wiki = fetch_wikipedia(topic, "mr") or fetch_wikipedia(short, "mr")
    if not wiki:
        wiki = fetch_wikipedia(topic, "hi") or fetch_wikipedia(short, "hi")
    result["wiki_chunks"] = wiki[:2]

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
