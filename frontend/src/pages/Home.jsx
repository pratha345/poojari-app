// src/pages/Home.jsx — पूजारी • Dynamic Premium Homepage
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header    from '../components/layout/Header';
import Footer    from '../components/layout/Footer';
import PoojaCard from '../components/common/PoojaCard';
import SEOHead   from '../components/SEOHead';
import { poojaAPI, homeAPI, pujariAPI, adminAPI } from '../api/index.js';
import { useTheme } from '../context/ThemeContext';
import s from './Home.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

// Category → decorative icon mapping
const CAT_ICON = {
  'गृह पूजा':        '🏠', 'वास्तू पूजा':    '🏛️',
  'हवन / जाप':       '🔥', 'पित्रुश्राद्ध':   '🕯️',
  'उत्सव पूजा':      '🎉', 'कथा / नित्य':    '📿',
  'कथा / नित्य पूजा':'📿', 'ऑनलाइन पूजा':   '💻',
  'आध्यात्मिक सेवा': '🧘', 'हॉल बुकिंग':     '🏛️',
};

// ── Featured Puja Full-Width Slider ──────────────────────────
function FeaturedPoojaSlider({ poojas }) {
  const [current,   setCurrent]   = useState(0);
  const [visible,   setVisible]   = useState(true);
  const [failedIds, setFailedIds] = useState(new Set());
  const timerRef = useRef(null);

  // Only show poojas whose images haven't failed
  const items = poojas.filter(p => !failedIds.has(p.id));

  const goTo = useCallback((idx) => {
    if (items.length < 2) return;
    setVisible(false);
    setTimeout(() => { setCurrent(idx); setVisible(true); }, 350);
  }, [items.length]);

  const next = useCallback(() => goTo((current + 1) % items.length), [current, items.length, goTo]);
  const prev = useCallback(() => goTo((current - 1 + items.length) % items.length), [current, items.length, goTo]);

  useEffect(() => {
    if (items.length < 2) return;
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [items.length, next]);

  // Clamp current index if items shrink after failures
  useEffect(() => {
    if (items.length > 0 && current >= items.length) setCurrent(0);
  }, [items.length, current]);

  if (!items.length) return null;

  const pooja    = items[current];
  const gradClass = `pSliderGrad${current % 8}`;
  const imgSrc   = pooja.image_url
    ? (pooja.image_url.startsWith('http') ? pooja.image_url : `${BASE_URL}${pooja.image_url}`)
    : null;
  const showGrad = !imgSrc;

  return (
    <section className={s.pSlider}>
      {/* Background gradient layer — shown when no image or image fails */}
      <div
        className={`${s.pSliderBg} ${showGrad ? s[gradClass] : ''} ${visible ? s.pSliderBgVisible : s.pSliderBgHidden}`}
      />

      {/* Background image — removed from rotation permanently if it fails */}
      {imgSrc && (
        <img
          key={imgSrc}
          src={imgSrc}
          alt=""
          aria-hidden="true"
          className={`${s.pSliderBgImg} ${visible ? s.pSliderBgVisible : s.pSliderBgHidden}`}
          onError={() => setFailedIds(prev => new Set([...prev, pooja.id]))}
        />
      )}

      {/* Decorative elements — shown only on gradient (no-image) slides */}
      {showGrad && (
        <div className={s.pSliderDecor} aria-hidden="true">
          {/* Mandala rings */}
          <div className={s.pSliderRing1} />
          <div className={s.pSliderRing2} />
          <div className={s.pSliderRing3} />
          {/* Large category icon */}
          <span className={s.pSliderDecorIcon}>
            {CAT_ICON[pooja.category_name] || '🪔'}
          </span>
          {/* OM watermark */}
          <span className={s.pSliderOm}>ॐ</span>
        </div>
      )}

      {/* Dark overlay */}
      <div className={s.pSliderOverlay} />

      {/* Slide counter */}
      <div className={s.pSliderCounter}>{current + 1} / {items.length}</div>

      {/* Content — re-key on current to trigger animation */}
      <div className={`container ${s.pSliderContainer}`}>
        <div key={current} className={s.pSliderText}>
          {pooja.category_name && (
            <span className={s.pSliderCat}>{pooja.category_name}</span>
          )}
          <h2 className={s.pSliderTitle}>{pooja.name_mr}</h2>
          {pooja.short_desc && (
            <p className={s.pSliderDesc}>{pooja.short_desc}</p>
          )}
          <div className={s.pSliderMeta}>
            {pooja.price && (
              <span className={s.pSliderMetaItem}>
                💰 ₹{Number(pooja.price).toLocaleString('mr-IN')} पासून
              </span>
            )}
            {pooja.duration_hrs && (
              <span className={s.pSliderMetaItem}>
                ⏱ {pooja.duration_hrs} तास
              </span>
            )}
          </div>
          <div className={s.pSliderActions}>
            <Link to={`/booking/${pooja.slug}`} className={s.pSliderBtnPrimary}>
              🪔 पूजा बुक करा
            </Link>
            <Link to={`/vidhi/${pooja.slug}`} className={s.pSliderBtnSecondary}>
              अधिक पहा →
            </Link>
          </div>
        </div>
      </div>

      {/* Left arrow */}
      <button
        className={`${s.pSliderArrow} ${s.pSliderArrowLeft}`}
        onClick={() => { prev(); resetTimer(); }}
        aria-label="मागील पूजा"
      >‹</button>

      {/* Right arrow */}
      <button
        className={`${s.pSliderArrow} ${s.pSliderArrowRight}`}
        onClick={() => { next(); resetTimer(); }}
        aria-label="पुढील पूजा"
      >›</button>

      {/* Dots */}
      <div className={s.pSliderDots}>
        {items.map((_, i) => (
          <button
            key={i}
            className={`${s.pSliderDot} ${i === current ? s.pSliderDotActive : ''}`}
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function FestivalBanner({ name, imageUrl }) {
  const src = imageUrl?.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
  return (
    <section className={s.festivalBanner} aria-label={`${name} उत्सव बॅनर`}>
      {/* Decorative floating dots */}
      <span className={`${s.festDot} ${s.festDot1}`} style={{ width: 90,  height: 90,  top: '10%', right: '48%' }} />
      <span className={`${s.festDot} ${s.festDot2}`} style={{ width: 44,  height: 44,  bottom: '12%', right: '50%' }} />
      <span className={`${s.festDot} ${s.festDot3}`} style={{ width: 22,  height: 22,  top: '40%', left: '38%' }} />

      <div className={s.festivalBannerInner}>
        {/* LEFT: text */}
        <div className={s.festivalTextSide}>
          <div className={s.festivalTag}>
            <span className={s.festivalTagDot} />
            <span className={s.festivalTagText}>आत्ता सुरू आहे</span>
          </div>
          <h2 className={s.festivalName}>{name}</h2>
          <p className={s.festivalSub}>
            या शुभ मुहूर्तावर पूजा बुक करा<br />
            आणि घरात सुख-समृद्धी आणा.
          </p>
          <Link to="/pooja" className={s.festivalCta}>
            🪔 पूजा बुक करा
          </Link>
        </div>

        {/* RIGHT: festival image */}
        <div className={s.festivalImageSide}>
          <img
            src={src}
            alt={name}
            className={s.festivalImg}
            onError={e => { e.currentTarget.closest('section').style.display = 'none'; }}
          />
        </div>
      </div>
    </section>
  );
}

const SITE = 'https://pujari.mydashboard.site';

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE}/#webpage`,
      'url': `${SITE}/`,
      'name': 'पूजारी - घरी पूजा, मनासारखी',
      'description': 'महाराष्ट्रातील सर्वोत्तम ऑनलाइन पूजा बुकिंग सेवा',
      'inLanguage': 'mr',
      'isPartOf': { '@id': `${SITE}/#website` },
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE}/#business`,
      'name': 'पूजारी',
      'alternateName': 'Pojjari Puja Booking',
      'description': 'महाराष्ट्रातील सर्वोत्तम ऑनलाइन पूजा बुकिंग सेवा. अनुभवी पुजारी घरी बोलवा.',
      'url': `${SITE}/`,
      'telephone': '+91-9561903219',
      'email': 'support@pojjari.com',
      'image': `${SITE}/og-image.jpg`,
      'logo': `${SITE}/logo.webp`,
      'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Pune',
        'addressRegion': 'Maharashtra',
        'addressCountry': 'IN',
        'postalCode': '411001',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 18.5204,
        'longitude': 73.8567,
      },
      'areaServed': {
        '@type': 'State',
        'name': 'Maharashtra',
        'containedInPlace': { '@type': 'Country', 'name': 'India' },
      },
      'priceRange': '₹₹',
      'openingHoursSpecification': {
        '@type': 'OpeningHoursSpecification',
        'dayOfWeek': ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
        'opens': '06:00',
        'closes': '20:00',
      },
      'serviceType': 'Puja Booking Service',
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'पूजा सेवा',
        'itemListElement': [
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'सत्यनारायण पूजा' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'गृहप्रवेश पूजा' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'दशक्रिया विधी' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'रुद्राभिषेक' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'नवग्रह हवन' } },
        ]
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'reviewCount': '500',
        'bestRating': '5',
        'worstRating': '1',
      },
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'ऑनलाइन पूजा बुकिंग कसे करावे?',
          'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी वेबसाईटवर जाऊन इच्छित पूजा निवडा, तारीख व वेळ निश्चित करा, आणि सुरक्षित ऑनलाइन पेमेंट करा. पुजारी घरी येऊन संपूर्ण विधी करतात.' }
        },
        {
          '@type': 'Question',
          'name': 'पुजारी घरी येतात का?',
          'acceptedAnswer': { '@type': 'Answer', 'text': 'होय, आमचे सर्व पुजारी सामग्रीसह घरी येतात. महाराष्ट्रातील सर्व जिल्ह्यांमध्ये सेवा उपलब्ध आहे.' }
        },
        {
          '@type': 'Question',
          'name': 'कोणत्या पूजा बुक करता येतात?',
          'acceptedAnswer': { '@type': 'Answer', 'text': 'सत्यनारायण पूजा, गृहप्रवेश, दशक्रिया विधी, रुद्राभिषेक, नवग्रह हवन, लक्ष्मी पूजन, गणपती स्थापना व इतर सर्व पूजा बुक करता येतात.' }
        },
        {
          '@type': 'Question',
          'name': 'पूजेसाठी किती वेळ आधी बुकिंग करावे?',
          'acceptedAnswer': { '@type': 'Answer', 'text': 'शक्यतो २-३ दिवस आधी बुकिंग करणे उत्तम. तात्काळ बुकिंगसाठी आमच्या WhatsApp वर संपर्क करा: +91-9561903219.' }
        },
        {
          '@type': 'Question',
          'name': 'पूजेची साहित्य (सामग्री) कोण आणते?',
          'acceptedAnswer': { '@type': 'Answer', 'text': 'बुकिंग पूर्ण झाल्यावर पुजारी संपूर्ण साहित्याची यादी पाठवतात. तुम्ही स्वतः आणू शकता किंवा पुजारी सोबत आणू शकतात — हे बुकिंगच्या वेळी ठरवता येते.' }
        },
      ]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────
