// src/routes/tenantConfig.routes.js
// Tenant franchise configuration routes — admin only
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/tenantConfig.controller');
const { authenticate, authorize }  = require('../middleware/auth.middleware');
const { attachTenant }             = require('../middleware/tenant.middleware');
const { adminLimiter }             = require('../middleware/security.middleware');

// All routes: authenticated + tenant attached + admin/super_admin only
const guard = [adminLimiter, authenticate, attachTenant, authorize('admin', 'super_admin')];

// ── Features ───────────────────────────────────────────────────
router.get('/features',                     ...guard, ctrl.getTenantFeatures);

// ── Dashboard ──────────────────────────────────────────────────
router.get('/dashboard',                    ...guard, ctrl.getTenantDashboard);

// ── Puja Config ────────────────────────────────────────────────
router.get   ('/puja',                      ...guard, ctrl.getPujaConfig);
router.put   ('/puja/:poojaId',             ...guard, ctrl.upsertPujaConfig);
router.delete('/puja/:poojaId',             ...guard, ctrl.deletePujaConfig);

// ── Samagri Config ─────────────────────────────────────────────
router.get   ('/samagri/:poojaId',          ...guard, ctrl.getSamagriConfig);
router.put   ('/samagri/:poojaId',          ...guard, ctrl.saveSamagriConfig);
router.delete('/samagri/:poojaId',          ...guard, ctrl.resetSamagriConfig);

// ── Pujari Management ──────────────────────────────────────────
router.get   ('/pujaris',                   ...guard, ctrl.getTenantPujaris);
router.post  ('/pujaris/create',            ...guard, ctrl.createPujari);    // New pujari account
router.post  ('/pujaris',                   ...guard, ctrl.assignPujari);    // Assign existing
router.delete('/pujaris/:pujariId',         ...guard, ctrl.removePujari);

module.exports = router;
