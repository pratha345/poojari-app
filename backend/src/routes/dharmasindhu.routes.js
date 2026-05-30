// src/routes/dharmasindhu.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/dharmasindhu.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const admin = [authenticate, authorize('admin', 'super_admin')];

router.get ('/status',      ...admin, ctrl.getStatus);  // OCR progress
router.get ('/stats',       ...admin, ctrl.getStats);   // Summary stats
router.post('/ask',         ...admin, ctrl.ask);         // AI Q&A — main feature
router.get ('/search',      ...admin, ctrl.search);      // Raw keyword search
router.get ('/page/:page_no', ...admin, ctrl.getPage);  // Single page content

module.exports = router;