// STATIC FALLBACK DATA (shown if API is unavailable)
// ─────────────────────────────────────────────────────────────────

const DEFAULT_CONTENT = {
  title:         'आपल्या सर्व पूजा सेवांसाठी एक विश्वासार्ह स्थान',
  subtitle:      'घरी पूजा, मनासारखी',
  description:   'घरबसल्या पूजा बुक करा, अनुभवी पुजारी मिळवा, आणि सर्व धार्मिक विधी सहज पूर्ण करा.',
  button_text_1: 'पूजा बुक करा',
  button_text_2: 'अधिक जाणून घ्या',
  hero_image:    null,
  bg_image:      null,
  stat_bookings: '५,०००+',
  stat_pujaris:  '५००+',
  stat_cities:   '३५+',
  stat_years:    '५+',
};

const SEARCH_CATEGORIES = [
  { label: 'सर्व पूजा',          value: '' },
  { label: 'गृह पूजा',           value: 'gruh-pooja' },
  { label: 'हवन / जाप',          value: 'havan-jaap' },
  { label: 'कथा / नित्य पूजा',   value: 'katha-nitya' },
  { label: 'पित्रुश्राद्ध',       value: 'pitru-shraddha' },
  { label: 'उत्सव पूजा',         value: 'utsav-pooja' },
  { label: 'वास्तू पूजा',         value: 'vastu-pooja' },
];

// Quick-occasion chips — shown below the search bar on the homepage
const OCCASIONS = [
  { icon: '🏠', label: 'गृहप्रवेश',       href: '/pooja/vastu-pooja'                    },
  { icon: '🪔', label: 'सत्यनारायण',      href: '/pooja?search=सत्यनारायण'              },
  { icon: '💍', label: 'लग्न',            href: '/pooja?search=लग्न'                    },
  { icon: '👶', label: 'नामकरण',          href: '/pooja?search=नामकरण'                  },
  { icon: '🔥', label: 'हवन',             href: '/pooja/havan-jaap'                     },
  { icon: '🕯️', label: 'दशक्रिया',        href: '/pooja/pitru-shraddha'                 },
  { icon: '🐘', label: 'गणपती पूजा',      href: '/pooja?search=गणपती'                   },
  { icon: '🌟', label: 'नवग्रह शांती',     href: '/pooja?search=नवग्रह'                  },
  { icon: '🎓', label: 'मुंज',            href: '/pooja?search=मुंज'                    },
  { icon: '💡', label: 'दिवाळी पूजा',     href: '/pooja?search=दिवाळी'                  },
];

// City cards now link to dedicated SEO city pages
const MH_CITIES = [
  { name: 'मुंबई',       icon: '🌆', slug: 'mumbai'      },
  { name: 'पुणे',        icon: '🏛️', slug: 'pune'        },
  { name: 'नाशिक',      icon: '🕌', slug: 'nashik'      },
  { name: 'नागपूर',     icon: '🌳', slug: 'nagpur'      },
  { name: 'औरंगाबाद',  icon: '🏯', slug: 'aurangabad'  },
  { name: 'कोल्हापूर', icon: '⛩️', slug: 'kolhapur'    },
  { name: 'रत्नागिरी', icon: '🌊', slug: 'ratnagiri'   },
  { name: 'सोलापूर',   icon: '🌾', slug: 'solapur'     },
  { name: 'सातारा',    icon: '🏔️', slug: 'satara'      },
  { name: 'अहमदनगर',  icon: '🏺', slug: 'ahmednagar'  },
  { name: 'ठाणे',      icon: '🏙️', slug: 'thane'       },
  { name: 'सांगली',    icon: '🌻', slug: 'sangli'      },
  { name: 'नवी मुंबई', icon: '🏗️', slug: 'navi-mumbai' },
  { name: 'अमरावती',   icon: '🛕', slug: 'amravati'    },
  { name: 'जळगाव',     icon: '🌿', slug: 'jalgaon'     },
  { name: 'पालघर',     icon: '🌴', slug: 'palghar'     },
];

