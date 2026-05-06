// src/pages/Home.jsx — पूजारी • Dynamic Premium Homepage
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header    from '../components/layout/Header';
import Footer    from '../components/layout/Footer';
import PoojaCard from '../components/common/PoojaCard';
import SEOHead   from '../components/SEOHead';
import { poojaAPI, homeAPI } from '../api/index.js';
import s from './Home.module.css';

const HOME_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://pojjari.com/#webpage',
      'url': 'https://pojjari.com/',
      'name': 'पूजारी - घरी पूजा, मनासारखी',
      'description': 'महाराष्ट्रातील सर्वोत्तम ऑनलाईन पूजा बुकिंग सेवा',
      'inLanguage': 'mr',
      'isPartOf': { '@id': 'https://pojjari.com/#website' },
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'ऑनलाईन पूजा बुकिंग कसे करावे?',
          'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी वेबसाईटवर जाऊन इच्छित पूजा निवडा, तारीख व वेळ निश्चित करा, आणि सुरक्षित ऑनलाईन पेमेंट करा. पुजारी घरी येऊन संपूर्ण विधी करतात.' }
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
        }
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
};

const QUICK_ACTIONS = [
  { icon: '📿', label: 'आजची पूजा बुक करा', sub: 'घरात किंवा मंदिरात', to: '/pooja',    accent: '#FF7A00' },
  { icon: '📅', label: 'पंचांग पहा',         sub: 'आजचे तिथी-नक्षत्र', to: '/panchang', accent: '#C62828' },
  { icon: '🧑‍🦳', label: 'पुजारी शोधा',      sub: 'अनुभवी व विश्वासू',  to: '/pooja',    accent: '#D4AF37' },
];

const SERVICES = [
  { icon: '💻', accent: '#FF7A00', title: 'ऑनलाईन पूजा बुकिंग', desc: 'मोबाईलवरून घरबसल्या बुकिंग करा. काही मिनिटांत पूजा नक्की करा.', to: '/pooja' },
  { icon: '🛕', accent: '#C62828', title: 'मंदिर पूजा',          desc: 'जवळच्या मंदिरात अभिषेक, होम-हवन व विशेष विधींची संपूर्ण व्यवस्था.', to: '/pooja' },
  { icon: '🙏', accent: '#D4AF37', title: 'पुजारी सेवा',         desc: 'वेदशास्त्रसंपन्न पुजारी घरी येऊन संपूर्ण विधी भक्तीभावाने करतात.', to: '/pooja' },
];

const STEPS = [
  { icon: '💻', num: '१', title: 'पूजा निवडा',     desc: 'इच्छित पूजेची श्रेणी निवडा आणि बुकिंग फॉर्म भरा.' },
  { icon: '📲', num: '२', title: 'पुजारी नियुक्त', desc: 'आम्ही आपल्यासाठी विश्वासू व अनुभवी पुजारी निवडतो.' },
  { icon: '💳', num: '३', title: 'पेमेंट करा',     desc: 'सुरक्षित ऑनलाईन पेमेंट — Razorpay द्वारे.' },
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
  { slug: 'lagn-hall',      icon: '🏛️', label: 'हॉल बुकिंग',      desc: 'लग्नसमारंभ व कार्यक्रम' },
];

const TRUST = [
  { icon: '🔐', color: '#FF7A00', title: 'सत्यापित पुजारी',   desc: 'सर्व पुजारी ओळख-सत्यापित, अनुभवी आणि पारंपरिक ज्ञानसंपन्न.' },
  { icon: '⚡', color: '#C62828', title: 'सहज बुकिंग',        desc: 'काही मिनिटांत बुकिंग पूर्ण करा. कोणतीही गुंतागुंत नाही.' },
  { icon: '💸', color: '#D4AF37', title: 'परवडणाऱ्या किंमती', desc: 'कोणत्याही बजेटमध्ये उत्तम सेवा — कोणतेही छुपे शुल्क नाही.' },
  { icon: '🏠', color: '#2E7D32', title: 'घरपोच सेवा',        desc: 'पुजारी सामग्रीसह घरी येतो — आपण पूर्णतः निश्चिंत रहा.' },
];

