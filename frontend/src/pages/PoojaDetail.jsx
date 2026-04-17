// src/pages/PoojaDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { poojaAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, POOJA_PLACEHOLDER } from '../utils/index.js';
import styles from './PoojaDetail.module.css';

export default function PoojaDetail() {
  const { slug }      = useParams();
  const { isAuthenticated } = useAuth();
  const navigate      = useNavigate();
  const [pooja,  setPooja]  = useState(null);
  const [loading,setLoading]= useState(true);
  const [tab,    setTab]    = useState('samagri'); // samagri | steps | reviews

  useEffect(() => {
    poojaAPI.getPoojaBySlug(slug)
      .then(r => setPooja(r.data.data))
      .catch(() => setPooja(null))
      .finally(() => setLoading(false));
  }, [slug]);

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
                {pooja.is_featured && <span className={styles.featuredBadge}>⭐ लोकप्रिय</span>}
              </div>

              <div className={styles.info}>
                <span className={styles.category}>{pooja.category_name}</span>
                <h1 className={styles.title}>{pooja.name_mr}</h1>
                {pooja.name_en && <p className={styles.titleEn}>{pooja.name_en}</p>}
                <div className={styles.metaRow}>
                  {pooja.duration_hrs && (
                    <span className={styles.metaBadge}>⏱ {pooja.duration_hrs} तास</span>
                  )}
                  <span className={styles.metaBadge}>
                    ⭐ {pooja.avg_rating || '४.८'} ({reviews.length} अभिप्राय)
                  </span>
                </div>
                <p className={styles.desc}>{pooja.description}</p>

                {/* Tabs */}
                <div className={styles.tabs}>
                  {[
                    { key: 'samagri', label: '🛒 सामग्री यादी' },
                    { key: 'steps',   label: '📋 विधी चरण'     },
                    { key: 'reviews', label: '⭐ अभिप्राय'      },
                  ].map(t => (
                    <button
                      key={t.key}
                      className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                      onClick={() => setTab(t.key)}
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
                                <span className={styles.samagriDot}>🌸</span>
                                <span className={styles.samagriName}>{item.name_mr}</span>
                                {item.quantity && <span className={styles.samagriQty}>{item.quantity}</span>}
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
                </div>
              </div>
            </div>

            {/* RIGHT: Booking Panel */}
            <div className={styles.bookPanel}>
              <div className={styles.bookCard}>
                <h2 className={styles.bookPrice}>
                  ₹{Number(pooja.price).toLocaleString('mr-IN')}
                </h2>
                <p className={styles.bookPriceSub}>सर्व सामग्रीसह</p>
                <div className={styles.bookFeatures}>
                  <div className={styles.bookFeature}><span>✅</span> अनुभवी पुजारी</div>
                  <div className={styles.bookFeature}><span>✅</span> वेळेवर सेवा</div>
                  <div className={styles.bookFeature}><span>✅</span> पारंपरिक विधी</div>
                  <div className={styles.bookFeature}><span>✅</span> {pooja.duration_hrs} तास सेवा</div>
                </div>
                <button
                  className={`btn btn-primary btn-lg ${styles.bookBtn}`}
                  onClick={() => {
                    if (!isAuthenticated) navigate('/login');
                    else navigate(`/booking/${slug}`);
                  }}
                >
                  🪔 आता बुक करा
                </button>
                <a
                  href={`https://wa.me/9307720459?text=मला ${pooja.name_mr} बुक करायची आहे.`}
                  target="_blank" rel="noreferrer"
                  className={`btn btn-secondary ${styles.waBtn}`}
                >
                  💬 WhatsApp वर चौकशी करा
                </a>
                <p className={styles.bookNote}>
                  🔒 सुरक्षित पेमेंट — Razorpay द्वारे
                </p>
              </div>

              {/* Why book here */}
              <div className={styles.whyBox}>
                <h3>आमची हमी</h3>
                <div>✅ मंजूर आणि अनुभवी पुजारी</div>
                <div>✅ बुकिंग रद्द केल्यास पूर्ण परतावा</div>
                <div>✅ २४x७ ग्राहक सेवा</div>
                <div>✅ पूजेनंतर अभिप्राय द्या</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
