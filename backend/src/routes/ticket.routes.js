// src/routes/ticket.routes.js
'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/ticket.controller');
const { authenticate } = require('../middleware/auth.middleware');

const isAdmin = (req, res, next) => {
  if (req.user?.role === 'admin' || req.user?.role === 'super_admin') return next();
  return res.status(403).json({ success: false, message: 'Access denied' });
};

// User routes — POST is public (guests can submit tickets without login)
router.post('/',              ctrl.createTicket);
router.get('/my',             authenticate, ctrl.getMyTickets);
router.get('/open-count',     authenticate, ctrl.getOpenCount);
router.get('/:id',            authenticate, ctrl.getTicket);
router.post('/:id/reply',     authenticate, ctrl.userReply);

// Admin routes
router.get('/',               authenticate, isAdmin, ctrl.adminGetAll);
router.post('/:id/admin-reply', authenticate, isAdmin, ctrl.adminReply);
router.put('/:id/assign',     authenticate, isAdmin, ctrl.assignTicket);
router.put('/:id/status',     authenticate, isAdmin, ctrl.updateStatus);
router.get('/admins/list',    authenticate, isAdmin, ctrl.getAdmins);

module.exports = router;
