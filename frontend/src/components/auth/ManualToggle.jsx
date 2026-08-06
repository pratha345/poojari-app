// src/components/auth/ManualToggle.jsx — shared "reveal the manual form"
// button + animated wrapper, used below GoogleVerifyBox on all three pages.
import styles from './ManualToggle.module.css';

export default function ManualToggle({ show, onShow, label, icon = '📱', children }) {
  if (!show) {
    return (
      <button type="button" className={styles.toggleBtn} onClick={onShow}>
        {icon} {label}
      </button>
    );
  }
  // key forces a fresh mount each time this becomes visible, so the
  // slide-in animation replays instead of only firing the very first time.
  return <div key="manual-form" className={styles.revealed}>{children}</div>;
}
