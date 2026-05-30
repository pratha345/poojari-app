'use strict';
// services/imageProcessor.service.js — Sharp-based image processing pipeline

const fs   = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (_) {
  console.warn('⚠️ sharp not available — image processing disabled');
}

const UPLOADS_DIR = path.join(__dirname, '../../uploads/festivals');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const THUMB_DIR = path.join(UPLOADS_DIR, 'thumbs');
fs.mkdirSync(THUMB_DIR, { recursive: true });

/**
 * Process a raw image buffer: convert to webp, resize, generate thumbnail.
 * @param {Buffer} buffer       Raw PNG/JPEG buffer from Stability AI
 * @param {string} filename     Base filename (without ext)
 * @param {string} themeType    'poster'|'banner'|'whatsapp' etc.
 * @returns {Promise<{webpFilename, thumbFilename, webpPath, thumbPath, size}>}
 */
async function processImage(buffer, filename, themeType = 'poster') {
  const baseName   = filename.replace(/\.(png|jpg|jpeg|webp)$/, '');
  const webpFile   = `${baseName}.webp`;
  const thumbFile  = `${baseName}-thumb.webp`;
  const webpPath   = path.join(UPLOADS_DIR, webpFile);
  const thumbPath  = path.join(THUMB_DIR,   thumbFile);

  if (!sharp) {
    // Fallback: save raw buffer as-is
    const rawFile = `${baseName}.png`;
    const rawPath = path.join(UPLOADS_DIR, rawFile);
    fs.writeFileSync(rawPath, buffer);
    return {
      webpFilename:  rawFile,
      thumbFilename: rawFile,
      webpPath:      rawPath,
      thumbPath:     rawPath,
      size:          buffer.length,
    };
  }

  // Resize dimensions per theme type
  const dims = getResizeDims(themeType);

  // Main webp — high quality
  await sharp(buffer)
    .resize(dims.width, dims.height, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, effort: 4 })
    .toFile(webpPath);

  // Thumbnail — 320px wide
  await sharp(buffer)
    .resize(320, null, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 70, effort: 2 })
    .toFile(thumbPath);

  const stats = fs.statSync(webpPath);

  console.log(`  🖼️  WebP: ${webpFile} (${Math.round(stats.size / 1024)}KB)`);
  console.log(`  🖼️  Thumb: ${thumbFile}`);

  return {
    webpFilename:  webpFile,
    thumbFilename: thumbFile,
    webpPath,
    thumbPath,
    size: stats.size,
  };
}

/**
 * Add watermark text to an image file.
 */
async function addWatermark(imagePath, text = '© Pojjari') {
  if (!sharp) return;
  const buf = await sharp(imagePath)
    .composite([{
      input: Buffer.from(`<svg><text x="10" y="30" fill="rgba(255,255,255,0.4)" font-size="18">${text}</text></svg>`),
      gravity: 'southeast',
    }])
    .toBuffer();
  fs.writeFileSync(imagePath, buf);
}

/**
 * Resize dimensions based on theme type.
 */
function getResizeDims(themeType) {
  const map = {
    'poster':           { width: 1080, height: 1620 },
    'banner':           { width: 1920, height: 1080 },
    'whatsapp':         { width: 1080, height: 1080 },
    'whatsapp-status':  { width: 1080, height: 1920 },
    'instagram':        { width: 1080, height: 1080 },
    'invitation':       { width: 1080, height: 1440 },
    'wallpaper':        { width: 1920, height: 1080 },
    'mobile':           { width: 1080, height: 1920 },
    'luxury':           { width: 1080, height: 1620 },
    'minimal':          { width: 1080, height: 1080 },
    'devotional':       { width: 1080, height: 1620 },
    'royal':            { width: 1080, height: 1620 },
  };
  return map[themeType?.toLowerCase()] || { width: 1080, height: 1080 };
}

/**
 * Check if a file exists and is a valid image (>5KB).
 */
function validateImageFile(filepath) {
  if (!fs.existsSync(filepath)) return false;
  const stats = fs.statSync(filepath);
  return stats.size > 5000;
}

/**
 * Delete old variant files for same slug+year+type to save disk space.
 */
function cleanupOldVariants(slug, year, type, keepFilename) {
  try {
    const prefix = `${slug}-${year}-${type}`;
    const files  = fs.readdirSync(UPLOADS_DIR).filter(
      f => f.startsWith(prefix) && f !== keepFilename && !f.includes('-thumb')
    );
    files.forEach(f => {
      try { fs.unlinkSync(path.join(UPLOADS_DIR, f)); } catch (_) {}
    });
    // Also clean thumbs
    const thumbFiles = fs.readdirSync(THUMB_DIR).filter(
      f => f.startsWith(prefix)
    );
    thumbFiles.forEach(f => {
      try { fs.unlinkSync(path.join(THUMB_DIR, f)); } catch (_) {}
    });
  } catch (_) {}
}

module.exports = { processImage, addWatermark, validateImageFile, cleanupOldVariants };
