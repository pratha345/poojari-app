#!/bin/bash
# Serve /sitemap.xml from the backend's dynamic route instead of the old static file
# in frontend/dist. Backs up the site config, validates with nginx -t, rolls back on error.
set -e
CONF=/etc/nginx/sites-enabled/pojjari
COUNT=$(curl -s http://localhost:5000/sitemap.xml | grep -c "/blog/" || true)
echo "backend sitemap blog urls: $COUNT"
[ "$COUNT" -gt 100 ] || { echo "backend sitemap looks wrong, aborting"; exit 1; }
if grep -q "location = /sitemap.xml" "$CONF"; then echo "rule already present"; exit 0; fi
cp "$CONF" "/root/pojjari.nginx.bak-$(date +%Y%m%d-%H%M)"
sed -i '0,/    location \/api\/ {/s//    location = \/sitemap.xml {\n        proxy_pass http:\/\/localhost:5000\/sitemap.xml;\n        proxy_set_header Host $host;\n    }\n\n    location \/api\/ {/' "$CONF"
if nginx -t; then systemctl reload nginx; echo "nginx reloaded"; else cp "$(ls -t /root/pojjari.nginx.bak-* | head -1)" "$CONF"; echo "nginx -t failed, restored"; exit 1; fi
