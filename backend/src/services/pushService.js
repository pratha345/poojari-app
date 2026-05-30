// src/services/pushService.js
const webpush = require('web-push');
const pool    = require('../config/db');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL  || 'mailto:admin@pojjari.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// Save subscription to DB
exports.saveSubscription = async (user_id, tenant_id, subscription) => {
  const { endpoint, keys: { p256dh, auth } } = subscription;
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, tenant_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE p256dh=VALUES(p256dh), auth=VALUES(auth)`,
    [user_id, tenant_id, endpoint, p256dh, auth]
  );
};

// Send push to all admins of a tenant
exports.sendPushToTenant = async (tenant_id, payload) => {
  const [subs] = await pool.query(
    'SELECT * FROM push_subscriptions WHERE tenant_id = ?',
    [tenant_id]
  );
  const json = JSON.stringify(payload);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        json
      );
    } catch (err) {
      // Subscription expired — remove it
      if (err.statusCode === 410) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
      }
    }
  }
};
