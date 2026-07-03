// src/pages/CityPage.jsx — City-specific SEO landing page
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import PoojaCard from '../components/common/PoojaCard';
import { getImageUrl } from '../utils/index.js';
import styles from './CityPage.module.css';
import api from '../api/axios';
import { pujariAPI } from '../api/index.js';
import { FaStar, FaLocationDot } from 'react-icons/fa6';

const HOW_IT_WORKS = [
  { icon: '📱', title: 'पूजा निवडा',        desc: 'इच्छित पूजा किंवा विधी निवडा.' },
  { icon: '📅', title: 'तारीख-वेळ ठरवा',   desc: 'तुमच्या सोयीनुसार तारीख व वेळ सेट करा.' },
  { icon: '💳', title: 'पेमेंट करा',         desc: 'सुरक्षित Razorpay द्वारे ऑनलाइन पेमेंट.' },
  { icon: '🪔', title: 'पुजारी घरी येतात',  desc: 'सत्यापित पुजारी तुमच्या घरी येऊन विधी करतात.' },
];

export default function CityPage() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [pujaris, setPujaris] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/cities/${slug}`)
      .then(r => {
        const d = r.data.data;
        setData(d);
        // Fetch pujaris for this city (non-blocking)
        const cityName = d?.city?.name_en || d?.city?.name_mr || '';
        if (cityName) {
          pujariAPI.getNearbyPujaris({ city: cityName, limit: 6 })
            .then(res => {
              const { data: list = [], fallback = false } = res.data || {};
              if (!fallback) setPujaris(list);
            })
            .catch(() => {});
        }
      })
      .catch(() => navigate('/404', { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading) return (
    <div><Header />
      <div className="page-loader"><div className="spinner" /><p>माहिती लोड होत आहे...</p></div>
    <Footer /></div>
  );
  if (!data) return null;

  const { city, poojas } = data;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        'name': `पूजारी — ${city.name_mr}`,
        'description': city.seo_desc,
        'url': `https://pojjari.com/cities/${slug}`,
        'areaServed': { '@type': 'City', 'name': city.name_en },
        'address': { '@type': 'PostalAddress', 'addressLocality': city.name_en, 'addressRegion': city.state_en || 'Maharashtra', 'addressCountry': 'IN' },
        'telephone': '+919561903219',
        'aggregateRating': { '@type': 'AggregateRating', 'ratingValue': '4.8', 'reviewCount': city.booking_count.replace('+','') },
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'मुख्यपृष्ठ', 'item': 'https://pojjari.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'शहरे',        'item': 'https://pojjari.com/cities' },
          { '@type': 'ListItem', 'position': 3, 'name': city.name_mr,   'item': `https://pojjari.com/cities/${slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': `${city.name_mr}मध्ये पुजारी कसे बुक करावेत?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `पूजारी वेबसाइटवर जाऊन इच्छित पूजा निवडा, ${city.name_mr}मधील तुमचा पत्ता आणि वेळ द्या. अनुभवी पुजारी संपूर्ण साहित्यासह तुमच्या घरी येतात.` },
          },
          {
            '@type': 'Question',
            'name': `${city.name_mr}मध्ये पूजेसाठी किती खर्च येतो?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `${city.name_mr}मध्ये पूजेचा खर्च पूजेच्या प्रकारानुसार ₹१,५०० ते ₹१५,००० पर्यंत असतो. बुकिंगपूर्वीच किंमत कळते — कोणतेही छुपे शुल्क नाही.` },
          },
          {
            '@type': 'Question',
            'name': `${city.name_mr}मध्ये कोणत्या पूजा उपलब्ध आहेत?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `${city.name_mr}मध्ये ${city.popular_pujas?.join(', ')} आणि इतर सर्व हिंदू विधी उपलब्ध आहेत. सर्व प्रमुख संस्कार, हवन, आणि सणांच्या पूजांसाठी बुकिंग करता येते.` },
          },
          {
            '@type': 'Question',
            'name': `${city.name_mr}मधील पुजारी साहित्य आणतात का?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `होय, पूजारीचे सर्व पुजारी संपूर्ण पूजा साहित्यासह येतात. तुम्हाला वेगळे साहित्य आणण्याची गरज नाही.` },
          },
        ],
      },
    ],
  };

  return (
    <div>
      <SEOHead
        title={`${city.name_mr}मध्ये पूजा बुकिंग | अनुभवी पुजारी — पूजारी`}
        description={city.seo_desc}
        keywords={city.keywords}
        canonical={`/cities/${slug}`}
        schema={schema}
      />
      <Header />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <Link to="/cities">सर्व शहरे</Link>
            <span>›</span>
            <span>{city.name_mr}</span>
          </div>

          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
              <div className={styles.cityBadge}>📍 {city.name_mr}, {city.state_mr || city.state_en || 'महाराष्ट्र'}</div>
              <h1 className={styles.heroTitle}>{city.tagline}</h1>
              <p className={styles.heroDesc}>{city.desc}</p>

              {/* Trust bar */}
              <div className={styles.trustBar}>
                <div className={styles.trustItem}>
                  <span className={styles.trustNum}>{city.pujari_count}+</span>
                  <small>सत्यापित पुजारी</small>
                </div>
                <div className={styles.trustDiv} />
                <div className={styles.trustItem}>
                  <span className={styles.trustNum}>{city.booking_count}</span>
                  <small>यशस्वी बुकिंग</small>
                </div>
                <div className={styles.trustDiv} />
                <div className={styles.trustItem}>
                  <span className={styles.trustNum}>⭐ ४.८</span>
                  <small>सरासरी रेटिंग</small>
                </div>
                <div className={styles.trustDiv} />
                <div className={styles.trustItem}>
                  <span className={styles.trustNum}>{poojas.length}+</span>
                  <small>पूजा उपलब्ध</small>
                </div>
              </div>

              <div className={styles.heroCtas}>
                <Link to="/pooja" className="btn btn-primary btn-lg">🪔 पूजा बुक करा</Link>
                <a
                  href={`https://wa.me/9561903219?text=${encodeURIComponent(`मला ${city.name_mr}मध्ये पूजा बुक करायची आहे.`)}`}
                  target="_blank" rel="noreferrer"
                  className={`btn btn-secondary btn-lg ${styles.waBtn}`}
                >💬 WhatsApp करा</a>
              </div>
            </div>

            {/* Hero info card */}
            <div className={styles.heroCard}>
              <h3 className={styles.heroCardTitle}>
                {city.name_mr}मध्ये लोकप्रिय पूजा
              </h3>
              <ul className={styles.popularList}>
                {city.popular_pujas.map((p, i) => (
                  <li key={i} className={styles.popularItem}>
                    <span className={styles.popularIcon}>🪔</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.areasWrap}>
                <p className={styles.areasLabel}>📍 सेवा उपलब्ध भाग:</p>
                <div className={styles.areasTags}>
                  {city.areas.map((a, i) => (
                    <span key={i} className={styles.areaTag}>{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Poojas ──────────────────────────────────────────────── */}
      <section className={styles.poojasSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            {city.name_mr}मध्ये उपलब्ध पूजा
          </h2>
          <p className={styles.sectionSub}>
            खालील सर्व पूजांसाठी {city.name_mr}मध्ये अनुभवी पुजारी उपलब्ध आहेत
          </p>
          <div className={styles.poojasGrid}>
            {poojas.map(pooja => <PoojaCard key={pooja.id} pooja={pooja} />)}
          </div>
          <div className={styles.viewAll}>
            <Link to="/pooja" className="btn btn-secondary">सर्व पूजा पहा →</Link>
          </div>
        </div>
      </section>

      {/* ── Pujaris Section ─────────────────────────────────────── */}
      {pujaris.length > 0 && (
        <section style={{ background: '#fff', padding: '52px 0' }}>
          <div className="container">
            <h2 className={styles.sectionTitle}>{city.name_mr}मधील अनुभवी पुजारी</h2>
            <p className={styles.sectionSub}>
              खालील पुजारी {city.name_mr} परिसरात सेवा देतात — थेट बुकिंग करा
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 20, marginTop: 28,
            }}>
              {pujaris.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/pujari/${p.id}`)}
                  style={{
                    background: '#fff', borderRadius: 16,
                    border: '1px solid #f0e0c8',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    padding: '20px 18px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(179,92,0,0.14)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                  }}
                >
                  {/* Top row: photo + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#FF8C00,#E07B2A)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    }}>
                      {p.photo_url
                        ? <img src={getImageUrl(p.photo_url)} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '🙏'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#2d1a00', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.full_name}
                      </div>
                      {p.is_verified && (
                        <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>
                          ✓ सत्यापित
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#888' }}>
                      <FaLocationDot style={{ color: '#b35c00', fontSize: 11 }} />
                      {p.city}
                      {p.distance_km != null && <span style={{ color: '#b35c00', fontWeight: 700 }}> • {p.distance_km} km</span>}
                    </span>
                    {p.experience_yrs > 0 && (
                      <span style={{ fontSize: 12, color: '#888' }}>• {p.experience_yrs} वर्षे अनुभव</span>
                    )}
                  </div>

                  {p.specializations && (
                    <div style={{ fontSize: 12, color: '#b35c00', fontWeight: 600, marginBottom: 10, lineHeight: 1.4 }}>
                      {p.specializations}
                    </div>
                  )}

                  {/* Rating + CTA */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #f5ece0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f7c948', fontWeight: 800, fontSize: 14 }}>
                      <FaStar style={{ fontSize: 12 }} />
                      {p.avg_rating || '—'}
                      <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>({p.total_reviews || 0})</span>
                    </div>
                    <span style={{
                      background: 'linear-gradient(135deg,#b35c00,#e07b2a)',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                      padding: '5px 14px', borderRadius: 20,
                    }}>
                      बुकिंग करा →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/book-pujari')}
              >
                {city.name_mr}मधील सर्व पुजारी पाहा →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>{city.name_mr}मध्ये पूजा कशी बुक करावी?</h2>
          <div className={styles.howGrid}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className={styles.howCard}>
                <div className={styles.howStep}>{i + 1}</div>
                <div className={styles.howIcon}>{step.icon}</div>
                <h3 className={styles.howTitle}>{step.title}</h3>
                <p className={styles.howDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ───────────────────────────────────────── */}
      <section className={styles.whySection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>आम्हालाच का निवडायचे?</h2>
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <span className={styles.whyIcon}>✅</span>
              <h3>सत्यापित पुजारी</h3>
              <p>{city.name_mr}मधील सर्व पुजारी प्रशिक्षित, अनुभवी आणि पोलीस सत्यापित आहेत.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyIcon}>⚡</span>
              <h3>तत्काळ बुकिंग</h3>
              <p>२४ तासांत पुजारी नियुक्त होतो. अर्जंट बुकिंगसाठी WhatsApp करा.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyIcon}>💰</span>
              <h3>परवडणाऱ्या किंमती</h3>
              <p>पारदर्शक किंमती. कोणताही छुपा खर्च नाही. सर्व सामग्री मिळून एकच दर.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyIcon}>🔒</span>
              <h3>१००% परतावा</h3>
              <p>पूजा रद्द केल्यास ४८ तास आधी संपूर्ण रक्कम परत मिळते.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyIcon}>📱</span>
              <h3>ऑनलाइन पूजा</h3>
              <p>परदेशात असल्यास व्हिडिओ कॉलद्वारे पूजा करा. NRI साठी विशेष व्यवस्था.</p>
            </div>
            <div className={styles.whyCard}>
              <span className={styles.whyIcon}>🕐</span>
              <h3>२४x७ सहाय्य</h3>
              <p>बुकिंगपासून पूजेपर्यंत आमची टीम सदैव आपल्यासाठी उपलब्ध.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className={styles.testimonialsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>{city.name_mr}मधील ग्राहकांचे अनुभव</h2>
          <div className={styles.testimonialsGrid}>
            {city.testimonials.map((t, i) => (
              <div key={i} className={styles.testimonialCard}>
                <div className={styles.stars}>{'⭐'.repeat(t.stars)}</div>
                <p className={styles.testimonialText}>"{t.text}"</p>
                <div className={styles.testimonialAuthor}>
                  <strong>{t.name}</strong>
                  <small>📍 {t.area}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Other Cities ────────────────────────────────────────── */}
      <section className={styles.citiesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>इतर शहरांतही सेवा उपलब्ध</h2>
          <div className={styles.citiesGrid}>
            {[
              { slug:'mumbai', name:'मुंबई',      icon:'🏙️' },
              { slug:'pune',   name:'पुणे',        icon:'🌆' },
              { slug:'nashik', name:'नाशिक',       icon:'🍇' },
              { slug:'nagpur', name:'नागपूर',      icon:'🟠' },
              { slug:'thane',  name:'ठाणे',        icon:'🏘️' },
              { slug:'kolhapur',name:'कोल्हापूर',  icon:'🏛️' },
              { slug:'solapur',name:'सोलापूर',     icon:'🕌' },
              { slug:'satara', name:'सातारा',      icon:'⚔️' },
              { slug:'ratnagiri',name:'रत्नागिरी', icon:'🐟' },
              { slug:'aurangabad',name:'औरंगाबाद',icon:'🏯' },
              { slug:'ahmednagar',name:'अहमदनगर', icon:'🌾' },
              { slug:'sangli', name:'सांगली',      icon:'🌻' },
            ].filter(c => c.slug !== slug).slice(0, 8).map(c => (
              <Link key={c.slug} to={`/cities/${c.slug}`} className={styles.cityChip}>
                <span>{c.icon}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop: 20 }}>
            <Link to="/cities" className="btn btn-secondary">सर्व शहरे पहा →</Link>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>{city.name_mr}मध्ये आजच पूजा बुक करा</h2>
            <p>अनुभवी सत्यापित पुजारी घरी येतात — पारंपरिक विधीपूर्वक पूजा</p>
            <div className={styles.ctaBtns}>
              <Link to="/pooja" className="btn btn-primary btn-lg">🪔 पूजा बुक करा</Link>
              <a
                href={`https://wa.me/9561903219?text=${encodeURIComponent(`मला ${city.name_mr}मध्ये पूजा बुक करायची आहे.`)}`}
                target="_blank" rel="noreferrer"
                className={`btn btn-secondary btn-lg ${styles.waCtaBtn}`}
              >💬 WhatsApp करा</a>
              <Link to="/online-puja" className={`btn ${styles.onlineBtn}`}>💻 ऑनलाइन पूजा</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
