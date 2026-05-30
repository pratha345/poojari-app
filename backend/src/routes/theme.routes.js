'use strict';
// src/routes/theme.routes.js

const router = require('express').Router();
const ctrl   = require('../controllers/themeController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const admin = [authenticate, authorize('admin')];

// Public
router.get('/', ctrl.getTheme);

// Admin — theme settings
router.post('/admin', ...admin, ctrl.updateTheme);

// Admin — festival management
router.get('/admin/festivals',                          ...admin, ctrl.getFestivalThemes);
router.post('/admin/festivals/auto-update',             ...admin, ctrl.autoUpdateFestivals);
router.post('/admin/festivals/:id/upload-image',        ...admin, ctrl.festivalImageUpload, ctrl.uploadFestivalImage);
router.post('/admin/festivals/:id/generate',            ...admin, ctrl.generateFestivalThemeImage);
router.post('/admin/festivals/:id/generate-multi',      ...admin, ctrl.generateMultipleThemeImages);
router.post('/admin/festivals/:id/whatsapp-caption',    ...admin, ctrl.getWhatsAppCaption);
router.post('/admin/festivals',                         ...admin, ctrl.addFestivalTheme);
router.put('/admin/festivals/:id',                      ...admin, ctrl.updateFestivalTheme);
router.delete('/admin/festivals/:id',                   ...admin, ctrl.deleteFestivalTheme);

module.exports = router;
