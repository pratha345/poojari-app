// src/pages/OnlinePuja.jsx — ऑनलाइन पूजा (Virtual Puja) landing page
import Icon3D from '../components/common/Icon3D';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import styles from './OnlinePuja.module.css';

const ONLINE_SERVICES = [
  { img: '3d/occ-grihapravesh', icon: '🏠',  name: 'गृहप्रवेश पूजा',       desc: 'नवीन घरात प्रवेशापूर्वी विधिपूर्वक पूजा',  slug: 'gruh-pravesh' },
  { img: '3d/occ-satyanarayan', icon: '🙏',  name: 'सत्यनारायण पूजा',      desc: 'घरी किंवा व्हिडिओ कॉलद्वारे संपूर्ण पूजा',  slug: 'satyanarayan' },
  { img: '3d/nav-havan', icon: '🔥',  name: 'हवन / जाप',            desc: 'ऑनलाइन हवन सेवा अनुभवी पुजारींसोबत',         slug: 'havan-jaap'   },
  { img: '3d/cat-utsav-pooja', icon: '⭐',  name: 'नवरात्री पूजा',         desc: 'माँ दुर्गेची नवरात्री पूजा व्हिडिओवर',       slug: 'utsav-pooja'  },
  { img: '3d/cat-vastu-pooja', icon: '🌙',  name: 'वास्तुशांती पूजा',      desc: 'वास्तूदोष निवारणासाठी ऑनलाइन पूजा',          slug: 'vastu-pooja'  },
  { img: '3d/cat-pitru-shraddha', icon: '🪔',  name: 'पितृश्राद्ध / तर्पण',  desc: 'पूर्वजांसाठी ऑनलाइन श्राद्ध विधी',           slug: 'pitru-shraddha'},
];

const HOW_IT_WORKS = [
  { step: '1', img: '3d/step-choose-puja', icon: '📱', title: 'पूजा बुक करा',       desc: 'आपल्या पसंतीची पूजा निवडा आणि तारीख व वेळ सेट करा.' },
  { step: '2', img: '3d/step-pujari-assigned', icon: '🧑‍💼', title: 'पुजारी नियुक्त होतो', desc: 'आम्ही सत्यापित व अनुभवी पुजारी तुमच्यासाठी नियुक्त करतो.' },
  { step: '3', img: '3d/step-video-call', icon: '💻', title: 'व्हिडिओ कॉल सुरू',  desc: 'ठरलेल्या वेळी WhatsApp / Zoom वर पुजारी जोडतात.' },
  { step: '4', img: '3d/step-puja-complete', icon: '🪔', title: 'पूजा संपन्न होते',   desc: 'घरी बसून पारंपरिक विधी पूर्ण होतो, आशीर्वाद मिळतो.' },
];

const BENEFITS = [
  { img: '3d/feat-worldwide', icon: '🌍', title: 'कुठूनही करा',        desc: 'USA, UK, UAE, Canada — जगात कुठेही असलात तरी पूजा करा.' },
  { img: '3d/feat-time-saving', icon: '⏰', title: 'वेळेची बचत',          desc: 'प्रवास नाही, तयारी कमी — फक्त भक्तिभावाने बसा.' },
  { img: '3d/feat-verified', icon: '✅', title: 'सत्यापित पुजारी',    desc: 'सर्व पुजारी प्रशिक्षित, अनुभवी आणि पोलीस सत्यापित.' },
  { img: '3d/feat-affordable', icon: '💰', title: 'परवडणाऱ्या किंमती', desc: 'प्रत्यक्ष पूजेपेक्षा कमी खर्चात संपूर्ण विधी.' },
  { img: '3d/feat-vedic-vidhi', icon: '📿', title: 'पारंपरिक विधी',      desc: 'वैदिक पद्धतीने संपूर्ण मंत्रोच्चार व विधी.' },
  { img: '3d/feat-support', icon: '📞', title: '२४x७ सहाय्य',        desc: 'बुकिंगपासून पूजेपर्यंत आमची टीम सदैव उपलब्ध.' },
];

