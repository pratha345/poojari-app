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

// GET /api/panchang/chakra?start=<ISO>&hours=96&step=30&lat=&lon=
// Sidereal longitudes (Lahiri) of the nine grahas and the lagna, sampled every `step`
// minutes from `start` — feeds the Rashi Chakra wheel, which interpolates between samples.
const gochar = require('../services/gocharService');
const CHAKRA_KEYS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
router.get('/chakra', (req, res) => {
  const start = Date.parse(req.query.start || new Date().toISOString());
  const hours = Math.min(240, Math.max(1, parseInt(req.query.hours) || 96));
  const step  = Math.min(240, Math.max(10, parseInt(req.query.step) || 30));
  const lat   = parseFloat(req.query.lat ?? 18.5204);
  const lon   = parseFloat(req.query.lon ?? 73.8567);
  if (!Number.isFinite(start) || start < Date.UTC(1900, 0) || start > Date.UTC(2100, 0))
    return res.status(400).json({ success: false, message: 'अवैध वेळ.' });
  if (!(lat >= -66 && lat <= 66) || !(lon >= -180 && lon <= 180))
    return res.status(400).json({ success: false, message: 'अवैध स्थान.' });
  const samples = [];
  for (let m = 0; m <= hours * 60; m += step) {
    const d = new Date(start + m * 60000);
    const row = { t: d.getTime(), lagna: +gochar.lagnaLon(d, lat, lon).toFixed(4) };
    for (const k of CHAKRA_KEYS) row[k] = +gochar.siderealLon(k, d).toFixed(4);
    samples.push(row);
  }
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ success: true, data: { step, samples } });
});

// GET /api/panchang/days?start=YYYY-MM-DD&days=42&lat=&lon=
// The sunrise panchang of consecutive days (मासिक calendar): tithi at sunrise, Moon–Sun
// elongation for the phase picture, maas, nakshatra and festivals. One call per month grid.
router.get('/days', async (req, res) => {
  try {
    const start = String(req.query.start || '');
    const days  = Math.min(45, Math.max(1, parseInt(req.query.days) || 42));
    const lat   = parseFloat(req.query.lat ?? 18.5204);
    const lon   = parseFloat(req.query.lon ?? 73.8567);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(start)))
      return res.status(400).json({ success: false, message: 'अवैध तारीख स्वरूप. YYYY-MM-DD वापरा.' });
    if (!(lat >= -66 && lat <= 66) || !(lon >= -180 && lon <= 180))
      return res.status(400).json({ success: false, message: 'अवैध स्थान.' });
    const [y, m, d] = start.split('-').map(Number);
    const out = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10);
      const p = await getPanchang(date, lat, lon, 330, null);       // at sunrise
      out.push({
        date, var: p.var, sunrise: p.sunrise, sunset: p.sunset,
        tithi: p.tithi, paksha: p.paksha, maas: p.maas, nakshatra: p.nakshatra, yoga: p.yoga,
        chandraRashi: p.chandraRashi, el: Number(p._moon_sun_diff),
        festivals: (p.festivals || []).map(f => ({ name: f.name, icon: f.icon, type: f.type })),
      });
    }
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ success: true, data: out });
  } catch (err) {
    console.error('❌ Panchang days error:', err);
    res.status(500).json({ success: false, message: 'पंचांग माहिती मिळवण्यात त्रुटी झाली.' });
  }
});

// GET /api/panchang/YYYY-MM-DD (tests use this) — only matches a date, so /rating etc. reach their own routes
router.get('/:date(\\d{4}-\\d{2}-\\d{2})', (req, res) => {
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
