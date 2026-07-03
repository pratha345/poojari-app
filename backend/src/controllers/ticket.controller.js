// src/controllers/ticket.controller.js
'use strict';
const pool    = require('../config/db');
const authAPI = require('../services/sms.service');

const genCode = () => 'TKT' + Date.now().toString(36).toUpperCase().slice(-7);

// ── Create ticket (authenticated) ────────────────────────────
exports.createTicket = async (req, res) => {
  try {
    const { subject, message, name: bodyName, phone: bodyPhone, email: bodyEmail } = req.body;
    if (!subject?.trim() || !message?.trim())
      return res.status(400).json({ success: false, message: 'विषय व संदेश आवश्यक आहे.' });

    const user_id = req.user?.id || null;
    const name    = req.user?.name || req.user?.full_name || bodyName || 'वापरकर्ता';
    const phone   = req.user?.phone || bodyPhone || null;
    const ticket_code = genCode();

    const [r] = await pool.query(
      `INSERT INTO support_tickets (ticket_code, user_id, phone, name, subject, status) VALUES (?,?,?,?,?,'open')`,
      [ticket_code, user_id, phone, name, subject.trim()]
    );
    const ticket_id = r.insertId;

    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, sender_name, message) VALUES (?,?,?,?,?)`,
      [ticket_id, 'user', user_id, name, message.trim()]
    );

    res.json({ success: true, data: { ticket_id, ticket_code } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get my tickets (user) ─────────────────────────────────────
exports.getMyTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(
      `SELECT st.*,
         (SELECT sender_name FROM ticket_messages WHERE ticket_id=st.id ORDER BY created_at DESC LIMIT 1) AS last_sender,
         (SELECT message    FROM ticket_messages WHERE ticket_id=st.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT COUNT(*)   FROM ticket_messages WHERE ticket_id=st.id AND sender_type='admin' AND is_read=0) AS unread_admin
       FROM support_tickets st
       WHERE st.user_id = ?
       ORDER BY st.updated_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Open tickets count (for navbar badge) ────────────────────
exports.getOpenCount = async (req, res) => {
  try {
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM support_tickets
       WHERE user_id=? AND status NOT IN ('resolved','closed')`,
      [req.user.id]
    );
    const [[{ unread }]] = await pool.query(
      `SELECT COUNT(*) AS unread FROM ticket_messages tm
       JOIN support_tickets st ON st.id=tm.ticket_id
       WHERE st.user_id=? AND tm.sender_type='admin' AND tm.is_read=0`,
      [req.user.id]
    );
    res.json({ success: true, data: { open: count, unread } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get single ticket + messages ──────────────────────────────
exports.getTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const role   = req.user.role;
    const isAdmin = role === 'admin' || role === 'super_admin';

    const [rows] = await pool.query(
      `SELECT st.*, u.name AS assigned_name
       FROM support_tickets st
       LEFT JOIN users u ON u.id = st.assigned_to
       WHERE st.id = ? ${isAdmin ? '' : 'AND st.user_id = ?'}`,
      isAdmin ? [id] : [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Ticket सापडला नाही.' });

    const [messages] = await pool.query(
      `SELECT * FROM ticket_messages WHERE ticket_id=? ORDER BY created_at ASC`, [id]
    );

    // Mark admin messages as read when user views
    if (!isAdmin) {
      await pool.query(
        `UPDATE ticket_messages SET is_read=1 WHERE ticket_id=? AND sender_type='admin' AND is_read=0`, [id]
      );
    }

    res.json({ success: true, data: { ticket: rows[0], messages } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── User reply ────────────────────────────────────────────────
exports.userReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'संदेश आवश्यक.' });

    const [rows] = await pool.query(
      `SELECT * FROM support_tickets WHERE id=? AND user_id=?`, [id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Ticket सापडला नाही.' });
    if (rows[0].status === 'closed') return res.status(400).json({ success: false, message: 'हे ticket बंद आहे.' });

    const name = req.user.name || req.user.full_name || 'वापरकर्ता';
    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, sender_name, message) VALUES (?,?,?,?,?)`,
      [id, 'user', req.user.id, name, message.trim()]
    );
    await pool.query(`UPDATE support_tickets SET status='open', updated_at=NOW() WHERE id=?`, [id]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: get all tickets ────────────────────────────────────
exports.adminGetAll = async (req, res) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const vals = [];
    let where = '1=1';
    if (status) { where += ' AND st.status=?'; vals.push(status); }

    const [tickets] = await pool.query(
      `SELECT st.*,
         u.name  AS user_name,  u.phone  AS user_phone,
         a.name  AS assigned_name,
         (SELECT sender_name FROM ticket_messages WHERE ticket_id=st.id ORDER BY created_at DESC LIMIT 1) AS last_sender,
         (SELECT message  FROM ticket_messages WHERE ticket_id=st.id ORDER BY created_at DESC LIMIT 1) AS last_message,
         (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id=st.id AND sender_type='user' AND is_read=0) AS unread_user
       FROM support_tickets st
       LEFT JOIN users u ON u.id = st.user_id
       LEFT JOIN users a ON a.id = st.assigned_to
       WHERE ${where}
       ORDER BY st.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...vals, Number(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM support_tickets st WHERE ${where}`, vals
    );

    res.json({ success: true, data: { rows: tickets, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: reply ─────────────────────────────────────────────
exports.adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'संदेश आवश्यक.' });

    const name = req.user.name || req.user.full_name || 'Admin';
    await pool.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, sender_name, message) VALUES (?,?,?,?,?)`,
      [id, 'admin', req.user.id, name, message.trim()]
    );
    await pool.query(
      `UPDATE support_tickets SET status='in_progress', updated_at=NOW() WHERE id=?`, [id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: assign ─────────────────────────────────────────────
exports.assignTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    await pool.query(
      `UPDATE support_tickets SET assigned_to=?, status='in_progress', updated_at=NOW() WHERE id=?`,
      [assigned_to || null, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: update status ──────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;
    const updates = [];
    const vals    = [];
    if (status)   { updates.push('status=?');   vals.push(status); }
    if (priority) { updates.push('priority=?'); vals.push(priority); }
    if (!updates.length) return res.status(400).json({ success: false, message: 'काहीही बदलायचे नाही.' });
    vals.push(id);
    await pool.query(`UPDATE support_tickets SET ${updates.join(',')}, updated_at=NOW() WHERE id=?`, vals);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: get admins list (for assign dropdown) ──────────────
exports.getAdmins = async (req, res) => {
  try {
    const [admins] = await pool.query(
      `SELECT id, name, phone FROM users WHERE role IN ('admin','super_admin') ORDER BY name`
    );
    res.json({ success: true, data: admins });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
