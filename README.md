# 🪔 पूजारी (Pojjari) — पूजा बुकिंग वेबॅप

## 🖼️ Images — महत्त्वाची माहिती

**Images public folder मध्ये नाहीत — backend database मधून serve होतात!**

Flow: `backend/uploads/poojas/*.png` → API returns full URL → Frontend displays

| Image File | Pooja Slug |
|---|---|
| satyanarayan-pooja.png | satyanarayan-pooja |
| engagement-pooja.png | engagement-pooja |
| rudra-abhishek.png | rudra-abhishek |
| navgraha-shanti-havan.png | navgraha-shanti-havan |
| datta-yag.png | datta-yag |
| dashkriya-vidhi.png | dashkriya-vidhi |
| barave-vidhi.png | barave-vidhi |
| varshik-shraddha.png | varshik-shraddha |
| ganpati-sthapna.png | ganpati-sthapna |
| lakshmi-poojan-diwali.png | lakshmi-poojan-diwali |
| gruhpravesh-gruhshanti.png | gruhpravesh-gruhshanti |
| bhoomi-pujan.png | bhoomi-pujan |
| vastu-shanti-udak.png | vastu-shanti-udak |
| lagn-vidhi.png | lagn-vidhi |
| nakshatra-janan-shanti.png | nakshatra-janan-shanti |

---

## 🚀 Setup

### Backend

```bash
cd backend
cp .env.example .env
# .env edit करा — DB password, JWT_SECRET, BACKEND_URL
npm install
```

**.env मध्ये BACKEND_URL set करणे आवश्यक आहे:**
```env
PORT=5000
BACKEND_URL=http://localhost:5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=pojjari_db
JWT_SECRET=change_this_to_random_string
CLIENT_URL=http://localhost:5173
```

### Database

```bash
mysql -u root -p < backend/src/config/schema.sql
```

Schema आपोआप tables + seed data + images URL तयार करतो.

### Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
```

### Backend Start

```bash
cd backend
npm run dev
```

---

## 🔑 Admin

- Email: admin@pojjari.com  
- Phone: 9307720459  
- Password: schema.sql मधून update करा

---

## Production

```env
BACKEND_URL=https://api.yoursite.com
VITE_API_URL=https://api.yoursite.com/api
```

`backend/uploads/` folder server वर copy करा.
