'use strict';
// stabilityService.js — Stability AI image generation (production-ready)

const fs   = require('fs');
const path = require('path');
const { slugify, festivalFilename } = require('../utils/slugify');
const { generatePrompt, getAspectRatio } = require('./promptGenerator.service');
const { processImage, validateImageFile } = require('./imageProcessor.service');

const STABILITY_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';
const SAVE_DIR      = path.join(__dirname, '../../uploads/festivals');

fs.mkdirSync(SAVE_DIR, { recursive: true });

// ── Main generate function ─────────────────────────────────────
/**
 * Generate a single festival image.
 * @param {string} festivalName
 * @param {string} [type]     - 'poster'|'banner'|'whatsapp'|'instagram'|'invitation'|...
 * @param {string} [style]    - 'realistic'|'luxury-gold'|'cinematic'|...
 * @param {number} [variant]  - 1|2|3 for multi-image variation
 * @param {function} [onProgress] - (msg: string) => void
 */
async function generateFestivalImage(
  festivalName,
  type    = 'poster',
  style   = 'realistic',
  variant = 1,
  onProgress = null
) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) throw new Error('STABILITY_API_KEY env मध्ये set नाही.');

  const slug       = slugify(festivalName);
  const year       = new Date().getFullYear();
  const ts         = Date.now();
  const baseFile   = `${slug}-${year}-${type}-v${variant}-${ts}`;

  const promptData = generatePrompt({ festivalName, themeType: type, style, variant });
  const aspect     = getAspectRatio(type);

  const emit = (msg) => { if (onProgress) onProgress(msg); };

  console.log(`\n🎨 Generating [${type}] v${variant} for: ${festivalName} (${slug})`);
  console.log(`📝 Prompt: ${promptData.positivePrompt.substring(0, 120)}...`);
  console.log(`📐 Aspect: ${aspect}`);

  emit(`Stability AI ला request पाठवत आहे... (${type} v${variant})`);

  const fd = new FormData();
  fd.append('prompt',          promptData.positivePrompt);
  fd.append('negative_prompt', promptData.negativePrompt);
  fd.append('output_format',   'png');
  fd.append('aspect_ratio',    aspect);

  let lastErr;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`  Attempt ${attempt}/3...`);
      emit(`Attempt ${attempt}/3 — image generate होत आहे...`);

      const res = await fetch(STABILITY_URL, {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept':        'image/*',
        },
        body:   fd,
        signal: AbortSignal.timeout(120000),
      });

      const contentType = res.headers.get('content-type') || '';
      console.log(`  Response: ${res.status} | Content-Type: ${contentType}`);

      if (!res.ok) {
        const errBody = await res.text();
        console.error(`  ❌ API Error ${res.status}:`, errBody.substring(0, 300));

        // Parse JSON error for frontend toast
        let errMsg = `Stability AI ${res.status}`;
        try {
          const parsed = JSON.parse(errBody);
          errMsg = parsed.errors?.[0] || parsed.message || errMsg;
        } catch (_) {
          errMsg = errBody.substring(0, 200) || errMsg;
        }
        throw new Error(errMsg);
      }

      if (!contentType.startsWith('image/')) {
        const body = await res.text();
        console.error(`  ❌ Expected image, got ${contentType}:`, body.substring(0, 300));
        throw new Error(`API ने image नाही, ${contentType} दिले — ${body.substring(0, 100)}`);
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      console.log(`  ✅ Received ${buffer.length} bytes`);

      if (buffer.length < 5000) {
        throw new Error(`Response खूप लहान (${buffer.length} bytes) — API error असू शकतो`);
      }

      emit(`Image मिळाली (${Math.round(buffer.length / 1024)}KB) — processing...`);

      // Process: convert to webp + generate thumbnail
      const processed = await processImage(buffer, baseFile, type);

      const publicUrl  = `/uploads/festivals/${processed.webpFilename}`;
      const thumbUrl   = `/uploads/festivals/thumbs/${processed.thumbFilename}`;

      console.log(`  💾 Saved: ${processed.webpPath}`);
      console.log(`  🖼️  Thumb: ${processed.thumbPath}`);
      console.log(`  📏 Size: ${Math.round(processed.size / 1024)}KB`);
      console.log(`  🔗 URL: ${publicUrl}`);

      emit(`✅ Image तयार झाली! (${Math.round(processed.size / 1024)}KB)`);

      return {
        filename:    processed.webpFilename,
        thumb_url:   thumbUrl,
        image_url:   publicUrl,
        prompt:      promptData.positivePrompt,
        type,
        style,
        variant,
        size:        processed.size,
        colors:      promptData.colors,
        mood:        promptData.mood,
        slug,
        festivalName,
      };

    } catch (err) {
      lastErr = err;
      console.error(`  ❌ Attempt ${attempt} failed:`, err.message);
      emit(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt < 3) {
        const wait = attempt * 3000;
        emit(`${wait / 1000}s मध्ये retry करत आहे...`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }

  throw lastErr;
}

/**
 * Generate multiple variations (1-3) of the same festival image.
 * Emits progress via onProgress callback.
 */
async function generateMultipleImages(
  festivalName,
  type      = 'poster',
  style     = 'realistic',
  count     = 3,
  onProgress = null
) {
  const results  = [];
  const errors   = [];

  for (let v = 1; v <= count; v++) {
    try {
      const result = await generateFestivalImage(festivalName, type, style, v, onProgress);
      results.push(result);
    } catch (err) {
      errors.push({ variant: v, error: err.message });
      console.error(`  ❌ Variant ${v} failed:`, err.message);
    }
    // Small delay between generations to respect API rate limits
    if (v < count) await new Promise(r => setTimeout(r, 1500));
  }

  return { results, errors };
}

module.exports = { generateFestivalImage, generateMultipleImages };
