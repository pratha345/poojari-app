// src/routes/admin.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const admin = [authenticate, authorize('admin')];

router.get('/stats',                        ...admin, ctrl.getStats);
router.get('/pujaris/pending',              ...admin, ctrl.getPendingPujaris);
router.put('/pujaris/:id/respond',          ...admin, ctrl.respondToPujari);
router.get('/bookings',                     ...admin, ctrl.getAllBookings);
router.put('/bookings/:id/assign-pujari',   ...admin, ctrl.assignPujari);
router.put('/reviews/:id/approve',          ...admin, ctrl.approveReview);
router.get('/users',                        ...admin, ctrl.getAllUsers);

module.exports = router;
