// src/routes/kundali.routes.js — कुंडली मिलान API मार्ग
// Admin-only endpoints
'use strict';

const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/kundaliController');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All kundali routes require admin authentication
router.use(authenticate, authorize('admin'));

// POST  /api/kundali/match  — calculate without saving
router.post('/match',  ctrl.matchKundali);

// POST  /api/kundali/save   — calculate + save to DB
router.post('/save',   ctrl.saveKundali);

// GET   /api/kundali        — list saved matches
router.get('/',        ctrl.listKundali);

// GET   /api/kundali/:id    — get one saved match
router.get('/:id',     ctrl.getKundali);

// DELETE /api/kundali/:id   — delete a saved match
router.delete('/:id',  ctrl.deleteKundali);

module.exports = router;
