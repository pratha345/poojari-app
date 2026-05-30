#!/usr/bin/env python3
"""
Dharmasindhu PDF OCR Script — Groq Vision
==========================================
Uses PyMuPDF + Groq Vision API (meta-llama/llama-4-scout-17b-16e-instruct)
to extract Marathi/Sanskrit text. Resumes automatically if interrupted.

Run from backend/scripts/:
  python ocr_dharmasindhu.py
  python ocr_dharmasindhu.py 92 841   (resume from page 92)
"""

import fitz
import base64
import requests
import json
import time
import sys
import os

import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# ── Load .env ─────────────────────────────────────────────────────────────────
env_path = os.path.join(os.path.dirname(__file__), '..', 'env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

try:
    import mysql.connector
except ImportError:
    print("ERROR: pip install mysql-connector-python"); sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
# Allow override via env (needed on server where PDF is in /dist, not /public)
PDF_PATH = os.environ.get('DHARMASINDHU_PDF_PATH') or os.path.join(
    os.path.dirname(__file__), '..', '..', 'frontend', 'public',
    'Dharmasindhu Marathi Translation Bapu Sastri Moghe 1886.pdf'
)
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
DB_CONFIG = {
    'host':     os.environ.get('DB_HOST',     'localhost'),
    'port':     int(os.environ.get('DB_PORT', '3306')),
    'user':     os.environ.get('DB_USER',     'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME',     'pojjari_db'),
    'charset':  'utf8mb4',
}

START_PAGE   = int(sys.argv[1]) if len(sys.argv) > 1 else 1
END_PAGE     = int(sys.argv[2]) if len(sys.argv) > 2 else 9999
DPI          = 150
SLEEP_SEC    = 6.0    # 10 req/min — token limit is 30k/min, ~2500 tokens/page = 12 pages/min max
VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

SYSTEM_PROMPT = (
    "तुम्ही OCR तज्ञ आहात. तुम्हाला एक जुन्या मराठी/संस्कृत ग्रंथाचे पान दिले आहे "
    "(धर्मसिंधु, १८८६). या पानावरील सर्व मराठी आणि संस्कृत मजकूर अचूकपणे काढा. "
    "फक्त मजकूर द्या — कोणतेही स्पष्टीकरण, टीका किंवा अनुवाद देऊ नका."
)


# ── DB ────────────────────────────────────────────────────────────────────────

def get_db():
    for attempt in range(5):
        try:
            return mysql.connector.connect(**DB_CONFIG, connection_timeout=15)
        except Exception as e:
            print(f"\n  DB connect attempt {attempt+1} failed: {e}")
            time.sleep(5)
    raise RuntimeError("Cannot connect to DB after 5 attempts")

def safe_execute(cursor, conn, sql, params=()):
    """Execute with auto-reconnect on lost connection"""
    global _conn, _cursor
    for attempt in range(3):
        try:
            cursor.execute(sql, params)
            return
        except mysql.connector.errors.OperationalError as e:
            if attempt < 2:
                print(f"\n  DB lost, reconnecting...")
                time.sleep(3)
                _conn   = get_db()
                _cursor = _conn.cursor()
                cursor  = _cursor
                conn    = _conn
            else:
                raise

_conn   = None
_cursor = None

def ensure_tables(cursor):
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dharmasindhu_content (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page_no INT NOT NULL, content LONGTEXT NOT NULL, word_count INT DEFAULT 0,
            UNIQUE KEY uq_page (page_no), FULLTEXT KEY ft_ds (content)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS dharmasindhu_ocr_progress (
            id INT AUTO_INCREMENT PRIMARY KEY,
            total_pages INT DEFAULT 0, processed_pages INT DEFAULT 0,
            status ENUM('idle','running','completed','error') DEFAULT 'idle',
            started_at TIMESTAMP NULL, completed_at TIMESTAMP NULL,
            error_msg TEXT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def set_progress(cursor, conn, total, done, status, error=None):
    cursor.execute("""
        INSERT INTO dharmasindhu_ocr_progress (id,total_pages,processed_pages,status,started_at,error_msg)
        VALUES (1,%s,%s,%s,NOW(),%s)
        ON DUPLICATE KEY UPDATE total_pages=%s,processed_pages=%s,status=%s,error_msg=%s,updated_at=NOW()
    """, (total,done,status,error,total,done,status,error))
    conn.commit()


# ── OCR ───────────────────────────────────────────────────────────────────────

def page_to_base64(doc, page_num):
    page = doc[page_num - 1]
    mat  = fitz.Matrix(DPI / 72.0, DPI / 72.0)
    pix  = page.get_pixmap(matrix=mat, colorspace=fitz.csGRAY)
    return base64.b64encode(pix.tobytes('png')).decode('utf-8')

def extract_text_groq(b64_img):
    if not GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY not set")
    payload = {
        'model': VISION_MODEL, 'max_tokens': 4096,
        'messages': [{'role': 'user', 'content': [
            {'type': 'text', 'text': SYSTEM_PROMPT},
            {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{b64_img}'}}
        ]}]
    }
    wait = 65
    for attempt in range(6):  # max 6 retries on rate limit
        resp = requests.post(
            'https://api.groq.com/openai/v1/chat/completions',
            headers={'Authorization': f'Bearer {GROQ_API_KEY}', 'Content-Type': 'application/json'},
            json=payload, timeout=60
        )
        if resp.status_code == 200:
            return resp.json()['choices'][0]['message']['content'].strip()
        elif resp.status_code == 429:
            print(f"\n  Rate limited (attempt {attempt+1}) — waiting {wait}s...")
            time.sleep(wait)
            wait = min(wait * 2, 300)  # exponential backoff, max 5 min
        else:
            raise RuntimeError(f"Groq error {resp.status_code}: {resp.text[:200]}")
    raise RuntimeError("Groq rate limit: max retries exceeded")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not os.path.exists(PDF_PATH):
        print(f"ERROR: PDF not found at: {PDF_PATH}"); sys.exit(1)
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not set in backend/env"); sys.exit(1)

    # ── If already completed, just sleep so PM2 does not rapid-restart ─────
    try:
        _c = get_db(); _cur = _c.cursor()
        _cur.execute("SELECT status, processed_pages, total_pages FROM dharmasindhu_ocr_progress WHERE id=1")
        row = _cur.fetchone()
        _cur.close(); _c.close()
        if row and row[0] == 'completed':
            print(f"OCR already completed ({row[1]}/{row[2]} pages). Sleeping 1 hour...")
            time.sleep(3600)
            sys.exit(0)
    except Exception:
        pass  # Table may not exist yet — continue to setup

    doc   = fitz.open(PDF_PATH)
    total = len(doc)
    end   = min(END_PAGE, total)

    print(f"Dharmasindhu OCR — Groq Vision")
    print(f"Pages: {START_PAGE} to {end}  |  Model: {VISION_MODEL}")
    print()

    conn   = get_db()
    cursor = conn.cursor()
    ensure_tables(cursor)
    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM dharmasindhu_content")
    already_done = cursor.fetchone()[0]
    set_progress(cursor, conn, total, already_done, 'running')

    done    = already_done
    errors  = 0
    t_start = time.time()

    for page_num in range(START_PAGE, end + 1):
        # Reconnect if needed
        try:
            conn.ping(reconnect=True, attempts=3, delay=3)
        except Exception:
            try:
                conn   = get_db()
                cursor = conn.cursor()
            except Exception as e:
                print(f"\n  DB reconnect failed: {e}, waiting 10s...")
                time.sleep(10)
                continue

        try:
            cursor.execute("SELECT id FROM dharmasindhu_content WHERE page_no=%s", (page_num,))
            if cursor.fetchone():
                continue  # already done, skip silently
        except Exception:
            conn = get_db(); cursor = conn.cursor(); continue

        try:
            elapsed = time.time() - t_start
            pages_this_run = done - already_done
            speed   = pages_this_run / elapsed if elapsed > 0 else 0
            eta_min = ((end - page_num) / speed / 60) if speed > 0 else 0
            pct     = round(done / total * 100, 1)

            print(
                f"  Page {page_num}/{end}  |  {done} done ({pct}%)  |  "
                f"ETA: {eta_min:.0f} min"
            )

            b64   = page_to_base64(doc, page_num)
            text  = extract_text_groq(b64)
            words = len(text.split())

            if words < 5:
                text  = f"[पान {page_num} — मजकूर उपलब्ध नाही]"
                words = 0

            # Save with reconnect retry
            for db_attempt in range(3):
                try:
                    conn.ping(reconnect=True, attempts=2, delay=2)
                    cursor.execute("""
                        INSERT INTO dharmasindhu_content (page_no,content,word_count)
                        VALUES (%s,%s,%s)
                        ON DUPLICATE KEY UPDATE content=%s, word_count=%s
                    """, (page_num, text, words, text, words))
                    conn.commit()
                    set_progress(cursor, conn, total, done + 1, 'running')
                    break
                except Exception as e:
                    print(f"\n  DB save error (attempt {db_attempt+1}): {e}")
                    time.sleep(5)
                    conn = get_db(); cursor = conn.cursor()

            done += 1
            time.sleep(SLEEP_SEC)

        except KeyboardInterrupt:
            print("\n\nInterrupted. Run again to resume.")
            set_progress(cursor, conn, total, done, 'idle')
            break
        except Exception as e:
            errors += 1
            print(f"\n  Page {page_num} error: {e}")
            time.sleep(3)

    doc.close()
    cursor.close()
    conn.close()

    if done >= total:
        set_progress_bare(total, total, 'completed')
        elapsed = time.time() - t_start
        print(f"\n\nComplete! {done}/{total} pages in {elapsed/60:.1f} min.")
        print("Sleeping 1 hour before exit so PM2 does not rapid-restart...")
        time.sleep(3600)
        sys.exit(0)
    else:
        print(f"\n\nProgress: {done}/{total} done ({errors} errors). Exiting for PM2 restart...")
        sys.exit(1)


def set_progress_bare(total, done, status):
    try:
        c = get_db()
        cur = c.cursor()
        cur.execute("""
            INSERT INTO dharmasindhu_ocr_progress (id,total_pages,processed_pages,status)
            VALUES (1,%s,%s,%s)
            ON DUPLICATE KEY UPDATE total_pages=%s,processed_pages=%s,status=%s,updated_at=NOW()
        """, (total, done, status, total, done, status))
        c.commit(); cur.close(); c.close()
    except Exception:
        pass

if __name__ == '__main__':
    main()
