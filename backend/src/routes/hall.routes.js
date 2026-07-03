const router             = require('express').Router();
const { getHalls, getNearbyHalls, getPlacesNearbyHalls, createHall, updateHall, deleteHall, getAllHallsAdmin } = require('../controllers/hall.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const admin = [authenticate, authorize('admin', 'super_admin')];

router.get('/places-nearby', getPlacesNearbyHalls);
router.get('/nearby',        getNearbyHalls);
router.get('/',              getHalls);
router.post('/',             ...admin, createHall);
router.put('/:id',           ...admin, updateHall);
router.delete('/:id',        ...admin, deleteHall);

module.exports = router;
