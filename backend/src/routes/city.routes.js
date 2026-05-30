// src/routes/city.routes.js
const router = require('express').Router();
const ctrl   = require('../controllers/city.controller');

router.get('/',          ctrl.list);
router.get('/by-state',  ctrl.byState);
router.get('/:slug',     ctrl.getCity);

module.exports = router;
