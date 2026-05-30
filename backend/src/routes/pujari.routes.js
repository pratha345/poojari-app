// src/routes/pujari.routes.js
const router      = require('express').Router();
const ctrl        = require('../controllers/pujari.controller');
const { authenticate } = require('../middleware/auth.middleware');
const multer      = require('multer');
const path        = require('path');
const webpConvert = require('../middleware/webpConvert.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, `pujari-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
]);

router.post('/register',           authenticate, upload,                                  webpConvert, ctrl.register);
router.get('/profile',             authenticate, ctrl.getMyProfile);
router.put('/profile',             authenticate, multer({ storage }).single('photo'),    webpConvert, ctrl.updateProfile);
router.post('/availability',       authenticate, ctrl.setAvailability);
router.get('/my-services',         authenticate, ctrl.getMyPoojaServices);
router.post('/my-services',        authenticate, ctrl.saveMyPoojaServices);
router.get('/bookings',            authenticate, ctrl.getMyBookings);
router.put('/bookings/:id/respond',authenticate, ctrl.respondToBooking);
router.get('/nearby',              ctrl.getNearbyPujaris);
router.post('/geocode-all',        authenticate, async (req, res) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin')
    return res.status(403).json({ success: false, message: 'Access denied' });
  ctrl.geocodeAllPujaris(); // fire-and-forget
  res.json({ success: true, message: 'Geocoding started in background.' });
});
router.get('/top-reviews',         ctrl.getTopReviews);
router.get('/:id/reviews',         ctrl.getPublicReviews);
router.get('/:id',                 ctrl.getPublicProfile);

module.exports = router;
