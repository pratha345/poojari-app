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
# Check if column already exists
cur.execute("SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=%s AND TABLE_NAME='poojas' AND COLUMN_NAME='samagri_price'", (os.environ['DB_NAME'],))
exists = cur.fetchone()[0]
if not exists:
    cur.execute('ALTER TABLE poojas ADD COLUMN samagri_price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER price')
    c.commit()
    print('samagri_price column added!')
else:
    print('samagri_price column already exists.')
cur.execute("SELECT id, name_mr, price, samagri_price FROM poojas LIMIT 5")
for r in cur.fetchall(): print(r)
c.close()
