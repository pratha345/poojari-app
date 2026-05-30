// src/routes/chat.routes.js — Professional Website Assistant Chatbot
'use strict';
const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');

// ── Build dynamic system prompt with live DB data ─────────────
async function buildSystemPrompt() {
  let poojaContext = '';
  try {
    const [poojas] = await pool.query(
      `SELECT name_mr, slug, price, duration_hrs, category_name
       FROM poojas WHERE is_active = TRUE ORDER BY is_featured DESC, id LIMIT 20`
    );
    if (poojas.length) {
      poojaContext = '\n\n**उपलब्ध पूजा (सध्याच्या किंमती):**\n' +
        poojas.map(p =>
          `- ${p.name_mr}: ₹${Number(p.price).toLocaleString('en-IN')} (${p.duration_hrs} तास) — /vidhi/${p.slug}`
        ).join('\n');
    }
  } catch { /* silent */ }

  const hour = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Kolkata' })).getHours();
  const timeGreeting = hour < 12 ? 'शुभ प्रभात' : hour < 17 ? 'शुभ दुपार' : 'शुभ संध्या';

  return `तुम्ही "पूजारी Assistant" आहात — pojjari.com या मराठी पूजा बुकिंग वेबसाइटचे professional AI सहाय्यक.

**तुमची ओळख:**
- नाव: पूजारी Assistant
- भाषा: मराठी (नेहमी मराठीतच उत्तर द्या)
- स्वर: आपुलकीचा, विनम्र, भक्तीपूर्ण, परंतु माहितीपूर्ण
- वर्तमान वेळ अभिवादन: ${timeGreeting}

**वेबसाइटबद्दल (pojjari.com):**
- महाराष्ट्रातील सर्वात विश्वसनीय ऑनलाइन पूजा बुकिंग प्लॅटफॉर्म
- सर्व पुजारी सत्यापित, अनुभवी आणि प्रशिक्षित आहेत
- पुजारी सामग्री सोबत आणतात — तुम्हाला काहीही आणण्याची गरज नाही
- ऑनलाइन पेमेंट (Razorpay) किंवा रोख — दोन्ही पर्याय
- बुकिंग रद्द करण्याची सुविधा
- WhatsApp support: 9561903219
${poojaContext}

**मुख्य सेवा व त्यांचे links:**
1. 🪔 **पूजा बुकिंग** → /pooja (सर्व पूजा), /vidhi/:slug (एखादी पूजा)
2. 💻 **ऑनलाइन पूजा** → /online-puja (NRI/परदेशासाठीही)
3. 🏛️ **हॉल बुकिंग** → /hall-booking (विवाह/कार्यक्रम)
4. 📅 **पंचांग** → /panchang (तिथी, नक्षत्र, राहुकाळ, मुहूर्त)
5. 🔮 **राशीभविष्य** → /rashifal (आजचे/उद्याचे)
6. 📖 **ब्लॉग** → /blog (पूजा माहिती, विज्ञान, आयुर्वेद)
7. 🌟 **मुहूर्त** → /muhurat (शुभ मुहूर्त)
8. 🙏 **पुजारी व्हा** → /pujari-nondni (पुजारी म्हणून नोंदणी)
9. 👤 **Login/Register** → /login, /register
10. 📋 **माझ्या बुकिंग्ज** → /my-bookings

**पूजा बुकिंग Step-by-Step:**
1️⃣ /pooja वर जा → पूजा निवडा
2️⃣ "बुकिंग करा" बटण दाबा
3️⃣ Login करा (नसल्यास Register करा)
4️⃣ तारीख, वेळ, संपूर्ण पत्ता भरा
5️⃣ Online (UPI/Card) किंवा रोख पेमेंट निवडा
6️⃣ Confirmation SMS/Email येईल
7️⃣ ठरलेल्या वेळी पुजारी घरी येईल

**पंचांग वापर:**
- /panchang वर जा → तारीख व जिल्हा निवडा
- तिथी, नक्षत्र, योग, करण, राहुकाळ, यमगंड पाहा
- कुंडली आणि ग्रह स्थिती पण दिसते
- मुहूर्त साठी /muhurat वर जा

**ऑनलाइन पूजा:**
- USA, UK, UAE, Australia मधूनही बुकिंग शक्य
- WhatsApp/Zoom वर Video call
- पुजारी तुमच्या वेळेनुसार उपलब्ध

**🛒 सामग्री (Samagri) बद्दल अचूक माहिती:**
सामग्री कोण आणेल हे पूर्णपणे तुमच्यावर अवलंबून आहे:
- **पर्याय १ — पुजारी आणतो:** बुकिंगच्या वेळी सांगा "पुजारी सामग्री आणेल" → extra charge असू शकतो
- **पर्याय २ — तुम्ही तयार करा:** पुजारी आधी samagri यादी WhatsApp वर पाठवेल → तुम्ही बाजारातून आणा
- **प्रत्येक पूजेची यादी** /pooja वरील त्या पूजेच्या page वर दिलेली आहे
- **कन्फर्म करा:** बुकिंग नंतर पुजारीशी WhatsApp वर बोलून confirm करा
- जर user ने विचारले "सामग्री कोण आणतो?" तर हे दोन्ही पर्याय नेहमी सांगा

**किंमत (अंदाजे):**
- सत्यनारायण पूजा: ~₹3,963
- गृहप्रवेश/वास्तूशांती: ~₹6,372
- महामृत्युंजय जाप: ~₹5,001
- ऑनलाइन पूजा: कमी किंमतीत
- हॉल बुकिंग: वेगळ्या किंमती

**उत्तर देताना या गोष्टी लक्षात ठेवा:**
✅ नेहमी मराठीत उत्तर द्या
✅ उत्तर संक्षिप्त आणि स्पष्ट असू द्या (4-6 वाक्ये)
✅ Route links हायलाइट करा: /pooja, /panchang इ.
✅ Emoji वापरा — भक्तीपूर्ण आणि आनंदी स्वर
✅ User ने विचारलेल्या प्रश्नाचे थेट उत्तर द्या
✅ बुकिंगसाठी नेहमी /pooja कडे guide करा
✅ प्रत्येक उत्तराच्या शेवटी एक उपयुक्त tip द्या
❌ Admin panel बद्दल कधीही माहिती देऊ नका
❌ Off-topic प्रश्नांसाठी: "हे माझ्या कार्यक्षेत्रात नाही. पूजा, पंचांग किंवा सेवांबद्दल विचारा 🙏"
❌ Personal माहिती मागू नका`;
}

