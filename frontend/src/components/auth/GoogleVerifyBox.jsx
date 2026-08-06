// src/components/auth/GoogleVerifyBox.jsx — shared "Google leads, one-click"
// highlight box used on Login/Booking/BookPujari. Extracted so all three stay
// visually in sync instead of drifting via copy-pasted inline styles (they
// already had — Booking used a 🛡️ emoji where BookPujari used FaShieldHalved).
import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { homeAPI } from '../../api/index.js';
import styles from './GoogleVerifyBox.module.css';

// Real admin-configured stat (same number shown on the homepage stats strip)
// — module-level cache so all three pages share one fetch per page-load
// instead of three, and so we never show a fabricated number if it fails.
let bookingStatCache = null;
let bookingStatPromise = null;
function useBookingStat() {
  const [stat, setStat] = useState(bookingStatCache);
  useEffect(() => {
    if (bookingStatCache) return;
    bookingStatPromise ||= homeAPI.get().then(r => r.data?.data?.content?.stat_bookings || null).catch(() => null);
    bookingStatPromise.then(v => { bookingStatCache = v; setStat(v); });
  }, []);
  return stat;
}

export default function GoogleVerifyBox({
  onSuccess,
  onError,
  googleText = 'continue_with',
  badgeText = '⚡ सर्वात जलद पद्धत',
}) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const bookingStat = useBookingStat();

  // The Google button renders into containerRef asynchronously (external
  // script + iframe) — watch for that DOM insertion to know when to fade the
  // skeleton out, rather than guessing with a fixed timeout.
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new MutationObserver(() => {
      if (containerRef.current.childElementCount > 0) { setReady(true); obs.disconnect(); }
    });
    obs.observe(containerRef.current, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  return (
    <div className={styles.box}>
      <span className={styles.badge}>{badgeText}</span>

      <div className={styles.googleSlot}>
        {!ready && (
          <div className={styles.skeleton} aria-hidden="true">
            <div className={styles.skeletonDot} />
            <div className={styles.skeletonBar} />
          </div>
        )}
        <div ref={containerRef} className={styles.googleReal} style={{ opacity: ready ? 1 : 0 }}>
          <GoogleLogin
            useOneTap
            onSuccess={onSuccess}
            onError={onError}
            locale="mr"
            text={googleText}
            shape="rectangular"
            theme="outline"
            width="100%"
          />
        </div>
      </div>

      <div className={styles.trust}>
        <span>🔒 १००% सुरक्षित</span>
        <span className={styles.trustDot}>•</span>
        <span>✋ OTP ची गरज नाही</span>
      </div>

      {bookingStat && (
        <div className={styles.socialProof}>{bookingStat} भाविकांनी विश्वास ठेवला</div>
      )}
    </div>
  );
}
