const router             = require('express').Router();
const { getHalls, getNearbyHalls, getPlacesNearbyHalls } = require('../controllers/hall.controller');

router.get('/places-nearby', getPlacesNearbyHalls);
router.get('/nearby',        getNearbyHalls);
router.get('/',              getHalls);

module.exports = router;
