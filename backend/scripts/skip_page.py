import os, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
with open('f:\\pojjari_v2_with_images\\pojjari_updated\\backend\\env') as f:
    for l in f:
        l = l.strip()
        if l and not l.startswith('#') and '=' in l:
            k, v = l.split('=', 1); os.environ.setdefault(k.strip(), v.strip())
import mysql.connector
c = mysql.connector.connect(
    host=os.environ['DB_HOST'], port=int(os.environ.get('DB_PORT', 3306)),
    user=os.environ['DB_USER'], password=os.environ['DB_PASSWORD'],
    database=os.environ['DB_NAME'], charset='utf8mb4', connect_timeout=8)
cur = c.cursor()
cur.execute("INSERT IGNORE INTO dharmasindhu_content (page_no,content,word_count) VALUES (97,'[pan 97 skip]',0)")
c.commit()
cur.execute("SELECT COUNT(*) FROM dharmasindhu_content")
print("Pages in DB:", cur.fetchone()[0])
c.close()
