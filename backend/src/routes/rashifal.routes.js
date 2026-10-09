// backend/src/routes/rashifal.routes.js
const express = require('express');
const router  = express.Router();
const { getTomorrowPrediction, getWeeklyPrediction } = require('../services/groqRashifalService');
const rashifalEngine = require('../services/rashifalEngine');

// GET /api/rashifal/gochar/:rashiId?period=today|tomorrow|week|month|year[&date=YYYY-MM-DD][&year=YYYY]
// Built from real planetary positions and classical gochar rules (no AI).
router.get('/gochar/:rashiId', (req, res) => {
  const rashiId = parseInt(req.params.rashiId);
  const period  = req.query.period || 'today';
  if (isNaN(rashiId) || rashiId < 0 || rashiId > 11)
    return res.status(400).json({ success: false, message: 'अवैध राशी ID.' });
  if (!['today', 'tomorrow', 'week', 'month', 'year'].includes(period))
    return res.status(400).json({ success: false, message: 'अवैध कालावधी.' });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : undefined;
  const year = /^\d{4}$/.test(req.query.year || '') ? Number(req.query.year) : undefined;
  if (year && (year < 2000 || year > 2100))
    return res.status(400).json({ success: false, message: 'अवैध वर्ष.' });
  try {
    res.set('Cache-Control', 'public, max-age=1800');
    res.json({ success: true, data: rashifalEngine.get(period, rashiId, { date, year }) });
  } catch (err) {
    console.error('rashifal/gochar error:', err.message);
    res.status(500).json({ success: false, message: 'भविष्य मिळवता आले नाही.' });
  }
});

// GET /api/rashifal/tomorrow/:rashiId
router.get('/tomorrow/:rashiId', async (req, res) => {
  try {
    const rashiId = parseInt(req.params.rashiId);
    if (isNaN(rashiId) || rashiId < 0 || rashiId > 11)
      return res.status(400).json({ success: false, message: 'अवैध राशी ID.' });

    const data = await getTomorrowPrediction(rashiId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('rashifal/tomorrow error:', err.message);
    res.status(500).json({ success: false, message: 'भविष्य मिळवता आले नाही.' });
  }
});

// GET /api/rashifal/weekly/:rashiId
router.get('/weekly/:rashiId', async (req, res) => {
  try {
    const rashiId = parseInt(req.params.rashiId);
    if (isNaN(rashiId) || rashiId < 0 || rashiId > 11)
      return res.status(400).json({ success: false, message: 'अवैध राशी ID.' });

    const data = await getWeeklyPrediction(rashiId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('rashifal/weekly error:', err.message);
    res.status(500).json({ success: false, message: 'साप्ताहिक भविष्य मिळवता आले नाही.' });
  }
});

// Also accept /:rashiId/tomorrow and /:rashiId/weekly (test format)
router.get('/:rashiId/tomorrow', async (req, res) => {
  try {
    const rashiId = parseInt(req.params.rashiId);
    if (isNaN(rashiId) || rashiId < 0 || rashiId > 11)
      return res.status(400).json({ success: false, message: 'अवैध राशी ID.' });
    const data = await getTomorrowPrediction(rashiId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('rashifal/:rashiId/tomorrow error:', err.message);
    res.status(500).json({ success: false, message: 'भविष्य मिळवता आले नाही.' });
  }
});

router.get('/:rashiId/weekly', async (req, res) => {
  try {
    const rashiId = parseInt(req.params.rashiId);
    if (isNaN(rashiId) || rashiId < 0 || rashiId > 11)
      return res.status(400).json({ success: false, message: 'अवैध राशी ID.' });
    const data = await getWeeklyPrediction(rashiId);
    res.json({ success: true, data });
  } catch (err) {
    console.error('rashifal/:rashiId/weekly error:', err.message);
    res.status(500).json({ success: false, message: 'साप्ताहिक भविष्य मिळवता आले नाही.' });
  }
});

module.exports = router;
