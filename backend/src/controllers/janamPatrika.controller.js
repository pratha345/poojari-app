'use strict';
const pool   = require('../config/db');
const { generateJanamPatrika } = require('../services/janamPatrikaService');

exports.generate = async (req, res) => {
  try {
    const { name, dob, tob, place, lat, lon } = req.body;
    if (!name || !dob || !lat || !lon)
      return res.status(400).json({ success: false, message: 'नाव, जन्मतारीख आणि जन्मस्थळ आवश्यक आहे.' });

    const data = generateJanamPatrika({ name, dob, tob: tob || '12:00', place, lat: +lat, lon: +lon });
    res.json({ success: true, data });
  } catch (err) {
    console.error('generateJanamPatrika error:', err);
    res.status(500).json({ success: false, message: 'जन्म पत्रिका तयार करता आली नाही.' });
  }
};

exports.save = async (req, res) => {
  try {
    const { name, dob, tob, place, lat, lon } = req.body;
    const data = generateJanamPatrika({ name, dob, tob: tob || '12:00', place, lat: +lat, lon: +lon });
    const [r]  = await pool.query(
      'INSERT INTO janam_patrika (name, dob, tob, place, lat, lon, kundali_json) VALUES (?,?,?,?,?,?,?)',
      [name, dob, tob, place, lat, lon, JSON.stringify(data)]
    );
    res.json({ success: true, id: r.insertId, message: 'जन्म पत्रिका जतन झाली.' });
  } catch (err) {
    console.error('saveJanamPatrika error:', err);
    res.status(500).json({ success: false, message: 'जतन करता आले नाही.' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, dob, tob, place, created_at FROM janam_patrika ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'यादी मिळवता आली नाही.' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM janam_patrika WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'नोंद सापडली नाही.' });
    const rec = rows[0];
    res.json({ success: true, data: { ...rec, kundali_json: JSON.parse(rec.kundali_json) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'नोंद मिळवता आली नाही.' });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM janam_patrika WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'नोंद हटवली.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'हटवता आले नाही.' });
  }
};
