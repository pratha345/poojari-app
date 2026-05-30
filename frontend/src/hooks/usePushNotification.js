// src/hooks/usePushNotification.js
import { useEffect, useRef } from 'react';
import { adminAPI } from '../api/index.js';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotification() {
  const subscribed = useRef(false);

  useEffect(() => {
    if (subscribed.current) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const setup = async () => {
      try {
        // Register service worker
        const reg = await navigator.serviceWorker.register('/sw.js');

        // Ask permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Get VAPID public key from backend
        const keyRes = await adminAPI.getPushVapidKey();
        const publicKey = keyRes.data?.data?.publicKey;
        if (!publicKey) return;

        // Subscribe
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // Send subscription to backend
        await adminAPI.subscribePush(subscription.toJSON());
        subscribed.current = true;
      } catch (err) {
        // Silent fail — notifications not critical
      }
    };

    setup();
  }, []);
}
