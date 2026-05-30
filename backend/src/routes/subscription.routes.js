// src/routes/subscription.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { attachTenant } = require('../middleware/tenant.middleware');

const auth = [authenticate, attachTenant];

const { superAdminOnly } = require('../middleware/auth.middleware');

// Tenant admin only
router.get ('/plans',          ...auth, authorize('admin'), ctrl.getPlans);
router.post('/create-order',   ...auth, authorize('admin'), ctrl.createOrder);
router.post('/verify',         ...auth, authorize('admin'), ctrl.verifyPayment);
router.post('/request',        ...auth, authorize('admin'), ctrl.submitRequest);

// Super admin only
router.get ('/plan-requests',          authenticate, superAdminOnly, ctrl.getPlanRequests);
router.put ('/plan-requests/:id/approve', authenticate, superAdminOnly, ctrl.approveRequest);

module.exports = router;
