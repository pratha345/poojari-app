// src/routes/admin.routes.js
const router    = require('express').Router();
const ctrl      = require('../controllers/admin.controller');
const hallCtrl  = require('../controllers/hall.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');
const { checkPlanExpiry } = require('../middleware/planExpiry.middleware');

// admin = tenant admin; super_admin also passes (authorize skips for super_admin)
const admin = [authenticate, attachTenant, checkPlanExpiry, authorize('admin')];

// ── Push Notifications ─────────────────────────────────────────
const pushService = require('../services/pushService');
router.get('/push/vapid-key', ...admin, (req, res) => {
  res.json({ success: true, data: { publicKey: process.env.VAPID_PUBLIC_KEY } });
});
router.post('/push/subscribe', ...admin, async (req, res) => {
  try {
    await pushService.saveSubscription(req.user.id, req.tenantId || req.user.tenant_id, req.body);
    res.json({ success: true, message: 'Subscription saved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Subscription save failed.' });
  }
});

router.get('/stats',                       ...admin, ctrl.getStats);
router.get('/report',                      ...admin, ctrl.getReport);
router.get('/pujaris/pending',             ...admin, ctrl.getPendingPujaris);
router.get('/pujaris',                     ...admin, ctrl.getApprovedPujaris);
router.put('/pujaris/:id/respond',         ...admin, ctrl.respondToPujari);
router.put('/pujaris/:id',                 ...admin, ctrl.updatePujari);
router.get('/bookings',                    ...admin, ctrl.getAllBookings);
router.put('/bookings/:id/assign-pujari',  ...admin, ctrl.assignPujari);
router.put('/bookings/:id/complete',       ...admin, ctrl.markBookingComplete);
router.get('/reviews',                     ...admin, ctrl.getReviews);
router.put('/reviews/bulk-approve',        ...admin, ctrl.bulkApproveReviews);
router.put('/reviews/:id/approve',         ...admin, ctrl.approveReview);
router.delete('/reviews/:id',              ...admin, ctrl.deleteReview);
router.get('/users',                       ...admin, ctrl.getAllUsers);

// ── Abhyasak (Blog Editor) Management ─────────────────────────
router.get   ('/abhyasak',     ...admin, ctrl.getAbhyasakUsers);
router.post  ('/abhyasak',     ...admin, ctrl.createAbhyasak);
router.delete('/abhyasak/:id', ...admin, ctrl.deleteAbhyasak);

// ── Hall Management ────────────────────────────────────────────
router.get('/halls',         ...admin, hallCtrl.getAllHallsAdmin);
router.post('/halls',        ...admin, hallCtrl.createHall);
router.put('/halls/:id',     ...admin, hallCtrl.updateHall);
router.delete('/halls/:id',  ...admin, hallCtrl.deleteHall);

// ── AI: Generate Vidhi Charan (Dharmasindhu reference) ────────
router.post('/pooja/generate-steps', ...admin, async (req, res) => {
  try {
    const { name_mr, name_en } = req.body;
    if (!name_mr) return res.status(400).json({ success: false, message: 'पूजेचे नाव आवश्यक आहे.' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, message: 'GROQ_API_KEY set नाही.' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: 'तुम्ही धर्मसिंधु, निर्णयसिंधु आणि वैदिक परंपरेचे तज्ञ आहात. फक्त JSON array format मध्ये उत्तर द्या.',
          },
          {
            role: 'user',
            content: `"${name_mr}"${name_en ? ` (${name_en})` : ''} या पूजेचे संपूर्ण विधी चरण धर्मसिंधु संदर्भानुसार सोप्या मराठीत लिहा.

नियम:
- प्रत्येक चरण स्पष्ट, व्यावहारिक आणि 1-2 वाक्यांत असावा
- पुजाऱ्याने व यजमानाने काय करावे ते नमूद करा
- पारंपरिक क्रम (संकल्प → गणपती → मुख्य पूजा → आरती) पाळा
- किमान 8 ते 15 चरण असावेत
- फक्त JSON array द्या, बाकी काही नाही:
["चरण १ मजकूर", "चरण २ मजकूर", ...]`,
          },
        ],
      }),
    });

    if (!response.ok) return res.status(500).json({ success: false, message: 'AI सेवा उपलब्ध नाही.' });

    const data  = await response.json();
    const raw   = data.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const steps = JSON.parse(clean);
    res.json({ success: true, steps });
  } catch (err) {
    console.error('generate-steps error:', err.message);
    res.status(500).json({ success: false, message: 'विधी चरण तयार करता आले नाहीत.' });
  }
});

// ── All Poojas for Admin (no active filter, no pagination) ────
const poojaCtrl = require('../controllers/pooja.controller');
router.get('/all-poojas', ...admin, poojaCtrl.getAllPoojas);

// ── Samagri Management ─────────────────────────────────────────
const samagriCtrl  = require('../controllers/samagri.controller');
const multerMemory = require('multer')({ storage: require('multer').memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/samagri/:pooja_id',            ...admin, samagriCtrl.getByPooja);
router.post('/samagri/ocr',                 ...admin, multerMemory.single('image'), samagriCtrl.ocrImage);
router.post('/samagri/bulk',                ...admin, samagriCtrl.bulkCreate);
router.post('/samagri',                     ...admin, samagriCtrl.create);
router.put('/samagri/reorder',             ...admin, samagriCtrl.reorder);
router.put('/samagri/:id',                  ...admin, samagriCtrl.update);
router.delete('/samagri/pooja/:pooja_id',  ...admin, samagriCtrl.deleteAllByPooja);
router.delete('/samagri/:id',              ...admin, samagriCtrl.remove);

// ── Janam Patrika ───────────────────────────────────────────────
const jpCtrl = require('../controllers/janamPatrika.controller');
router.post('/janam-patrika/generate', ...admin, jpCtrl.generate);
router.post('/janam-patrika/save',     ...admin, jpCtrl.save);
router.get('/janam-patrika',           ...admin, jpCtrl.getAll);
router.get('/janam-patrika/:id',       ...admin, jpCtrl.getById);
router.delete('/janam-patrika/:id',    ...admin, jpCtrl.remove);

module.exports = router;
