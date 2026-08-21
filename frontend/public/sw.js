// public/sw.js — Service Worker for Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || '🔔 पूजारी', {
      body:    data.body  || 'नवीन बुकिंग आली!',
      icon:    data.icon  || '/logo-icon.png',
      badge:   '/logo-icon.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/admin/bookings' },
      actions: [
        { action: 'open',    title: 'Dashboard उघडा' },
        { action: 'dismiss', title: 'बंद करा' },
      ],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/admin/bookings';
  event.waitUntil(clients.openWindow(url));
});