const QUICK_ACTIONS = [
  { icon: '📿', label: 'आजची पूजा बुक करा', sub: 'घरात किंवा मंदिरात', to: '/pooja',    accent: '#FF7A00' },
  { icon: '📅', label: 'पंचांग पहा',         sub: 'आजचे तिथी-नक्षत्र', to: '/panchang', accent: '#C62828' },
  { icon: '🔮', label: 'राशिभविष्य',         sub: 'आजचे भविष्य जाणा',   to: '/rashifal', accent: '#7B1FA2' },
];

const SERVICES = [
  { icon: '🙏', accent: '#D4AF37', title: 'पुजारी सेवा',          desc: 'वेदशास्त्रसंपन्न पुजारी घरी येऊन संपूर्ण विधी भक्तीभावाने करतात.', to: '/pooja',        badge: null },
  { icon: '💻', accent: '#FF7A00', title: 'ऑनलाइन पूजा — NRI',   desc: 'USA · UK · UAE · Canada — WhatsApp/Zoom वर पारंपरिक मराठी पूजा.', to: '/online-puja',  badge: '🌍 NRI' },
  { icon: '🏛️', accent: '#2E7D32', title: 'हॉल बुकिंग',          desc: 'लग्न · साखरपुडा · समारंभ. पूजारी + हॉल एकत्र बुक करा — फक्त पूजारीवर!', to: '/hall-booking', badge: '✨ युनिक' },
];

const STEPS = [
  { icon: '💻', num: '१', title: 'पूजा निवडा',     desc: 'इच्छित पूजेची श्रेणी निवडा आणि बुकिंग फॉर्म भरा.' },
  { icon: '📲', num: '२', title: 'पुजारी नियुक्त', desc: 'आम्ही आपल्यासाठी विश्वासू व अनुभवी पुजारी निवडतो.' },
  { icon: '💳', num: '३', title: 'पेमेंट करा',     desc: 'सुरक्षित ऑनलाइन पेमेंट — Razorpay द्वारे.' },
  { icon: '🪔', num: '४', title: 'पूजा संपन्न',    desc: 'पुजारी घरी येऊन पूर्ण विधीसह पूजा करतात.' },
];

const CATEGORIES = [
  { slug: 'gruh-pooja',     icon: '🏠', label: 'गृह पूजा',         desc: 'सत्यनारायण, साखरपुडा' },
  { slug: 'havan-jaap',     icon: '🔥', label: 'हवन / जाप',        desc: 'नवग्रह, महा मृत्युंजय' },
  { slug: 'katha-nitya',    icon: '📿', label: 'कथा / नित्य पूजा', desc: 'रुद्राभिषेक, मंगळागौरी' },
  { slug: 'pitru-shraddha', icon: '🕯️', label: 'पित्रुश्राद्ध',   desc: 'दशक्रिया, बारावे विधी' },
  { slug: 'utsav-pooja',    icon: '🎉', label: 'उत्सव पूजा',       desc: 'गणपती, नवरात्री, दिवाळी' },
  { slug: 'vastu-pooja',    icon: '🏗️', label: 'वास्तू पूजा',     desc: 'गृहप्रवेश, भूमिपूजन' },
  { slug: 'adhyatmik-seva', icon: '🧘', label: 'आध्यात्मिक सेवा',  desc: 'पाठ, अनुष्ठान, कीर्तन' },
  { slug: 'lagn-hall',      icon: '🏛️', label: 'हॉल बुकिंग',      desc: 'लग्नसमारंभ व कार्यक्रम', href: '/hall-booking' },
];

const TRUST = [
  { icon: '🔐', color: '#FF7A00', title: 'सत्यापित पुजारी',   desc: 'सर्व पुजारी ओळख-सत्यापित, अनुभवी आणि पारंपरिक ज्ञानसंपन्न.' },
  { icon: '⚡', color: '#C62828', title: 'सहज बुकिंग',        desc: 'काही मिनिटांत बुकिंग पूर्ण करा. कोणतीही गुंतागुंत नाही.' },
  { icon: '💸', color: '#D4AF37', title: 'परवडणाऱ्या किंमती', desc: 'कोणत्याही बजेटमध्ये उत्तम सेवा — कोणतेही छुपे शुल्क नाही.' },
  { icon: '🏠', color: '#2E7D32', title: 'घरपोच सेवा',        desc: 'पुजारी सामग्रीसह घरी येतो — आपण पूर्णतः निश्चिंत राहा.' },
];

const TESTIMONIALS = [
  { name: 'नेहा शिंदे',      city: 'रत्नागिरी', pooja: 'गृहप्रवेश पूजा',      rating: 5, text: 'पुजारी वेळेवर आले, सामग्री सुद्धा आणली. आमचे कुटुंब खूप प्रभावित झाले!' },
  { name: 'राहुल देशमुख',    city: 'कोल्हापूर', pooja: 'सत्यनारायण पूजा',     rating: 5, text: 'सत्यनारायण पूजेसाठी बुकिंग केली — एकही फोन न करता सर्व व्यवस्था झाली.' },
  { name: 'सुनीता जोशी',     city: 'नाशिक',     pooja: 'गणपती स्थापना',        rating: 5, text: 'गणेश चतुर्थीची पूजा पहिल्यांदा ऑनलाइन बुक केली — अनुभव अप्रतिम होता!' },
  { name: 'अजित पाटील',      city: 'पुणे',       pooja: 'दशक्रिया विधी',        rating: 5, text: 'दशक्रिया विधी साठी खूपच उपयुक्त. पुजाऱ्यांनी सर्व विधी भक्तीभावाने केले.' },
  { name: 'प्रिया कुलकर्णी', city: 'मुंबई',      pooja: 'नवग्रह शांती हवन',    rating: 5, text: 'नवग्रह हवनासाठी खूप अनुभवी पुजारी आले. मंत्रोच्चार इतका सुंदर होता की मन शांत झाले.' },
  { name: 'विकास मोरे',       city: 'नागपूर',     pooja: 'वास्तूशांती पूजा',    rating: 5, text: 'वास्तूशांती साठी उत्कृष्ट पुजारी. वेळेवर आले, साहित्य आणले, संपूर्ण विधी केला.' },
];

