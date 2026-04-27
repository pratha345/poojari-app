// src/routes/home.routes.js
'use strict';

const router  = require('express').Router();
const ctrl    = require('../controllers/homeController');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload  = require('../middleware/upload.middleware');

// ── Public ────────────────────────────────────────────────────
router.get('/', ctrl.getHome);

// ── Admin only ────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin'),
  upload.single('hero_image'),
  ctrl.upsertHome
);

router.post(
  '/slider',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  ctrl.addSlider
);

router.delete(
  '/slider/:id',
  authenticate,
  authorize('admin'),
  ctrl.deleteSlider
);

router.patch(
  '/slider/:id/toggle',
  authenticate,
  authorize('admin'),
  ctrl.toggleSlider
);

module.exports = router;
