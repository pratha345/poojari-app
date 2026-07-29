// src/routes/aarti.routes.js
const router      = require('express').Router();
const ctrl         = require('../controllers/aarti.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer       = require('multer');
const path         = require('path');
const fs           = require('fs');
const webpConvert  = require('../middleware/webpConvert.middleware');

// OCR photo upload — memory only, we never store the image, just read text out of it
const ocrUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },   // 8MB — phone photos
  fileFilter: (_, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

// Aarti featured-image upload — saved to disk, then converted to .webp by webpConvert
const aartiUploadDir = path.join(__dirname, '../../uploads/aarti');
if (!fs.existsSync(aartiUploadDir)) fs.mkdirSync(aartiUploadDir, { recursive: true });

const imgStorage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, aartiUploadDir),
  filename:    (_, file, cb) => cb(null, `aarti-${Date.now()}${path.extname(file.originalname)}`),
});
const imgUpload = multer({
  storage: imgStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

const admin      = [authenticate, authorize('admin')];
const aartiEditor = [authenticate, authorize('admin', 'abhyasak')];

// ── Public routes ─────────────────────────────────────────────
router.get('/',             ctrl.list);
router.get('/categories',   ctrl.categories);
router.get('/recommended',  ctrl.recommended);   // MUST stay above /:slug
router.get('/:slug',        ctrl.getBySlug);

// ── Admin routes ──────────────────────────────────────────────
router.get   ('/admin/all',         ...aartiEditor, ctrl.adminList);
router.post  ('/admin/ocr',         ...aartiEditor, ocrUpload.single('image'), ctrl.ocrExtract);
router.post  ('/admin/clean-text',  ...aartiEditor, ctrl.textExtract);
router.post  ('/admin',             ...aartiEditor, imgUpload.single('image'), webpConvert, ctrl.create);
router.put   ('/admin/:id',         ...aartiEditor, imgUpload.single('image'), webpConvert, ctrl.update);
router.patch ('/admin/:id/image',   ...aartiEditor, imgUpload.single('image'), webpConvert, ctrl.updateImage);
router.patch ('/admin/:id/publish', ...aartiEditor, ctrl.togglePublish);
router.patch ('/admin/:id/featured', ...aartiEditor, ctrl.toggleFeatured);
router.delete('/admin/:id',         ...admin,       ctrl.remove);

module.exports = router;
