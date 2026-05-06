// src/routes/admin.routes.js
const router    = require('express').Router();
const ctrl      = require('../controllers/admin.controller');
const hallCtrl  = require('../controllers/hall.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');

// admin = tenant admin; super_admin also passes (authorize skips for super_admin)
const admin = [authenticate, attachTenant, authorize('admin')];

router.get('/stats',                       ...admin, ctrl.getStats);
router.get('/pujaris/pending',             ...admin, ctrl.getPendingPujaris);
router.get('/pujaris',                     ...admin, ctrl.getApprovedPujaris);
router.put('/pujaris/:id/respond',         ...admin, ctrl.respondToPujari);
router.get('/bookings',                    ...admin, ctrl.getAllBookings);
router.put('/bookings/:id/assign-pujari',  ...admin, ctrl.assignPujari);
router.put('/reviews/:id/approve',         ...admin, ctrl.approveReview);
router.get('/users',                       ...admin, ctrl.getAllUsers);

// ── Hall Management ────────────────────────────────────────────
router.get('/halls',         ...admin, hallCtrl.getAllHallsAdmin);
router.post('/halls',        ...admin, hallCtrl.createHall);
router.put('/halls/:id',     ...admin, hallCtrl.updateHall);
router.delete('/halls/:id',  ...admin, hallCtrl.deleteHall);

// ── Samagri Management ─────────────────────────────────────────
const samagriCtrl = require('../controllers/samagri.controller');
router.get('/samagri/:pooja_id',    ...admin, samagriCtrl.getByPooja);
router.post('/samagri',             ...admin, samagriCtrl.create);
router.put('/samagri/:id',          ...admin, samagriCtrl.update);
router.delete('/samagri/:id',       ...admin, samagriCtrl.remove);

// ── Janam Patrika ───────────────────────────────────────────────
const jpCtrl = require('../controllers/janamPatrika.controller');
router.post('/janam-patrika/generate', ...admin, jpCtrl.generate);
router.post('/janam-patrika/save',     ...admin, jpCtrl.save);
router.get('/janam-patrika',           ...admin, jpCtrl.getAll);
router.get('/janam-patrika/:id',       ...admin, jpCtrl.getById);
router.delete('/janam-patrika/:id',    ...admin, jpCtrl.remove);

module.exports = router;
