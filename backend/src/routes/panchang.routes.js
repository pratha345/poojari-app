// src/routes/panchang.routes.js — पंचांग API मार्ग
'use strict';

const express = require('express');
const router  = express.Router();
const { getPanchang } = require('../services/panchangService');
const pool    = require('../config/db');

async function handlePanchang(req, res) {
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
}

// GET /api/panchang?date=YYYY-MM-DD (frontend uses this)
router.get('/', handlePanchang);

// GET /api/panchang/YYYY-MM-DD (tests use this)
router.get('/:date', (req, res) => {
  req.query.date = req.params.date;
  if (req.query.lat === undefined && req.params.lat) req.query.lat = req.params.lat;
  return handlePanchang(req, res);
});

// ── POST /api/panchang/rate ────────────────────────────────────
router.post('/rate', async (req, res) => {
  try {
    const { date, is_helpful, session_id } = req.body;
    if (!date || !session_id) return res.status(400).json({ success: false, message: 'date आणि session_id आवश्यक आहे.' });
    if (is_helpful === undefined) return res.status(400).json({ success: false, message: 'is_helpful आवश्यक आहे.' });

    await pool.query(
      `INSERT INTO panchang_ratings (panchang_date, session_id, is_helpful)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_helpful = VALUES(is_helpful)`,
      [date, session_id, is_helpful ? 1 : 0]
    );

    const [[counts]] = await pool.query(
      `SELECT
         SUM(is_helpful = 1) AS helpful,
         SUM(is_helpful = 0) AS not_helpful
       FROM panchang_ratings WHERE panchang_date = ?`,
      [date]
    );
    res.json({ success: true, data: { helpful: counts.helpful || 0, not_helpful: counts.not_helpful || 0 }, message: 'अभिप्राय नोंदवला. धन्यवाद! 🙏' });
  } catch (err) {
    console.error('panchang rate error:', err);
    res.status(500).json({ success: false, message: 'अभिप्राय देताना त्रुटी झाली.' });
  }
});

// ── GET /api/panchang/rating?date=YYYY-MM-DD ──────────────────
router.get('/rating', async (req, res) => {
  try {
    const { date, session_id } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date आवश्यक आहे.' });

    const [[counts]] = await pool.query(
      `SELECT SUM(is_helpful=1) AS helpful, SUM(is_helpful=0) AS not_helpful
       FROM panchang_ratings WHERE panchang_date = ?`, [date]
    );

    let user_vote = null;
    if (session_id) {
      const [[row]] = await pool.query(
        'SELECT is_helpful FROM panchang_ratings WHERE panchang_date=? AND session_id=?', [date, session_id]
      );
      if (row) user_vote = row.is_helpful === 1;
    }

    res.json({ success: true, data: { helpful: counts.helpful || 0, not_helpful: counts.not_helpful || 0, user_vote } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'माहिती मिळवताना त्रुटी झाली.' });
  }
});

module.exports = router;
