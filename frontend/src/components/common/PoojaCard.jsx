// src/components/common/PoojaCard.jsx
import { Link } from 'react-router-dom';
import styles from './PoojaCard.module.css';
import { FaHouse, FaBuilding, FaFire, FaCalendarCheck,
         FaBookOpen, FaPersonPraying, FaStar, FaClock, FaCircleCheck } from 'react-icons/fa6';
import { GiCandleLight, GiPrayerBeads } from 'react-icons/gi';

const CAT_ICON = {
  'गृह पूजा':         FaHouse,
  'वास्तू पूजा':      FaBuilding,
  'हवन / जाप':        FaFire,
  'पित्रुश्राद्ध':   GiCandleLight,
  'उत्सव पूजा':       FaCalendarCheck,
  'कथा / नित्य':      GiPrayerBeads,
  'कथा / नित्य पूजा': GiPrayerBeads,
  'आध्यात्मिक सेवा':  FaPersonPraying,
  'हॉल बुकिंग':       FaBuilding,
};

const CAT_COLOR = {
  'गृह पूजा':         '#E07B2A',
  'वास्तू पूजा':      '#10b981',
  'हवन / जाप':        '#ef4444',
  'पित्रुश्राद्ध':   '#6b7280',
  'उत्सव पूजा':       '#D4AF37',
  'कथा / नित्य':      '#8b5cf6',
  'कथा / नित्य पूजा': '#8b5cf6',
  'आध्यात्मिक सेवा':  '#3b82f6',
  'हॉल बुकिंग':       '#10b981',
};

export default function PoojaCard({ pooja }) {
  const { name_mr, slug, short_desc, price, duration_hrs, image_url, category_name, is_featured, avg_rating } = pooja;

  return (
    <div className={`${styles.card} animate-fadeInUp`}>
      {!!is_featured && <span className={styles.badge}><FaStar style={{marginRight:4}}/> लोकप्रिय</span>}
      <span className={styles.verifiedBadge}><FaCircleCheck style={{marginRight:4}}/> सत्यापित</span>

      <Link to={`/vidhi/${slug}`} className={styles.imgWrap}>
        {image_url ? (
          <img
            src={image_url}
            alt={name_mr}
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
          />
        ) : null}
        {/* CSS placeholder — shows when no image or image fails */}
        <div
          className={styles.imgPlaceholder}
          style={{ display: image_url ? 'none' : 'flex' }}
        >
          <span className={styles.imgPlaceholderRing} />
          <span className={styles.imgPlaceholderIcon}>
            {(() => { const Ic = CAT_ICON[category_name] || FaFire; return <Ic />; })()}
          </span>
          <span className={styles.imgPlaceholderOm}>ॐ</span>
        </div>
        <div className={styles.overlay}>
          <span>तपशील पहा →</span>
        </div>
      </Link>
      <div className={styles.body}>
        {category_name && (
          <span className={styles.category}>
            <span className={styles.categoryDot} style={{ background: CAT_COLOR[category_name] || '#E07B2A' }} />
            {category_name}
          </span>
        )}
        <h3 className={styles.title}>
          <Link to={`/vidhi/${slug}`}>{name_mr}</Link>
        </h3>
        {short_desc && (
          <p className={styles.desc}>{short_desc.slice(0, 80)}...</p>
        )}
        <div className={styles.meta}>
          {parseFloat(duration_hrs) > 0 && <span><FaClock style={{marginRight:4,color:'#e07b2a'}}/>{parseFloat(duration_hrs)} तास</span>}
          {avg_rating > 0
            ? <span className={styles.rating}><FaStar style={{marginRight:3,color:'#f7c948'}}/>{Number(avg_rating).toFixed(1)}</span>
            : <span className={styles.rating}><FaStar style={{marginRight:3,color:'#f7c948'}}/>४.८</span>
          }
        </div>
        <div className={styles.footer}>
          <span className={styles.price}>{Number(price) > 0 ? `₹${Number(price).toLocaleString('mr-IN')}` : '—'}</span>
          <Link to={`/booking/${slug}`} className={`btn btn-primary btn-sm ${styles.bookBtn}`}>
            बुक करा
          </Link>
        </div>
      </div>
    </div>
  );
}
