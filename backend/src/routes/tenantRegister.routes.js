// src/routes/tenantRegister.routes.js — Public registration (no auth)
const router = require('express').Router();
const ctrl   = require('../controllers/tenantRegister.controller');

// Public — no authentication required
router.post('/register-tenant', ctrl.registerTenant);

module.exports = router;
