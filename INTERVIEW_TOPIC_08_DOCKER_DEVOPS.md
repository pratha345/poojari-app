# Topic 08: Docker + DevOps (CI/CD, PM2, Nginx)
> Pojjari production stack — Docker, GitHub Actions CI/CD, PM2, Nginx reverse proxy

---

## 8.1 Docker — Why Containerize?

### Problem without Docker
```
"It works on my machine!"

Developer's laptop:  Node 16, Ubuntu, MySQL 5.7, Redis 6
Production server:   Node 18, CentOS, MySQL 8.0, Redis 7

Different versions → different behavior → bugs in production
```

### Docker Solution
```
Code + Dependencies + Runtime + Config → ONE portable container image
Same image runs identically on any machine (laptop, CI, server)
```

### Container vs Virtual Machine

| | Container | VM |
|---|-----------|-----|
| What's included | App + libraries + runtime | App + OS + kernel |
| Size | MBs | GBs |
| Startup | Seconds | Minutes |
| Performance | Near-native | Overhead |
| Isolation | Process-level | Full OS |
| Use case | Microservices, apps | Full server emulation |

---

## 8.2 Dockerfile — Build Your Image

```dockerfile
# Pojjari backend Dockerfile

# Stage 1: Build dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production    # install only production deps (no devDeps)

# Stage 2: Production image (multi-stage build)
FROM node:18-alpine AS runner
WORKDIR /app

# Copy only what's needed (not node_modules from host)
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY .env.production .env

ENV NODE_ENV=production
EXPOSE 5000

# Don't run as root — security best practice
RUN addgroup -S pojjari && adduser -S pojjari -G pojjari
USER pojjari

CMD ["node", "src/app.js"]
```

### Why Multi-stage Build?
```
Without multi-stage:
  Base image (500MB) + devDependencies (200MB) + source = 700MB+ image

With multi-stage:
  Stage 1 (deps): installs everything, builds if needed
  Stage 2 (runner): copies ONLY production artifacts
  Final image: ~150MB — smaller, faster to deploy, smaller attack surface
```

---

## 8.3 Docker Compose — Run Multiple Services

```yaml
# docker-compose.yml — Pojjari full stack
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - REDIS_HOST=redis
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: pojjari_db
      MYSQL_USER: pojjari_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql   # persist DB across restarts
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  mysql_data:
  redis_data:
```

```bash
# Commands
docker-compose up -d           # start all services in background
docker-compose down            # stop all
docker-compose logs -f backend # stream backend logs
docker-compose ps              # show running services
docker-compose exec backend sh # shell into running container
```

---

## 8.4 PM2 — Process Manager (What Pojjari Uses in Production)

PM2 keeps Node.js apps running — auto-restart on crash, cluster mode, log management.

```bash
# Install
npm install -g pm2

# Start app
pm2 start src/app.js --name "pojjari-backend"
pm2 start src/app.js --name "pojjari-backend" -i max  # cluster mode (all CPU cores)

# Management
pm2 list                          # show all processes
pm2 logs pojjari-backend          # tail logs
pm2 restart pojjari-backend       # restart (keeps old env vars)
pm2 restart pojjari-backend --update-env  # restart + reload .env changes
pm2 reload pojjari-backend        # zero-downtime reload (cluster mode)
pm2 stop pojjari-backend
pm2 delete pojjari-backend

# Auto-start on server reboot
pm2 startup                       # generates startup command
pm2 save                          # save current process list

# ecosystem.config.js (production config)
module.exports = {
  apps: [{
    name: 'pojjari-backend',
    script: 'src/app.js',
    instances: 'max',        // use all CPU cores
    exec_mode: 'cluster',    // cluster mode for load balancing
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/pojjari/error.log',
    out_file: '/var/log/pojjari/out.log',
  }]
};

pm2 start ecosystem.config.js --env production
```

### `pm2 restart` vs `pm2 reload`
- **restart**: Kill process → start new one → brief downtime (~1s)
- **reload**: Cluster mode — rolling restart, one worker at a time → **zero downtime**
- **--update-env**: Required to load new/changed `.env` variables

---

## 8.5 Nginx — Reverse Proxy

Nginx sits in front of Node.js — handles SSL, static files, load balancing.

```nginx
# /etc/nginx/sites-available/pojjari
server {
    listen 80;
    server_name pujari.mydashboard.site;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name pujari.mydashboard.site;

    # SSL certificates (Let's Encrypt / Certbot)
    ssl_certificate /etc/letsencrypt/live/pujari.mydashboard.site/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pujari.mydashboard.site/privkey.pem;

    # Serve React frontend (build output)
    root /var/www/pojjari/frontend/dist;
    index index.html;

    # React Router — return index.html for all non-API routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve uploaded images
    location /uploads/ {
        alias /var/www/pojjari/backend/uploads/;
        expires 30d;        # browser cache for 30 days
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
}
```

