// src/routes/booking.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/booking.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/',                  authenticate, ctrl.createBooking);
router.get('/my',                 authenticate, ctrl.getMyBookings);
router.get('/:code',              authenticate, ctrl.getBookingByCode);
router.put('/:id/cancel',         authenticate, ctrl.cancelBooking);
router.post('/review',            authenticate, ctrl.submitReview);
router.post('/payment/create',    authenticate, ctrl.createPaymentOrder);
router.post('/payment/verify',    authenticate, ctrl.verifyPayment);

module.exports = router;

// ─────────────────────────────────────────────────────────────
// NOTE: Save the following as separate files:
// src/routes/admin.routes.js
// src/routes/contact.routes.js
// ─────────────────────────────────────────────────────────────
