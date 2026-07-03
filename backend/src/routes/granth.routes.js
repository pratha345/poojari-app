// src/routes/granth.routes.js — Granth Library routes
const router  = require('express').Router();
const ctrl    = require('../controllers/granth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');

const admin = [authenticate, authorize('admin', 'super_admin')];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/granths');
    require('fs').mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uid = crypto.randomBytes(8).toString('hex');
    cb(null, `granth_${uid}.pdf`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('फक्त PDF files upload करता येतात.'));
  },
});

router.post  ('/',              ...admin, upload.single('pdf'), ctrl.uploadGranth);
router.get   ('/',              ...admin, ctrl.listGranths);
router.get   ('/:id/status',   ...admin, ctrl.getStatus);
router.post  ('/:id/ask',      ...admin, ctrl.ask);
router.post  ('/:id/restart',  ...admin, ctrl.restartOCR);
router.delete('/:id',          ...admin, ctrl.deleteGranth);

module.exports = router;
