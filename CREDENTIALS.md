# Pojjari Project — Important Credentials
> Site: https://pujari.mydashboard.site

---

## 👤 Admin Logins

| Role | नाव | Email | Phone | Password |
|------|-----|-------|-------|----------|
| Super Admin | Super Admin | superadmin@pojjari.com | 9999999999 | `SuperAdmin@123` |
| Admin | Admin | admin@pojjari.com | 9000000000 | `Admin@123` |
| Admin (E2E Test) | Test Admin | testadmin@pojjari.com | 9307720459 | `Admin@123` |

- Admin Panel: https://pujari.mydashboard.site/admin
- Super Admin Panel: https://pujari.mydashboard.site/superadmin

---

## 🖥️ Server (DigitalOcean)

| | |
|---|---|
| IP | 64.227.152.85 |
| User | root |
| Password | NckUX?&wxHHa@123 |
| SSH Fingerprint | ssh-ed25519 255 SHA256:xjdoaCAoBdoZKvbCobRaamhYqZImpwzACAJqsE7Y3EU |

**Frontend dist path:** `/var/www/pojjari/frontend/dist/`
**Backend path:** `/var/www/pojjari/backend/`
**PM2 logs:** `/var/log/pm2/`
**Nginx config:** `/etc/nginx/sites-enabled/pojjari`

**Connect (PuTTY plink):**
```
"C:\Program Files\PuTTY\plink.exe" -pw "NckUX?&wxHHa@123" -batch -hostkey "ssh-ed25519 255 SHA256:xjdoaCAoBdoZKvbCobRaamhYqZImpwzACAJqsE7Y3EU" root@64.227.152.85 "command"
```

**Upload file (PuTTY pscp):**
```
"C:\Program Files\PuTTY\pscp.exe" -pw "NckUX?&wxHHa@123" -batch -hostkey "ssh-ed25519 255 SHA256:xjdoaCAoBdoZKvbCobRaamhYqZImpwzACAJqsE7Y3EU" "local\file.ext" "root@64.227.152.85:/var/www/pojjari/frontend/dist/"
```

---

## 🗄️ Database (MySQL)

| | |
|---|---|
| Host | 159.89.167.218 |
| Port | 3306 |
| User | pojjari_user |
| Password | StrongPassword@2024! |
| Database | pojjari_db |

---

## 🔑 API Keys

| Service | Key |
|---------|-----|
| Gemini (Google AI) | AIzaSyAESh1syc7Dhz-gm_cHuDwTPCVWW9o8gzw |
| Groq | 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 |
| Stability AI | sk-laMKT74qHBId7D04PQgaBNdoz3ImpxAbqJFzL6zcagZN0IrL |
| Fast2SMS | RM6C5zyEEG9gIeVedkQffUMTP2IjDUpr4TImtcpg0MxwJCxNMcYnp1cWT85E |
| Razorpay Key ID | rzp_test_Ss8lBeFcRhyNzM |
| Razorpay Secret | Zezw6rC0ZuaQndoHprd7v5z0 |

---

## ⚙️ App Config

| | |
|---|---|
| JWT Secret | pojjari_super_secret_key_change_this_2024_minimum32chars |
| VAPID Public | BNV4Slu1KOWkTvjxJ03bYPLulk_VMgYJ6PL3jBYNnFcDdHLI-vpxuXx4khekC9sBB1IpM0MKRaeZ8VHZWpjh_vY |
| VAPID Private | aYW9A7KEQoWtd2tl06Wl9kUo7tIN0mIpCHqZ8pSeOFA |

---

## 🔄 PM2 Processes

| Name | काय करतो |
|------|----------|
| pojjari-backend | Main Express API (port 5000) |
| pojjari-bot | WhatsApp bot |
| ocr-coordinator | Dharmasindhu OCR (Gemini+Groq alternate, auto-deletes after 841 pages) |

**Useful PM2 commands:**
```bash
pm2 list
pm2 logs pojjari-backend
pm2 restart pojjari-backend
pm2 logs ocr-coordinator
```

---

## 📁 Local Project Path

`f:\pojjari_v2_with_images\pojjari_updated\`

**Build & Deploy:**
```powershell
# Build
cd f:\pojjari_v2_with_images\pojjari_updated\frontend
npm run build

# Upload all assets
"C:\Program Files\PuTTY\pscp.exe" -pw "NckUX?&wxHHa@123" -batch -hostkey "ssh-ed25519 255 SHA256:xjdoaCAoBdoZKvbCobRaamhYqZImpwzACAJqsE7Y3EU" -r "dist\assets\*" "root@64.227.152.85:/var/www/pojjari/frontend/dist/assets/"
"C:\Program Files\PuTTY\pscp.exe" -pw "NckUX?&wxHHa@123" -batch -hostkey "ssh-ed25519 255 SHA256:xjdoaCAoBdoZKvbCobRaamhYqZImpwzACAJqsE7Y3EU" "dist\index.html" "root@64.227.152.85:/var/www/pojjari/frontend/dist/index.html"
```
