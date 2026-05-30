// src/routes/blog.routes.js
const router      = require('express').Router();
const ctrl        = require('../controllers/blog.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');
const webpConvert = require('../middleware/webpConvert.middleware');

// Blog image upload storage
const blogUploadDir = path.join(__dirname, '../../uploads/blog');
if (!fs.existsSync(blogUploadDir)) fs.mkdirSync(blogUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, blogUploadDir),
  filename:    (_, file, cb) => cb(null, `blog-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const admin         = [authenticate, authorize('admin')];
const blogEditor    = [authenticate, authorize('admin', 'abhyasak')];

// ── Public routes ─────────────────────────────────────────────
router.get ('/',              ctrl.list);
router.get ('/categories',    ctrl.categories);
router.post('/:slug/rate',    ctrl.rateBlog);
router.get ('/:slug',         ctrl.getBySlug);

// ── Admin/Abhyasak routes ─────────────────────────────────────
router.get   ('/admin/all',         ...blogEditor, ctrl.adminList);
router.post  ('/admin',             ...blogEditor, upload.single('image'), webpConvert, ctrl.create);
router.put   ('/admin/:id',         ...blogEditor, upload.single('image'), webpConvert, ctrl.update);
router.patch ('/admin/:id/publish', ...blogEditor, ctrl.togglePublish);
router.delete('/admin/:id',         ...admin,      ctrl.remove);

module.exports = router;
