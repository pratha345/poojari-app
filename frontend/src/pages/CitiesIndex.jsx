// src/pages/CitiesIndex.jsx — Pan-India cities with state-wise grouping + NRI section
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { useLang } from '../context/LanguageContext';
import T from '../i18n/translations';
import api from '../api/axios';
import styles from './CitiesIndex.module.css';

// City icons by slug
const CITY_ICONS = {
  // Maharashtra
  pune: '🌆', mumbai: '🏙️', nashik: '🍇', nagpur: '🟠',
  aurangabad: '🏯', kolhapur: '🏛️', solapur: '🕌', thane: '🏘️',
  satara: '⚔️', ratnagiri: '🐟', ahmednagar: '🌾', sangli: '🌻',
  // Delhi NCR
  delhi: '🏛️', noida: '🏙️',
  // Pilgrimage
  varanasi: '🕉️', prayagraj: '🌊', mathura: '🦚', lucknow: '🏰',
  // South India
  bangalore: '💻', hyderabad: '💎', chennai: '🌊', kochi: '⛵',
  // East
  kolkata: '🌸',
  // West / Central
  ahmedabad: '🪁', jaipur: '🌺', ujjain: '🔱', indore: '🏗️',
  // Punjab
  amritsar: '🪷',
};

// NRI / International country cards
const NRI_COUNTRIES = [
  { code: 'usa',       flag: '🇺🇸', name_en: 'United States',    name_mr: 'अमेरिका (USA)',     desc_en: 'New York, New Jersey, Chicago, Houston, Dallas, Atlanta', cities_mr: 'न्यूयॉर्क, ह्यूस्टन, शिकागो' },
  { code: 'uk',        flag: '🇬🇧', name_en: 'United Kingdom',    name_mr: 'ब्रिटन (UK)',        desc_en: 'London, Birmingham, Leicester, Manchester', cities_mr: 'लंडन, बर्मिंगहॅम, लेस्टर' },
  { code: 'uae',       flag: '🇦🇪', name_en: 'UAE',               name_mr: 'दुबई / UAE',         desc_en: 'Dubai, Abu Dhabi, Sharjah', cities_mr: 'दुबई, अबू धाबी, शारजाह' },
  { code: 'canada',    flag: '🇨🇦', name_en: 'Canada',            name_mr: 'कॅनडा',             desc_en: 'Toronto, Vancouver, Brampton, Mississauga', cities_mr: 'टोरोंटो, व्हँकुव्हर, ब्रॅम्प्टन' },
  { code: 'australia', flag: '🇦🇺', name_en: 'Australia',         name_mr: 'ऑस्ट्रेलिया',       desc_en: 'Sydney, Melbourne, Brisbane', cities_mr: 'सिडनी, मेलबर्न' },
  { code: 'other',     flag: '🌍', name_en: 'Other Countries',   name_mr: 'इतर देश',           desc_en: 'Singapore, New Zealand, Germany & more', cities_mr: 'सिंगापूर, जर्मनी व इतर' },
];