const TESTIMONIALS = [
  { name: 'नेहा शिंदे',   city: 'रत्नागिरी', text: 'पुजारी वेळेवर आले, सामग्री सुद्धा आणली. आमचे कुटुंब खूप प्रभावित झाले!' },
  { name: 'राहुल देशमुख', city: 'कोल्हापूर', text: 'सत्यनारायण पूजेसाठी बुकिंग केली — एकही फोन न करता सर्व व्यवस्था झाली.' },
  { name: 'सुनीता जोशी',  city: 'नाशिक',    text: 'गणेश चतुर्थीची पूजा पहिल्यांदा ऑनलाईन बुक केली — अनुभव अप्रतिम होता!' },
  { name: 'अजित पाटील',   city: 'पुणे',      text: 'दशक्रिया विधी साठी खूपच उपयुक्त. पुजाऱ्यांनी सर्व विधी भक्तीभावाने केले.' },
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

  const slide = sliders[current];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[50%] border-[5px] border-white/60 bg-gradient-to-b from-amber-50 to-orange-100/60 shadow-[0_20px_60px_rgba(139,37,0,0.22)]">
      {/* Image */}
      <img
        src={slide.image_url}
        alt={slide.title || 'slide'}
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
  const [content,   setContent]   = useState(DEFAULT_CONTENT);
  const [sliders,   setSliders]   = useState([]);
  const [featured,  setFeatured]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    // Load homepage dynamic content
    homeAPI.get()
      .then(r => {
        const { content: c, sliders: sl } = r.data.data;
        if (c) setContent({ ...DEFAULT_CONTENT, ...c });
        setSliders(sl || []);
      })
      .catch(() => {}); // silent fallback to defaults

    // Load featured poojas
    poojaAPI.getPoojas({ featured: true, limit: 8 })
      .then(r => setFeatured(r.data.data.poojas || []))
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  // Decide what to show in the hero right panel
  const heroSrc   = content.hero_image || '/ganpati.png';
  const hasSlider = sliders.length > 0;

  return (
    <div className="min-h-screen bg-[#FDF6EC]">
      <SEOHead
        title="घरी पूजा, मनासारखी | ऑनलाईन पूजा बुकिंग महाराष्ट्र"
        description="पूजारी - महाराष्ट्रातील सर्वोत्तम ऑनलाईन पूजा बुकिंग सेवा. अनुभवी पुजारी घरी बोलवा. सत्यनारायण, गृहप्रवेश, दशक्रिया, हवन, उत्सव पूजा बुक करा."
        keywords="online puja booking, pujari near me, घरबसल्या पूजा, पुजारी सेवा, book pandit online, पूजा बुकिंग महाराष्ट्र, satyanarayan puja booking, पुणे पुजारी, मुंबई पुजारी, ऑनलाईन पूजा"
        canonical="/"
        schema={HOME_SCHEMA}
      />
      <Header />
      <main>

        {/* ════════════════════════════════════════════════════
            §1  HERO
        ════════════════════════════════════════════════════ */}
        <section className={`relative overflow-hidden ${s.heroBg}`}>
          <span className={s.omWatermark} aria-hidden="true">ॐ</span>
          <div className="pointer-events-none absolute -right-56 -top-56 h-[600px] w-[600px] rounded-full bg-saffron-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 -left-36 h-[400px] w-[400px] rounded-full bg-crimson-700/5 blur-2xl" />

          <div className="container relative z-10">
            {/* Mobile: 1-col text only; lg: 2-col with image */}
            <div className="grid grid-cols-1 items-center gap-8 py-12 lg:min-h-[84vh] lg:grid-cols-2 lg:gap-10 lg:py-16">

              {/* LEFT: dynamic text */}
              <div className="flex flex-col gap-5 sm:gap-7">

                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-saffron-500/25 bg-white/75 px-4 py-2 shadow-sm backdrop-blur-sm sm:px-5 sm:py-2.5">
                  <span>🙏</span>
                  <span className="font-devanagari text-sm font-semibold text-saffron-600">
                    {content.subtitle}
                  </span>
                </div>

                <h1 className="font-display text-3xl font-bold leading-[1.22] text-maroon-700 sm:text-4xl lg:text-[3rem] xl:text-[3.2rem]">
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-3.5 font-devanagari text-sm font-bold text-white shadow-saffron transition-all duration-200 hover:-translate-y-1 hover:from-saffron-600 hover:to-saffron-700 hover:shadow-saffron-xl sm:w-auto sm:gap-2.5 sm:px-8 sm:py-4 sm:text-base">
                    🪔 {content.button_text_1}
                  </Link>
                  <Link to="/about"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-saffron-500/55 bg-white/75 px-6 py-3.5 font-devanagari text-sm font-bold text-saffron-600 backdrop-blur-sm transition-all duration-200 hover:border-saffron-500 hover:bg-white sm:w-auto sm:px-8 sm:py-4 sm:text-base">
                    {content.button_text_2}
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
                  {['✅ विश्वासू पुजारी', '⚡ तत्काळ बुकिंग', '🔒 सुरक्षित पेमेंट'].map(t => (
                    <span key={t} className="font-devanagari text-xs font-semibold text-maroon-700/55 sm:text-sm">{t}</span>
                  ))}
                </div>
              </div>

              {/* RIGHT: image / slider — hidden on mobile, scales up on md/lg */}
              <div className="hidden md:flex items-center justify-center">
                <div className="relative flex h-[340px] w-[340px] items-center justify-center lg:h-[440px] lg:w-[440px] xl:h-[480px] xl:w-[480px]">

                  <div className={`absolute inset-0 rounded-full ${s.mandalaRing}`} />
                  <div className={`absolute h-[278px] w-[278px] rounded-full lg:h-[360px] lg:w-[360px] xl:h-[394px] xl:w-[394px] ${s.mandalaRingInner}`} />
                  <div className={`absolute h-[270px] w-[270px] rounded-full lg:h-[350px] lg:w-[350px] xl:h-[383px] xl:w-[383px] ${s.imageGlow}`} />
                  <div className="absolute h-[235px] w-[235px] rounded-full lg:h-[305px] lg:w-[305px] xl:h-[334px] xl:w-[334px] border border-saffron-500/15" />

                  {/* Image frame */}
                  <div className="relative z-10 h-[214px] w-[196px] overflow-hidden rounded-[50%] lg:h-[276px] lg:w-[254px] xl:h-[302px] xl:w-[278px]">
                    {hasSlider ? (
                      <HeroSlider sliders={sliders} />
                    ) : !imgBroken ? (
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[50%] border-[5px] border-white/60 bg-gradient-to-b from-amber-50 to-orange-100/60 shadow-[0_20px_60px_rgba(139,37,0,0.22)]">
                        <img
                          src={heroSrc}
                          alt="श्री गणेश — पूजारी पूजा बुकिंग सेवा"
                          className="h-full w-full object-cover object-top"
                          fetchpriority="high"
                          onError={() => setImgBroken(true)}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-[50%] border-[5px] border-white/60 bg-gradient-to-b from-amber-50 to-orange-100/60">
                        <div className="flex flex-col items-center gap-3 text-center">
                          <span className={`font-display text-[4.5rem] leading-none lg:text-[5.5rem] ${s.omFallback}`}>ॐ</span>
                          <span className="font-display text-xs font-bold text-saffron-700 lg:text-sm">श्री गणेशाय नमः</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floating cards — only on lg+ to prevent overflow */}
                  <div className={`${s.floatCard} absolute -right-2 top-[10%] z-20 hidden lg:flex min-w-[140px] items-center gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]`}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg">⭐</div>
                    <div>
                      <p className="font-display text-sm font-bold leading-tight text-maroon-700">4.8 रेटिंग</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">५०० + ग्राहक</p>
                    </div>
                  </div>

                  <div className={`${s.floatCard} absolute -left-6 top-[38%] z-20 hidden lg:flex min-w-[144px] items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]`}
                    style={{ animationDelay: '1.5s' }}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg">🙏</div>
                    <div>
                      <p className="font-display text-sm font-bold leading-tight text-maroon-700">500+ पुजारी</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">अनुभवी व विश्वासू</p>
                    </div>
                  </div>

                  <div className={`${s.floatCard} absolute -right-4 bottom-[10%] z-20 hidden lg:flex min-w-[148px] items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)]`}
                    style={{ animationDelay: '3s' }}>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-lg">📍</div>
                    <div>
                      <p className="font-display text-sm font-bold leading-tight text-maroon-700">महाराष्ट्र सेवा</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">सर्व जिल्ह्यांत</p>
                    </div>
                  </div>

                  <span className="absolute right-[22%] top-[7%] h-2.5 w-2.5 rounded-full bg-gold-500 shadow-[0_0_12px_rgba(255,193,7,0.75)]" />
                  <span className="absolute bottom-[7%] left-[20%] h-2 w-2 rounded-full bg-saffron-400 shadow-[0_0_10px_rgba(255,122,0,0.65)]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §2  QUICK ACTIONS
        ════════════════════════════════════════════════════ */}
        <section className="border-y border-saffron-500/12 bg-white py-8 shadow-sm">
          <div className="container">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.label} to={a.to}
                  className={`${s.quickCard} group flex items-center gap-5 rounded-2xl bg-[#FFFAF4] p-5 transition-all duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-[0_8px_32px_rgba(224,123,42,0.15)]`}
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
            §3  SERVICES
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#FFFAF4] py-20">
          <div className="container">
            <SectionHeading title="आमच्या सेवा" sub="श्रद्धेला आधुनिक सुविधेची जोड" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {SERVICES.map(svc => (
                <Link key={svc.title} to={svc.to}
                  className={`${s.serviceCard} group relative overflow-hidden rounded-2xl border border-saffron-500/10 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-spiritual`}
                  style={{ '--accent': svc.accent }}>
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
                  className={`${s.trustCard} group rounded-2xl border border-saffron-500/10 bg-[#FFFAF4] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_40px_rgba(224,123,42,0.14)]`}>
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
            §6  HOW IT WORKS
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#F5E8D0] py-20">
          <div className="container">
            <SectionHeading title="कसे काम करते?" sub="फक्त ४ सोप्या चरणांमध्ये घरी पूजा" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((st, i) => (
                <div key={i} className="relative rounded-2xl border border-saffron-500/12 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-saffron">
                  <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 shadow-saffron">
                    <span className="font-display text-sm font-bold text-white">{st.num}</span>
                  </div>
                  <div className="mb-4 mt-3 text-4xl">{st.icon}</div>
                  <h3 className="mb-2 font-display text-base font-bold text-maroon-700">{st.title}</h3>
                  <p className="font-devanagari text-xs leading-relaxed text-maroon-700/60">{st.desc}</p>
                  {i < 3 && <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl text-saffron-300 lg:block">→</span>}
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
                <Link key={cat.slug} to={`/pooja?category=${cat.slug}`}
                  className="group rounded-2xl border border-saffron-500/10 bg-[#FFFAF4] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:bg-saffron-500 hover:shadow-saffron-xl">
                  <span className="block text-3xl transition-transform duration-200 group-hover:scale-110">{cat.icon}</span>
                  <h3 className="mt-3 font-display text-sm font-bold text-maroon-700 transition-colors group-hover:text-white">{cat.label}</h3>
                  <p className="mt-1 font-devanagari text-xs text-maroon-700/50 transition-colors group-hover:text-white/80">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §8  POPULAR POOJAS
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#F5E8D0]/65 py-20">
          <div className="container">
            <SectionHeading title="लोकप्रिय पूजा" sub="सर्वाधिक बुक केल्या जाणाऱ्या पूजा" />
            {loading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : (
              <div className="grid-4">
                {(featured.length > 0 ? featured : MOCK_POOJAS).map(p => (
                  <PoojaCard key={p.id} pooja={p} />
                ))}
              </div>
            )}
            <div className="mt-12 flex justify-center">
              <Link to="/pooja"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 px-10 py-4 font-devanagari text-base font-bold text-white shadow-saffron transition-all duration-200 hover:-translate-y-0.5 hover:shadow-saffron-xl sm:w-auto">
                सर्व पूजा पहा →
              </Link>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §9  CTA
        ════════════════════════════════════════════════════ */}
        <section className="bg-[#F5E8D0] py-16">
          <div className="container">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-saffron-500 to-saffron-700 p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-saffron-xl">
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.12) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative z-10">
                  <p className="mb-4 text-5xl">🪔</p>
                  <h2 className="mb-3 font-display text-2xl font-bold text-white">पूजा बुक करा</h2>
                  <p className="mb-7 font-devanagari text-sm leading-relaxed text-white/80">आपल्या शुभ प्रसंगासाठी विश्वासू पुजारी मिळवा</p>
                  <Link to="/pooja" className="btn btn-gold">आता बुक करा</Link>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl border-2 border-saffron-500/18 bg-white p-10 transition-all duration-300 hover:-translate-y-1 hover:shadow-spiritual">
                <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle,rgba(224,123,42,0.07) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative z-10">
                  <p className="mb-4 text-5xl">📋</p>
                  <h2 className="mb-3 font-display text-2xl font-bold text-maroon-700">पुजारी म्हणून नोंदणी</h2>
                  <p className="mb-7 font-devanagari text-sm leading-relaxed text-maroon-700/60">आपले ज्ञान शेअर करा, जास्त कमाई करा</p>
                  <Link to="/pujari-nondni" className="btn btn-secondary">नोंदणी करा</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════
            §10  TESTIMONIALS
        ════════════════════════════════════════════════════ */}
        <section className="bg-white py-20">
          <div className="container">
            <SectionHeading title="ग्राहकांचे अभिप्राय" sub="प्रत्येक बुकिंग एक आठवण बनते" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TESTIMONIALS.map((t, i) => (
                <div key={i}
                  className="flex flex-col gap-5 rounded-2xl bg-[#FFFAF4] p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_12px_40px_rgba(224,123,42,0.14)]"
                  style={{ borderTop: '3.5px solid #FF7A00' }}>
                  <div className="flex gap-0.5">{Array(5).fill(0).map((_, j) => <span key={j} className="text-[15px] text-gold-500">★</span>)}</div>
                  <p className="flex-1 font-devanagari text-sm italic leading-relaxed text-maroon-700/70">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron-400 to-gold-500 font-display text-base font-bold text-white shadow-sm">{t.name[0]}</div>
                    <div>
                      <p className="font-display text-sm font-bold text-maroon-700">{t.name}</p>
                      <p className="font-devanagari text-xs text-maroon-700/50">📍 {t.city}</p>
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
