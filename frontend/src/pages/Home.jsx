// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PoojaCard from '../components/common/PoojaCard';
import { poojaAPI } from '../api/index.js';
import styles from './Home.module.css';

const CATEGORIES = [
  { slug: 'gruh-pooja',     icon: '🏠', label: 'गृह पूजा',         desc: 'बाळ शॉवर, साखरपुडा, सत्यनारायण' },
  { slug: 'havan-jaap',     icon: '🔥', label: 'हवन / जाप',        desc: 'नवग्रह, महा मृत्युंजय, लक्ष्मी' },
  { slug: 'katha-nitya',    icon: '📿', label: 'कथा / नित्य पूजा', desc: 'रुद्राभिषेक, मंगळागौरी' },
  { slug: 'pitru-shraddha', icon: '🕯️', label: 'पित्रुश्राद्ध',   desc: 'दशक्रिया, बारावे, तेरावे विधी' },
  { slug: 'utsav-pooja',    icon: '🎉', label: 'उत्सव पूजा',       desc: 'गणपती, नवरात्री, दिवाळी' },
  { slug: 'vastu-pooja',    icon: '🏗️', label: 'वास्तू पूजा',     desc: 'गृहप्रवेश, भूमिपूजन' },
  { slug: 'adhyatmik-seva', icon: '🙏', label: 'आध्यात्मिक सेवा',  desc: 'पाठ, अनुष्ठान, कीर्तन' },
  { slug: 'lagn-hall',      icon: '🏛️', label: 'हॉल बुकिंग',      desc: 'लग्नसमारंभ व कार्यक्रम' },
];

const STEPS = [
  { icon: '💻', step: '१', title: 'पूजा निवडा',       desc: 'आपल्या इच्छित पूजेची श्रेणी निवडा आणि बुकिंग करा.' },
  { icon: '📲', step: '२', title: 'पुजारी नियुक्त',   desc: 'आम्ही आपल्यासाठी विश्वासू आणि अनुभवी पुजारी निवडतो.' },
  { icon: '✅', step: '३', title: 'पेमेंट करा',       desc: 'सुरक्षित ऑनलाईन पेमेंट — Razorpay द्वारे.' },
  { icon: '🪔', step: '४', title: 'पूजा संपन्न',      desc: 'पुजारी घरी येऊन पूर्ण विधीसह पूजा करतात.' },
];

const TESTIMONIALS = [
  { name: 'नेहा शिंदे',    city: 'रत्नागिरी',   text: 'पुजारी वेळेवर आले, सामग्री सुद्धा आणली. आमचे कुटुंब खूप प्रभावित झाले!',          rating: 5 },
  { name: 'राहुल देशमुख',  city: 'कोल्हापूर',   text: 'सत्यनारायण पूजेसाठी बुकिंग केली — एकही फोन न करता सर्व व्यवस्था झाली.',          rating: 5 },
  { name: 'सुनीता जोशी',   city: 'नाशिक',       text: 'गणेश चतुर्थीची पूजा पहिल्यांदा ऑनलाईन बुक केली — अनुभव अप्रतिम होता!',           rating: 5 },
  { name: 'अजित पाटील',    city: 'पुणे',         text: 'दशक्रिया विधी साठी खूपच उपयुक्त. पुजाऱ्यांनी सर्व विधी अत्यंत भक्तीभावाने केले.', rating: 5 },
];

