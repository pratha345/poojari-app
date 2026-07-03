# DevOps Guide — Pojjari Project
## CI/CD, Docker, Deployment & Infrastructure

> Current Server: DigitalOcean `64.227.152.85`
> Current Deploy: Manual `deploy.ps1` (PowerShell + PuTTY)
> Goal: Fully automated CI/CD pipeline

---

## Table of Contents

1. [Current Architecture](#1-current-architecture)
2. [DevOps Goals](#2-devops-goals)
3. [Git Branching Strategy](#3-git-branching-strategy)
4. [GitHub Actions — CI/CD Pipeline](#4-github-actions--cicd-pipeline)
5. [Docker — Backend Containerization](#5-docker--backend-containerization)
6. [Server Setup Script](#6-server-setup-script)
7. [Nginx Configuration](#7-nginx-configuration)
8. [PM2 Process Management](#8-pm2-process-management)
9. [Database Backup Automation](#9-database-backup-automation)
10. [Monitoring & Alerting](#10-monitoring--alerting)
11. [Server Migration Guide](#11-server-migration-guide)
12. [Environment Management](#12-environment-management)
13. [Deployment Checklist](#13-deployment-checklist)

---

## 1. Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT SETUP                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Developer Machine                                          │
│  ┌──────────────────────┐                                  │
│  │ npm run build (Vite) │ → frontend/dist/                 │
│  └──────────────────────┘                                  │
│              │                                              │
│              │ deploy.ps1 (PowerShell + PuTTY/pscp)         │
│              ▼                                              │
│  DigitalOcean Server (64.227.152.85)                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Nginx                                             │    │
│  │  ├── /var/www/pojjari/frontend/dist/ (static)      │    │
│  │  └── proxy → localhost:5000 (backend)              │    │
│  │                                                    │    │
│  │  PM2                                               │    │
│  │  ├── pojjari-backend  (Node.js Express)            │    │
│  │  └── pojjari-bot      (WhatsApp bot)               │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                  │
│  MySQL Server (159.89.167.218) — Separate server           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Problems:
  ❌ Manual deployment (error-prone)
  ❌ No tests before deploy
  ❌ No rollback if deploy breaks something
  ❌ node_modules on server (200MB+)
  ❌ .env secrets directly on server
  ❌ No deployment notifications
  ❌ SSH password authentication (security risk)
```

---

## 2. DevOps Goals

```
✅ git push → automatic test → build → deploy
✅ Failed tests = deploy blocked
✅ Docker container → no node_modules on server
✅ Secrets in GitHub, not on server
✅ Rollback: one command
✅ Email notification on deploy success/failure
✅ Server health monitoring
✅ Daily database backups
```

---

## 3. Git Branching Strategy

```
main        → Production (live site) — protected branch
develop     → Development testing
feature/*   → New features
hotfix/*    → Emergency production fixes
```

**Workflow:**
```bash
# New feature:
git checkout -b feature/add-whatsapp-sharing
# ... code ...
git push origin feature/add-whatsapp-sharing
# GitHub → Pull Request → Review → Merge to develop → Merge to main → Auto Deploy

# Emergency fix:
git checkout -b hotfix/fix-booking-crash
# ... fix ...
git push origin hotfix/fix-booking-crash
# PR → merge to main (skip develop) → Auto Deploy
```

**Branch Protection Rules (GitHub Settings):**
```
main branch:
  ✅ Require PR reviews (1 reviewer)
  ✅ Require status checks to pass (CI tests)
  ✅ No direct push to main
  ✅ No force push
```

---

## 4. GitHub Actions — CI/CD Pipeline

**File:** `.github/workflows/deploy.yml`

```yaml
name: Pojjari CI/CD Pipeline

on:
  push:
    branches: [main]          # main branch ला push → auto run
  pull_request:
    branches: [main]          # PR → test only (no deploy)

jobs:

  # ══════════════════════════════════════════════════════
  # JOB 1: TEST — Backend tests run करा
  # ══════════════════════════════════════════════════════
  test:
    name: Run Backend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: cd backend && npm ci

      - name: Run tests
        run: cd backend && npm test
        env:
          NODE_ENV:   test
          JWT_SECRET: test-secret-minimum-32-chars-long

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: backend/coverage/

  # ══════════════════════════════════════════════════════
  # JOB 2: BUILD — Frontend build करा
  # test pass झाल्यावरच चालतो
  # ══════════════════════════════════════════════════════
  build-frontend:
    name: Build Frontend
    needs: test               # test fail = build skip!
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install & Build
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_API_URL: https://pujari.mydashboard.site/api

      - name: Save build artifact
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: frontend/dist/
          retention-days: 1

  # ══════════════════════════════════════════════════════
  # JOB 3: DEPLOY — Server वर deploy करा
  # build pass झाल्यावरच, main branch only
  # ══════════════════════════════════════════════════════
  deploy:
    name: Deploy to Production
    needs: build-frontend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # main branch only!

    steps:
      - uses: actions/checkout@v4

      - name: Download frontend build
        uses: actions/download-artifact@v4
        with:
          name: frontend-dist
          path: ./dist

      - name: Deploy Frontend to Server
        uses: appleboy/scp-action@v0.1.7
        with:
          host:     64.227.152.85
          username: root
          password: ${{ secrets.SERVER_PASSWORD }}
          source:   './dist/*'
          target:   '/var/www/pojjari/frontend/dist/'

      - name: Deploy Backend & Restart
        uses: appleboy/ssh-action@v1.0.3
        with:
          host:     64.227.152.85
          username: root
          password: ${{ secrets.SERVER_PASSWORD }}
          script: |
            set -e
            cd /var/www/pojjari/backend

            # Latest code pull
            git pull origin main

            # Install new dependencies (if package.json changed)
            npm ci --only=production

            # PM2 restart
            pm2 restart pojjari-backend
            pm2 save

            echo "✅ Backend deployed and restarted"

      - name: Health Check
        run: |
          sleep 10
          curl -f https://pujari.mydashboard.site/api/health || exit 1
          echo "✅ Health check passed!"

      - name: Notify Success
        if: success()
        uses: appleboy/ssh-action@v1.0.3
        with:
          host:     64.227.152.85
          username: root
          password: ${{ secrets.SERVER_PASSWORD }}
          script: |
            echo "🚀 Deploy successful at $(date)" >> /var/log/pojjari-deploys.log
```

**GitHub Secrets Setup:**
```
GitHub Repo → Settings → Secrets and variables → Actions → New secret

Add these secrets:
  SERVER_PASSWORD  →  NckUX?&wxHHa@123   (Server SSH password)
  DOCKER_USERNAME  →  your-dockerhub-username  (future Docker use)
  DOCKER_TOKEN     →  dockerhub-access-token
```

---

## 5. Docker — Backend Containerization

**File:** `backend/Dockerfile`

```dockerfile
# ── Stage 1: Build dependencies ─────────────────────────
FROM node:20-slim AS deps

WORKDIR /app

# sharp package साठी native build tools
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# package.json आधी copy (cache optimization)
# src/ नंतर copy → package.json change नाही → cache hit!
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Runtime image ───────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

# sharp runtime library
RUN apt-get update && apt-get install -y \
    libvips \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Non-root user (security — root म्हणून चालू नये)
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home pojjari

# Stage 1 मधून node_modules copy
COPY --from=deps /app/node_modules ./node_modules

# Source code copy (node_modules नाही)
COPY src/ ./src/

# Uploads folder for volume mount
RUN mkdir -p uploads && chown -R pojjari:nodejs /app

USER pojjari    # Root म्हणून run नको!

EXPOSE 5000

CMD ["node", "src/app.js"]
```

**File:** `backend/.dockerignore`
```
node_modules
env
.env
.env.*
*.log
*.md
.git
coverage
dist
```

**File:** `docker-compose.yml` (Local Development)
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file: ./backend/env          # तुमचा env file
    volumes:
      - ./backend/src:/app/src        # Live reload
      - pojjari-uploads:/app/uploads  # Persistent uploads
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass localredispass

volumes:
  pojjari-uploads:
```

**Docker Commands:**
```bash
# Local development:
docker-compose up -d          # Start all services
docker-compose logs -f backend # Live logs
docker-compose down           # Stop

# Production image build + run:
docker build -t pojjari-backend:latest ./backend

docker run -d \
  --name pojjari-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file /var/pojjari/env \
  -v /var/pojjari/uploads:/app/uploads \
  pojjari-backend:latest
```

---

## 6. Server Setup Script

**File:** `scripts/server-setup.sh`

```bash
#!/bin/bash
# Run ONCE on a new server: bash server-setup.sh
set -e

echo "🚀 Pojjari Server Setup Starting..."

# ── System ────────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── Node.js 20 ────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
echo "✅ Node.js $(node --version)"

# ── PM2 ───────────────────────────────────────────────────
npm install -g pm2
echo "✅ PM2 installed"

# ── Nginx ─────────────────────────────────────────────────
apt-get install -y nginx
systemctl enable nginx
echo "✅ Nginx installed"

# ── Certbot (SSL) ─────────────────────────────────────────
apt-get install -y certbot python3-certbot-nginx
echo "✅ Certbot installed"

# ── Fail2ban (SSH brute force) ────────────────────────────
apt-get install -y fail2ban
systemctl enable fail2ban
echo "✅ Fail2ban installed"

# ── UFW Firewall ──────────────────────────────────────────
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
echo "✅ Firewall configured"

# ── Redis ─────────────────────────────────────────────────
apt-get install -y redis-server
systemctl enable redis-server
sed -i 's/^# requirepass.*/requirepass StrongRedisPassword@2024/' /etc/redis/redis.conf
sed -i 's/^bind 127.0.0.1 ::1/bind 127.0.0.1/' /etc/redis/redis.conf
systemctl restart redis-server
echo "✅ Redis installed and secured"

# ── Folder Structure ──────────────────────────────────────
mkdir -p /var/www/pojjari/frontend/dist
mkdir -p /var/www/pojjari/backend
mkdir -p /var/pojjari/uploads/poojas
mkdir -p /var/pojjari/uploads/blog
mkdir -p /var/pojjari/uploads/slider
mkdir -p /var/pojjari/logs
chmod -R 755 /var/www/pojjari
echo "✅ Directories created"

# ── Nginx config ──────────────────────────────────────────
cp /tmp/pojjari-nginx.conf /etc/nginx/sites-available/pojjari
ln -sf /etc/nginx/sites-available/pojjari /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
echo "✅ Nginx configured"

# ── PM2 startup ───────────────────────────────────────────
pm2 startup systemd -u root --hp /root
echo "✅ PM2 startup configured"

echo ""
echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env: scp env root@IP:/var/pojjari/"
echo "  2. Clone backend: git clone <repo> /var/www/pojjari/backend"
echo "  3. Install deps: cd /var/www/pojjari/backend && npm ci --only=production"
echo "  4. Start PM2: pm2 start src/app.js --name pojjari-backend"
echo "  5. SSL: certbot --nginx -d pujari.mydashboard.site"
echo "  6. pm2 save"
```

---

## 7. Nginx Configuration

**File:** `scripts/pojjari-nginx.conf`

```nginx
# HTTP → HTTPS redirect
server {
    listen 80;
    server_name pujari.mydashboard.site;
    return 301 https://$server_name$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name pujari.mydashboard.site;

    # SSL (Certbot fills these automatically)
    ssl_certificate     /etc/letsencrypt/live/pujari.mydashboard.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pujari.mydashboard.site/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # File upload limit
    client_max_body_size 10M;

    # Frontend — React app (static files)
    root /var/www/pojjari/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        # ↑ React Router: /booking/123 → serves index.html → React handles routing
    }

    # Backend API
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;    # Long requests (AI generation)
    }

    # Socket.IO (WebSocket upgrade)
    location /socket.io/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
    }

    # Uploaded files (images)
    location /uploads/ {
        alias /var/pojjari/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript;
}
```

---

## 8. PM2 Process Management

**Current processes:**

```bash
pm2 list
# ┌──────────────────────┬─────┬────────┬─────┐
# │ App name             │ id  │ status │ CPU │
# ├──────────────────────┼─────┼────────┼─────┤
# │ pojjari-backend      │ 0   │ online │ 0%  │
# │ pojjari-bot          │ 1   │ online │ 0%  │
# │ ocr-coordinator      │ 2   │ online │ 0%  │
# └──────────────────────┴─────┴────────┴─────┘
```

**PM2 Ecosystem File:**

```javascript
// ecosystem.config.js (backend root)
module.exports = {
  apps: [
    {
      name:         'pojjari-backend',
      script:       'src/app.js',
      instances:    1,            // Single instance (no cluster)
      autorestart:  true,
      watch:        false,        // Production मध्ये watch नाही
      max_memory_restart: '512M', // 512MB RAM limit → auto-restart
      env_file:     '/var/pojjari/env',
      log_file:     '/var/pojjari/logs/backend.log',
      error_file:   '/var/pojjari/logs/backend-error.log',
      time:         true,         // Timestamp in logs
    }
  ]
};

// Start: pm2 start ecosystem.config.js
// Reload: pm2 reload pojjari-backend (zero-downtime)
// Restart: pm2 restart pojjari-backend (brief downtime)
```

**Useful PM2 Commands:**
```bash
pm2 list                          # सगळे processes
pm2 logs pojjari-backend          # Live logs
pm2 logs pojjari-backend --lines 100  # Last 100 lines
pm2 restart pojjari-backend       # Restart
pm2 reload pojjari-backend        # Zero-downtime reload
pm2 stop pojjari-backend          # Stop
pm2 delete pojjari-backend        # Remove from PM2
pm2 monit                         # Real-time monitoring dashboard
pm2 save                          # Save current state
pm2 startup                       # Server reboot वर auto-start
```

**PM2 Log Rotation:**
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M   # 10MB per log file
pm2 set pm2-logrotate:retain 7       # 7 days worth of logs
pm2 set pm2-logrotate:compress true  # Gzip old logs
```

---

## 9. Database Backup Automation

**File:** `scripts/backup.sh`

```bash
#!/bin/bash
# Daily automatic database backup
# Setup: crontab -e → 0 2 * * * /var/pojjari/scripts/backup.sh

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/var/pojjari/backups"
DB_HOST="159.89.167.218"
DB_USER="pojjari_user"
DB_PASS="StrongPassword@2024!"
DB_NAME="pojjari_db"

mkdir -p "$BACKUP_DIR"

# ── Database dump ──────────────────────────────────────────
mysqldump \
  -h "$DB_HOST" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" \
  > "$BACKUP_DIR/db_$DATE.sql"

# ── Compress ───────────────────────────────────────────────
gzip "$BACKUP_DIR/db_$DATE.sql"

# ── Clean old backups (30 days) ────────────────────────────
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

# ── Log ────────────────────────────────────────────────────
echo "[$(date)] ✅ Backup: db_$DATE.sql.gz ($(du -sh "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1))" \
  >> /var/log/pojjari-backups.log

echo "✅ Backup complete: db_$DATE.sql.gz"
```

**Setup:**
```bash
# Server वर:
chmod +x /var/pojjari/scripts/backup.sh

# Cron job (daily 2AM):
crontab -e
# Add line:
0 2 * * * /var/pojjari/scripts/backup.sh >> /var/log/pojjari-backups.log 2>&1

# Test manually:
bash /var/pojjari/scripts/backup.sh
ls -la /var/pojjari/backups/

# Restore from backup:
gunzip -c /var/pojjari/backups/db_2024-12-25.sql.gz | \
  mysql -h 159.89.167.218 -u pojjari_user -p'StrongPassword@2024!' pojjari_db
```

---

## 10. Monitoring & Alerting

**Free Tools (Set up now — 5 minutes):**

### UptimeRobot (Website monitoring)
```
1. uptimerobot.com → Sign up
2. Add Monitor:
   Type: HTTP(s)
   URL:  https://pujari.mydashboard.site/api/health
   Check every: 5 minutes
   Alert: Email + SMS when DOWN

3. Also add:
   URL:  https://pujari.mydashboard.site/
   → Nginx + Frontend monitoring
```

### PM2 Server Monitoring
```bash
# Server मध्ये status check:
pm2 status

# Memory/CPU:
pm2 monit

# Alerts (PM2+ paid — free alternative):
# Add to cron: every 5 min check
*/5 * * * * pm2 jlist | python3 -c "
import json, sys
procs = json.load(sys.stdin)
for p in procs:
    if p['pm2_env']['status'] != 'online':
        print(f'ALERT: {p[\"name\"]} is {p[\"pm2_env\"][\"status\"]}')
"
```

### Nginx Access Logs
```bash
# Real-time:
tail -f /var/log/nginx/access.log

# 4xx/5xx errors:
grep ' [45][0-9][0-9] ' /var/log/nginx/access.log | tail -50

# Top IPs (potential attackers):
awk '{print $1}' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -20

# Requests per minute:
awk '{print $4}' /var/log/nginx/access.log | cut -d: -f2 | sort | uniq -c
```

---

## 11. Server Migration Guide

**When to migrate:**
- Server crash/compromise
- Upgrading to bigger droplet
- Moving to different provider

**Migration Steps:**

```bash
# Step 1: New server setup
bash server-setup.sh               # On new server

# Step 2: Copy data from old server
# (Run on OLD server)
OLD="root@64.227.152.85"
NEW="root@NEW_IP_HERE"

# Uploads (images, pooja photos, blog images)
rsync -avz --progress \
  /var/pojjari/uploads/ \
  $NEW:/var/pojjari/uploads/

# Environment config
scp /var/pojjari/env $NEW:/var/pojjari/env

# Frontend build
rsync -avz --progress \
  /var/www/pojjari/frontend/dist/ \
  $NEW:/var/www/pojjari/frontend/dist/

# Database backup → copy
bash /var/pojjari/scripts/backup.sh
scp /var/pojjari/backups/db_$(date +%Y-%m-%d).sql.gz $NEW:/tmp/

# Step 3: On NEW server
gunzip -c /tmp/db_*.sql.gz | \
  mysql -h 159.89.167.218 -u pojjari_user -p'StrongPassword@2024!' pojjari_db
# Note: DB is already on separate server (159.89.167.218)
# No DB migration needed if keeping same DB server!

# Backend code
git clone <your-repo> /var/www/pojjari/backend
cd /var/www/pojjari/backend
npm ci --only=production
pm2 start ecosystem.config.js
pm2 save

# SSL
certbot --nginx -d pujari.mydashboard.site

# Step 4: Test new server
curl http://NEW_IP/api/health

# Step 5: DNS switch
# Cloudflare / Domain registrar:
#   pujari.mydashboard.site → NEW_IP
# Propagation: 2-5 minutes

# Step 6: Verify
curl https://pujari.mydashboard.site/api/health

# Step 7: Old server (after 24 hours)
# DigitalOcean → Destroy old droplet
```

**Zero-Downtime Migration:**
```
1. New server fully ready (tested with IP)
2. DNS TTL कमी करा (300s → 60s, 24 hours before)
3. DNS switch → new IP
4. 60 seconds propagation
5. Old server running as backup (24 hours)
6. Old server destroy
```

---

## 12. Environment Management

**Files:**
```
backend/env              ← Local development (git ignore करा!)
backend/env.example      ← Template (git commit करा)
/var/pojjari/env         ← Production (server only)
GitHub Secrets           ← CI/CD pipeline
```

**`backend/env.example`:**
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=pojjari_user
DB_PASS=your-db-password
DB_NAME=pojjari_db

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-minimum-32-char-secret-key
JWT_EXPIRES=7d

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# API Keys
FAST2SMS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
GEMINI_API_KEY=
GROQ_API_KEY=

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@pojjari.com
```

**Security Rules:**
```
✅ env (production secrets) → .gitignore → NEVER in git
✅ env.example → git commit (no real values)
✅ GitHub Secrets → CI/CD only
✅ Production .env → /var/pojjari/env (server only)
❌ Never: console.log(process.env.DB_PASS)
❌ Never: commit .env to git
❌ Never: share secrets in chat/email
```

---

## 13. Deployment Checklist

**Before every deploy:**
```
Local:
  □ npm test passes locally
  □ npm run build succeeds (no errors)
  □ No console.log with sensitive data
  □ .env not staged in git

GitHub:
  □ PR created with description
  □ CI tests green ✅
  □ Code review done (if team)

After deploy:
  □ https://pujari.mydashboard.site loads
  □ /api/health → { status: 'ok' }
  □ Login works
  □ Booking flow works
  □ Admin panel accessible
  □ PM2 processes all online: pm2 status
  □ No errors in logs: pm2 logs --lines 20
```

**Rollback (if something breaks):**
```bash
# Option 1: Git revert + redeploy
git revert HEAD
git push origin main
# → GitHub Actions auto-deploy previous code

# Option 2: Manual server rollback
ssh root@64.227.152.85
cd /var/www/pojjari/backend
git log --oneline -5                    # Find previous commit
git checkout <previous-commit-hash>
pm2 restart pojjari-backend

# Option 3: PM2 auto-restart
# PM2 monitors the process — if it crashes, it restarts automatically
# Check: pm2 status → restart count
```