```bash
nginx -t                          # test config syntax
systemctl reload nginx            # reload without downtime
certbot --nginx -d pujari.mydashboard.site  # auto-get + configure SSL
```

---

## 8.6 GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Pojjari

on:
  push:
    branches: [main]      # trigger on push to main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: backend

      - name: Run tests
        run: npm test
        working-directory: backend

  deploy:
    needs: test           # only deploy if tests pass
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          VITE_API_URL: ${{ secrets.PROD_API_URL }}

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/pojjari
            git pull origin main
            cd backend && npm ci --only=production
            pm2 restart pojjari-backend --update-env
            cd ../frontend && npm run build
            systemctl reload nginx
```

**Pipeline flow:**
```
git push → GitHub Actions trigger
  → Install deps + Run tests
  → If tests pass → SSH into server
  → git pull → npm ci → pm2 restart → nginx reload
  → Site updated ✅
```

---

## 8.7 Essential DevOps Commands

```bash
# System monitoring
htop                          # CPU/memory usage
df -h                         # disk space
netstat -tlnp                 # open ports

# Node.js process
pm2 monit                     # real-time monitoring dashboard
pm2 logs --lines 100          # last 100 log lines

# Nginx
nginx -t && systemctl reload nginx    # test + reload
tail -f /var/log/nginx/access.log     # watch requests
tail -f /var/log/nginx/error.log      # watch errors

# MySQL
mysql -u pojjari_user -p pojjari_db   # connect
SHOW PROCESSLIST;                      # active queries
SHOW INDEX FROM bookings;              # check indexes

# Redis
redis-cli ping                 # PONG if healthy
redis-cli info memory          # memory usage
redis-cli dbsize               # number of keys
```

---

## Interview Q&A

**Q: Docker Container vs VM — फरक**
> VM: Full OS + kernel virtualize करतो — GBs, minutes to start. Hardware-level isolation.
> Container: OS kernel share करतो, process-level isolation — MBs, seconds to start. Docker uses Linux namespaces + cgroups.
> Use: Multiple full OS environments → VM. Application deployment, microservices, CI/CD → Container.

**Q: Multi-stage Dockerfile का वापरतो?**
> Production image minimal असायला हवी — small size, fast deploy, small attack surface. Build stage मध्ये devDependencies install करतो (TypeScript compiler, test tools). Runner stage मध्ये फक्त production artifacts copy करतो. 700MB → 150MB.

**Q: `pm2 restart` vs `pm2 reload`**
> restart: Process kill → new process start → brief downtime. Single instance साठी ठीक.
> reload: Cluster mode only — old workers gracefully shutdown, new workers start → zero downtime. Production साठी `reload` वापरायचं.
> --update-env: .env file बदवलं असेल तर restart/reload ला हा flag लागतो — otherwise नवीन env vars load होत नाहीत.

**Q: Nginx reverse proxy का वापरतो?**
> 1) SSL termination — Nginx HTTPS handle करतो, Node.js ला plain HTTP.
> 2) Static file serving — Nginx built-in, faster than Node.js.
> 3) Load balancing — multiple Node.js instances.
> 4) Request buffering — slow clients Node.js ला slow नाही करत.
> 5) Security — direct Node.js access नाही, Nginx filter करतो.

**Q: CI/CD pipeline explain करा**
> CI = Continuous Integration — code push → automated tests run. CD = Continuous Deployment — tests pass → automatically deploy. Pojjari: GitHub push → Actions workflow trigger → npm test → SSH to server → git pull → pm2 restart. Every commit automatically tested + deployed.

**Q: `try_files $uri $uri/ /index.html` Nginx मध्ये का?**
> React Router SPA साठी. `/pujaris/42` ला request येतो → file नाही → directory नाही → `index.html` serve करतो → React Router client-side routing handle करतो. Without this, direct URL refresh → 404.

---

## Pojjari Production Stack

```
Browser
  ↓ HTTPS
Nginx (port 443)
  ├── /api/* → proxy_pass → PM2 (Node.js port 5000)
  │                            ↓
  │                         MySQL (3306)
  │                         Redis (6379)
  └── /* → /dist/index.html (React SPA)
         + /uploads/* → static images
```

---

## Summary Table

| Concept | Key Point |
|---------|-----------|
| Docker | Package app + runtime → portable container |
| Multi-stage build | Small prod image — no devDeps, no build tools |
| docker-compose | Run multiple services (backend + DB + Redis) |
| PM2 | Node.js process manager — auto-restart, cluster |
| `pm2 reload` | Zero-downtime restart (cluster mode) |
| `--update-env` | Load new .env vars into PM2 |
| Nginx | Reverse proxy — SSL, static files, load balance |
| `try_files ... /index.html` | SPA routing fix |
| GitHub Actions | CI/CD — test then deploy on push to main |
| Let's Encrypt | Free SSL certificate (certbot) |
