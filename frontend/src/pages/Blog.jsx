// src/pages/Blog.jsx — Blog listing page
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { blogAPI } from '../api/index.js';
import styles from './Blog.module.css';
import { FaCalendarDays, FaClock, FaEye, FaMagnifyingGlass, FaFolder, FaHandsPraying, FaFire, FaWhatsapp } from 'react-icons/fa6';

// Backend base URL — needed to resolve /uploads/blog/... image paths
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

function toBlogImgUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;       // already absolute
  return `${API_BASE}${url}`;                   // prepend backend base
}

// Category → accent color map (6 fixed categories)
const CAT_COLOR = {
  'पूजा मार्गदर्शन': '#E07B2A',
  'सण-उत्सव':        '#C62828',
  'धर्म-अध्यात्म':  '#5D4037',
  'संस्कार':         '#4527A0',
  'ज्योतिष':         '#7B1FA2',
  'तीर्थक्षेत्र':   '#1B5E20',
};

function BlogCard({ post }) {
  const date    = new Date(post.created_at).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const accent  = CAT_COLOR[post.category] || '#E07B2A';
  const imgSrc  = toBlogImgUrl(post.image_url);
  const hasImg  = !!imgSrc;

  return (
    <article className={styles.card}>
      <Link to={`/blog/${post.slug}`} className={styles.cardHero}>

        {/* ── Background image (only when uploaded) ── */}
        {hasImg && (
          <img
            src={imgSrc}
            alt={post.title}
            className={styles.cardHeroImg}
            loading="lazy"
            onError={e => {
              // If image fails to load → hide it, gradient background shows
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* ── No-image decorative background (subtle OM pattern) ── */}
        {!hasImg && (
          <div
            className={styles.cardHeroBg}
            style={{ '--cat-color': accent }}
          />
        )}

        {/* ── Gradient overlays ── */}
        <div className={styles.cardHeroOverlay} />
        <div className={styles.cardHeroGrad} />

        {/* ── Top row: logo + category ── */}
        <div className={styles.cardHeroTop}>
          <div className={styles.cardLogo}>
            <picture>
              <source srcSet="/logo.webp" type="image/webp" />
              <img
                src="/logo.png"
                alt="Poojaris"
                className={styles.cardLogoImg}
              />
            </picture>
          </div>
          <span className={styles.cardCat} style={{ background: accent }}>
            {post.category}
          </span>
        </div>

        {/* ── Bottom: date + title over image ── */}
        <div className={styles.cardHeroBottom}>
          <div className={styles.cardMetaImg}>
            <span><FaCalendarDays style={{marginRight:4}}/>{date}</span>
            <span><FaClock style={{marginRight:4}}/>{post.read_time} मि.</span>
            <span><FaEye style={{marginRight:4}}/>{post.views}</span>
          </div>
          <h2 className={styles.cardTitleImg}>{post.title}</h2>
        </div>
      </Link>

      {/* ── Body below image ── */}
      <div className={styles.cardBody}>
        <p className={styles.cardExcerpt}>{post.excerpt?.slice(0, 110)}…</p>
        <Link to={`/blog/${post.slug}`} className={styles.cardReadMore} style={{ '--accent': accent }}>
          संपूर्ण वाचा →
        </Link>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className={`${styles.card} ${styles.skeleton}`}>
      <div className={styles.skelImg} />
      <div className={styles.skelBody}>
        <div className={styles.skelLine} style={{ width: '40%', height: 12 }} />
        <div className={styles.skelLine} style={{ width: '90%', height: 20, marginTop: 10 }} />
        <div className={styles.skelLine} style={{ width: '75%', height: 20, marginTop: 6 }} />
        <div className={styles.skelLine} style={{ width: '100%', height: 14, marginTop: 12 }} />
        <div className={styles.skelLine} style={{ width: '80%', height: 14, marginTop: 6 }} />
      </div>
    </div>
  );
}

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCat  = searchParams.get('category') || '';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const currentQ    = searchParams.get('search') || '';

  const [posts,      setPosts]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [searchInput, setSearchInput] = useState(currentQ);
  const postsRef = useRef(null);

  const LIMIT = 9;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: LIMIT, page: currentPage };
      if (currentCat) params.category = currentCat;
      if (currentQ)   params.search   = currentQ;
      const r = await blogAPI.list(params);
      setPosts(r.data.data.posts || []);
      setTotal(r.data.data.total || 0);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentCat, currentPage, currentQ]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    blogAPI.categories().then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);

  const setFilter = (cat) => {
    const p = {};
    if (cat)       p.category = cat;
    if (currentQ)  p.search   = currentQ;
    setSearchParams(p);
    // Mobile: scroll to posts grid after category click
    setTimeout(() => {
      postsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const p = {};
    if (currentCat)     p.category = currentCat;
    if (searchInput.trim()) p.search = searchInput.trim();
    setSearchParams(p);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const goPage = (pg) => {
    const p = { page: pg };
    if (currentCat) p.category = currentCat;
    if (currentQ)   p.search   = currentQ;
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <SEOHead
        title="ब्लॉग | पूजा, सण, मुहूर्त, पंचांग मार्गदर्शन — पूजारी"
        description="सत्यनारायण पूजा, गृहप्रवेश मुहूर्त, नवरात्री विधी, दिवाळी पूजन — हिंदू धर्मातील सर्व माहिती मराठीत वाचा."
        keywords="पूजा माहिती, हिंदू सण, मुहूर्त, पंचांग, blog marathi puja"
        canonical="/blog"
      />
      <Header />

      {/* ── Page Header ──────────────────────────────────────── */}
      <section className={styles.pageHeader}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <span>ब्लॉग</span>
          </div>

          {/* Title left + Search right — same row */}
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <h1 className={styles.pageTitle}>📖 पूजारी ब्लॉग</h1>
              <p className={styles.pageSub}>पूजा विधी, सण-उत्सव, मुहूर्त, पंचांग आणि हिंदू संस्कृतीविषयी सखोल माहिती</p>
            </div>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="ब्लॉग शोधा..."
                className={styles.searchInput}
              />
              <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}><FaMagnifyingGlass style={{marginRight:6}}/> शोधा</button>
            </form>
          </div>
        </div>
      </section>

      <div className="container">
        <div className={styles.layout}>
          {/* ── Sidebar ──────────────────────────────────────── */}
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}>
              <h3 className={styles.sideTitle}><FaFolder style={{marginRight:6}}/> श्रेणी</h3>
              <button
                className={`${styles.catBtn} ${!currentCat ? styles.catActive : ''}`}
                onClick={() => setFilter('')}
              >
                <FaHandsPraying style={{marginRight:6}}/> सर्व लेख <span>{total}</span>
              </button>
              {categories.map(c => (
                <button
                  key={c.category}
                  className={`${styles.catBtn} ${currentCat === c.category ? styles.catActive : ''}`}
                  onClick={() => setFilter(c.category)}
                >
                  {c.category} <span>{c.count}</span>
                </button>
              ))}
            </div>

            {/* CTA sidebar box */}
            <div className={styles.sideCtaBox}>
              <div className={styles.sideCtaIcon}><FaFire /></div>
              <h3>पूजा बुक करा</h3>
              <p>अनुभवी पुजारी घरी येतात किंवा व्हिडिओ कॉलवर</p>
              <Link to="/pooja" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }}>
                आता बुक करा
              </Link>
              <a
                href="https://wa.me/9561903219?text=मला पूजा बुक करायची आहे."
                target="_blank" rel="noreferrer"
                className={styles.sideWa}
              >
                <FaWhatsapp style={{marginRight:6}}/> WhatsApp करा
              </a>
            </div>
          </aside>

          {/* ── Main Content ──────────────────────────────────── */}
          <main className={styles.main} ref={postsRef}>
            {/* Active filter tag */}
            {(currentCat || currentQ) && (
              <div className={styles.activeFilter}>
                {currentCat && <span className={styles.filterTag}>{currentCat} ✕ <button onClick={() => setFilter('')} /></span>}
                {currentQ   && <span className={styles.filterTag}>"{currentQ}" ✕ <button onClick={() => { setSearchInput(''); setSearchParams(currentCat ? { category: currentCat } : {}); }} /></span>}
                <span className={styles.resultCount}>{total} लेख सापडले</span>
              </div>
            )}

            {loading ? (
              <div className={styles.grid}>
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className={styles.empty}>
                <span>🔍</span>
                <h3>कोणताही लेख सापडला नाही</h3>
                <p>दुसरी श्रेणी निवडा किंवा शोध बदला</p>
                <button className="btn btn-secondary" onClick={() => { setSearchInput(''); setSearchParams({}); }}>
                  सर्व लेख पहा
                </button>
              </div>
            ) : (
              <>
                <div className={styles.grid}>
                  {posts.map(post => <BlogCard key={post.id} post={post} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      className={styles.pgBtn}
                      onClick={() => goPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >← मागे</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                      <button
                        key={pg}
                        className={`${styles.pgBtn} ${pg === currentPage ? styles.pgActive : ''}`}
                        onClick={() => goPage(pg)}
                      >{pg}</button>
                    ))}
                    <button
                      className={styles.pgBtn}
                      onClick={() => goPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >पुढे →</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
