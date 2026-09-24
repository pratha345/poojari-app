// src/pages/BlogDetail.jsx — Single blog post
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { blogAPI } from '../api/index.js';
import { getSessionId } from '../utils/session.js';
import styles from './BlogDetail.module.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
function toImgUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND}${url}`;
}

// ── Star Rating Widget ────────────────────────────────────────
function BlogRating({ slug, initialRating, initialCount, userRating }) {
  const [hovered,    setHovered]    = useState(0);
  const [selected,   setSelected]   = useState(userRating || 0);
  const [avgRating,  setAvgRating]  = useState(Number(initialRating) || 0);
  const [ratingCount,setRatingCount]= useState(initialCount || 0);
  const [submitting, setSubmitting] = useState(false);
  const [voted,      setVoted]      = useState(!!userRating);

  const handleRate = async (star) => {
    if (submitting) return;
    setSelected(star);
    setSubmitting(true);
    try {
      const sid = getSessionId();
      const res = await blogAPI.rateBlog(slug, star, sid);
      setAvgRating(Number(res.data.data.avg_rating));
      setRatingCount(res.data.data.rating_count);
      setVoted(true);
      toast.success('रेटिंग दिल्याबद्दल धन्यवाद! 🙏');
    } catch {
      toast.error('रेटिंग देताना त्रुटी झाली.');
    } finally { setSubmitting(false); }
  };

  const displayStar = hovered || selected;

  return (
    <div className={styles.ratingBox}>
      <div className={styles.ratingTitle}>
        हा लेख किती उपयुक्त वाटला?
      </div>
      <div className={styles.starsRow}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            className={`${styles.starBtn} ${displayStar >= n ? styles.starActive : ''}`}
            onMouseEnter={() => !voted && setHovered(n)}
            onMouseLeave={() => !voted && setHovered(0)}
            onClick={() => !voted && handleRate(n)}
            disabled={submitting}
            title={['', 'खूपच वाईट', 'वाईट', 'ठीक आहे', 'चांगले', 'अप्रतिम'][n]}
            aria-label={`${n} star`}
          >★</button>
        ))}
      </div>
      {voted && (
        <div className={styles.ratingFeedback}>
          {['', '😞 खूपच वाईट', '😐 वाईट', '🙂 ठीक आहे', '😊 चांगले', '🤩 अप्रतिम'][selected]}
        </div>
      )}
      {ratingCount > 0 && (
        <div className={styles.ratingStats}>
          ⭐ {avgRating.toFixed(1)} / 5 &nbsp;·&nbsp; {ratingCount} वाचकांनी रेट केले
        </div>
      )}
    </div>
  );
}

export default function BlogDetail() {
  const { slug }        = useParams();
  const navigate        = useNavigate();
  const [post,       setPost]       = useState(null);
  const [related,    setRelated]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [userRating, setUserRating] = useState(null);

  useEffect(() => {
    setLoading(true);
    const sid = getSessionId();
    blogAPI.getBySlug(slug, sid)
      .then(r => {
        // Old/merged blog URLs redirect to the post that replaced them
        if (r.data.data.redirect_to) { navigate(`/blog/${r.data.data.redirect_to}`, { replace: true }); return; }
        setPost(r.data.data.post);
        setRelated(r.data.data.related || []);
        setUserRating(r.data.data.user_rating || null);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const shareWhatsApp = () => {
    const text = `${post.title}\n\nवाचा: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return (
    <div><Header />
      <div className="page-loader"><div className="spinner" /><p>लेख लोड होत आहे...</p></div>
      <Footer />
    </div>
  );

  if (!post) return (
    <div><Header />
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>लेख सापडला नाही</h2>
        <Link to="/blog" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>
          ब्लॉगवर परत जा
        </Link>
      </div>
      <Footer />
    </div>
  );

  const date = new Date(post.created_at).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const tags = Array.isArray(post.tags) ? post.tags : [];

  return (
    <div>
      <SEOHead
        title={`${post.title} — पूजारी ब्लॉग`}
        description={post.excerpt || post.title}
        keywords={[...tags, post.category, 'पूजा', 'हिंदू धर्म'].join(', ')}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.image_url}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          'headline': post.title,
          'description': post.excerpt,
          'author': { '@type': 'Person', 'name': post.author_name },
          'datePublished': post.created_at,
          'dateModified': post.updated_at,
          'image': post.image_url || undefined,
          'publisher': { '@type': 'Organization', 'name': 'पूजारी', 'url': 'https://pojjari.com' },
          'keywords': tags.join(', '),
        }}
      />
      <Header />

      <div className={styles.wrap}>
        {/* ── Breadcrumb ───────────────────────────────────── */}
        <div className={styles.breadcrumb}>
          <div className="container">
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <Link to="/blog">ब्लॉग</Link>
            <span>›</span>
            <Link to={`/blog?category=${encodeURIComponent(post.category)}`}>{post.category}</Link>
            <span>›</span>
            <span>{post.title.slice(0, 40)}...</span>
          </div>
        </div>

        <div className="container">
          <div className={styles.layout}>
            {/* ── Article ─────────────────────────────────── */}
            <article className={styles.article}>
              {/* Category + meta */}
              <div className={styles.articleTop}>
                <Link to={`/blog?category=${encodeURIComponent(post.category)}`} className={styles.catTag}>
                  {post.category}
                </Link>
                <div className={styles.metaRow}>
                  <span>✍️ {post.author_name}</span>
                  <span>📅 {date}</span>
                  <span>⏱ {post.read_time} मिनिटे वाचन</span>
                  <span>👁 {post.views} वाचले</span>
                </div>
              </div>

              <h1 className={styles.title}>{post.title}</h1>

              {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}

              {/* Featured image */}
              {post.image_url && (
                <div className={styles.featuredImg}>
                  <img src={toImgUrl(post.image_url)} alt={post.title} />
                </div>
              )}

              {/* Content */}
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {tags.length > 0 && (
                <div className={styles.tags}>
                  <span className={styles.tagsLabel}>🏷️ Tags:</span>
                  {tags.map(tag => (
                    <Link key={tag} to={`/blog?search=${encodeURIComponent(tag)}`} className={styles.tag}>
                      {tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* ── Rating Widget ─────────────────────────── */}
              <BlogRating
                slug={post.slug}
                initialRating={post.avg_rating}
                initialCount={post.rating_count}
                userRating={userRating}
              />

              {/* Share */}
              <div className={styles.shareBar}>
                <span className={styles.shareLabel}>हा लेख शेअर करा:</span>
                <button onClick={shareWhatsApp} className={styles.shareWa}>
                  💬 WhatsApp वर शेअर करा
                </button>
              </div>

              {/* CTA inside article */}
              <div className={styles.inArticleCta}>
                <div className={styles.ctaIcon}>🪔</div>
                <div>
                  <h3>पूजा बुक करायची आहे?</h3>
                  <p>अनुभवी सत्यापित पुजारी घरी येतात — आत्ताच बुक करा.</p>
                </div>
                <div className={styles.ctaBtns}>
                  <Link to="/pooja" className="btn btn-primary">पूजा बुक करा</Link>
                  <Link to="/online-puja" className="btn btn-secondary">ऑनलाइन पूजा</Link>
                </div>
              </div>
            </article>

            {/* ── Sidebar ──────────────────────────────────── */}
            <aside className={styles.sidebar}>
              {/* Quick links */}
              <div className={styles.sideCard}>
                <h3 className={styles.sideTitle}>⚡ त्वरित लिंक्स</h3>
                <Link to="/pooja"        className={styles.sideLink}>🪔 पूजा बुक करा</Link>
                <Link to="/online-puja"  className={styles.sideLink}>💻 ऑनलाइन पूजा</Link>
                <Link to="/panchang"     className={styles.sideLink}>🕉️ आजचे पंचांग</Link>
                <Link to="/hall-booking" className={styles.sideLink}>🏛️ हॉल बुकिंग</Link>
                <a href="https://wa.me/9561903219" target="_blank" rel="noreferrer" className={styles.sideWaLink}>
                  💬 WhatsApp बुकिंग
                </a>
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div className={styles.sideCard}>
                  <h3 className={styles.sideTitle}>📖 संबंधित लेख</h3>
                  {related.map(r => (
                    <Link key={r.id} to={`/blog/${r.slug}`} className={styles.relatedCard}>
                      <strong>{r.title}</strong>
                      <small>{r.category} · {r.read_time} मि.</small>
                    </Link>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className={styles.sideStats}>
                <div className={styles.statItem}><span>५,०००+</span><small>यशस्वी पूजा</small></div>
                <div className={styles.statItem}><span>५००+</span><small>पुजारी</small></div>
                <div className={styles.statItem}><span>⭐ ४.८</span><small>रेटिंग</small></div>
              </div>
            </aside>
          </div>

          {/* ── More from blog ──────────────────────────── */}
          {related.length > 0 && (
            <div className={styles.moreSection}>
              <h2 className={styles.moreTitle}>आणखी वाचा</h2>
              <div className={styles.moreGrid}>
                {related.map(r => {
                  const rDate = new Date(r.created_at).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short' });
                  return (
                    <Link key={r.id} to={`/blog/${r.slug}`} className={styles.moreCard}>
                      {r.image_url
                        ? <img src={toImgUrl(r.image_url)} alt={r.title} className={styles.moreImg} />
                        : <div className={styles.morePlaceholder}>📰</div>
                      }
                      <div className={styles.moreBody}>
                        <span className={styles.moreCat}>{r.category}</span>
                        <h3>{r.title}</h3>
                        <small>{rDate} · {r.read_time} मि.</small>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