export default function CitiesIndex() {
  const { lang } = useLang();
  const t = T[lang];
  const [stateGroups, setStateGroups] = useState([]);
  const [activeState, setActiveState] = useState('all');

  useEffect(() => {
    api.get('/cities/by-state')
      .then(r => setStateGroups(r.data.data || []))
      .catch(() => {});
  }, []);

  // Maharashtra first, then alphabetical
  const sorted = [...stateGroups].sort((a, b) => {
    if (a.state_en === 'Maharashtra') return -1;
    if (b.state_en === 'Maharashtra') return 1;
    return a.state_en.localeCompare(b.state_en);
  });

  const visibleGroups = activeState === 'all'
    ? sorted
    : sorted.filter(s => s.state_en === activeState);

  const totalCities = stateGroups.reduce((n, s) => n + s.cities.length, 0);

  return (
    <div>
      <SEOHead
        title={lang === 'en'
          ? 'Book Pandit Online Across India | Puja Booking — Pojjari'
          : 'भारतभर पूजा बुकिंग | सर्व शहरांत अनुभवी पुजारी — पूजारी'}
        description={lang === 'en'
          ? 'Book experienced verified pandits for puja and havan across India — Maharashtra, Delhi, Bangalore, Hyderabad, Chennai, Kolkata and more.'
          : 'महाराष्ट्र, दिल्ली, बेंगळुरू, हैदराबाद, चेन्नई, कोलकाता — भारतभर अनुभवी सत्यापित पुजारी उपलब्ध.'}
        keywords="puja booking india, pandit near me all cities, book pandit online india, पूजा बुकिंग भारत"
        canonical="/cities"
      />
      <Header />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.breadcrumb}>
            <Link to="/">{lang === 'en' ? 'Home' : 'मुख्यपृष्ठ'}</Link>
            <span>›</span>
            <span>{lang === 'en' ? 'All Cities' : 'सर्व शहरे'}</span>
          </div>
          <h1 className={styles.heroTitle}>
            📍 {lang === 'en' ? 'Book Puja Across India' : 'भारतभर पूजा सेवा'}
          </h1>
          <p className={styles.heroSub}>
            {lang === 'en'
              ? `Maharashtra to Delhi, Bangalore to Kolkata — verified pandits in ${totalCities}+ cities.`
              : `महाराष्ट्र ते दिल्ली, बेंगळुरू ते कोलकाता — ${totalCities}+ शहरांत सत्यापित पुजारी उपलब्ध.`}
          </p>

          {/* Stats strip */}
          <div className={styles.heroStats}>
            <span>🏙️ {totalCities}+ {lang === 'en' ? 'Cities' : 'शहरे'}</span>
            <span>🙏 500+ {lang === 'en' ? 'Pandits' : 'पुजारी'}</span>
            <span>✅ 5,000+ {lang === 'en' ? 'Bookings' : 'बुकिंग'}</span>
            <span>🌍 {lang === 'en' ? 'NRI Support' : 'NRI सेवा'}</span>
          </div>
        </div>
      </section>

      {/* ── State Filter Tabs ─────────────────────────────────── */}
      <section className={styles.filterSection}>
        <div className="container">
          <div className={styles.filterScroll}>
            <button
              className={`${styles.filterTab} ${activeState === 'all' ? styles.filterActive : ''}`}
              onClick={() => setActiveState('all')}
            >
              🗺️ {lang === 'en' ? 'All India' : 'संपूर्ण भारत'}
            </button>
            {sorted.map(s => (
              <button
                key={s.state_en}
                className={`${styles.filterTab} ${activeState === s.state_en ? styles.filterActive : ''}`}
                onClick={() => setActiveState(s.state_en)}
              >
                {lang === 'en' ? s.state_en : s.state_mr}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── City Groups ───────────────────────────────────────── */}
      <section className={styles.main}>
        <div className="container">
          {visibleGroups.map(group => (
            <div key={group.state_en} className={styles.stateGroup}>
              <h2 className={styles.stateHeading}>
                <span className={styles.stateFlag}>
                  {group.state_en === 'Maharashtra' ? '🌼' :
                   group.state_en === 'Delhi'       ? '🏛️' :
                   group.state_en === 'Uttar Pradesh'? '🕉️' :
                   group.state_en === 'Karnataka'   ? '🌿' :
                   group.state_en === 'Telangana'   ? '💎' :
                   group.state_en === 'Tamil Nadu'  ? '🌴' :
                   group.state_en === 'West Bengal' ? '🌸' :
                   group.state_en === 'Gujarat'     ? '🪁' :
                   group.state_en === 'Rajasthan'   ? '🌺' :
                   group.state_en === 'Madhya Pradesh'? '🔱' :
                   group.state_en === 'Kerala'      ? '⛵' :
                   group.state_en === 'Punjab'      ? '🪷' : '📍'}
                </span>
                {lang === 'en' ? group.state_en : group.state_mr}
                <span className={styles.stateCount}>{group.cities.length} {lang === 'en' ? 'cities' : 'शहरे'}</span>
              </h2>

              <div className={styles.grid}>
                {group.cities.map(city => (
                  <Link key={city.slug} to={`/cities/${city.slug}`} className={styles.cityCard}>
                    <div className={styles.cityIcon}>{CITY_ICONS[city.slug] || '🏙️'}</div>
                    <h3 className={styles.cityName}>{lang === 'en' ? city.name_en : city.name_mr}</h3>
                    <p className={styles.cityTagline}>{city.tagline}</p>
                    <div className={styles.cityStats}>
                      <span>👨‍💼 {city.pujari_count}+ {lang === 'en' ? 'pandits' : 'पुजारी'}</span>
                      <span>✅ {city.booking_count}</span>
                    </div>
                    <span className={styles.cityLink}>
                      {lang === 'en' ? 'Book Puja →' : 'पूजा बुक करा →'}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── NRI / International Section ───────────────────────── */}
      <section className={styles.nriSection}>
        <div className="container">
          <div className={styles.nriHeader}>
            <h2 className={styles.nriTitle}>
              🌍 {lang === 'en' ? 'NRI / International Online Puja' : 'NRI / आंतरराष्ट्रीय ऑनलाइन पूजा'}
            </h2>
            <p className={styles.nriSub}>
              {lang === 'en'
                ? 'Living abroad? Book online puja via video call. Experienced pandits available for all countries.'
                : 'परदेशात राहता? व्हिडिओ कॉलद्वारे घरी बसून पूजा बुक करा. सर्व देशांसाठी अनुभवी पुजारी उपलब्ध.'}
            </p>
          </div>

          <div className={styles.nriGrid}>
            {NRI_COUNTRIES.map(c => (
              <Link
                key={c.code}
                to={`/online-puja?country=${c.code}`}
                className={styles.nriCard}
              >
                <span className={styles.nriFlag}>{c.flag}</span>
                <div className={styles.nriInfo}>
                  <h3 className={styles.nriCountry}>
                    {lang === 'en' ? c.name_en : c.name_mr}
                  </h3>
                  <p className={styles.nriCities}>
                    {lang === 'en' ? c.desc_en : c.cities_mr}
                  </p>
                </div>
                <span className={styles.nriArrow}>→</span>
              </Link>
            ))}
          </div>

          <div className={styles.nriCta}>
            <Link to="/online-puja" className="btn btn-primary btn-lg">
              💻 {lang === 'en' ? 'Book Online Puja for NRI' : 'NRI साठी ऑनलाइन पूजा बुक करा'}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Not Found CTA ─────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.cta}>
            <h2>{lang === 'en' ? 'Your city not listed?' : 'तुमचे शहर यादीत नाही?'}</h2>
            <p>{lang === 'en'
              ? 'Contact us on WhatsApp — we arrange pandits anywhere in India & abroad.'
              : 'WhatsApp वर संपर्क करा — भारतात व परदेशात कुठेही व्यवस्था करतो.'}
            </p>
            <div className={styles.ctaBtns}>
              <a href="https://wa.me/9561903219" target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
                💬 WhatsApp
              </a>
              <Link to="/online-puja" className="btn btn-secondary btn-lg">
                💻 {lang === 'en' ? 'Online Puja' : 'ऑनलाइन पूजा'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
