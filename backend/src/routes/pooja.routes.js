// src/routes/pooja.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/pooja.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');
const path   = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) =>
    cb(null, `pooja-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/categories',       ctrl.getCategories);
router.get('/',                 ctrl.getPoojas);
router.get('/:slug',            ctrl.getPoojaBySlug);

// Admin only
router.post('/',      authenticate, authorize('admin'), upload.single('image'), ctrl.createPooja);
router.put('/:id',    authenticate, authorize('admin'), upload.single('image'), ctrl.updatePooja);
router.delete('/:id', authenticate, authorize('admin'), ctrl.deletePooja);

module.exports = router;
