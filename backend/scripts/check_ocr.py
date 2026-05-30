import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
with open('f:\\pojjari_v2_with_images\\pojjari_updated\\backend\\env') as f:
    for l in f:
        l=l.strip()
        if l and not l.startswith('#') and '=' in l:
            k,v=l.split('=',1); os.environ.setdefault(k.strip(),v.strip())
import mysql.connector
c=mysql.connector.connect(host=os.environ['DB_HOST'],port=int(os.environ.get('DB_PORT',3306)),
    user=os.environ['DB_USER'],password=os.environ['DB_PASSWORD'],
    database=os.environ['DB_NAME'],charset='utf8mb4',connect_timeout=8)
cur=c.cursor()
cur.execute("SELECT COUNT(*) FROM dharmasindhu_pages WHERE ocr_text IS NOT NULL AND ocr_text != ''")
done=cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM dharmasindhu_pages")
total=cur.fetchone()[0]
cur.execute("SELECT page_number FROM dharmasindhu_pages WHERE ocr_text IS NOT NULL AND ocr_text != '' ORDER BY page_number DESC LIMIT 10")
last=[r[0] for r in cur.fetchall()]
print(f"Done: {done}/{total} pages ({round(done/total*100,1)}%)")
print(f"Last 10 done: {last}")
c.close()