const MOCK_POOJAS = [
  { id:1, name_mr:'सत्यनारायण पूजा',   slug:'satyanarayan-pooja',     price:3963, duration_hrs:3, category_name:'गृह पूजा',       is_featured:true, short_desc:'घरामध्ये सुख-समृद्धी आणि ईश्वरी आशीर्वादासाठी.' },
  { id:2, name_mr:'गृहप्रवेश पूजा',    slug:'gruhpravesh-gruhshanti', price:6372, duration_hrs:4, category_name:'वास्तू पूजा',    is_featured:true, short_desc:'नवीन घरात प्रवेश करताना केली जाणारी शुभ पूजा.' },
  { id:3, name_mr:'दशक्रिया विधी',     slug:'dashkriya-vidhi',        price:4500, duration_hrs:3, category_name:'पित्रुश्राद्ध', is_featured:true, short_desc:'मृत्यूनंतर दहाव्या दिवशी पिंडदान, तर्पण विधी.' },
  { id:4, name_mr:'महा मृत्युंजय जाप', slug:'maha-mrityunjay-jap',    price:5097, duration_hrs:3, category_name:'हवन / जाप',     is_featured:true, short_desc:'दीर्घायुष्यासाठी केला जाणारा पवित्र जाप.' },
  { id:5, name_mr:'गणपती स्थापना',     slug:'ganpati-sthapna',        price:5098, duration_hrs:2, category_name:'उत्सव पूजा',    is_featured:true, short_desc:'गणेशोत्सवाच्या पहिल्या दिवशी स्थापना विधी.' },
  { id:6, name_mr:'लक्ष्मी पूजन',      slug:'lakshmi-poojan-diwali',  price:3682, duration_hrs:2, category_name:'उत्सव पूजा',    is_featured:true, short_desc:'दिवाळीच्या रात्री धन-संपत्तीसाठी पूजा.' },
  { id:7, name_mr:'रुद्राभिषेक',       slug:'rudra-abhishek',         price:3540, duration_hrs:2, category_name:'कथा / नित्य',   is_featured:true, short_desc:'भगवान शंकराला अभिषेक करण्याचा पवित्र विधी.' },
  { id:8, name_mr:'नवग्रह हवन',        slug:'navgraha-shanti-havan',  price:5098, duration_hrs:4, category_name:'हवन / जाप',     is_featured:true, short_desc:'नऊ ग्रहांच्या दोषांपासून मुक्तीसाठी हवन.' },
];

const MH_CITY_NAMES = [
  'मुंबई', 'पुणे', 'नाशिक', 'नागपूर', 'औरंगाबाद',
  'कोल्हापूर', 'रत्नागिरी', 'सोलापूर', 'सातारा', 'अहमदनगर', 'ठाणे', 'सांगली',
];