const STATS = [
  { value: '५००+', label: 'विश्वासू पुजारी'  },
  { value: '१०,०००+', label: 'यशस्वी बुकिंग्ज' },
  { value: '५०+', label: 'शहरे व तालुके'    },
  { value: '४.८⭐', label: 'सरासरी रेटिंग'   },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    poojaAPI.getPoojas({ featured: true, limit: 8 })
      .then(res => setFeatured(res.data.data.poojas || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <Header />
      <main>
        {/* ── HERO ──────────────────────────────────────────── */}
        <section className={styles.hero}>
          <div className={styles.heroBg}>
            <div className={styles.heroOrb1}/><div className={styles.heroOrb2}/>
          </div>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroContent}>
              <div className={styles.heroPill}>🙏 महाराष्ट्रातील #१ पूजा बुकिंग सेवा</div>
              <h1 className={styles.heroTitle}>
                घरी पूजा,<br/>
                <span className={styles.heroHighlight}>मनासारखी</span>
              </h1>
              <p className={styles.heroDesc}>
                विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी — सर्व एकाच क्लिकवर.
                गृहपूजा पासून श्राद्ध विधीपर्यंत, आम्ही आपल्यासोबत आहोत.
              </p>
              <div className={styles.heroCta}>
                <Link to="/pooja" className="btn btn-primary btn-lg">पूजा बुक करा 🪔</Link>
                <Link to="/pujari-nondni" className="btn btn-secondary btn-lg">पुजारी व्हा</Link>
              </div>
              <div className={styles.heroStats}>
                {STATS.map(s => (
                  <div key={s.label} className={styles.heroStat}>
                    <span className={styles.heroStatVal}>{s.value}</span>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.heroIllus}>
              <div className={styles.heroCard}>
                <div className={styles.heroEmoji} style={{ animationDelay: '0s' }}>🪔</div>
                <div className={styles.heroEmoji} style={{ animationDelay: '0.5s' }}>🌸</div>
                <div className={styles.heroEmoji} style={{ animationDelay: '1s' }}>🛕</div>
                <div className={styles.heroEmoji} style={{ animationDelay: '1.5s' }}>📿</div>
                <div className={styles.omSymbol}>ॐ</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────── */}
        <section className={`section section-alt ${styles.howSection}`}>
          <div className="container">
            <div className="section-heading">
              <h2>कसे काम करते?</h2>
              <p>फक्त ४ सोप्या चरणांमध्ये आपल्या घरी पूजा</p>
            </div>
            <div className={`grid-4 stagger-children ${styles.steps}`}>
              {STEPS.map((s, i) => (
                <div key={i} className={`${styles.step} animate-fadeInUp`}>
                  <div className={styles.stepNum}>{s.step}</div>
                  <div className={styles.stepIcon}>{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  {i < STEPS.length - 1 && <div className={styles.stepArrow}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ────────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <h2>पूजा श्रेणी</h2>
              <p>आपल्या गरजेनुसार पूजा निवडा</p>
            </div>
            <div className={`grid-4 stagger-children ${styles.catGrid}`}>
              {CATEGORIES.map((cat, i) => (
                <Link
                  key={cat.slug}
                  to={`/pooja/${cat.slug}`}
                  className={`animate-fadeInUp ${styles.catCard}`}
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <span className={styles.catIcon}>{cat.icon}</span>
                  <h3>{cat.label}</h3>
                  <p>{cat.desc}</p>
                  <span className={styles.catArrow}>पहा →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURED POOJAS ───────────────────────────────── */}
        <section className="section section-alt om-bg">
          <div className="container">
            <div className="section-heading">
              <h2>लोकप्रिय पूजा</h2>
              <p>सर्वाधिक बुक केल्या जाणाऱ्या पूजा</p>
            </div>
            {loading ? (
              <div className="page-loader">
                <div className="spinner"/>
                <p>पूजा यादी लोड होत आहे...</p>
              </div>
            ) : (
              <div className={`grid-4 ${styles.poojaGrid}`}>
                {featured.length > 0
                  ? featured.map(p => <PoojaCard key={p.id} pooja={p}/>)
                  : MOCK_POOJAS.map(p => <PoojaCard key={p.id} pooja={p}/>)
                }
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <Link to="/pooja" className="btn btn-primary btn-lg">सर्व पूजा पहा</Link>
            </div>
          </div>
        </section>

        {/* ── CTA SPLIT ─────────────────────────────────────── */}
        <section className={styles.ctaSplit}>
          <div className="container">
            <div className={styles.ctaGrid}>
              <div className={`${styles.ctaCard} ${styles.ctaBook}`}>
                <span className={styles.ctaIcon}>🪔</span>
                <h2>पूजा बुक करा</h2>
                <p>आपल्या शुभ प्रसंगासाठी विश्वासू पुजारी मिळवा</p>
                <Link to="/pooja" className="btn btn-gold btn-lg">आता बुक करा</Link>
              </div>
              <div className={`${styles.ctaCard} ${styles.ctaPujari}`}>
                <span className={styles.ctaIcon}>📋</span>
                <h2>पुजारी म्हणून नोंदणी करा</h2>
                <p>आपले ज्ञान आणि अनुभव शेअर करा, जास्त कमाई करा</p>
                <Link to="/pujari-nondni" className="btn btn-secondary btn-lg">नोंदणी करा</Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div className="section-heading">
              <h2>ग्राहकांचे अभिप्राय</h2>
              <p>प्रत्येक बुकिंग एक आठवण बनते</p>
            </div>
            <div className={`grid-4 stagger-children`}>
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className={`${styles.review} animate-fadeInUp`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={styles.reviewStars}>{'⭐'.repeat(t.rating)}</div>
                  <p className={styles.reviewText}>"{t.text}"</p>
                  <div className={styles.reviewer}>
                    <div className={styles.reviewerAvatar}>{t.name[0]}</div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// Fallback mock data when API is not connected
const MOCK_POOJAS = [
  { id: 1, name_mr: 'सत्यनारायण पूजा',  slug: 'satyanarayan-pooja',  price: 3963, duration_hrs: 3, category_name: 'गृह पूजा',     is_featured: true,  short_desc: 'घरामध्ये सुख-समृद्धी आणि ईश्वरी आशीर्वादासाठी.' },
  { id: 2, name_mr: 'गृहप्रवेश पूजा',   slug: 'gruhpravesh-gruhshanti',price: 6372, duration_hrs: 4, category_name: 'वास्तू पूजा',  is_featured: true,  short_desc: 'नवीन घरात प्रवेश करताना केली जाणारी शुभ पूजा.' },
  { id: 3, name_mr: 'दशक्रिया विधी',    slug: 'dashkriya-vidhi',      price: 4500, duration_hrs: 3, category_name: 'पित्रुश्राद्ध', is_featured: true, short_desc: 'मृत्यूनंतर दहाव्या दिवशी पिंडदान, तर्पण विधी.' },
  { id: 4, name_mr: 'महा मृत्युंजय जाप',slug: 'maha-mrityunjay-jap',  price: 5097, duration_hrs: 3, category_name: 'हवन / जाप',   is_featured: true,  short_desc: 'दीर्घायुष्यासाठी केला जाणारा पवित्र जाप.' },
  { id: 5, name_mr: 'गणपती स्थापना',    slug: 'ganpati-sthapna',      price: 5098, duration_hrs: 2, category_name: 'उत्सव पूजा',  is_featured: true,  short_desc: 'गणेशोत्सवाच्या पहिल्या दिवशी स्थापना विधी.' },
  { id: 6, name_mr: 'लक्ष्मी पूजन',     slug: 'lakshmi-poojan-diwali',price: 3682, duration_hrs: 2, category_name: 'उत्सव पूजा',  is_featured: true,  short_desc: 'दिवाळीच्या रात्री धन-संपत्तीसाठी पूजा.' },
  { id: 7, name_mr: 'रुद्राभिषेक',      slug: 'rudra-abhishek',       price: 3540, duration_hrs: 2, category_name: 'कथा / नित्य', is_featured: true,  short_desc: 'भगवान शंकराला अभिषेक करण्याचा पवित्र विधी.' },
  { id: 8, name_mr: 'नवग्रह हवन',       slug: 'navgraha-shanti-havan',price: 5098, duration_hrs: 4, category_name: 'हवन / जाप',   is_featured: true,  short_desc: 'नऊ ग्रहांच्या दोषांपासून मुक्तीसाठी हवन.' },
];
