#!/usr/bin/env python3
"""
Dharmasindhu PDF OCR Script — Google Gemini Free Edition
=========================================================
Free API key: https://aistudio.google.com/apikey  (no credit card)
Free tier: 1500 req/day, 15 RPM — enough for all 841 pages.

PM2 usage on server:
  pm2 start ocr_ecosystem_gemini.config.js
"""

import sys, os, time, base64

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
    import fitz
except ImportError:
    print("Run: pip install pymupdf"); sys.exit(1)

try:
    import mysql.connector
except ImportError:
    print("Run: pip install mysql-connector-python"); sys.exit(1)

try:
    import google.generativeai as genai
except ImportError:
    print("Run: pip install google-generativeai"); sys.exit(1)

# ── Config ────────────────────────────────────────────────────────────────────
PDF_PATH = os.environ.get('DHARMASINDHU_PDF_PATH') or os.path.join(
    os.path.dirname(__file__), '..', '..', 'frontend', 'public',
    'Dharmasindhu Marathi Translation Bapu Sastri Moghe 1886.pdf'
)
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
DB_CONFIG = {
    'host':     os.environ.get('DB_HOST',     'localhost'),
    'port':     int(os.environ.get('DB_PORT', '3306')),
    'user':     os.environ.get('DB_USER',     'root'),
    'password': os.environ.get('DB_PASSWORD', ''),
    'database': os.environ.get('DB_NAME',     'pojjari_db'),
    'charset':  'utf8mb4',
}

START_PAGE = int(sys.argv[1]) if len(sys.argv) > 1 else 1
END_PAGE   = int(sys.argv[2]) if len(sys.argv) > 2 else 9999
DPI        = 150
SLEEP_SEC  = 4.5   # 13 req/min — safe under Gemini free 15 RPM

OCR_PROMPT = (
    "This is a page from Dharmasindhu (1886 Marathi translation of a Sanskrit text). "
    "Extract ALL Marathi and Sanskrit Devanagari text from this page exactly as written. "
    "Output only the text, no explanations or translations."
)


# ── DB ────────────────────────────────────────────────────────────────────────

def get_db():
    for attempt in range(5):
        try:
            return mysql.connector.connect(**DB_CONFIG, connection_timeout=15)
        except Exception as e:
            print(f"DB connect attempt {attempt+1} failed: {e}")
            time.sleep(5)
    raise RuntimeError("Cannot connect to DB after 5 attempts")

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

def extract_text_gemini(model, b64_img):
    wait = 65
    for attempt in range(8):
        try:
            resp = model.generate_content([
                OCR_PROMPT,
                {'mime_type': 'image/png', 'data': b64_img}
            ])
            return resp.text.strip()
        except Exception as e:
            err = str(e)
            if '429' in err or 'quota' in err.lower() or 'resource' in err.lower():
                print(f"  Rate limited (attempt {attempt+1}) — waiting {wait}s...")
                time.sleep(wait)
                wait = min(wait * 2, 300)
            elif attempt < 7:
                print(f"  Gemini error (attempt {attempt+1}): {err[:100]}, retrying in 10s...")
                time.sleep(10)
            else:
                raise
    raise RuntimeError("Gemini: max retries exceeded")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not os.path.exists(PDF_PATH):
        print(f"ERROR: PDF not found at {PDF_PATH}"); sys.exit(1)
    if not GEMINI_API_KEY:
        print("ERROR: GEMINI_API_KEY not set"); sys.exit(1)

    # ── Already completed? Sleep so PM2 does not rapid-restart ────────────────
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
        pass

    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')

    doc   = fitz.open(PDF_PATH)
    total = len(doc)
    end   = min(END_PAGE, total)

    print(f"Dharmasindhu OCR — Gemini Flash")
    print(f"Pages: {START_PAGE} to {end}  |  Delay: {SLEEP_SEC}s/page")

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
        # Keep DB connection alive
        try:
            conn.ping(reconnect=True, attempts=3, delay=3)
        except Exception:
            conn = get_db(); cursor = conn.cursor()

        # Skip already processed pages
        try:
            cursor.execute("SELECT id FROM dharmasindhu_content WHERE page_no=%s", (page_num,))
            if cursor.fetchone():
                continue
        except Exception:
            conn = get_db(); cursor = conn.cursor(); continue

        try:
            elapsed = time.time() - t_start
            pages_this_run = done - already_done
            speed   = pages_this_run / elapsed if elapsed > 0 else 0
            eta_min = ((end - page_num) / speed / 60) if speed > 0 else 0
            pct     = round(done / total * 100, 1)

            print(f"  Page {page_num}/{end}  |  {done} done ({pct}%)  |  ETA: {eta_min:.0f} min")

            b64   = page_to_base64(doc, page_num)
            text  = extract_text_gemini(model, b64)
            words = len(text.split())

            if words < 5:
                text  = f"[पान {page_num} - मजकूर उपलब्ध नाही]"
                words = 0

            for db_attempt in range(3):
                try:
                    conn.ping(reconnect=True, attempts=2, delay=2)
                    cursor.execute("""
                        INSERT INTO dharmasindhu_content (page_no, content, word_count)
                        VALUES (%s,%s,%s)
                        ON DUPLICATE KEY UPDATE content=%s, word_count=%s
                    """, (page_num, text, words, text, words))
                    conn.commit()
                    set_progress(cursor, conn, total, done + 1, 'running')
                    break
                except Exception as e:
                    print(f"  DB save error (attempt {db_attempt+1}): {e}")
                    time.sleep(5)
                    conn = get_db(); cursor = conn.cursor()

            done += 1
            time.sleep(SLEEP_SEC)

        except KeyboardInterrupt:
            print("\nInterrupted. Run again to resume.")
            set_progress(cursor, conn, total, done, 'idle')
            break
        except Exception as e:
            errors += 1
            print(f"  Page {page_num} error: {e}")
            time.sleep(5)

    doc.close()
    cursor.close()
    conn.close()

    if done >= total:
        print(f"\nComplete! {done}/{total} pages.")
        # Sleep 1h so PM2 does not rapid-restart after completion
        time.sleep(3600)
        sys.exit(0)
    else:
        print(f"\nProgress: {done}/{total} done ({errors} errors). Exiting for PM2 restart...")
        sys.exit(1)


if __name__ == '__main__':
    main()
