// src/pages/PoojaDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { poojaAPI, pujariAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, POOJA_PLACEHOLDER } from '../utils/index.js';
import styles from './PoojaDetail.module.css';
import { FaStar, FaClock, FaCartShopping, FaListCheck, FaCircleCheck,
         FaFire, FaWhatsapp, FaLock, FaLocationDot } from 'react-icons/fa6';
import { GiFlowerEmblem } from 'react-icons/gi';

const MH_CITIES_MR = 'पुणे, मुंबई, नागपूर, नाशिक, औरंगाबाद, ठाणे, कोल्हापूर, सोलापूर';
const MH_CITIES_EN = 'Pune, Mumbai, Nagpur, Nashik, Aurangabad, Thane, Kolhapur, Solapur';

function buildSeoTitle(pooja) {
  const price = pooja.price ? ` — ₹${Number(pooja.price).toLocaleString('mr-IN')} पासून` : '';
  return `${pooja.name_mr}${price} | घरी पुजारी बुकिंग — पूजारी`;
}

function buildSeoDescription(pooja) {
  const price    = pooja.price    ? `₹${Number(pooja.price).toLocaleString('mr-IN')} पासून. ` : '';
  const duration = pooja.duration_hrs ? `${pooja.duration_hrs} तास. ` : '';
  const desc     = (pooja.short_desc || '').slice(0, 60);
  return `${pooja.name_mr} ${price}${duration}${desc} महाराष्ट्रातील अनुभवी पुजारी साहित्यासह घरी येतात. आत्ता बुक करा.`.slice(0, 160);
}

function buildSeoKeywords(pooja) {
  const n  = pooja.name_mr;
  const ne = pooja.name_en || '';
  const cat = pooja.category_name || '';
  return [
    n, ne, cat,
    `${n} बुकिंग`, `${n} विधी`, `${n} किंमत`,
    `${ne} booking`, `${ne} near me`,
    `पूजा बुकिंग`, `पुजारी सेवा`, `pandit near me`,
    `book puja online`, `घरी पुजारी`,
    ...MH_CITIES_EN.split(', ').map(c => `${ne} ${c}`),
    ...MH_CITIES_MR.split(', ').map(c => `${n} ${c}`),
  ].filter(Boolean).join(', ');
}

function buildPoojaSchema(pooja) {
  const priceStr = pooja.price
    ? `₹${Number(pooja.price).toLocaleString('mr-IN')} पासून`
    : 'किंमतीसाठी संपर्क करा';
  const durStr = pooja.duration_hrs ? `${pooja.duration_hrs} तास` : 'वेळेनुसार';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `https://pojjari.com/vidhi/${pooja.slug}`,
        'name': pooja.name_mr,
        'alternateName': pooja.name_en || undefined,
        'description': pooja.description || pooja.short_desc,
        'url': `https://pojjari.com/vidhi/${pooja.slug}`,
        'image': getImageUrl(pooja.image_url),
        'provider': {
          '@type': 'LocalBusiness',
          'name': 'पूजारी',
          'url': 'https://pojjari.com'
        },
        'areaServed': { '@type': 'State', 'name': 'Maharashtra' },
        'offers': {
          '@type': 'Offer',
          'price': pooja.price,
          'priceCurrency': 'INR',
          'availability': 'https://schema.org/InStock',
        },
        ...(pooja.avg_rating ? {
          'aggregateRating': {
            '@type': 'AggregateRating',
            'ratingValue': pooja.avg_rating,
            'bestRating': 5,
            'reviewCount': pooja.review_count || 1,
          }
        } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'मुख्यपृष्ठ', 'item': 'https://pojjari.com/' },
          { '@type': 'ListItem', 'position': 2, 'name': 'पूजा',        'item': 'https://pojjari.com/pooja' },
          ...(pooja.category_name ? [{ '@type': 'ListItem', 'position': 3, 'name': pooja.category_name, 'item': `https://pojjari.com/pooja/${pooja.category_slug}` }] : []),
          { '@type': 'ListItem', 'position': pooja.category_name ? 4 : 3, 'name': pooja.name_mr, 'item': `https://pojjari.com/vidhi/${pooja.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': `${pooja.name_mr}साठी किती खर्च येतो?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `${pooja.name_mr}साठी ${priceStr} खर्च येतो. यात पुजारी दक्षिणा आणि साहित्य समाविष्ट आहे.` },
          },
          {
            '@type': 'Question',
            'name': `${pooja.name_mr} किती वेळ चालते?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `${pooja.name_mr}ला साधारण ${durStr} लागतात. पुजारी संपूर्ण विधी शास्त्रोक्त पद्धतीने करतात.` },
          },
          {
            '@type': 'Question',
            'name': `${pooja.name_mr} घरी होऊ शकते का?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `होय, पूजारी ॲपचे अनुभवी पुजारी संपूर्ण साहित्यासह आपल्या घरी येऊन ${pooja.name_mr} करतात. महाराष्ट्रातील सर्व प्रमुख शहरांत सेवा उपलब्ध.` },
          },
          {
            '@type': 'Question',
            'name': `${pooja.name_mr} कधी करावी?`,
            'acceptedAnswer': { '@type': 'Answer', 'text': `${pooja.name_mr} शुभ मुहूर्तावर करणे उत्तम. पूजारी ॲपवर बुकिंग केल्यावर पुजारी तुम्हाला मुहूर्त सांगतात.` },
          },
        ],
      },
    ],
  };
}

