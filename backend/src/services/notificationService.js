// src/services/notificationService.js
const nodemailer = require('nodemailer');
const pool       = require('../config/db');
const pushService = require('./pushService');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST  || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send SMS via Fast2SMS (free Indian SMS API) ───────────────
async function sendSMS(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`[SMS] No FAST2SMS_API_KEY — message for ${phone}: ${message}`);
    return;
  }
  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: phone,
      }),
    });
    const data = await res.json();
    if (!data.return) console.error('[SMS] Fast2SMS error:', data);
  } catch (err) {
    console.error('[SMS] Send failed:', err.message);
  }
}

// ── Send Email ────────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your@gmail.com') {
    console.log(`[Email] Not configured — would send to ${to}: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"पूजारी Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
  }
}

// ── Notify Admin: New Booking ─────────────────────────────────
exports.notifyAdminNewBooking = async ({ booking_code, pooja_name, booking_date, booking_time, address, user_phone, tenant_id, io }) => {
  try {
    // Get admin of this tenant
    const [admins] = await pool.query(
      `SELECT u.email, u.phone, u.name
       FROM users u
       WHERE u.tenant_id = ? AND u.role = 'admin' AND u.is_active = TRUE
       LIMIT 1`,
      [tenant_id]
    );
    if (!admins.length) return;

    const admin = admins[0];
    const dateStr = new Date(booking_date).toLocaleDateString('mr-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // 1. Email to admin
    if (admin.email) {
      await sendEmail(
        admin.email,
        `🔔 नवीन बुकिंग: ${pooja_name} — ${dateStr}`,
        `
        <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:24px;border:1px solid #e0c97f;border-radius:12px;">
          <h2 style="color:#b35c00;">🙏 नवीन बुकिंग आली!</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;color:#666;">बुकिंग कोड</td><td style="padding:8px;font-weight:bold;">#${booking_code}</td></tr>
            <tr style="background:#fdf6e3;"><td style="padding:8px;color:#666;">पूजा</td><td style="padding:8px;font-weight:bold;">${pooja_name}</td></tr>
            <tr><td style="padding:8px;color:#666;">तारीख</td><td style="padding:8px;">${dateStr}</td></tr>
            <tr style="background:#fdf6e3;"><td style="padding:8px;color:#666;">वेळ</td><td style="padding:8px;">${booking_time}</td></tr>
            <tr><td style="padding:8px;color:#666;">पत्ता</td><td style="padding:8px;">${address}</td></tr>
            <tr style="background:#fdf6e3;"><td style="padding:8px;color:#666;">User फोन</td><td style="padding:8px;">${user_phone || '—'}</td></tr>
          </table>
          <a href="${process.env.CLIENT_URL || ''}/admin/bookings"
             style="display:inline-block;margin-top:20px;padding:12px 24px;background:#b35c00;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Dashboard उघडा →
          </a>
        </div>
        `
      );
    }

    // 2. SMS to admin
    if (admin.phone) {
      await sendSMS(
        admin.phone,
        `नवीन बुकिंग! ${pooja_name} | ${dateStr} ${booking_time} | #${booking_code} | Dashboard: ${process.env.CLIENT_URL || ''}/admin/bookings`
      );
    }

    // 3. Socket.io real-time notification to admin dashboard
    if (io) {
      io.to(`tenant_${tenant_id}`).emit('new_booking', {
        booking_code,
        pooja_name,
        booking_date,
        booking_time,
        user_phone,
        address,
      });
    }

    // 4. Browser Push Notification
    await pushService.sendPushToTenant(tenant_id, {
      title: '🔔 नवीन बुकिंग!',
      body:  `${pooja_name} | ${new Date(booking_date).toLocaleDateString('mr-IN')} | #${booking_code}`,
      icon:  '/logo-icon.png',
      url:   '/admin/bookings',
    });

  } catch (err) {
    console.error('[Notification] notifyAdminNewBooking failed:', err.message);
  }
};
