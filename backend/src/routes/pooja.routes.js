// src/routes/pooja.routes.js
const router      = require('express').Router();
const ctrl        = require('../controllers/pooja.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer      = require('multer');
const path        = require('path');
const webpConvert = require('../middleware/webpConvert.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, `pooja-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/categories',       ctrl.getCategories);
router.get('/',                 ctrl.getPoojas);
router.get('/price/:id',        ctrl.getPoojaPrice);   // ?pujari_id= — price for this site / pujari
router.get('/:slug',            ctrl.getPoojaBySlug);

// Admin only — webpConvert runs after multer, before controller
router.post('/',      authenticate, authorize('admin'), ctrl.mainSiteOnly, upload.single('image'), webpConvert, ctrl.createPooja);
router.put('/:id',    authenticate, authorize('admin'), ctrl.mainSiteOnly, upload.single('image'), webpConvert, ctrl.updatePooja);
router.delete('/:id', authenticate, authorize('admin'), ctrl.mainSiteOnly, ctrl.deletePooja);

module.exports = router;
