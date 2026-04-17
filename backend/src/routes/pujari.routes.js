// src/routes/pujari.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/pujari.controller');
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const path   = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, `pujari-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
]);

router.post('/register',           authenticate, upload, ctrl.register);
router.get('/profile',             authenticate, ctrl.getMyProfile);
router.put('/profile',             authenticate, multer({ storage }).single('photo'), ctrl.updateProfile);
router.post('/availability',       authenticate, ctrl.setAvailability);
router.get('/bookings',            authenticate, ctrl.getMyBookings);
router.put('/bookings/:id/respond',authenticate, ctrl.respondToBooking);
router.get('/:id',                 ctrl.getPublicProfile);

module.exports = router;
