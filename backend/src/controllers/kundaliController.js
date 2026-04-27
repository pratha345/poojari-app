// src/controllers/kundaliController.js — कुंडली मिलान नियंत्रक
'use strict';

const pool = require('../config/db');
const { success, error } = require('../utils/response.util');
const { matchKundali }   = require('../services/kundaliService');

// ── POST /api/kundali/match ───────────────────────────────────
// Calculate Gun Milan (does NOT save to DB)
exports.matchKundali = async (req, res) => {
  try {
    const { bride, groom } = req.body;

    // Basic validation
    if (!bride?.name || !bride?.dob || !groom?.name || !groom?.dob) {
      return error(res, 'वधू आणि वराचे नाव व जन्मतारीख आवश्यक आहे.', 400);
    }

    const result = matchKundali(bride, groom);
    return success(res, result, 'गुण मिलान यशस्वी');
  } catch (err) {
    console.error('❌ Kundali match error:', err);
    return error(res, 'कुंडली मिलानात त्रुटी झाली.');
  }
};

// ── POST /api/kundali/save ────────────────────────────────────
// Calculate + save result to DB
exports.saveKundali = async (req, res) => {
  try {
    const { bride, groom } = req.body;

    if (!bride?.name || !bride?.dob || !groom?.name || !groom?.dob) {
      return error(res, 'वधू आणि वराचे नाव व जन्मतारीख आवश्यक आहे.', 400);
    }

    const result = matchKundali(bride, groom);

    await pool.query(
      `INSERT INTO kundali_matches
         (bride_name, bride_dob, bride_tob, bride_city, bride_nak_idx, bride_rashi_idx,
          groom_name, groom_dob, groom_tob, groom_city, groom_nak_idx, groom_rashi_idx,
          total_gun, match_result, grade, details, doshas, recommendation, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        result.bride.name,  result.bride.dob,  result.bride.tob  || null,
        result.bride.city   || null,
        result.bride.nakshatraIdx, result.bride.rashiIdx,
        result.groom.name,  result.groom.dob,  result.groom.tob  || null,
        result.groom.city   || null,
        result.groom.nakshatraIdx, result.groom.rashiIdx,
        result.totalGun, result.result, result.grade,
        JSON.stringify(result.kootas),
        JSON.stringify(result.doshas),
        result.recommendation,
        req.user.id,
      ]
    );

    return success(res, result, 'कुंडली जतन केली', 201);
  } catch (err) {
    console.error('❌ Kundali save error:', err);
    return error(res, 'कुंडली जतन करताना त्रुटी झाली.');
  }
};

// ── GET /api/kundali ──────────────────────────────────────────
// List saved matches (with optional search)
exports.listKundali = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '';
    const params = [];
    if (search) {
      where = 'WHERE bride_name LIKE ? OR groom_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT id, bride_name, bride_dob, bride_city, bride_nak_idx, bride_rashi_idx,
              groom_name, groom_dob, groom_city, groom_nak_idx, groom_rashi_idx,
              total_gun, match_result, grade, doshas, recommendation, created_at
       FROM kundali_matches ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM kundali_matches ${where}`,
      params
    );

    return success(res, { rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('❌ Kundali list error:', err);
    return error(res, 'यादी मिळवताना त्रुटी झाली.');
  }
};

// ── GET /api/kundali/:id ──────────────────────────────────────
exports.getKundali = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM kundali_matches WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return error(res, 'कुंडली नोंद सापडली नाही.', 404);

    const record = rows[0];
    // Parse JSON columns if stored as strings
    if (typeof record.details  === 'string') record.details  = JSON.parse(record.details);
    if (typeof record.doshas   === 'string') record.doshas   = JSON.parse(record.doshas);

    return success(res, record);
  } catch (err) {
    console.error('❌ Kundali get error:', err);
    return error(res, 'कुंडली माहिती मिळवताना त्रुटी झाली.');
  }
};

// ── DELETE /api/kundali/:id ───────────────────────────────────
exports.deleteKundali = async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM kundali_matches WHERE id = ?',
      [req.params.id]
    );
    if (!result.affectedRows) return error(res, 'कुंडली नोंद सापडली नाही.', 404);
    return success(res, {}, 'कुंडली नोंद हटवली');
  } catch (err) {
    console.error('❌ Kundali delete error:', err);
    return error(res, 'हटवताना त्रुटी झाली.');
  }
};
