'use strict';
// routes/gallery.routes.js

const router = require('express').Router();
const ctrl   = require('../controllers/galleryController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const admin = [authenticate, authorize('admin')];

// Public
router.get('/',                      ctrl.getGallery);
router.get('/stats',                 ...admin, ctrl.getGalleryStats);
router.get('/admin',                 ...admin, ctrl.getAdminGallery);
router.get('/:id',                   ctrl.getGalleryItem);

// Admin
router.patch('/:id/select',          ...admin, ctrl.selectImage);
router.patch('/:id/publish',         ...admin, ctrl.togglePublish);
router.delete('/festival/:slug',     ...admin, ctrl.deleteByFestival);
router.delete('/:id',                ...admin, ctrl.deleteGalleryItem);

module.exports = router;
