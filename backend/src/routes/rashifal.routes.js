// backend/src/routes/rashifal.routes.js
const express = require('express');
const router  = express.Router();
const { getTomorrowPrediction, getWeeklyPrediction } = require('../services/groqRashifalService');

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