const FAQS = [
  {
    q: 'ऑनलाइन पूजेसाठी काय लागते?',
    a: 'फक्त स्मार्टफोन किंवा लॅपटॉप आणि इंटरनेट कनेक्शन. पुजारी तुम्हाला आधी सांगतात कोणती साधी सामग्री घरी ठेवायची.',
  },
  {
    q: 'पूजा व्हिडिओ कॉलवर कशी होते?',
    a: 'बुकिंगनंतर पुजारी WhatsApp व्हिडिओ कॉल किंवा Zoom वर जोडतात. तुम्ही कॅमेरा चालू ठेवून विधीत सहभागी होता.',
  },
  {
    q: 'NRI साठी वेळ कसा ठरतो?',
    a: 'बुकिंगच्या वेळी तुमचा देश व टाइमझोन सांगा. आम्ही तुमच्या वेळेनुसार पुजारी उपलब्ध करतो.',
  },
  {
    q: 'पूजा रद्द केल्यास पैसे परत मिळतात का?',
    a: 'होय. पूजेच्या ४८ तास आधी रद्द केल्यास १००% परतावा मिळतो.',
  },
  {
    q: 'ऑनलाइन पूजा खरोखरच प्रभावी असते का?',
    a: 'होय. शास्त्रानुसार भाव महत्त्वाचा असतो, स्थान नाही. वैदिक मंत्र व विधी पूर्णपणे संपन्न होतात.',
  },
];

const NRI_COUNTRY_NAMES = {
  usa:       { flag: '🇺🇸', name: 'United States', msg: 'USA (EST/PST/CST/MST)' },
  uk:        { flag: '🇬🇧', name: 'United Kingdom', msg: 'UK (GMT/BST)' },
  uae:       { flag: '🇦🇪', name: 'UAE',            msg: 'UAE (GST, UTC+4)' },
  canada:    { flag: '🇨🇦', name: 'Canada',         msg: 'Canada (EST/PST)' },
  australia: { flag: '🇦🇺', name: 'Australia',      msg: 'Australia (AEST/AWST)' },
  other:     { flag: '🌍',   name: 'International',  msg: 'Your timezone' },
};

