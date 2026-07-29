// src/pages/Aarti.jsx — Aarti collection listing page
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { aartiAPI } from '../api/index.js';
import styles from './Aarti.module.css';
import { FaMagnifyingGlass, FaFolder, FaHandsPraying, FaFire } from 'react-icons/fa6';

// Backend base URL — needed to resolve /uploads/aarti/... image paths
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';
function toAartiImgUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE}${url}`;
}

// Deity → accent color map (restructured 2026-07-29: विष्णु had grown to 23/58
// aartis mixing विठ्ठल/कृष्ण/राम/सत्यनारायण — split into dedicated categories;
// संत आरत्या split out of इतर देवता for the ज्ञानेश्वर/तुकाराम/एकनाथ/रामदास/गजानन cluster)
const DEITY_COLOR = {
  'गणपती':            '#E07B2A',
  'शिव':              '#1B5E20',
  'देवी':             '#C62828',
  'विठ्ठल-पांडुरंग':  '#6A1B9A',
  'कृष्ण':            '#00838F',
  'राम':              '#EF6C00',
  'विष्णु':           '#1A56DB',
  'संत आरत्या':       '#8D6E63',
  'इतर देवता':        '#4527A0',
  'सामान्य':          '#455A64',
};


// Magazine-style card — same visual system as the blog cards: full-bleed hero
// (uploaded image, or deity-colored decorative gradient until one is uploaded),
// dark legibility gradients, logo chip + deity badge on top, title over the image.
function AartiCard({ a }) {
  const accent = DEITY_COLOR[a.deity_category] || '#E07B2A';
  const imgSrc = toAartiImgUrl(a.image_url);
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = imgSrc && !imgFailed;

  return (
    <article className={styles.card}>
      <Link to={`/aarti/${a.slug}`} className={styles.cardHero}>
        {showImg ? (
          <img
            src={imgSrc}
            alt={a.title}
            className={styles.cardHeroImg}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={styles.cardHeroBg} style={{ '--deity-color': accent }} />
        )}

        <div className={styles.cardHeroOverlay} />
        <div className={styles.cardHeroGrad} />

        <div className={styles.cardHeroTop}>
          <div className={styles.cardLogo}>
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img src="/logo.png" alt="Poojaris" className={styles.cardLogoImg} />
            </picture>
          </div>
          <span className={styles.cardDeity} style={{ background: accent }}>{a.deity_category}</span>
        </div>

        <div className={styles.cardHeroBottom}>
          <div className={styles.cardMetaImg}>
            {!!a.is_featured && <span className={styles.cardFeatured}>⭐ लोकप्रिय</span>}
            {a.occasion && <span>🗓️ {a.occasion}</span>}
            {a.views > 0 && <span>👁 {a.views}</span>}
          </div>
          <h2 className={styles.cardTitleImg}>{a.title}</h2>
        </div>
      </Link>

      <div className={styles.cardBody}>
        <Link to={`/aarti/${a.slug}`} className={styles.cardReadMore} style={{ '--accent': accent }}>
          🪔 संपूर्ण आरती वाचा →
        </Link>
      </div>
    </article>
  );
}

export default function Aarti() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentDeity = searchParams.get('deity') || '';
  const currentQ     = searchParams.get('search') || '';

  const [aartis,     setAartis]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [searchInput, setSearchInput] = useState(currentQ);
  const [festival,   setFestival]   = useState(null);   // आजचा सण (panchang-नुसार)
  const [recommended, setRecommended] = useState([]);   // user च्या booking वरून

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (currentDeity) params.deity  = currentDeity;
      if (currentQ)     params.search = currentQ;
      const r = await aartiAPI.list(params);
      setAartis(r.data.data.aartis || []);
      setTotal(r.data.data.total || 0);
      setFestival(r.data.data.festival || null);
    } catch {
      setAartis([]);
    } finally {
      setLoading(false);
    }
  }, [currentDeity, currentQ]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    aartiAPI.categories().then(r => setCategories(r.data.data || [])).catch(() => {});
    // Logged-in users: aartis matching their booked poojas (best-effort)
    if (localStorage.getItem('pojjari_token')) {
      aartiAPI.recommended()
        .then(r => setRecommended(r.data.data.aartis || []))
        .catch(() => {});
    }
  }, []);

  const setFilter = (deity) => {
    const p = {};
    if (deity)     p.deity  = deity;
    if (currentQ)  p.search = currentQ;
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const p = {};
    if (currentDeity)        p.deity  = currentDeity;
    if (searchInput.trim())  p.search = searchInput.trim();
    setSearchParams(p);
  };

  return (
    <div>
      <SEOHead
        title="आरती संग्रह | प्रमाणित आरत्या — पूजारी"
        description="सुखकर्ता दुःखहर्ता, ॐ जय जगदीश हरे, दुर्गे दुर्घट भारी — गणपती, शिव, देवी, विष्णु, विठ्ठल, दत्त यांच्या प्रमाणित आरत्या शब्दांसह."
        keywords="आरती संग्रह, गणपती आरती, शिव आरती, विठ्ठल आरती, मराठी आरती"
        canonical="/aarti"
      />
      <Header />

      <section className={styles.pageHeader}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <span>आरती संग्रह</span>
          </div>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>🪔 आरती संग्रह</h1>
              <p className={styles.pageSub}>प्रमाणित शब्दांसह गणपती, शिव, देवी, विष्णु, विठ्ठल, दत्त यांच्या आरत्या</p>
            </div>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="आरती शोधा..."
                className={styles.searchInput}
              />
              <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
                <FaMagnifyingGlass style={{ marginRight: 6 }} /> शोधा
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="container">
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><FaFolder style={{ marginRight: 6 }} /> देवता</h3>
              <button
                className={`${styles.catBtn} ${!currentDeity ? styles.catActive : ''}`}
                onClick={() => setFilter('')}
              >
                <FaHandsPraying style={{ marginRight: 6 }} /> सर्व आरत्या <span>{total}</span>
              </button>
              {categories.map(c => (
                <button
                  key={c.deity_category}
                  className={`${styles.catBtn} ${currentDeity === c.deity_category ? styles.catActive : ''}`}
                  onClick={() => setFilter(c.deity_category)}
                >
                  {c.deity_category} <span>{c.count}</span>
                </button>
              ))}
            </div>

            <div className={styles.sideCtaBox}>
              <div className={styles.sideCtaIcon}><FaFire /></div>
              <h3>पूजा बुक करा</h3>
              <p>अनुभवी पुजारी घरी येतात, योग्य आरती-मंत्रांसह पूजा करतात</p>
              <Link to="/pooja" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                आता बुक करा
              </Link>
            </div>
          </aside>

          <main className={styles.main}>
            {/* ── तुमच्या booked पूजेची आरती — सर्वोच्च प्राधान्य ── */}
            {recommended.length > 0 && !currentQ && (
              <section className={styles.recoSection}>
                <h2 className={styles.recoTitle}>🙏 तुमच्या पूजेसाठी</h2>
                <p className={styles.recoSub}>
                  तुम्ही book केलेल्या {recommended.map(r => `"${r.reason}"`).join(', ')} नुसार
                </p>
                <div className={styles.grid}>
                  {recommended.map(a => <AartiCard key={`reco-${a.id}`} a={a} />)}
                </div>
              </section>
            )}

            {/* ── आजचा सण — त्या देवतेच्या आरत्या प्रथम ── */}
            {festival && !currentDeity && !currentQ && (
              <div className={styles.festivalBanner}>
                <span className={styles.festivalIcon}>{festival.icon}</span>
                <div>
                  <strong>{festival.festival} विशेष</strong>
                  <p>{festival.deity} च्या आरत्या प्रथम दाखवत आहोत</p>
                </div>
              </div>
            )}

            {(currentDeity || currentQ) && (
              <div className={styles.activeFilter}>
                {currentDeity && <span className={styles.filterTag}>{currentDeity} ✕ <button onClick={() => setFilter('')} /></span>}
                {currentQ && <span className={styles.filterTag}>"{currentQ}" ✕ <button onClick={() => { setSearchInput(''); setSearchParams(currentDeity ? { deity: currentDeity } : {}); }} /></span>}
                <span className={styles.resultCount}>{total} आरत्या सापडल्या</span>
              </div>
            )}

            {loading ? (
              <div className={styles.grid}>
                {Array(6).fill(0).map((_, i) => <div key={i} className={`${styles.card} ${styles.skeleton}`} />)}
              </div>
            ) : aartis.length === 0 ? (
              <div className={styles.empty}>
                <span>🔍</span>
                <h3>कोणतीही आरती सापडली नाही</h3>
                <p>दुसरी देवता निवडा किंवा शोध बदला</p>
                <button className="btn btn-secondary" onClick={() => { setSearchInput(''); setSearchParams({}); }}>
                  सर्व आरत्या पहा
                </button>
              </div>
            ) : (
              <div className={styles.grid}>
                {aartis.map(a => <AartiCard key={a.id} a={a} />)}
              </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
