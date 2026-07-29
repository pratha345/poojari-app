// src/pages/AartiDetail.jsx — Single aarti — large-font lyrics for singing along
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { aartiAPI } from '../api/index.js';
import styles from './AartiDetail.module.css';

// Backend base URL — needed to resolve /uploads/aarti/... image paths
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
function toAartiImgUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

export default function AartiDetail() {
  const { slug } = useParams();
  const [aarti,   setAarti]   = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    aartiAPI.getBySlug(slug)
      .then(r => {
        const a = r.data.data;
        setAarti(a);
        aartiAPI.list({ deity: a.deity_category, limit: 6 })
          .then(rr => setRelated((rr.data.data.aartis || []).filter(x => x.slug !== slug)))
          .catch(() => setRelated([]));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Keep the screen awake while the aarti is open — phone is held up in front
  // of the murti, mid-aarti auto-lock is the last thing anyone wants.
  // Silently no-ops where Wake Lock API isn't supported (e.g. older iOS Safari).
  useEffect(() => {
    let sentinel = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) sentinel = await navigator.wakeLock.request('screen');
      } catch { /* unsupported or denied — reading still works fine without it */ }
    };
    requestLock();
    const reacquire = () => { if (document.visibilityState === 'visible') requestLock(); };
    document.addEventListener('visibilitychange', reacquire);
    return () => {
      document.removeEventListener('visibilitychange', reacquire);
      sentinel?.release().catch(() => {});
    };
  }, [slug]);

  const shareWhatsApp = () => {
    const text = `${aarti.title}\n\n${aarti.lyrics}\n\nअधिक आरत्या: ${window.location.origin}/aarti`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div><Header />
      <div className="page-loader"><div className="spinner" /><p>आरती लोड होत आहे...</p></div>
      <Footer />
    </div>
  );

  if (notFound || !aarti) return (
    <div><Header />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>आरती सापडली नाही</h2>
        <Link to="/aarti" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>
          आरती संग्रहाकडे परत जा
        </Link>
      </div>
      <Footer />
    </div>
  );

  const lyricsLines = (aarti.lyrics || '').split('\n');
  const imgSrc = toAartiImgUrl(aarti.image_url);

  return (
    <div>
      <SEOHead
        title={`${aarti.title} — आरती संग्रह — पूजारी`}
        description={aarti.meaning || aarti.title}
        keywords={`${aarti.title}, ${aarti.deity_category} आरती, मराठी आरती`}
        canonical={`/aarti/${aarti.slug}`}
      />
      <Header />

      <div className={styles.wrap}>
        <div className={styles.breadcrumb}>
          <div className="container">
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <Link to="/aarti">आरती संग्रह</Link>
            <span>›</span>
            <Link to={`/aarti?deity=${encodeURIComponent(aarti.deity_category)}`}>{aarti.deity_category}</Link>
            <span>›</span>
            <span>{aarti.title.slice(0, 30)}...</span>
          </div>
        </div>

        <div className="container">
          <div className={styles.layout}>
            <article className={styles.article}>
              <div className={styles.articleTop}>
                <Link to={`/aarti?deity=${encodeURIComponent(aarti.deity_category)}`} className={styles.deityTag}>
                  {aarti.deity_category}
                </Link>
                <div className={styles.metaRow}>
                  {aarti.author_name && <span>✍️ {aarti.author_name}</span>}
                  {aarti.occasion   && <span>🗓️ {aarti.occasion}</span>}
                  <span>👁 {aarti.views}</span>
                </div>
              </div>

              <h1 className={styles.title}>{aarti.title}</h1>

              {imgSrc && (
                <div className={styles.heroImageWrap}>
                  <img
                    src={imgSrc}
                    alt={aarti.title}
                    className={styles.heroImage}
                    onError={e => { e.currentTarget.closest(`.${styles.heroImageWrap}`).style.display = 'none'; }}
                  />
                </div>
              )}

              {/* ── Lyrics — large, well-spaced, print-friendly ─────────── */}
              <div className={styles.lyricsBox} id="printable-lyrics">
                {lyricsLines.map((line, i) => (
                  line.trim()
                    ? <p key={i} className={styles.lyricLine}>{line}</p>
                    : <div key={i} className={styles.lyricGap} />
                ))}
              </div>

              {aarti.meaning && (
                <div className={styles.meaningBox}>
                  <h3>🔤 अर्थ</h3>
                  <p>{aarti.meaning}</p>
                </div>
              )}

              {aarti.source_note && (
                <p className={styles.sourceNote}>📌 {aarti.source_note}</p>
              )}

              <div className={styles.actionBar}>
                <button onClick={() => window.print()} className="btn btn-secondary">
                  🖨️ Print करा
                </button>
                <button onClick={shareWhatsApp} className={styles.shareWa}>
                  💬 WhatsApp वर पाठवा
                </button>
              </div>

              <div className={styles.inArticleCta}>
                <div className={styles.ctaIcon}>🪔</div>
                <div>
                  <h3>पूजा बुक करायची आहे?</h3>
                  <p>अनुभवी पुजारी घरी येऊन योग्य आरती-मंत्रांसह पूजा करतात.</p>
                </div>
                <Link to="/pooja" className="btn btn-primary">पूजा बुक करा</Link>
              </div>
            </article>

            <aside className={styles.sidebar}>
              <div className={styles.sideCard}>
                <h3 className={styles.sideTitle}>⚡ त्वरित लिंक्स</h3>
                <Link to="/aarti" className={styles.sideLink}>🪔 सर्व आरत्या</Link>
                <Link to="/pooja" className={styles.sideLink}>🛕 पूजा बुक करा</Link>
                <Link to="/blog"  className={styles.sideLink}>📖 ब्लॉग</Link>
              </div>

              {related.length > 0 && (
                <div className={styles.sideCard}>
                  <h3 className={styles.sideTitle}>🪔 {aarti.deity_category} च्या इतर आरत्या</h3>
                  {related.map(r => (
                    <Link key={r.id} to={`/aarti/${r.slug}`} className={styles.relatedCard}>
                      <strong>{r.title}</strong>
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