export default function PoojaDetail() {
  const { slug }      = useParams();
  const { isAuthenticated } = useAuth();
  const navigate      = useNavigate();
  const [pooja,  setPooja]  = useState(null);
  const [loading,setLoading]= useState(true);
  const [tab,    setTab]    = useState('samagri'); // samagri | steps | reviews

  // Nearby pujaris state
  const [nearbyPujaris,  setNearbyPujaris]  = useState([]);
  const [nearbyLoading,  setNearbyLoading]  = useState(false);
  const [nearbyCity,     setNearbyCity]     = useState('');
  const [nearbyFetched,  setNearbyFetched]  = useState(false);
  const [nearbyCoords,   setNearbyCoords]   = useState(null);     // { lat, lng }
  const [nearbyDistrict, setNearbyDistrict] = useState('');
  const [nearbyFallback, setNearbyFallback] = useState(false);

  useEffect(() => {
    poojaAPI.getPoojaBySlug(slug)
      .then(r => setPooja(r.data.data))
      .catch(() => setPooja(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Auto-detect location on page load to pre-populate nearby pujaris
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const coords = { lat, lng: lon };
          setNearbyCoords(coords);
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'User-Agent': 'PojjariApp/1.0' } }
          );
          const geo = await r.json();
          const addr     = geo.address || {};
          const city     = addr.city || addr.town || addr.village || '';
          const district = addr.county || addr.state_district || '';
          if (city)     setNearbyCity(city);
          if (district) setNearbyDistrict(district);
          fetchNearbyPujaris(city, coords, district);
        } catch { /* silent */ }
      },
      () => { /* permission denied — user can type manually */ }
    );
  }, []);

  const fetchNearbyPujaris = async (city, coords, district) => {
    setNearbyLoading(true);
    setNearbyFetched(true);
    try {
      const params = { limit: 4 };
      if (city) params.city = city;
      const d = district !== undefined ? district : nearbyDistrict;
      if (d) params.district = d;
      const c = coords || nearbyCoords;
      if (c) { params.lat = c.lat; params.lng = c.lng; }
      if (!params.city && !c) { setNearbyLoading(false); return; }
      const res = await pujariAPI.getNearbyPujaris(params);
      const { data = [], fallback = false } = res.data || {};
      setNearbyFallback(fallback);
      setNearbyPujaris(fallback ? [] : data);
    } catch {
      setNearbyPujaris([]);
    } finally { setNearbyLoading(false); }
  };

  const detectAndFetch = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const coords = { lat, lng: lon };
          setNearbyCoords(coords);
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            { headers: { 'User-Agent': 'PojjariApp/1.0' } }
          );
          const geo = await r.json();
          const addr     = geo.address || {};
          const city     = addr.city || addr.town || addr.village || '';
          const district = addr.county || addr.state_district || '';
          if (city)     setNearbyCity(city);
          if (district) setNearbyDistrict(district);
          fetchNearbyPujaris(city, coords, district);
        } catch { /* silent */ }
      },
      () => { /* permission denied — show manual input */ }
    );
  };

  if (loading) return (
    <div><Header/>
      <div className="page-loader">
        <div className="spinner"/>
        <p>माहिती लोड होत आहे...</p>
      </div>
    <Footer/></div>
  );

  if (!pooja) return (
    <div><Header/>
      <div style={{ textAlign:'center', padding:'80px 20px' }}>
        <h2>पूजा सापडली नाही</h2>
        <Link to="/pooja" className="btn btn-primary" style={{marginTop:'20px', display:'inline-block'}}>
          परत जा
        </Link>
      </div>
    <Footer/></div>
  );

  const steps   = Array.isArray(pooja.steps) ? pooja.steps : [];
  const samagri = pooja.samagri || [];
  const reviews = pooja.reviews || [];

  return (
    <div>
      <SEOHead
        title={buildSeoTitle(pooja)}
        description={buildSeoDescription(pooja)}
        keywords={buildSeoKeywords(pooja)}
        canonical={`/vidhi/${pooja.slug}`}
        ogType="product"
        ogImage={getImageUrl(pooja.image_url)}
        schema={buildPoojaSchema(pooja)}
      />
      <Header />
      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <div className="container">
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <Link to="/pooja">पूजा</Link>
            {pooja.category_slug && <><span>›</span><Link to={`/pooja/${pooja.category_slug}`}>{pooja.category_name}</Link></>}
            <span>›</span>
            <span>{pooja.name_mr}</span>
          </div>
        </div>

        <div className="container">
          <div className={styles.layout}>
            {/* LEFT: Details */}
            <div className={styles.details}>
              <div className={styles.imageWrap}>
                <img
                  src={getImageUrl(pooja.image_url)}
                  alt={pooja.name_mr}
                  onError={e => { e.target.src = POOJA_PLACEHOLDER; }}
                />
                {pooja.is_featured && <span className={styles.featuredBadge}><FaStar style={{marginRight:4}}/> लोकप्रिय</span>}
              </div>

              <div className={styles.info}>
                <span className={styles.category}>{pooja.category_name}</span>
                <h1 className={styles.title}>{pooja.name_mr}</h1>
                {pooja.name_en && <p className={styles.titleEn}>{pooja.name_en}</p>}
                <div className={styles.metaRow}>
                  {pooja.duration_hrs && (
                    <span className={styles.metaBadge}><FaClock style={{marginRight:4}}/>{pooja.duration_hrs} तास</span>
                  )}
                  <span className={styles.metaBadge}>
                    <FaStar style={{color:'#f7c948',marginRight:4}}/>{pooja.avg_rating || '४.८'} ({reviews.length} अभिप्राय)
                  </span>
                </div>
                {pooja.description && <p className={styles.desc}>{pooja.description}</p>}

                {/* Tabs */}
                <div className={styles.tabs}>
                  {[
                    { key: 'samagri', label: <><FaCartShopping style={{marginRight:5}}/> सामग्री यादी</> },
                    { key: 'steps',   label: <><FaListCheck style={{marginRight:5}}/> विधी चरण</>     },
                    { key: 'pujari',  label: <><FaLocationDot style={{marginRight:5}}/> जवळचे पुजारी</> },
                    { key: 'reviews', label: <><FaStar style={{marginRight:5}}/> अभिप्राय</>          },
                  ].map(t => (
                    <button
                      key={t.key}
                      className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                      onClick={() => {
                        setTab(t.key);
                        if (t.key === 'pujari' && !nearbyFetched) detectAndFetch();
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                  {tab === 'samagri' && (
                    <div>
                      <h3 className={styles.tabTitle}>आवश्यक सामग्री</h3>
                      {samagri.length === 0
                        ? <p className={styles.tabEmpty}>सामग्री यादी लवकरच उपलब्ध होईल.</p>
                        : <ul className={styles.samagriList}>
                            {samagri.map(item => (
                              <li key={item.id} className={styles.samagriItem}>
                                <span className={styles.samagriDot}><GiFlowerEmblem /></span>
                                <span className={styles.samagriName}>{item.name_mr}</span>
                                {(item.quantity || item.unit) && (
                                  <span className={styles.samagriQty}>
                                    {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                      }
                    </div>
                  )}
                  {tab === 'steps' && (
                    <div>
                      <h3 className={styles.tabTitle}>विधी चरण</h3>
                      {steps.length === 0
                        ? <p className={styles.tabEmpty}>चरण यादी लवकरच उपलब्ध होईल.</p>
                        : <ol className={styles.stepList}>
                            {steps.map((step, i) => (
                              <li key={i} className={styles.stepItem}>
                                <span className={styles.stepNum}>{i + 1}</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ol>
                      }
                    </div>
                  )}
                  {tab === 'reviews' && (
                    <div>
                      <h3 className={styles.tabTitle}>ग्राहकांचे अभिप्राय</h3>
                      {reviews.length === 0
                        ? <p className={styles.tabEmpty}>अद्याप कोणताही अभिप्राय नाही.</p>
                        : reviews.map(r => (
                            <div key={r.id} className={styles.reviewItem}>
                              <div className={styles.reviewHeader}>
                                <strong>{r.user_name}</strong>
                                <span>{'⭐'.repeat(r.rating)}</span>
                              </div>
                              <p>{r.comment}</p>
                            </div>
                          ))
                      }
                    </div>
                  )}
                  {tab === 'pujari' && (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                        <h3 className={styles.tabTitle} style={{ margin: 0 }}>जवळचे पुजारी</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            style={{ border: '1px solid #ddd', borderRadius: 8, padding: '6px 12px', fontSize: 14, flex: 1, minWidth: 0 }}
                            placeholder="शहर टाका..."
                            value={nearbyCity}
                            onChange={e => setNearbyCity(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchNearbyPujaris(nearbyCity, nearbyCoords, nearbyDistrict)}
                          />
                          <button
                            onClick={() => fetchNearbyPujaris(nearbyCity, nearbyCoords, nearbyDistrict)}
                            style={{ background: '#e07b2a', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 14 }}
                          >
                            शोधा
                          </button>
                          <button
                            onClick={detectAndFetch}
                            style={{ background: '#f5f5f5', color: '#555', border: '1px solid #ddd', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <FaLocationDot /> GPS
                          </button>
                        </div>
                      </div>

                      {nearbyLoading ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                          <div className="spinner" />
                        </div>
                      ) : nearbyFetched && nearbyPujaris.length === 0 ? (
                        <p style={{ color: '#888', fontSize: 14, margin: 0 }}>
                          {nearbyDistrict
                            ? `${nearbyDistrict} जिल्ह्यात`
                            : nearbyCity ? `${nearbyCity} परिसरात` : 'जवळपास'}{' '}
                          अद्याप पुजारी नोंदणीकृत नाहीत. बुकिंग केल्यावर आम्ही मॅन्युअली पुजारी नियुक्त करतो.
                        </p>
                      ) : nearbyPujaris.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                          {nearbyPujaris.map(p => (
                            <div
                              key={p.id}
                              onClick={() => navigate(`/pujari/${p.id}`, { state: { poojaSlug: pooja.slug, poojaName: pooja.name_mr } })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 10,
                                border: '1px solid #f0e0c8', background: '#fdf6ee',
                                cursor: 'pointer', transition: 'box-shadow 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(179,92,0,0.15)'}
                              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                            >
                              <div style={{
                                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                                background: 'linear-gradient(135deg,#FF8C00,#E07B2A)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 20, overflow: 'hidden',
                              }}>
                                {p.photo_url
                                  ? <img src={getImageUrl(p.photo_url)} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : '🙏'}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.full_name}</div>
                                <div style={{ fontSize: 12, color: '#888' }}>
                                  {p.city}
                                  {p.distance_km != null && <span style={{ color: '#b35c00', fontWeight: 600 }}> • {p.distance_km} km</span>}
                                  {p.experience_yrs > 0 && ` • ${p.experience_yrs}yr`}
                                </div>
                                <div style={{ fontSize: 12, color: '#f7c948', fontWeight: 700 }}>
                                  ⭐ {p.avg_rating || '—'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>
                          शहर टाका किंवा GPS वापरा — {pooja.name_mr} साठी जवळचे पुजारी दिसतील.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Booking Panel */}
            <div className={styles.bookPanel}>
              <div className={styles.bookCard}>
                {/* Verified trust badge */}
                <div className={styles.verifiedStrip}>
                  <span className={styles.verifiedIcon}>✅</span>
                  <div>
                    <strong>सत्यापित पुजारी सेवा</strong>
                    <p>सर्व पुजारी प्रशिक्षित व अनुभवी</p>
                  </div>
                </div>

                <h2 className={styles.bookPrice}>
                  ₹{Number(pooja.price).toLocaleString('mr-IN')}
                </h2>
                <p className={styles.bookPriceSub}>सर्व सामग्रीसह</p>
                <div className={styles.bookFeatures}>
                  <div className={styles.bookFeature}><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> सत्यापित अनुभवी पुजारी</div>
                  <div className={styles.bookFeature}><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> वेळेवर सेवा</div>
                  <div className={styles.bookFeature}><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> पारंपरिक विधी</div>
                  <div className={styles.bookFeature}><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> {pooja.duration_hrs} तास सेवा</div>
                </div>
                <button
                  className={`btn btn-primary btn-lg ${styles.bookBtn}`}
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else navigate(`/booking/${slug}`);
                  }}
                >
                  <FaFire style={{marginRight:6}}/> आता बुक करा
                </button>
                <a
                  href={`https://wa.me/9561903219?text=मला ${pooja.name_mr} बुक करायची आहे.`}
                  target="_blank" rel="noreferrer"
                  className={`btn btn-secondary ${styles.waBtn}`}
                >
                  <FaWhatsapp style={{marginRight:6}}/> WhatsApp वर चौकशी करा
                </a>
                <p className={styles.bookNote}>
                  <FaLock style={{marginRight:6}}/> सुरक्षित पेमेंट — Razorpay द्वारे
                </p>
              </div>

              {/* Why book here */}
              <div className={styles.whyBox}>
                <h3>आमची हमी</h3>
                <div><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> मंजूर आणि अनुभवी पुजारी</div>
                <div><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> बुकिंग रद्द केल्यास पूर्ण परतावा</div>
                <div><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> २४x७ ग्राहक सेवा</div>
                <div><FaCircleCheck style={{color:'#22c55e',marginRight:6}}/> पूजेनंतर अभिप्राय द्या</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
