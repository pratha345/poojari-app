// src/config/multer.js
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads directories exist
['uploads', 'uploads/poojas', 'uploads/pujari'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route-based sub-folder selection
    let folder = 'uploads';
    if (req.baseUrl && req.baseUrl.includes('/poojas')) folder = 'uploads/poojas';
    else if (req.baseUrl && req.baseUrl.includes('/pujari'))  folder = 'uploads/pujari';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|pdf/;
  const ext  = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('केवळ image (JPG/PNG/WebP) आणि PDF files मंजूर आहेत.'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});