export default function OnlinePuja() {
  const [params] = useSearchParams();
  const countryCode = params.get('country') || '';
  const nriInfo = NRI_COUNTRY_NAMES[countryCode] || null;
  return (
    <div>
      <SEOHead
        title="NRI ऑनलाइन पूजा सेवा | USA UK UAE साठी व्हिडिओ कॉल पूजा — पूजारी"
        description="परदेशात राहणाऱ्या मराठी भक्तांसाठी ऑनलाइन पूजा — USA, UK, UAE, Canada, Australia. WhatsApp/Zoom वर अनुभवी पुजारी. आजच बुक करा."
        keywords="online puja for NRI, marathi puja USA, online puja UK, virtual puja Maharashtra, NRI puja booking, ऑनलाइन पूजा, video call puja, puja from abroad, marathi pandit online, online satyanarayan puja, online griha pravesh, परदेशातून पूजा"
        canonical="/online-puja"
        schema={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Service',
              'name': 'ऑनलाइन पूजा सेवा — पूजारी',
              'description': 'NRI आणि परदेशातील मराठी भक्तांसाठी व्हिडिओ कॉलद्वारे पूजा. USA, UK, UAE, Canada, Australia मध्ये उपलब्ध.',
              'url': 'https://pojjari.com/online-puja',
              'areaServed': [
                { '@type': 'Country', 'name': 'India' },
                { '@type': 'Country', 'name': 'United States' },
                { '@type': 'Country', 'name': 'United Kingdom' },
                { '@type': 'Country', 'name': 'United Arab Emirates' },
                { '@type': 'Country', 'name': 'Canada' },
                { '@type': 'Country', 'name': 'Australia' },
              ],
              'provider': { '@type': 'Organization', 'name': 'पूजारी', 'url': 'https://pojjari.com' },
            },
            {
              '@type': 'FAQPage',
              'mainEntity': [
                { '@type': 'Question', 'name': 'USA मधून ऑनलाइन पूजा कशी बुक करावी?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी वेबसाइटवर जाऊन ऑनलाइन पूजा निवडा. बुकिंगच्या वेळी USA टाइमझोन सांगा. आमचे पुजारी तुमच्या वेळेनुसार WhatsApp/Zoom वर उपलब्ध होतात.' } },
                { '@type': 'Question', 'name': 'ऑनलाइन पूजेसाठी घरी काय लागते?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'फक्त स्मार्टफोन/लॅपटॉप आणि इंटरनेट. पुजारी आधीच सांगतात कोणती साधी सामग्री ठेवायची.' } },
                { '@type': 'Question', 'name': 'ऑनलाइन पूजा खरोखर प्रभावी असते का?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'होय. शास्त्रानुसार भाव महत्त्वाचा असतो, स्थान नाही. वैदिक मंत्र व पूर्ण विधी संपन्न होतात.' } },
              ],
            },
          ],
        }}
      />
      <Header />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>💻 नवीन सेवा</span>
            <h1 className={styles.heroTitle}>
              घरी बसून करा पूजा<br />
              <span className={styles.heroHighlight}>व्हिडिओ कॉलद्वारे</span>
            </h1>
            {nriInfo ? (
              <div className={styles.nriBanner}>
                <span className={styles.nriBannerFlag}>{nriInfo.flag}</span>
                <div>
                  <strong>{nriInfo.name} साठी ऑनलाइन पूजा</strong>
                  <span> — {nriInfo.msg} मध्ये वेळ ठरवतो</span>
                </div>
              </div>
            ) : (
              <div className={styles.nriTagline}>
                🌍 <strong>परदेशातील मराठी भक्तांसाठी</strong> — आता घरबसल्या पूजा!
              </div>
            )}

            {/* Country chips — always visible */}
            <div className={styles.countryChips}>
              {[
                { code: 'usa',       flag: '🇺🇸', label: 'USA' },
                { code: 'uk',        flag: '🇬🇧', label: 'UK' },
                { code: 'uae',       flag: '🇦🇪', label: 'UAE' },
                { code: 'canada',    flag: '🇨🇦', label: 'Canada' },
                { code: 'australia', flag: '🇦🇺', label: 'Australia' },
                { code: 'other',     flag: '🌍',  label: 'इतर' },
              ].map(c => (
                <Link
                  key={c.code}
                  to={`/online-puja?country=${c.code}`}
                  className={`${styles.countryChip} ${countryCode === c.code ? styles.countryChipActive : ''}`}
                >
                  {c.flag} {c.label}
                </Link>
              ))}
            </div>

            <p className={styles.heroDesc}>
              परदेशात असलात तरी चालेल — आमचे अनुभवी पुजारी
              WhatsApp किंवा Zoom वर तुमच्यासाठी पारंपरिक विधी करतात.
              महाराष्ट्र, भारत आणि जगभरातील मराठी भक्तांसाठी उपलब्ध.
            </p>
            <div className={styles.heroTrust}>
              <span>✅ सत्यापित पुजारी</span>
              <span>🌍 जगभर उपलब्ध</span>
              <span>📞 WhatsApp / Zoom</span>
            </div>
            <div className={styles.heroCtas}>
              <Link to="/pooja" className="btn btn-primary btn-lg">
                🪔 ऑनलाइन पूजा बुक करा
              </Link>
              <a
                href="https://wa.me/9561903219?text=मला ऑनलाइन पूजा बुक करायची आहे."
                target="_blank" rel="noreferrer"
                className={`btn btn-secondary btn-lg ${styles.waBtn}`}
              >
                💬 WhatsApp वर चौकशी
              </a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.heroCard}>
              <div className={styles.videoIcon}>📹</div>
              <p className={styles.videoText}>Live पूजा सुरू आहे...</p>
              <div className={styles.videoParticipants}>
                <div className={styles.participant}>
                  <span>🧑‍💼</span>
                  <small>पुजारी</small>
                </div>
                <div className={styles.videoLine}>📡</div>
                <div className={styles.participant}>
                  <span>🙏</span>
                  <small>भक्त</small>
                </div>
              </div>
              <div className={styles.locationBadge}>🌍 USA → Maharashtra</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────── */}
      <section className={styles.howSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>कसे काम करते?</h2>
          <p className={styles.sectionSub}>फक्त ४ सोप्या पायऱ्यांमध्ये तुमची ऑनलाइन पूजा संपन्न होते</p>
          <div className={styles.howGrid}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className={styles.howCard}>
                <div className={styles.howStep}>{item.step}</div>
                <div className={styles.howIcon}>{item.img ? <Icon3D name={item.img} size={56} /> : item.icon}</div>
                <h3 className={styles.howTitle}>{item.title}</h3>
                <p className={styles.howDesc}>{item.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className={styles.howArrow}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Available Services ────────────────────────────────────── */}
      <section className={styles.servicesSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>ऑनलाइन उपलब्ध पूजा</h2>
          <p className={styles.sectionSub}>खाली दिलेल्या पूजांसाठी ऑनलाइन बुकिंग उपलब्ध आहे</p>
          <div className={styles.servicesGrid}>
            {ONLINE_SERVICES.map((s, i) => (
              <Link to={`/pooja/${s.slug}`} key={i} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{s.img ? <Icon3D name={s.img} size={56} /> : s.icon}</div>
                <h3 className={styles.serviceName}>{s.name}</h3>
                <p className={styles.serviceDesc}>{s.desc}</p>
                <span className={styles.serviceLink}>बुक करा →</span>
              </Link>
            ))}
          </div>
          <div className={styles.moreServices}>
            <Link to="/pooja" className="btn btn-secondary">
              सर्व पूजा पहा →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────── */}
      <section className={styles.benefitsSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>ऑनलाइन पूजेचे फायदे</h2>
          <div className={styles.benefitsGrid}>
            {BENEFITS.map((b, i) => (
              <div key={i} className={styles.benefitCard}>
                <div className={styles.benefitIcon}>{b.img ? <Icon3D name={b.img} size={52} /> : b.icon}</div>
                <h3 className={styles.benefitTitle}>{b.title}</h3>
                <p className={styles.benefitDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial strip ────────────────────────────────────── */}
      <section className={styles.testimonialSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>NRI भक्तांचे अनुभव</h2>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonialCard}>
              <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"अमेरिकेत राहून गृहप्रवेश पूजा करणे अशक्य वाटत होते. पण पूजारीमुळे आमची पूजा व्हिडिओ कॉलवर अत्यंत भक्तिपूर्वक झाली."</p>
              <strong>— श्रीमती कविता देशमुख, New Jersey, USA</strong>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"लंडनमधून सत्यनारायण पूजा केली. पुजारींनी अत्यंत शांतपणे मंत्रोच्चार करत पूजा संपन्न केली. खूप समाधान मिळाले."</p>
              <strong>— श्री. अनिल जोशी, London, UK</strong>
            </div>
            <div className={styles.testimonialCard}>
              <div className={styles.stars}>⭐⭐⭐⭐⭐</div>
              <p>"दुबईत असताना नवरात्रीत पूजा करायची होती. पूजारी सेवेमुळे घरच्यासारखी पूजा झाली. हे खरोखरच अप्रतिम आहे!"</p>
              <strong>— श्रीमती सुनिता पाटील, Dubai, UAE</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className={styles.faqSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>वारंवार विचारले जाणारे प्रश्न</h2>
          <div className={styles.faqList}>
            {FAQS.map((faq, i) => (
              <div key={i} className={styles.faqItem}>
                <h3 className={styles.faqQ}>❓ {faq.q}</h3>
                <p className={styles.faqA}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>आजच तुमची ऑनलाइन पूजा बुक करा</h2>
            <p>जगाच्या कोणत्याही कोपऱ्यातून पारंपरिक पूजेचा अनुभव घ्या</p>
            <div className={styles.ctaBtns}>
              <Link to="/pooja" className="btn btn-primary btn-lg">
                🪔 पूजा बुक करा
              </Link>
              <a
                href="https://wa.me/9561903219?text=मला ऑनलाइन पूजाबद्दल अधिक माहिती हवी आहे."
                target="_blank" rel="noreferrer"
                className={`btn btn-secondary btn-lg ${styles.waCtaBtn}`}
              >
                💬 WhatsApp करा
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