// ─────────────────────────────────────────────────────────────────
// NEARBY PUJARIS component
// ─────────────────────────────────────────────────────────────────
function NearbyPujaris() {
  const [pujaris,      setPujaris]      = useState([]);
  const [detectedCity, setDetectedCity] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [status,       setStatus]       = useState('idle'); // idle | detecting | loading | done | denied
  const [showPicker,   setShowPicker]   = useState(false);

  const fetchByCity = async (city) => {
    if (!city) return;
    setStatus('loading');
    try {
      const r = await pujariAPI.getNearbyPujaris({ city, limit: 6 });
      setPujaris(r.data.data || []);
    } catch { setPujaris([]); }
    setStatus('done');
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { setShowPicker(true); return; }
    setStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=mr`,
            { headers: { 'User-Agent': 'pojjari-app/1.0' } }
          );
          const data = await r.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.suburb ||
            data.address?.county || '';
          setDetectedCity(city);
          fetchByCity(city);
        } catch {
          setStatus('denied');
          setShowPicker(true);
        }
      },
      () => { setStatus('denied'); setShowPicker(true); }
    );
  };

  const handleCityPick = (city) => {
    setSelectedCity(city);
    setShowPicker(false);
    setDetectedCity(city);
    fetchByCity(city);
  };

  const displayCity = detectedCity || selectedCity;

  return (
    <section className="bg-white py-20">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className={`font-display text-3xl font-bold text-maroon-700 sm:text-4xl ${s.sectionTitle}`}>
            जवळचे पुजारी
          </h2>
          {displayCity
            ? <p className="mt-7 font-devanagari text-base text-maroon-700/60">📍 {displayCity} परिसरातील उपलब्ध पुजारी</p>
            : <p className="mt-7 font-devanagari text-base text-maroon-700/60">आपल्या शहरातील सर्वोत्तम पुजारी शोधा</p>
          }
        </div>

        {/* Location prompt */}
        {status === 'idle' && (
          <div className={s.locationPrompt}>
            <div className={s.locationPromptInner}>
              <span className={s.locationIcon}>📍</span>
              <div>
                <p className={s.locationTitle}>आपले स्थान सांगा</p>
                <p className={s.locationSub}>जवळचे अनुभवी पुजारी शोधण्यासाठी</p>
              </div>
              <div className={s.locationBtns}>
                <button className="btn btn-primary" onClick={detectLocation}>
                  📍 GPS वापरा
                </button>
                <button className="btn btn-secondary" onClick={() => setShowPicker(true)}>
                  शहर निवडा
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detecting */}
        {status === 'detecting' && (
          <div className={s.locationPrompt}>
            <div className={s.locationPromptInner}>
              <span className={s.locationIcon}>🔍</span>
              <p className={s.locationTitle}>स्थान शोधत आहे...</p>
            </div>
          </div>
        )}

        {/* City picker */}
        {showPicker && (
          <div className={s.cityPickerWrap}>
            <p className="font-devanagari text-sm text-maroon-700/60 mb-3 text-center">आपले शहर निवडा:</p>
            <div className={s.cityPickerGrid}>
              {MH_CITY_NAMES.map(city => (
                <button
                  key={city}
                  className={`${s.cityPickerBtn} ${selectedCity === city ? s.cityPickerActive : ''}`}
                  onClick={() => handleCityPick(city)}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="page-loader"><div className="spinner"/></div>
        )}

        {/* Results */}
        {status === 'done' && pujaris.length === 0 && (
          <div className={s.nearbyEmpty}>
            <span>🙏</span>
            <p>{displayCity} मध्ये सध्या कोणताही पुजारी उपलब्ध नाही.</p>
            <button className="btn btn-secondary" onClick={() => { setStatus('idle'); setShowPicker(true); }}>
              दुसरे शहर निवडा
            </button>
          </div>
        )}

        {status === 'done' && pujaris.length > 0 && (
          <>
            <div className={s.nearbyGrid}>
              {pujaris.map(p => (
                <NearbyPujariCard key={p.id} pujari={p} />
              ))}
            </div>
            <div className="mt-4 text-center">
              <button
                className="btn btn-secondary"
                onClick={() => { setStatus('idle'); setShowPicker(true); setPujaris([]); setDetectedCity(''); }}
              >
                शहर बदला
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function NearbyPujariCard({ pujari }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
  const photoSrc = pujari.photo_url
    ? (pujari.photo_url.startsWith('http') ? pujari.photo_url : `${BASE_URL}${pujari.photo_url}`)
    : null;
  const specs = (pujari.specializations || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 2);

  return (
    <div className={s.nearbyCard}>
      <div className={s.nearbyCardTop}>
        <div className={s.nearbyAvatar}>
          {photoSrc
            ? <img src={photoSrc} alt={`${pujari.full_name} — पुजारी${pujari.city ? ', ' + pujari.city : ''}`} />
            : <span>{pujari.full_name?.[0]}</span>
          }
          {pujari.is_available
            ? <span className={`${s.nearbyDot} ${s.nearbyDotOn}`}/>
            : <span className={`${s.nearbyDot} ${s.nearbyDotOff}`}/>
          }
        </div>
        <div className={s.nearbyInfo}>
          <h3 className={s.nearbyName}>{pujari.full_name}</h3>
          <p className={s.nearbyLoc}>📍 {pujari.city}</p>
          <div className={s.nearbyRating}>
            <span className={s.nearbyStars}>
              {'★'.repeat(Math.round(Number(pujari.avg_rating) || 0))}{'☆'.repeat(5 - Math.round(Number(pujari.avg_rating) || 0))}
            </span>
            <span className={s.nearbyRatingNum}>{Number(pujari.avg_rating || 0).toFixed(1)}</span>
            <span className={s.nearbyReviews}>({pujari.total_reviews || 0})</span>
          </div>
        </div>
      </div>

      <div className={s.nearbyMeta}>
        <span className={s.nearbyExp}>🎓 {pujari.experience_yrs || 0} वर्षे</span>
        {specs.map(sp => <span key={sp} className={s.nearbySpec}>{sp}</span>)}
      </div>

      <Link to={`/pujari/${pujari.id}`} className={`btn btn-secondary ${s.nearbyBtn}`}>
        प्रोफाईल पहा →
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SECTION HEADING component
// ─────────────────────────────────────────────────────────────────
function SectionHeading({ title, sub }) {
  return (
    <div className="mb-14 text-center">
      <h2 className={`font-display text-3xl font-bold text-maroon-700 sm:text-4xl ${s.sectionTitle}`}>
        {title}
      </h2>
      {sub && <p className="mt-7 font-devanagari text-base text-maroon-700/60">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HERO IMAGE SLIDER component
// ─────────────────────────────────────────────────────────────────
function HeroSlider({ sliders }) {
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((idx) => {
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (sliders.length < 2) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % sliders.length;
        setFading(true);
        setTimeout(() => setFading(false), 300);
        return next;
      });
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, [sliders.length]);

  if (!sliders.length) return null;

  const slide    = sliders[current];
  const slideImg = slide.image_url?.startsWith('http')
    ? slide.image_url
    : `${BASE_URL}${slide.image_url}`;

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-amber-50 to-orange-100/60">
      {/* Image */}
      <img
        src={slideImg}
        alt={slide.title ? `${slide.title} — पूजारी पूजा बुकिंग` : 'पूजारी — ऑनलाइन पूजा बुकिंग महाराष्ट्र'}
        className={`h-full w-full object-cover object-center transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}
      />

      {/* Caption overlay */}
      {slide.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-center">
          <p className="font-display text-sm font-bold text-white">{slide.title}</p>
        </div>
      )}

      {/* Dot indicators */}
      {sliders.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
          {sliders.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────
export default function Home() {
  const { festival_name, festival_image_url } = useTheme();
  const navigate = useNavigate();

  const [content,        setContent]        = useState(DEFAULT_CONTENT);
  const [sliders,        setSliders]        = useState([]);
  const [featured,       setFeatured]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [imgBroken,      setImgBroken]      = useState(false);
  const [searchCategory, setSearchCategory] = useState('');
  const [liveReviews,    setLiveReviews]    = useState([]);
  const [heroBgIdx,      setHeroBgIdx]      = useState(0);
  // Dual-layer crossfade: layer A and B, alternate which is "active" (visible)
  const [bgLayers,       setBgLayers]       = useState({ a: null, b: null, front: 'a' });
  const lastBgSrcRef = useRef(null);

  // Cycle hero background index every 7s
  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setHeroBgIdx(i => (i + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [featured.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchCategory) params.set('category', searchCategory);
    navigate(`/pooja${params.toString() ? '?' + params.toString() : ''}`);
  };

  useEffect(() => {
    // Load homepage dynamic content
    homeAPI.get()
      .then(r => {
        const { content: c, sliders: sl } = r.data.data;
        if (c) setContent({ ...DEFAULT_CONTENT, ...c });
        setSliders(sl || []);
      })
      .catch(() => {}); // silent fallback to defaults

    // Load featured poojas — only those with images go into the slider
    poojaAPI.getPoojas({ featured: true, limit: 20 })
      .then(r => {
        const all = r.data.data.poojas || [];
        const withImages = all.filter(p => p.image_url && p.image_url.trim() !== '');
        setFeatured(withImages);
      })
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));

    // Load real reviews from DB
    pujariAPI.getTopReviews(6)
      .then(r => setLiveReviews(r.data.data || []))
      .catch(() => {}); // silent — falls back to static TESTIMONIALS
  }, []);

  // Resolve uploaded image path → absolute URL
  const toAbs = (p) => !p ? null : p.startsWith('http') ? p : `${BASE_URL}${p}`;

  // hero right panel image — festival image takes priority when active
  const festImgSrc    = toAbs(festival_image_url);
  const heroSrc       = festImgSrc || toAbs(content.hero_image) || '/ganpati.png';
  const hasSlider     = sliders.length > 0;
  // Hero background: admin bg_image > festival image > featured pooja image (cycling)
  const heroBgFeatured = featured.length > 0 ? toAbs(featured[heroBgIdx]?.image_url) : null;
  const bgSrc         = festImgSrc || toAbs(content.bg_image) || toAbs(content.hero_image) || heroBgFeatured;

  // Crossfade: preload new bgSrc then swap layers — no blank flash between images
  useEffect(() => {
    if (!bgSrc || bgSrc === lastBgSrcRef.current) return;
    lastBgSrcRef.current = bgSrc;
    const img = new window.Image();
    img.onload = () => {
      setBgLayers(prev => {
        const next = prev.front === 'a' ? 'b' : 'a';
        return { ...prev, [next]: bgSrc, front: next };
      });
    };
    img.onerror = () => {};
    img.src = bgSrc;
  }, [bgSrc]);

  return (
    <div className="min-h-screen bg-theme-cream">
      <SEOHead
        title="घरी पूजा, मनासारखी | ऑनलाइन पूजा बुकिंग महाराष्ट्र"
        description="पूजारी - महाराष्ट्रातील सर्वोत्तम ऑनलाइन पूजा बुकिंग सेवा. अनुभवी पुजारी घरी बोलवा. सत्यनारायण, गृहप्रवेश, दशक्रिया, हवन, उत्सव पूजा बुक करा."
        keywords="online puja booking, pujari near me, घरबसल्या पूजा, पुजारी सेवा, book pandit online, पूजा बुकिंग महाराष्ट्र, satyanarayan puja booking, पुणे पुजारी, मुंबई पुजारी, ऑनलाइन पूजा"
        canonical="/"
        schema={HOME_SCHEMA}
      />
      <Header />
      <main>

        {/* ════════════════════════════════════════════════════
            §1  HERO
        ════════════════════════════════════════════════════ */}
        <section className={`relative overflow-hidden ${s.heroBg}`}>
          {/* Hero background — dual-layer crossfade, no flash */}
          {bgLayers.a && (
            <img src={bgLayers.a} alt="" aria-hidden="true"
              className={`${s.heroBgLayer} ${bgLayers.front === 'a' ? s.heroBgFront : s.heroBgBack}`}
              onError={e => { e.currentTarget.style.opacity = '0'; }}
            />
          )}
          {bgLayers.b && (
            <img src={bgLayers.b} alt="" aria-hidden="true"
              className={`${s.heroBgLayer} ${bgLayers.front === 'b' ? s.heroBgFront : s.heroBgBack}`}
              onError={e => { e.currentTarget.style.opacity = '0'; }}
            />
          )}
          {/* Gradient overlay — always present once any image loaded */}
          {(bgLayers.a || bgLayers.b) && (
            <div className={s.heroBgOverlay} aria-hidden="true" />
          )}
          <span className={s.omWatermark} aria-hidden="true">ॐ</span>
          <div className="pointer-events-none absolute -right-56 -top-56 h-[600px] w-[600px] rounded-full bg-saffron-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 -left-36 h-[400px] w-[400px] rounded-full bg-crimson-700/5 blur-2xl" />

          <div className="container relative z-10">
            {/* Mobile: 1-col text only; lg: 2-col with image */}
            <div className="grid grid-cols-1 items-center gap-8 py-12 lg:min-h-[92vh] lg:grid-cols-2 lg:gap-10 lg:py-16">

              {/* LEFT: dynamic text */}
              <div className="flex flex-col gap-5 sm:gap-7">

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-saffron-500/25 bg-white/75 px-4 py-2 shadow-sm backdrop-blur-sm sm:px-5 sm:py-2.5">
                  <span>🙏</span>
                  <span className="font-devanagari text-sm font-semibold text-saffron-600">
                    {content.subtitle}
                  </span>
                </div>

                <h1 className="font-display text-3xl font-bold leading-[1.48] text-maroon-700 sm:text-4xl lg:text-[3.5rem] xl:text-[3.8rem]" style={{lineHeight:'1.42'}}>
                  {content.title.split('विश्वासार्ह').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && <span className={s.highlight}>विश्वासार्ह</span>}
                    </span>
                  ))}
                </h1>

                <p className="max-w-[500px] font-devanagari text-base leading-[1.85] text-maroon-700/65 sm:text-lg">
                  {content.description}
                </p>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
                  <Link to="/pooja"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-3.5 font-devanagari text-sm font-bold text-white transition-all duration-200 hover:-translate-y-1 hover:from-saffron-600 hover:to-saffron-700 sm:w-auto sm:gap-2.5 sm:px-8 sm:py-4 sm:text-base"
                    style={{ boxShadow: '0 6px 24px rgba(180,60,0,0.55), 0 2px 8px rgba(180,60,0,0.30)' }}>
                    🪔 {content.button_text_1}
                  </Link>
                  <Link to="/about"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-saffron-500/70 bg-white/92 px-6 py-3.5 font-devanagari text-sm font-bold text-saffron-700 backdrop-blur-sm transition-all duration-200 hover:border-saffron-600 hover:bg-white sm:w-auto sm:px-8 sm:py-4 sm:text-base">
                    {content.button_text_2}
                  </Link>
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch} className={s.searchBar}>
                  <div className={s.searchInner}>
                    <span className={s.searchIcon}>🔍</span>
                    <select
                      value={searchCategory}
                      onChange={e => setSearchCategory(e.target.value)}
                      className={s.searchSelect}
                    >
                      {SEARCH_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className={s.searchBtn}>पूजा शोधा →</button>
                </form>

                {/* Quick Occasion Chips */}
                <div className={s.occasionRow}>
                  <span className={s.occasionLabel}>प्रसंग निवडा:</span>
                  <div className={s.occasionChips}>
                    {OCCASIONS.map(o => (
                      <Link key={o.label} to={o.href} className={s.occasionChip}>
                        <span>{o.icon}</span>{o.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
                  {['✅ विश्वासू पुजारी', '⚡ तत्काळ बुकिंग', '🔒 सुरक्षित पेमेंट'].map(t => (
                    <span key={t} className="font-devanagari text-xs font-semibold text-maroon-700/55 sm:text-sm">{t}</span>
                  ))}
                </div>

                {/* Mobile-only hero image — shown below trust tags */}
                <div className="relative mt-2 h-[210px] overflow-hidden rounded-[20px] md:hidden">
                  {hasSlider ? (
                    <HeroSlider sliders={sliders} />
                  ) : !imgBroken ? (
                    <img
                      src={heroSrc}
                      alt="पूजारी — ऑनलाइन पूजा बुकिंग"
                      className="h-full w-full object-cover object-top"
                      onError={() => setImgBroken(true)}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100">
                      <span className={`font-display text-[5rem] leading-none ${s.omFallback}`}>ॐ</span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 rounded-[20px] ring-2 ring-saffron-500/20" />
                </div>
              </div>

              {/* RIGHT: Premium image panel — hidden on mobile */}
              <div className="hidden md:flex items-center justify-end">
                <div className={s.premiumHeroRight}>
                  {/* Ambient glow */}
                  <div className={s.premiumGlow} aria-hidden="true" />

                  {/* Core image frame */}
                  <div className={s.premiumImgFrame}>
                    {hasSlider ? (
                      <HeroSlider sliders={sliders} />
                    ) : !imgBroken ? (
                      <img
                        src={heroSrc}
                        alt="पूजारी — ऑनलाइन पूजा बुकिंग"
                        className="h-full w-full object-cover object-top"
                        fetchpriority="high"
                        onError={() => setImgBroken(true)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-amber-50 to-orange-100">
                        <span className={`font-display text-[8rem] leading-none ${s.omFallback}`}>ॐ</span>
                      </div>
                    )}
                    <div className={s.premiumImgOverlay} aria-hidden="true" />
                  </div>

                  {/* Floating stat cards — only on lg+ */}
                  <div className={`${s.floatCard} ${s.premiumStat1} hidden lg:flex min-w-[140px] items-center gap-3`}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg">⭐</div>
                    <div>
                      <p className="font-display text-sm font-bold leading-tight text-maroon-700">4.8 रेटिंग</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">५०० + ग्राहक</p>
                    </div>
                  </div>

                  <div className={`${s.floatCard} ${s.premiumStat2} hidden lg:flex min-w-[144px] items-center gap-3`} style={{ animationDelay: '1.5s' }}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">🙏</div>
                    <div>
                      <p className="font-display text-sm font-bold leading-tight text-maroon-700">500+ पुजारी</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">अनुभवी व विश्वासू</p>
                    </div>
                  </div>

                  <div className={`${s.floatCard} ${s.premiumStat3} hidden lg:flex min-w-[148px] items-center gap-3`} style={{ animationDelay: '3s' }}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">📍</div>
                    <div>
                      <p className="font-display text-sm font-bold leading-tight text-maroon-700">महाराष्ट्र सेवा</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">सर्व जिल्ह्यांत</p>
                    </div>
                  </div>

                  <span className="absolute right-[15%] top-[7%] h-3 w-3 rounded-full bg-gold-500 shadow-[0_0_16px_rgba(255,193,7,0.85)]" />
                  <span className="absolute bottom-[7%] left-[10%] h-2 w-2 rounded-full bg-saffron-400 shadow-[0_0_12px_rgba(255,122,0,0.75)]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §1.5  FESTIVAL BANNER — only when festival is active + has image
        ════════════════════════════════════════════════════ */}
        {festival_name && festival_image_url && (
          <FestivalBanner name={festival_name} imageUrl={festival_image_url} />
        )}

        {/* ════════════════════════════════════════════════════
            §1.8  STATS STRIP
        ════════════════════════════════════════════════════ */}
        <section className={s.statsStrip}>
          <div className="container">
            <div className={s.statsGrid}>
              {[
                { value: content.stat_bookings, label: 'यशस्वी बुकिंग',   icon: '📅' },
                { value: content.stat_pujaris,  label: 'अनुभवी पुजारी',   icon: '🙏' },
                { value: content.stat_cities,   label: 'शहरांमध्ये सेवा', icon: '📍' },
                { value: content.stat_years,    label: 'वर्षांचा अनुभव',  icon: '⭐' },
              ].map((stat, i) => (
                <div key={i} className={s.statCard}>
                  <span className={s.statIcon}>{stat.icon}</span>
                  <span className={s.statValue}>{stat.value}</span>
                  <span className={s.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §1.9  FEATURED POOJAS — Visual spotlight (full-width)
        ════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="page-loader" style={{ height: 400 }}><div className="spinner" /></div>
        ) : featured.length > 0 ? (
          <section>
            <FeaturedPoojaSlider poojas={featured} />
            <div className={s.featuredViewAll}>
              <Link to="/pooja"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-10 py-4 font-devanagari text-base font-bold text-white shadow-saffron transition-all duration-200 hover:-translate-y-0.5 hover:shadow-saffron-xl">
                सर्व पूजा पहा →
              </Link>
            </div>
          </section>
        ) : null}

        {/* ════════════════════════════════════════════════════
            §2  QUICK ACTIONS
        ════════════════════════════════════════════════════ */}
        <section className="border-y border-saffron-500/12 bg-white py-8 shadow-sm">
          <div className="container">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.label} to={a.to}
                  className={`${s.quickCard} group flex items-center gap-5 rounded-2xl bg-theme-cream p-5 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_8px_32px_rgba(224,123,42,0.15)]`}
                  style={{ '--qAccent': a.accent }}>
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-2xl"
                    style={{ background: `linear-gradient(135deg,${a.accent}25,${a.accent}10)`, border: `1.5px solid ${a.accent}30` }}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-base font-bold text-maroon-700">{a.label}</p>
                    <p className="mt-0.5 font-devanagari text-xs text-maroon-700/55">{a.sub}</p>
                  </div>
                  <span className="flex-shrink-0 text-lg transition-transform duration-200 group-hover:translate-x-1" style={{ color: a.accent }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §2.5  RASHIFAL BANNER
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-10 border-b border-saffron-500/10">
          <div className="container">
            <Link to="/rashifal"
              className="flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, #4a148c, #7b1fa2)', boxShadow: '0 8px 32px rgba(74,20,140,0.30)' }}>
              <div className="flex items-center gap-5">
                <span style={{ fontSize: '2.8rem' }}>🔮</span>
                <div>
                  <h2 className="font-display text-xl font-bold text-white mb-1">आजचे राशिभविष्य</h2>
                  <p className="font-devanagari text-sm text-white/75">मेष ते मीन — प्रेम, करिअर, आरोग्य आणि आर्थिक भविष्य मराठीत</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                {['♈ मेष','♉ वृषभ','♊ मिथुन','♋ कर्क','♌ सिंह','♍ कन्या'].map(r => (
                  <span key={r} className="font-devanagari text-xs font-bold text-white/80 bg-white/10 px-3 py-1 rounded-full">{r}</span>
                ))}
                <span className="ml-2 font-devanagari text-sm font-bold text-white bg-white/20 px-4 py-2 rounded-xl">सर्व राशी पहा →</span>
              </div>
            </Link>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §3  SERVICES
        ════════════════════════════════════════════════════ */}
        <section className="bg-theme-cream py-20">
          <div className="container">
            <SectionHeading title="आमच्या सेवा" sub="श्रद्धेला आधुनिक सुविधेची जोड" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {SERVICES.map(svc => (
                <Link key={svc.title} to={svc.to}
                  className={`${s.serviceCard} group relative overflow-hidden rounded-2xl border border-saffron-500/10 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-spiritual`}
                  style={{ '--accent': svc.accent }}>
                  {svc.badge && (
                    <span className={s.serviceBadge} style={{ background: svc.accent }}>
                      {svc.badge}
                    </span>
                  )}
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                    style={{ background: `linear-gradient(135deg,${svc.accent}20,${svc.accent}0e)`, border: `1.5px solid ${svc.accent}28` }}>
                    {svc.icon}
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-maroon-700">{svc.title}</h3>
                  <p className="mb-6 font-devanagari text-sm leading-relaxed text-maroon-700/60">{svc.desc}</p>
                  <span className="inline-flex items-center gap-1 font-devanagari text-sm font-bold transition-all duration-200 group-hover:gap-2"
                    style={{ color: svc.accent }}>अधिक पहा →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §4  DEVOTIONAL STRIP
        ════════════════════════════════════════════════════ */}
        <div className={`${s.mantraShimmer} relative overflow-hidden border-y-2 border-yellow-700/40 py-14`}>
          <div className="container">
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              <span className={`${s.diyaPulse} text-2xl sm:text-3xl`}>🪔</span>
              <span className={`${s.diyaPulse} hidden text-2xl sm:block`} style={{ animationDelay: '0.6s' }}>🪔</span>
              <div className="text-center">
                <p className="font-display text-4xl font-bold tracking-[0.1em] text-yellow-200 drop-shadow-[0_0_30px_rgba(255,193,7,0.6)] sm:text-5xl">
                  ॐ श्री गणेशाय नमः
                </p>
                <p className="mt-3 font-display text-xs tracking-[5px] text-yellow-300/60 sm:text-sm">
                  विघ्नहर्ता &nbsp;•&nbsp; मंगलमूर्ती &nbsp;•&nbsp; गजानन
                </p>
              </div>
              <span className={`${s.diyaPulse} hidden text-2xl sm:block`} style={{ animationDelay: '1.2s' }}>🪔</span>
              <span className={`${s.diyaPulse} text-2xl sm:text-3xl`} style={{ animationDelay: '1.8s' }}>🪔</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            §5  TRUST
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-20">
          <div className="container">
            <SectionHeading title="आम्हालाच का निवडायचे?" sub="लाखो भाविकांचा विश्वास — आमची ताकद" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST.map((w, i) => (
                <div key={i}
                  className={`${s.trustCard} group rounded-2xl border border-saffron-500/10 bg-theme-cream p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_40px_rgba(224,123,42,0.14)]`}>
                  <div className={`${s.trustIcon} mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl`}
                    style={{ background: `linear-gradient(135deg,${w.color}1e,${w.color}0c)`, border: `1.5px solid ${w.color}25` }}>
                    {w.icon}
                  </div>
                  <h3 className="mb-3 font-display text-base font-bold text-maroon-700">{w.title}</h3>
                  <p className="font-devanagari text-sm leading-relaxed text-maroon-700/60">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §5.5  SOCIAL PROOF COUNTER
        ════════════════════════════════════════════════════ */}
        <section className={s.socialProof}>
          <div className="container">
            <div className={s.socialProofGrid}>
              <div className={s.spItem}>
                <span className={s.spNum}>५,०००+</span>
                <span className={s.spLabel}>संतुष्ट ग्राहक</span>
              </div>
              <div className={s.spDivider} />
              <div className={s.spItem}>
                <span className={s.spNum}>⭐ ४.८ / ५</span>
                <span className={s.spLabel}>सरासरी रेटिंग</span>
              </div>
              <div className={s.spDivider} />
              <div className={s.spItem}>
                <span className={s.spNum}>✅ ५००+</span>
                <span className={s.spLabel}>सत्यापित पुजारी</span>
              </div>
              <div className={s.spDivider} />
              <div className={s.spItem}>
                <span className={s.spNum}>२०+</span>
                <span className={s.spLabel}>महाराष्ट्रातील शहरे</span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §6  HOW IT WORKS
        ════════════════════════════════════════════════════ */}
        <section className={s.howSection}>
          <div className="container">
            <SectionHeading title="कसे काम करते?" sub="फक्त ४ सोप्या चरणांमध्ये घरी पूजा" />
            <div className={s.stepsRow}>
              {STEPS.map((st, i) => (
                <div key={i} className={s.stepWrap}>
                  <div className={s.stepCard}>
                    {/* big number badge */}
                    <div className={s.stepNum}>{st.num}</div>
                    {/* icon circle */}
                    <div className={s.stepIconBox}>{st.icon}</div>
                    <h3 className={s.stepTitle}>{st.title}</h3>
                    <p className={s.stepDesc}>{st.desc}</p>
                  </div>
                  {/* arrow connector */}
                  {i < 3 && <div className={s.stepArrow}>→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §7  CATEGORIES
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-20">
          <div className="container">
            <SectionHeading title="पूजा श्रेणी" sub="आपल्या गरजेनुसार पूजा निवडा" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {CATEGORIES.map(cat => (
                <Link key={cat.slug} to={cat.href || `/pooja?category=${cat.slug}`}
                  className="group rounded-2xl border border-saffron-500/10 bg-theme-cream p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:bg-saffron-500 hover:shadow-saffron-xl">
                  <span className="block text-3xl transition-transform duration-200 group-hover:scale-110">{cat.icon}</span>
                  <h3 className="mt-3 font-display text-sm font-bold text-maroon-700 transition-colors group-hover:text-white">{cat.label}</h3>
                  <p className="mt-1 font-devanagari text-xs text-maroon-700/50 transition-colors group-hover:text-white/80">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* §8 Popular Poojas slider moved to §1.9 (right after stats strip) */}

        {/* ════════════════════════════════════════════════════
            §8.5  NEARBY PUJARIS
        ════════════════════════════════════════════════════ */}
        <NearbyPujaris />

        {/* ════════════════════════════════════════════════════
            §8.6  BROWSE BY CITY
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-20">
          <div className="container">
            <SectionHeading title="शहरानुसार पुजारी शोधा" sub="महाराष्ट्रातील प्रमुख शहरांमध्ये सेवा उपलब्ध" />
            <div className={s.cityGrid}>
              {MH_CITIES.map(city => (
                <Link
                  key={city.slug}
                  to={`/cities/${city.slug}`}
                  className={s.cityCard}
                >
                  <span className={s.cityIcon}>{city.icon}</span>
                  <span className={s.cityName}>{city.name}</span>
                </Link>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link to="/cities" className="btn btn-secondary">सर्व शहरे पहा →</Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §9  CTA
        ════════════════════════════════════════════════════ */}
        <section className="bg-theme-cream-dark py-16">
          <div className="container">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl p-10 transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #7a1e00 0%, #c04a00 55%, #e86a00 100%)', boxShadow: '0 8px 32px rgba(122,30,0,0.35)' }}>
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.10) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative z-10">
                  <p className="mb-4 text-5xl">🪔</p>
                  <h2 className="mb-3 font-display text-2xl font-bold" style={{ color: '#fff' }}>पूजा बुक करा</h2>
                  <p className="mb-7 font-devanagari text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>आपल्या शुभ प्रसंगासाठी विश्वासू पुजारी मिळवा</p>
                  <Link to="/pooja" className="btn btn-gold">आता बुक करा</Link>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl p-10 transition-all duration-300 hover:-translate-y-1"
                style={{ background: '#fff', border: '2px solid rgba(192,74,0,0.18)', boxShadow: '0 8px 32px rgba(122,30,0,0.08)' }}>
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(224,123,42,0.06) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative z-10">
                  <p className="mb-4 text-5xl">📋</p>
                  <h2 className="mb-3 font-display text-2xl font-bold" style={{ color: '#7a1e00' }}>पुजारी म्हणून नोंदणी</h2>
                  <p className="mb-7 font-devanagari text-sm leading-relaxed" style={{ color: 'rgba(122,30,0,0.65)' }}>आपले ज्ञान शेअर करा, जास्त कमाई करा</p>
                  <Link to="/pujari-nondni" className="btn btn-secondary">नोंदणी करा</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §10  TESTIMONIALS — Real DB reviews with static fallback
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-20">
          <div className="container">
            <SectionHeading
              title="ग्राहकांचे अभिप्राय"
              sub="प्रत्यक्ष बुकिंग केलेल्या ग्राहकांचे खरे अनुभव"
            />

            {/* Rating bar */}
            <div className={s.reviewsBar}>
              <span className={s.reviewsBarStar}>⭐ ⭐ ⭐ ⭐ ⭐</span>
              <span className={s.reviewsBarText}>
                <strong>४.८/५</strong> — सत्यापित बुकिंग अभिप्रायांवर आधारित
              </span>
            </div>

            {(() => {
              // Use real DB reviews if available, otherwise static
              const displayReviews = liveReviews.length > 0
                ? liveReviews.map(r => ({
                    name:   r.user_name || 'ग्राहक',
                    city:   r.pujari_city || '',
                    pooja:  r.pooja_name || '',
                    rating: r.rating || 5,
                    text:   r.comment,
                    pujariName: r.pujari_name,
                    pujariId:   r.pujari_id,
                    isLive: true,
                  }))
                : TESTIMONIALS;

              return (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayReviews.map((t, i) => (
                    <div key={i}
                      className={`${s.testimonialCard} flex flex-col gap-4 rounded-2xl bg-theme-cream p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_40px_rgba(224,123,42,0.14)]`}
                      style={{ borderTop: '3.5px solid #FF7A00' }}>

                      {/* Stars + verified */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                          {Array(t.rating || 5).fill(0).map((_, j) => (
                            <span key={j} className="text-[15px] text-gold-500">★</span>
                          ))}
                        </div>
                        <span className={s.verifiedCustomer}>✅ सत्यापित</span>
                      </div>

                      {/* Comment */}
                      <p className="flex-1 font-devanagari text-sm italic leading-relaxed text-maroon-700/70">
                        "{t.text}"
                      </p>

                      {/* Pooja tag */}
                      {t.pooja && (
                        <span className={s.testimonialPooja}>🪔 {t.pooja}</span>
                      )}

                      {/* Pujari tag — only for live reviews */}
                      {t.isLive && t.pujariName && (
                        <a
                          href={`/pujari/${t.pujariId}`}
                          className={s.testimonialPujari}
                          title="पुजाऱ्याचे प्रोफाइल पहा"
                        >
                          🙏 पं. {t.pujariName}
                        </a>
                      )}

                      {/* Reviewer */}
                      <div className="flex items-center gap-3 pt-1 border-t border-saffron-500/10">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron-400 to-gold-500 font-display text-base font-bold text-white shadow-sm">
                          {(t.name || 'G')[0]}
                        </div>
                        <div>
                          <p className="font-display text-sm font-bold text-maroon-700">{t.name}</p>
                          {t.city && (
                            <p className="font-devanagari text-xs text-maroon-700/50">📍 {t.city}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
