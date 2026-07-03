#!/usr/bin/env python3
"""
setup_rag.py  —  One-time setup: MySQL → embeddings → ChromaDB
Run once on any server after deployment.

Usage:
    python3 setup_rag.py

On new server (after git pull + pip install):
    pip install -r requirements-rag.txt
    python3 setup_rag.py
"""
import os, sys, time
import mysql.connector
import chromadb
from sentence_transformers import SentenceTransformer

# ── Config (env vars override hardcoded values for new servers) ───────────────
DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "159.89.167.218"),
    "user":     os.getenv("DB_USER",     "pojjari_user"),
    "password": os.getenv("DB_PASSWORD", "StrongPassword@2024!"),
    "database": os.getenv("DB_NAME",     "pojjari_db"),
}
CHROMA_PATH = os.getenv("CHROMA_PATH", os.path.join(os.path.dirname(__file__), "chroma_db"))
MODEL_NAME  = "paraphrase-multilingual-MiniLM-L12-v2"
CHUNK_SIZE  = 600
OVERLAP     = 100
BATCH_SIZE  = 64


def chunk_text(text: str, page_no: int) -> list:
    chunks, start = [], 0
    while start < len(text):
        end   = min(start + CHUNK_SIZE, len(text))
        chunk = text[start:end].strip()
        if len(chunk) > 80:
            chunks.append({"text": chunk, "page_no": page_no})
        start += CHUNK_SIZE - OVERLAP
    return chunks


def main():
    t0 = time.time()
    print("=" * 60)
    print("🚀 Dharmasindhu RAG Setup")
    print("=" * 60)

    # 1. Load embedding model
    print(f"\n📥 Loading model: {MODEL_NAME}")
    print("   (First run downloads ~470 MB — 2-3 min on slow connection)")
    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ Model ready  ({time.time()-t0:.1f}s)")

    # 2. Fetch all pages from MySQL
    print(f"\n📊 Connecting to MySQL {DB_CONFIG['host']}...")
    conn = mysql.connector.connect(**DB_CONFIG)
    cur  = conn.cursor()
    cur.execute(
        "SELECT page_no, content FROM dharmasindhu_content "
        "WHERE LENGTH(content) > 100 ORDER BY page_no"
    )
    rows = cur.fetchall()
    conn.close()
    print(f"✅ {len(rows)} pages fetched")

    # 3. Chunk
    print(f"\n✂️  Chunking  (size={CHUNK_SIZE}, overlap={OVERLAP})...")
    all_chunks = []
    for page_no, content in rows:
        all_chunks.extend(chunk_text(content, page_no))
    print(f"✅ {len(all_chunks)} chunks from {len(rows)} pages")

    # 4. ChromaDB
    print(f"\n🗄️  Setting up ChromaDB at: {CHROMA_PATH}")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        client.delete_collection("dharmasindhu")
        print("   ♻️  Deleted existing collection (fresh start)")
    except Exception:
        pass
    collection = client.create_collection(
        name="dharmasindhu",
        metadata={"hnsw:space": "cosine"}
    )

    # 5. Embed in batches
    print(f"\n⚡ Generating embeddings — {len(all_chunks)} chunks, batch={BATCH_SIZE}")
    print("   CPU वर 10-20 min लागतात. थांबा...")

    for i in range(0, len(all_chunks), BATCH_SIZE):
        batch      = all_chunks[i : i + BATCH_SIZE]
        texts      = [c["text"] for c in batch]
        embeddings = model.encode(texts, show_progress_bar=False).tolist()

        collection.add(
            ids        = [f"chunk_{i+j}" for j in range(len(batch))],
            embeddings = embeddings,
            documents  = texts,
            metadatas  = [{"page_no": c["page_no"]} for c in batch],
        )

        done = i + len(batch)
        pct  = int(done / len(all_chunks) * 100)
        bar  = "█" * (pct // 5) + "░" * (20 - pct // 5)
        print(f"\r   [{bar}] {pct}%  ({done}/{len(all_chunks)})", end="", flush=True)

    print(f"\n\n✅ ChromaDB ready!  {collection.count()} chunks")
    print(f"⏱️  Total time: {(time.time()-t0)/60:.1f} min")
    print(f"📁 Path: {CHROMA_PATH}")
    print("\n🚀 Next step — start RAG service:")
    print("   pm2 start rag_service.py --interpreter python3 --name dharmasindhu-rag")


if __name__ == "__main__":
    main()
