#!/usr/bin/env python3
# ocr_granth.py — Granth Library OCR using Groq Vision
# Usage: python3 ocr_granth.py --book_id=2 --pdf_path=/path/to/book.pdf --api_key=gsk_...
import os, sys, base64, time, argparse, json
import requests
import mysql.connector
from pdf2image import convert_from_path

# ── Args ──────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument('--book_id',  type=int, required=True)
parser.add_argument('--pdf_path', type=str, required=True)
parser.add_argument('--api_key',  type=str, default='')
parser.add_argument('--start',    type=int, default=1)
parser.add_argument('--end',      type=int, default=0)
args = parser.parse_args()

BOOK_ID   = args.book_id
PDF_PATH  = args.pdf_path
API_KEY   = args.api_key or os.environ.get('GROQ_API_KEY', '')
GROQ_URL  = 'https://api.groq.com/openai/v1/chat/completions'
OCR_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

# ── DB config (read from env file) ───────────────────────────────────────────
ENV_PATH = os.path.join(os.path.dirname(__file__), '../env')
db_cfg = {'host': '159.89.167.218', 'user': 'pojjari_user',
          'password': 'StrongPassword@2024!', 'database': 'pojjari_db', 'charset': 'utf8mb4'}
try:
    with open(ENV_PATH) as f:
        for line in f:
            line = line.strip()
            if line.startswith('DB_HOST='):    db_cfg['host']     = line.split('=',1)[1]
            elif line.startswith('DB_USER='):  db_cfg['user']     = line.split('=',1)[1]
            elif line.startswith('DB_PASSWORD='): db_cfg['password'] = line.split('=',1)[1]
            elif line.startswith('DB_NAME='):  db_cfg['database'] = line.split('=',1)[1]
            elif not API_KEY and line.startswith('GROQ_API_KEY='): API_KEY = line.split('=',1)[1]
except Exception: pass

# ── DB helpers ────────────────────────────────────────────────────────────────
def get_conn():
    return mysql.connector.connect(**db_cfg)

def page_exists(cursor, book_id, page_no):
    cursor.execute('SELECT id FROM granth_pages WHERE book_id=%s AND page_no=%s', (book_id, page_no))
    return cursor.fetchone() is not None

def save_page(cursor, book_id, page_no, content):
    wc = len(content.split())
    cursor.execute(
        'INSERT INTO granth_pages (book_id, page_no, content, word_count) VALUES (%s,%s,%s,%s) '
        'ON DUPLICATE KEY UPDATE content=VALUES(content), word_count=VALUES(word_count)',
        (book_id, page_no, content, wc)
    )

def update_progress(cursor, book_id, processed, total, status):
    cursor.execute(
        'UPDATE granth_books SET processed_pages=%s, total_pages=%s, status=%s, updated_at=NOW() WHERE id=%s',
        (processed, total, status, book_id)
    )

# ── OCR one page image ────────────────────────────────────────────────────────
def ocr_page(img, page_no):
    if not API_KEY:
        raise RuntimeError('GROQ_API_KEY not set')
    import io
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=85)
    b64 = base64.b64encode(buf.getvalue()).decode()
    payload = {
        'model': OCR_MODEL,
        'max_tokens': 2000,
        'messages': [{
            'role': 'user',
            'content': [
                {'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{b64}'}},
                {'type': 'text', 'text': (
                    'This is a page from a Marathi/Sanskrit religious text (printed book).\n'
                    'Extract ALL text exactly as printed — preserve Devanagari script, punctuation, '
                    'verse numbering, and paragraph breaks.\n'
                    'Do NOT translate, summarize, or add any commentary.\n'
                    'Return ONLY the extracted text.'
                )},
            ],
        }],
    }
    resp = requests.post(GROQ_URL, headers={'Authorization': f'Bearer {API_KEY}', 'Content-Type': 'application/json'},
                         json=payload, timeout=60)
    if not resp.ok:
        raise RuntimeError(f'Groq error {resp.status_code}: {resp.text[:200]}')
    return resp.json()['choices'][0]['message']['content'].strip()

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    if not os.path.exists(PDF_PATH):
        print(f'ERROR: PDF not found: {PDF_PATH}')
        sys.exit(1)
    if not API_KEY:
        print('ERROR: GROQ_API_KEY not set')
        sys.exit(1)

    print(f'\nGranth OCR — Book ID: {BOOK_ID}')
    print(f'PDF: {PDF_PATH}')
    print(f'Model: {OCR_MODEL}\n')

    conn = get_conn()
    cursor = conn.cursor()

    # Count pages
    images = convert_from_path(PDF_PATH, dpi=200)
    total  = len(images)
    start  = max(1, args.start)
    end    = args.end if args.end > 0 else total

    print(f'Total pages: {total}  |  Processing: {start} to {end}\n')
    update_progress(cursor, BOOK_ID, 0, total, 'processing')
    conn.commit()

    done = 0
    for page_no in range(start, end + 1):
        if page_exists(cursor, BOOK_ID, page_no):
            done += 1
            continue

        img = images[page_no - 1]
        print(f'  Page {page_no}/{total}  |  {done} done ({round(done/total*100,1)}%)', end='  ')

        try:
            text = ocr_page(img, page_no)
            save_page(cursor, BOOK_ID, page_no, text)
            done += 1
            update_progress(cursor, BOOK_ID, done, total, 'processing')
            conn.commit()
            print(f'✓ ({len(text.split())} words)')
        except Exception as e:
            print(f'✗ Error: {e}')
            conn.rollback()

        time.sleep(2)

    status = 'completed' if done >= (end - start + 1) else 'error'
    update_progress(cursor, BOOK_ID, done, total, status)
    conn.commit()
    cursor.close()
    conn.close()
    print(f'\n✅ Done — {done} pages OCR\'d. Status: {status}')

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        conn = get_conn()
        c = conn.cursor()
        c.execute('UPDATE granth_books SET status=%s WHERE id=%s', ('paused', BOOK_ID))
        conn.commit()
        print('\n⏸ Paused.')
    except Exception as e:
        conn = get_conn()
        c = conn.cursor()
        c.execute('UPDATE granth_books SET status=%s WHERE id=%s', ('error', BOOK_ID))
        conn.commit()
        print(f'\n❌ Fatal error: {e}')
        sys.exit(1)
