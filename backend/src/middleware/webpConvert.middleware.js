// webpConvert.middleware.js
// Converts any uploaded JPG/PNG/GIF to WebP (quality 82) using sharp.
// Runs AFTER multer — mutates req.file / req.files in-place so
// controllers see the updated path/filename without any changes.
// Graceful degradation: if sharp fails the original file is kept.

'use strict';

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif']);

async function convertToWebP(file) {
  // Skip: already WebP, not a raster image, or no disk path (memoryStorage)
  if (!file || !file.path || !IMAGE_MIMES.has(file.mimetype)) return;

  const dir      = path.dirname(file.path);
  const base     = path.basename(file.path, path.extname(file.path));
  const webpPath = path.join(dir, `${base}.webp`);

  await sharp(file.path)
    .webp({ quality: 82, effort: 4 })   // 82% quality = best size/quality ratio
    .toFile(webpPath);

  // Delete original (JPG/PNG)
  try { fs.unlinkSync(file.path); } catch { /* already gone — safe to ignore */ }

  // Mutate file object so controllers receive correct path/filename
  file.path         = webpPath;
  file.filename     = `${base}.webp`;
  file.originalname = path.basename(file.originalname, path.extname(file.originalname)) + '.webp';
  file.mimetype     = 'image/webp';
  try { file.size = fs.statSync(webpPath).size; } catch { /* non-critical */ }
}

module.exports = async function webpConvert(req, _res, next) {
  try {
    // Single file upload
    if (req.file) await convertToWebP(req.file);

    // Multiple files (array or fields object)
    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();
      await Promise.all(files.map(convertToWebP));
    }
  } catch (err) {
    // Never block the upload — just log and continue with original
    console.error('[webpConvert] conversion failed, using original:', err.message);
  }
  next();
};
