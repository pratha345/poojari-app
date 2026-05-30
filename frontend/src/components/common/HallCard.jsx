import styles from './HallCard.module.css';

export default function HallCard({ hall }) {
  const isOSM = hall.source === 'osm';

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.hallName}>🏛️ {hall.name}</h2>
        <div className={styles.badges}>
          {hall.district && (
            <span className={styles.cityBadge}>
              📍 {hall.district}{hall.taluka ? ` › ${hall.taluka}` : ''}
            </span>
          )}
          {!hall.district && hall.city && <span className={styles.cityBadge}>📍 {hall.city}</span>}
          {hall.distance != null && (
            <span className={styles.distBadge}>📏 {hall.distance} किमी</span>
          )}
          {isOSM && hall.rating && (
            <span className={styles.ratingBadge}>⭐ {hall.rating}</span>
          )}
          {isOSM && <span className={styles.osmBadge}>OSM</span>}
        </div>
      </div>

      <div className={styles.cardBody}>
        {hall.address && (
          <p className={styles.infoRow}>
            <span className={styles.infoIcon}>🗺️</span>
            <span>{hall.address}</span>
          </p>
        )}
        {hall.capacity && (
          <p className={styles.infoRow}>
            <span className={styles.infoIcon}>👥</span>
            <span><strong>क्षमता:</strong> {hall.capacity} व्यक्ती</span>
          </p>
        )}
        {hall.price_per_day && (
          <p className={styles.infoRow}>
            <span className={styles.infoIcon}>💰</span>
            <span><strong>भाडे:</strong> ₹{Number(hall.price_per_day).toLocaleString('en-IN')} / दिवस</span>
          </p>
        )}
      </div>

      <div className={styles.cardFooter}>
        {isOSM ? (
          <>
            {hall.phone && (
              <a href={`tel:${hall.phone}`} className={styles.callBtn}>
                📞 कॉल करा
              </a>
            )}
            <a
              href={hall.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.osmBtn}
            >
              🗺️ नकाशावर पहा
            </a>
          </>
        ) : (
          <>
            <a href={`tel:${hall.phone}`} className={styles.callBtn}>
              📞 कॉल करा
            </a>
            {hall.whatsapp && (
              <a
                href={`https://wa.me/${hall.whatsapp?.replace(/^(\+91|91)/, '') ? '91' + hall.whatsapp.replace(/^(\+91|91)/, '') : hall.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.waBtn}
              >
                💬 WhatsApp
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
