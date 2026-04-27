// src/routes/panchang.routes.js — पंचांग API मार्ग
'use strict';

const express = require('express');
const router  = express.Router();
const { getPanchang } = require('../services/panchangService');

/**
 * GET /api/panchang
 * Query params:
 *   date  - YYYY-MM-DD  (default: today)
 *   time  - HH:MM local time (optional; defaults to sunrise epoch)
 *   lat   - latitude    (default: 18.52 — Pune)
 *   lon   - longitude   (default: 73.86 — Pune)
 *   tz    - timezone offset in minutes (default: 330 — IST UTC+5:30)
 */
router.get('/', async (req, res) => {
  try {
    let { date, time, lat, lon, tz } = req.query;

    // Default to today (IST)
    if (!date) {
      const now = new Date();
      // Convert to IST
      const ist = new Date(now.getTime() + 330 * 60000);
      date = ist.toISOString().split('T')[0];
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'अवैध तारीख स्वरूप. YYYY-MM-DD वापरा.',
      });
    }

    // Validate time format (HH:MM) if provided
    const finalTime = (time && /^\d{2}:\d{2}$/.test(time)) ? time : null;

    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);
    const tzOffset  = parseInt(tz) || 330;

    // Validate lat/lon
    if (lat && (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90)) {
      return res.status(400).json({ success: false, message: 'अवैध अक्षांश (latitude).' });
    }
    if (lon && (isNaN(parsedLon) || parsedLon < -180 || parsedLon > 180)) {
      return res.status(400).json({ success: false, message: 'अवैध रेखांश (longitude).' });
    }

    const finalLat = isNaN(parsedLat) ? 18.5204 : parsedLat;
    const finalLon = isNaN(parsedLon) ? 73.8567 : parsedLon;

    const data = await getPanchang(date, finalLat, finalLon, tzOffset, finalTime);

    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Panchang error:', err);
    res.status(500).json({
      success: false,
      message: 'पंचांग माहिती मिळवण्यात त्रुटी झाली. कृपया पुन्हा प्रयत्न करा.',
    });
  }
});

module.exports = router;
