// src/components/common/PoojaCard.jsx
import { Link } from 'react-router-dom';
import { getImageUrl, POOJA_PLACEHOLDER } from '../../utils/index.js';
import styles from './PoojaCard.module.css';

export default function PoojaCard({ pooja }) {
  const { name_mr, slug, short_desc, price, duration_hrs, image_url, category_name, is_featured } = pooja;

  return (
    <div className={`${styles.card} animate-fadeInUp`}>
      {!!is_featured && <span className={styles.badge}>⭐ लोकप्रिय</span>}
      <Link to={`/vidhi/${slug}`} className={styles.imgWrap}>
        <img
          src={getImageUrl(image_url)}
          alt={name_mr}
          loading="lazy"
          onError={e => { e.target.src = POOJA_PLACEHOLDER; }}
        />
        <div className={styles.overlay}>
          <span>तपशील पहा →</span>
        </div>
      </Link>
      <div className={styles.body}>
        {category_name && (
          <span className={styles.category}>{category_name}</span>
        )}
        <h3 className={styles.title}>
          <Link to={`/vidhi/${slug}`}>{name_mr}</Link>
        </h3>
        {short_desc && (
          <p className={styles.desc}>{short_desc.slice(0, 80)}...</p>
        )}
        <div className={styles.meta}>
          {parseFloat(duration_hrs) > 0 ? <span>⏱ {parseFloat(duration_hrs)} तास</span> : null}
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