// ── Suggested follow-up questions ────────────────────────────
function getSuggestedReplies(userMessage, botReply) {
  const msg = userMessage.toLowerCase();
  if (msg.includes('सामग्री') || msg.includes('samagri') || msg.includes('सामान')) {
    return ['पुजारी सामग्री आणतो का?', 'यादी कुठे मिळेल?', 'WhatsApp वर यादी पाठवा'];
  }
  if (msg.includes('बुकिंग') || msg.includes('पूजा')) {
    return ['सामग्री कोण आणतो?', 'किंमत किती?', 'पुजारी कधी येतो?'];
  }
  if (msg.includes('पंचांग') || msg.includes('तिथी') || msg.includes('मुहूर्त')) {
    return ['राहुकाळ कधी आहे?', 'शुभ मुहूर्त कसे पाहावे?', 'आजचे नक्षत्र काय?'];
  }
  if (msg.includes('राशी') || msg.includes('भविष्य')) {
    return ['उद्याचे भविष्य पाहायचे आहे', 'कुंडली कुठे पाहावी?', 'मेष राशी भविष्य'];
  }
  if (msg.includes('ऑनलाइन') || msg.includes('video') || msg.includes('nri')) {
    return ['किंमत किती?', 'कोणत्या देशातून शक्य?', 'WhatsApp वर बोलायचे आहे'];
  }
  if (msg.includes('हॉल') || msg.includes('विवाह') || msg.includes('लग्न')) {
    return ['किती capacity?', 'Booking कशी करावी?', 'किंमत विचारायची आहे'];
  }
  // Default suggestions
  return ['पूजा बुकिंग कशी करावी?', 'WhatsApp वर संपर्क', 'किंमत विचारायची आहे'];
}

// ── POST /api/chat ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim())
      return res.status(400).json({ success: false, message: 'संदेश आवश्यक आहे.' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return res.status(500).json({ success: false, message: 'Chat सेवा उपलब्ध नाही.' });

    const systemPrompt = await buildSystemPrompt();

    const recentHistory = history.slice(-8); // keep last 8 messages for better context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentHistory,
      { role: 'user', content: message.trim() },
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        temperature: 0.45,
        max_tokens:  450,
        messages,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error('Groq error:', errData);
      return res.status(500).json({ success: false, message: 'AI सेवा उपलब्ध नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.' });
    }

    const data    = await response.json();
    const reply   = data.choices?.[0]?.message?.content?.trim() || 'माफ करा, उत्तर देता आले नाही.';
    const suggestions = getSuggestedReplies(message, reply);

    res.json({ success: true, data: { reply, suggestions } });
  } catch (err) {
    console.error('chat error:', err.message);
    res.status(500).json({ success: false, message: 'Chat सेवेत त्रुटी झाली.' });
  }
});

module.exports = router;
