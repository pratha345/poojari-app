// src/routes/superadmin.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/superadmin.controller');
const { authenticate, superAdminOnly } = require('../middleware/auth.middleware');

const guard = [authenticate, superAdminOnly];

router.get('/stats',                  ...guard, ctrl.getStats);
router.get('/tenants',                ...guard, ctrl.getTenants);
router.get('/tenants/:id',            ...guard, ctrl.getTenant);
router.post('/tenants',               ...guard, ctrl.createTenant);
router.put('/tenants/:id',            ...guard, ctrl.updateTenant);
router.patch('/tenants/:id/plan',     ...guard, ctrl.updatePlan);
router.delete('/tenants/:id',         ...guard, ctrl.deleteTenant);
router.get('/tenants/:id/stats',      ...guard, ctrl.getTenantStats);
router.get('/tenants/:id/pricing-policy', ...guard, ctrl.getPricingPolicy);
router.put('/tenants/:id/pricing-policy', ...guard, ctrl.updatePricingPolicy);
router.get('/users',                  ...guard, ctrl.getAllUsers);
router.get('/revenue',                ...guard, ctrl.getRevenueReport);

module.exports = router;
