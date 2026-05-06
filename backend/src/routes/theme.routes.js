// src/routes/theme.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/themeController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const admin = [authenticate, authorize('admin')];

// Public
router.get('/',                     ctrl.getTheme);

// Admin
router.post('/admin',               ...admin, ctrl.updateTheme);
router.get('/admin/festivals',      ...admin, ctrl.getFestivalThemes);
router.post('/admin/festivals',     ...admin, ctrl.addFestivalTheme);
router.put('/admin/festivals/:id',  ...admin, ctrl.updateFestivalTheme);
router.delete('/admin/festivals/:id',...admin, ctrl.deleteFestivalTheme);

module.exports = router;
