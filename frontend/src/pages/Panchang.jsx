// src/pages/Panchang.jsx — हिंदू पंचांग + कुंडली पृष्ठ
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ClockTimePicker from '../components/common/ClockTimePicker';
import SEOHead from '../components/SEOHead';
import { panchangAPI } from '../api/index.js';
import { getSessionId } from '../utils/session.js';
import styles from '../styles/Panchang.module.css';
import { RASHIS } from '../data/rashifalData';
import RashiChakra3D from '../components/panchang/RashiChakra3D';
import DishaYantra3D from '../components/panchang/DishaYantra3D';
import PanchangYantra3D from '../components/panchang/PanchangYantra3D';
import SankalpMantra from '../components/panchang/SankalpMantra';
import VelMasik from '../components/panchang/VelMasik';

const RASHI_IMG = Object.fromEntries(RASHIS.map(r => [r.name, r.img]));

function buildPanchangSchema(dateStr) {
  const d = dateStr || new Date().toISOString().split('T')[0];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        'name': `आजचा पंचांग ${d} | Hindu Panchang Today`,
        'description': 'आजचे तिथी, नक्षत्र, योग, करण, राहुकाळ व कुंडली माहिती. महाराष्ट्रातील सर्व जिल्ह्यांसाठी दैनंदिन हिंदू पंचांग.',
        'url': 'https://pojjari.com/panchang',
        'inLanguage': 'mr',
        'dateModified': d,
        'breadcrumb': {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'मुख्यपृष्ठ', 'item': 'https://pojjari.com/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'पंचांग', 'item': 'https://pojjari.com/panchang' },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        'mainEntity': [
          { '@type': 'Question', 'name': 'आजची तिथी काय आहे?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी पंचांगवर आजची तिथी, नक्षत्र, योग, करण आणि राहुकाळ पाहता येतो. तुमचा जिल्हा निवडा आणि अचूक माहिती मिळवा.' } },
          { '@type': 'Question', 'name': 'आजचा शुभ मुहूर्त कोणता?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी पंचांगवर आजचा अभिजित मुहूर्त, अमृत काळ आणि इतर शुभ मुहूर्त दिसतात. राहुकाळ, यमगंड टाळून शुभ काळात कार्य करावे.' } },
          { '@type': 'Question', 'name': 'राहुकाळ म्हणजे काय?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'राहुकाळ हा दिवसातील अशुभ काळ मानला जातो. या काळात नवीन काम, प्रवास किंवा शुभ कार्य सुरू करू नये. दर वारानुसार राहुकाळ वेगळा असतो.' } },
          { '@type': 'Question', 'name': 'गुढीपाडव्याचा मुहूर्त कधी आहे?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'गुढीपाडवा 2026: १९ मार्च 2026. सकाळी ६:१५ ते ७:३० हा शुभ मुहूर्त. पूजारी पंचांगवर सर्व सणांचे मुहूर्त आगाऊ पाहता येतात.' } },
        ],
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MONTHS_MR = [
  'जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर',
];

const DISTRICTS = [
  { name: 'पुणे',          eng: 'pune poona',                 lat: '18.5204', lon: '73.8567' },
  { name: 'मुंबई शहर',     eng: 'mumbai city bombay shahar',  lat: '18.9388', lon: '72.8354' },
  { name: 'मुंबई उपनगर',  eng: 'mumbai suburban upnagar',    lat: '19.0760', lon: '72.8777' },
  { name: 'ठाणे',          eng: 'thane thana',                lat: '19.2183', lon: '72.9781' },
  { name: 'पालघर',         eng: 'palghar',                    lat: '19.6967', lon: '72.7697' },
  { name: 'रायगड',         eng: 'raigad raigadh',             lat: '18.5158', lon: '73.1186' },
  { name: 'रत्नागिरी',     eng: 'ratnagiri',                  lat: '16.9902', lon: '73.3120' },
  { name: 'सिंधुदुर्ग',    eng: 'sindhudurg',                 lat: '16.3490', lon: '73.8530' },
  { name: 'सातारा',        eng: 'satara',                     lat: '17.6805', lon: '74.0183' },
  { name: 'सांगली',        eng: 'sangli',                     lat: '16.8524', lon: '74.5815' },
  { name: 'कोल्हापूर',     eng: 'kolhapur',                   lat: '16.6975', lon: '74.2282' },
  { name: 'सोलापूर',       eng: 'solapur sholapur',           lat: '17.6805', lon: '75.9064' },
  { name: 'नाशिक',        eng: 'nashik nasik',               lat: '20.0059', lon: '73.7898' },
  { name: 'धुळे',          eng: 'dhule dhulia',               lat: '20.9042', lon: '74.7749' },
  { name: 'नंदुरबार',      eng: 'nandurbar',                  lat: '21.3667', lon: '74.2333' },
  { name: 'जळगाव',        eng: 'jalgaon',                    lat: '21.0077', lon: '75.5626' },
  { name: 'अहमदनगर',      eng: 'ahmednagar ahmadnagar',      lat: '19.0950', lon: '74.7493' },
  { name: 'औरंगाबाद',     eng: 'aurangabad',                 lat: '19.8762', lon: '75.3433' },
  { name: 'जालना',         eng: 'jalna',                      lat: '19.8415', lon: '75.8816' },
  { name: 'बीड',           eng: 'beed bid',                   lat: '18.9893', lon: '75.7602' },
  { name: 'लातूर',         eng: 'latur',                      lat: '18.4088', lon: '76.5604' },
  { name: 'उस्मानाबाद',    eng: 'osmanabad',                  lat: '18.1860', lon: '76.0388' },
  { name: 'नांदेड',        eng: 'nanded',                     lat: '19.1383', lon: '77.2985' },
  { name: 'परभणी',         eng: 'parbhani',                   lat: '19.2704', lon: '76.6076' },
  { name: 'हिंगोली',       eng: 'hingoli',                    lat: '19.7177', lon: '77.1548' },
  { name: 'नागपूर',        eng: 'nagpur',                     lat: '21.1458', lon: '79.0882' },
  { name: 'वर्धा',         eng: 'wardha',                     lat: '20.7453', lon: '78.5966' },
  { name: 'यवतमाळ',       eng: 'yavatmal yawatmal',          lat: '20.3888', lon: '78.1204' },
  { name: 'अमरावती',       eng: 'amravati amraoti',           lat: '20.9333', lon: '77.7500' },
  { name: 'अकोला',         eng: 'akola',                      lat: '20.7063', lon: '77.0024' },
  { name: 'वाशिम',         eng: 'washim',                     lat: '20.1000', lon: '77.1333' },
  { name: 'बुलढाणा',       eng: 'buldhana',                   lat: '20.5333', lon: '76.1833' },
  { name: 'चंद्रपूर',      eng: 'chandrapur',                 lat: '19.9615', lon: '79.2961' },
  { name: 'गडचिरोली',      eng: 'gadchiroli',                 lat: '20.1809', lon: '80.0000' },
  { name: 'गोंदिया',       eng: 'gondia',                     lat: '21.4592', lon: '80.1953' },
  { name: 'भंडारा',        eng: 'bhandara',                   lat: '21.1667', lon: '79.6500' },
];

// North Indian Kundali: house number → { rashi (Marathi), col, row } in 4×4 grid
// North Indian (diamond) chart: houses are fixed, lagna is house 1 (top centre) and
// houses run anti-clockwise. x / y = label position in a 400×400 box.
const NI_HOUSES = [
  { h: 1,  x: 200, y: 100 }, { h: 2,  x: 100, y: 40  }, { h: 3,  x: 40,  y: 100 },
  { h: 4,  x: 100, y: 200 }, { h: 5,  x: 40,  y: 300 }, { h: 6,  x: 100, y: 360 },
  { h: 7,  x: 200, y: 300 }, { h: 8,  x: 300, y: 360 }, { h: 9,  x: 360, y: 300 },
  { h: 10, x: 300, y: 200 }, { h: 11, x: 360, y: 100 }, { h: 12, x: 300, y: 40  },
];
const RASHI_NAMES = RASHIS.map(r => r.name);
// first-letter abbreviations used in printed patrikas
const GRAHA_SHORT = { Mars: 'मं', Mercury: 'बु', Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के' };

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function todayIST() {
  const ist = new Date(Date.now() + 330 * 60000);
  return ist.toISOString().split('T')[0];
}

function nowISTTime() {
  const ist = new Date(Date.now() + 330 * 60000);
  const h = String(ist.getUTCHours()).padStart(2, '0');
  const m = String(ist.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Nearest Maharashtra district to a GPS point — Haversine great-circle distance
// against each district's center lat/lon (DISTRICTS above), same approach as
// the halls "nearby" search elsewhere in this codebase.
function nearestDistrict(lat, lon) {
  const toRad = d => (d * Math.PI) / 180;
  let best = null, bestDist = Infinity;
  for (const d of DISTRICTS) {
    const dLat = toRad(d.lat - lat);
    const dLon = toRad(d.lon - lon);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(d.lat)) * Math.sin(dLon / 2) ** 2;
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return best;
}

function formatMR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS_MR[parseInt(m) - 1]}, ${y}`;
}

function formatTime12h(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12  = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/* ── Panchang detail card ── */
function PCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`${styles.pCard} ${accent ? styles.pCardAccent : ''}`}>
      <div className={styles.pCardTop}>
        <span className={styles.pCardIcon}>{icon}</span>
        <span className={styles.pCardLabel}>{label}</span>
      </div>
      <span className={styles.pCardValue}>{value || '—'}</span>
      {sub && <span className={styles.pCardSub}>{sub}</span>}
    </div>
  );
}

/* ── Muhurta time block ── */
// tone: 'good' = शुभ (green), 'bad' = टाळावे (red), 'warn' = वर्ज्य / सावधानी (amber)
function MuhurtaBlock({ icon, label, range, tone = 'good' }) {
  const cls = { good: styles.muhurtaGood, bad: styles.muhurtaBad, warn: styles.muhurtaWarn }[tone];
  return (
    <div className={`${styles.muhurtaBlock} ${cls}`}>
      <div className={styles.muhurtaTop}>
        <span className={styles.muhurtaIcon}>{icon}</span>
        <span className={styles.muhurtaLabel}>{label}</span>
      </div>
      <span className={styles.muhurtaTime}>
        {range ? `${formatTime12h(range.start)} – ${formatTime12h(range.end)}` : '—'}
      </span>
    </div>
  );
}

/* ── Festival pill ── */
function FestivalPill({ event }) {
  const cls = {
    special:  styles.pillSpecial,
    vrat:     styles.pillVrat,
    festival: styles.pillFestival,
    info:     styles.pillInfo,
  }[event.type] || styles.pillInfo;
  return (
    <span className={`${styles.pill} ${cls}`}>
      {event.icon && <span>{event.icon}</span>}
      <span>{event.name}</span>
    </span>
  );
}

/* ── Skeleton loader ── */
function Skeleton() {
  return (
    <div className={styles.skeletonWrap}>
      <div className={styles.skeletonBanner} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
      <div className={styles.skeletonBanner} style={{ height: 120 }} />
    </div>
  );
}

/* ── North Indian Kundali Chart ── */
function KundaliChart({ suryaRashi, chandraRashi, lagna, grahas = [], dark }) {
  const lagnaIdx = Math.max(0, RASHI_NAMES.indexOf(lagna || suryaRashi));
  return (
    <div className={`${styles.kundaliWrap} ${dark ? styles.kundaliDark : ''}`}>
      <div className={styles.niChart} role="img"
        aria-label={`कुंडली: लग्न ${lagna}, सूर्य ${suryaRashi}, चंद्र ${chandraRashi}`}>
        <svg viewBox="0 0 400 400" className={styles.niLines} aria-hidden="true">
          <rect x="1.5" y="1.5" width="397" height="397" />
          <line x1="0" y1="0" x2="400" y2="400" />
          <line x1="400" y1="0" x2="0" y2="400" />
          <polygon points="200,0 400,200 200,400 0,200" />
        </svg>
        {NI_HOUSES.map(({ h, x, y }) => {
          const rIdx  = (lagnaIdx + h - 1) % 12;
          const rashi = RASHI_NAMES[rIdx];
          const isSun  = rashi === suryaRashi;
          const isMoon = rashi === chandraRashi;
          const others = grahas.filter(g => g.rashi === rashi);
          return (
            <div key={h}
              className={`${styles.niHouse} ${h === 1 ? styles.niLagna : ''}`}
              style={{ left: `${x / 4}%`, top: `${y / 4}%` }}
              title={`${h} वे स्थान — ${rashi}`}
            >
              <span className={styles.niNum}>{rIdx + 1}</span>
              <img src={RASHI_IMG[rashi]} alt={rashi} className={styles.niImg} loading="lazy" width="26" height="26" />
              {(h === 1 || isSun || isMoon || others.length > 0) && (
                <span className={styles.niPlanets}>
                  {h === 1 && <span className={`${styles.niTag} ${styles.niTagLagna}`}>लग्न</span>}
                  {isSun  && <span className={`${styles.niTag} ${styles.niTagSun}`}>सूर्य</span>}
                  {isMoon && <span className={`${styles.niTag} ${styles.niTagMoon}`}>चंद्र</span>}
                  {others.map(g => (
                    <span key={g.key} className={styles.niGraha} title={`${g.name}${g.retro ? ' (वक्री)' : ''}`}>
                      {GRAHA_SHORT[g.key]}{g.retro && <sup>व</sup>}
                    </span>
                  ))}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className={styles.niKey}>
        मं = मंगळ · बु = बुध · गु = गुरू · शु = शुक्र · श = शनी · रा = राहू · के = केतू · <sup>व</sup> = वक्री
      </p>

      {/* Rashi legend below chart */}
      <div className={styles.kundaliLegend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDotSun} />
          <span>सूर्य राशी: <strong>{suryaRashi || '—'}</strong></span>
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDotMoon} />
          <span>चंद्र राशी: <strong>{chandraRashi || '—'}</strong></span>
        </div>
        {lagna && (
          <div className={styles.legendItem}>
            <span className={styles.legendDotLagna} />
            <span>लग्न: <strong>{lagna}</strong></span>
          </div>
        )}
        {suryaRashi === chandraRashi && (
          <div className={styles.legendItem}>
            <span className={styles.legendDotBoth} />
            <span>सूर्य + चंद्र एकाच राशीत आहेत</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── small pieces of the control panel ──
const CAL_MON = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
const CAL_DAY = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
// a tiny analogue clock whose hands show the chosen time
function MiniClock({ time }) {
  const [h, m] = (time || '00:00').split(':').map(Number);
  const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
  return (
    <svg viewBox="0 0 40 40" className={styles.miniClock} aria-hidden="true">
      <circle cx="20" cy="20" r="18" className={styles.mcFace} />
      {[0, 90, 180, 270].map(a => <line key={a} x1="20" y1="4.5" x2="20" y2="7.5" className={styles.mcTick} transform={`rotate(${a} 20 20)`} />)}
      <line x1="20" y1="20" x2="20" y2="11" className={styles.mcHour} transform={`rotate(${ha} 20 20)`} />
      <line x1="20" y1="20" x2="20" y2="7" className={styles.mcMin} transform={`rotate(${ma} 20 20)`} />
      <circle cx="20" cy="20" r="2" className={styles.mcHub} />
    </svg>
  );
}
// the tab dock: icon, full name (wide screens) and a short name (phones)
const PAGE_TABS = [
  ['panchang', '📅', 'पंचांग', 'पंचांग'],
  ['chakra', '🪐', 'राशि चक्र', 'चक्र'],
  ['yantra', '🔆', 'पंचांग यंत्र', 'यंत्र'],
  ['sankalp', '🙏', 'संकल्प मंत्र', 'संकल्प'],
  ['vel', '🕰', 'वेळ · मासिक', 'वेळ'],
  ['disha', '🧭', 'दिशा यंत्र', 'दिशा'],
];

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

// What survives a refresh: tab + picked date/time live in the URL (shareable, back button);
// district and dark mode in localStorage; the last result in sessionStorage so a refresh
// paints straight away instead of skeleton → data → GPS district → data.
const TABS = ['panchang', 'chakra', 'yantra', 'sankalp', 'vel', 'disha'];
const PLACE_KEY = 'panchang_place', DARK_KEY = 'panchang_dark', LAST_KEY = 'panchang_last';
const store = {
  get: (k, ss) => { try { return JSON.parse((ss ? sessionStorage : localStorage).getItem(k)); } catch { return null; } },
  set: (k, v, ss) => { try { (ss ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
};
function initialState(params) {
  const qd = params.get('date'), qt = params.get('time'), qtab = params.get('tab');
  const custom = /^\d{4}-\d{2}-\d{2}$/.test(qd || '');
  const place = store.get(PLACE_KEY);
  const okPlace = place && place.name && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon));
  const date = custom ? qd : todayIST();
  const lat = okPlace ? String(place.lat) : '18.5204', lon = okPlace ? String(place.lon) : '73.8567';
  const last = store.get(LAST_KEY, true);
  return {
    tab: TABS.includes(qtab) ? qtab : 'panchang',
    live: !custom,
    date,
    time: custom && /^\d{2}:\d{2}$/.test(qt || '') ? qt : nowISTTime(),
    lat, lon, name: okPlace ? place.name : 'पुणे', savedPlace: !!okPlace,
    dark: store.get(DARK_KEY) === true,
    data: last && last.key === `${date}|${lat}|${lon}` ? last.data : null,
  };
}

export default function Panchang() {
  const [params, setParams] = useSearchParams();
  const init = useRef(null);
  if (!init.current) init.current = initialState(params);
  const I = init.current;

  const [date,       setDate]       = useState(I.date);
  const [time,       setTime]       = useState(I.time);
  // live = follow the current IST time (and date). Turns off when the user picks a date or time.
  const [live,       setLive]       = useState(I.live);
  // पंचांग | राशि चक्र | पंचांग यंत्र | दिशा यंत्र
  const [pageTab,    setPageTab]    = useState(I.tab);
  const [showClock,  setShowClock]  = useState(false);
  const [lat,        setLat]        = useState(I.lat);
  const [lon,        setLon]        = useState(I.lon);
  const [cityName,   setCityName]   = useState(I.name);
  const [data,       setData]       = useState(I.data);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [dark,       setDark]       = useState(I.dark);
  const [lastRefresh,setLastRefresh]= useState('');

  // keep the URL / storage in step with what is on screen (replace: no history spam)
  useEffect(() => {
    const next = new URLSearchParams(window.location.search);
    if (pageTab === 'panchang') next.delete('tab'); else next.set('tab', pageTab);
    if (live) { next.delete('date'); next.delete('time'); } else { next.set('date', date); next.set('time', time); }
    if (next.toString() !== new URLSearchParams(window.location.search).toString()) setParams(next, { replace: true });
  }, [pageTab, live, date, time, setParams]);
  useEffect(() => { store.set(PLACE_KEY, { name: cityName, lat, lon }); }, [cityName, lat, lon]);
  useEffect(() => { store.set(DARK_KEY, dark); }, [dark]);
  // the tab dock sticks just under the site header, whatever its height on this screen
  useEffect(() => {
    const fit = () => {
      const h = document.querySelector('header')?.getBoundingClientRect().height;
      if (h) document.documentElement.style.setProperty('--dock-top', `${Math.round(h) + 6}px`);
    };
    fit(); window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Rating state
  const [panRating,  setPanRating]  = useState({ helpful: 0, not_helpful: 0, user_vote: null });
  const [ratingDone, setRatingDone] = useState(false);

  // searchable district dropdown
  const [query,     setQuery]     = useState(I.name);
  const [open,      setOpen]      = useState(false);
  const [highlight, setHighlight] = useState(0);
  const dropRef  = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const filteredDistricts = query.trim()
    ? (() => {
        const q = query.trim().toLowerCase();
        return DISTRICTS.filter(d =>
          d.name.includes(q) || d.eng.toLowerCase().includes(q)
        );
      })()
    : DISTRICTS;

  useEffect(() => {
    const handler = e => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectDistrict = d => {
    setCityName(d.name); setLat(d.lat); setLon(d.lon);
    setQuery(d.name); setOpen(false); setHighlight(0);
  };

  const handleDropKey = e => {
    if (!open) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, filteredDistricts.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (filteredDistricts[highlight]) selectDistrict(filteredDistricts[highlight]); }
    if (e.key === 'Escape')    { setOpen(false); }
  };

  // ── Fetch ───────────────────────────────────────────────────
  // Values always swap in place: no remount, no fade, no dimming (that read as a page blink).
  // silent: background refresh from the live clock — not even the "अपडेट होत आहे" note.
  const reqId = useRef(0);
  const fetchPanchang = useCallback(async (d, la, lo, t, { silent = false } = {}) => {
    const my = ++reqId.current;            // ignore responses that arrive out of order
    if (!silent) setLoading(true);
    setError('');
    try {
      const params = { date: d };
      if (la && lo) { params.lat = la; params.lon = lo; }
      if (t)        { params.time = t; }
      const res = await panchangAPI.get(params);
      if (my !== reqId.current) return;
      setData(res.data.data);
      store.set(LAST_KEY, { key: `${d}|${la}|${lo}`, data: res.data.data }, true);
      setLastRefresh(nowISTTime());
    } catch (err) {
      if (my === reqId.current && !silent) setError(err.response?.data?.message || 'पंचांग माहिती मिळवण्यात त्रुटी झाली.');
    } finally {
      if (my === reqId.current && !silent) setLoading(false);
    }
  }, []);

  // ── Live clock: move date/time forward every 30 s while in live mode ──
  // Changing `time` refetches through the effect below, so the lagna and kundali stay current.
  // Skipped while the tab is hidden; catches up as soon as it is visible again.
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      if (document.hidden) return;
      const t = nowISTTime(), d = todayIST();
      // mark the refetch quiet only when the tick actually changes something
      setTime(prev => { if (prev === t) return prev; silentNext.current = true; return t; });
      setDate(prev => { if (prev === d) return prev; silentNext.current = true; return d; });
    };
    tick();
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [live]);

  // ── Auto-refresh on any input change (debounced 400ms) ──────
  // Live-clock ticks (and the first load when a cached result is already on screen) are quiet.
  const silentNext = useRef(!!I.data);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const silent = silentNext.current;
    silentNext.current = false;
    debounceRef.current = setTimeout(() => {
      fetchPanchang(date, lat, lon, time, { silent });
    }, silent ? 0 : 400);
    return () => clearTimeout(debounceRef.current);
  }, [date, time, lat, lon, fetchPanchang]);

  // Load rating for current date
  useEffect(() => {
    const sid = getSessionId();
    panchangAPI.getRating(date, sid)
      .then(r => {
        const d = r.data.data;
        setPanRating({ helpful: d.helpful || 0, not_helpful: d.not_helpful || 0, user_vote: d.user_vote });
        if (d.user_vote !== null) setRatingDone(true);
      })
      .catch(() => {});
  }, [date]);

  // ── Panchang Rating ──────────────────────────────────────────
  const handlePanchangRate = async (is_helpful) => {
    if (ratingDone) return;
    try {
      const sid = getSessionId();
      const res = await panchangAPI.rate(date, is_helpful, sid);
      const d = res.data.data;
      setPanRating({ helpful: d.helpful, not_helpful: d.not_helpful, user_vote: is_helpful });
      setRatingDone(true);
      toast.success(is_helpful ? 'धन्यवाद! 🙏 तुमचा अभिप्राय नोंदवला.' : 'अभिप्राय नोंदवला. सुधारणा करू. 🙏');
    } catch { toast.error('अभिप्राय देताना त्रुटी झाली.'); }
  };

  // ── Geolocation ─────────────────────────────────────────────
  // Shared by the manual GPS button AND the silent auto-detect-on-load below.
  const applyGpsPosition = (gpsLat, gpsLon) => {
    // Match to the nearest Maharashtra district so the label + calculation
    // are consistent with manually selecting that same district from the
    // dropdown (district-level panchang, not a raw personal GPS point).
    const nearest = nearestDistrict(gpsLat, gpsLon);
    const la = nearest ? nearest.lat : gpsLat.toFixed(4);
    const lo = nearest ? nearest.lon : gpsLon.toFixed(4);
    const label = nearest ? nearest.name : 'माझे स्थान';
    setLat(la); setLon(lo);                // the input-change effect fetches once
    setCityName(label); setQuery(label);
  };

  const detectLocation = () => {
    if (!navigator.geolocation) { setError('ब्राउझर GPS समर्थित नाही.'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => { applyGpsPosition(pos.coords.latitude, pos.coords.longitude); setLocLoading(false); },
      () => { setError('स्थान मिळवता आले नाही.'); setLocLoading(false); },
      { timeout: 8000 }
    );
  };

  // Auto-detect ONCE on page load — same district match, but silent
  // (no error shown) if the user hasn't granted/denied location yet;
  // पुणे stays as the default when permission isn't available.
  useEffect(() => {
    if (!navigator.geolocation || I.savedPlace) return;   // a remembered district wins on refresh
    navigator.geolocation.getCurrentPosition(
      pos => applyGpsPosition(pos.coords.latitude, pos.coords.longitude),
      () => {},                 // denied/unavailable — keep default पुणे, no error shown
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className={`${styles.page} ${dark ? styles.dark : ''}`}>
      <SEOHead
        title={`आजचा पंचांग ${formatMR(date)} | आजचा शुभ मुहूर्त मराठी — पूजारी`}
        description={`${formatMR(date)} चा हिंदू पंचांग — तिथी, नक्षत्र, योग, करण, राहुकाळ, अभिजित मुहूर्त. पुणे, मुंबई, नाशिक, नागपूरसह महाराष्ट्रातील सर्व ३६ जिल्ह्यांसाठी दैनंदिन पंचांग मराठीत.`}
        keywords="आजचा पंचांग, आजचा मुहूर्त मराठी, शुभ मुहूर्त आज, आजची तिथी मराठी, आजचे नक्षत्र, राहुकाळ आज, hindu panchang today marathi, tithi today marathi, nakshatra today, panchang 2026, अभिजित मुहूर्त, आजचा योग, आजचे करण, कुंडली मराठी"
        canonical="/panchang"
        schema={buildPanchangSchema(date)}
      />
      <Header />

      {/* ═══ HERO ═══════════════════════════════════════════ */}
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <span className={styles.heroOm}>🕉️</span>
              <div>
                <h1 className={styles.heroTitle}>हिंदू पंचांग</h1>
                <p className={styles.heroSub}>तिथी · नक्षत्र · योग · करण · लग्न · कुंडली</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Muhurat button */}
              <Link to="/muhurat" style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', borderRadius: '22px',
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)',
                border: '1.5px solid rgba(255,255,255,0.35)',
                color: '#fff', fontWeight: '700', fontSize: '13px',
                textDecoration: 'none', transition: 'all 0.2s',
              }}>
                🪔 मुहूर्त
              </Link>
              {/* Dark mode toggle */}
              <button
                className={styles.darkToggle}
                onClick={() => setDark(d => !d)}
                title={dark ? 'उजेड मोड' : 'अंधार मोड'}
              >
                {dark ? '☀️' : '🌙'}
                <span>{dark ? 'उजेड' : 'अंधार'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        {/* ═══ CONTROLS: calendar page · time · place ═════════ */}
        <div className={styles.ctl}>
          {(() => {
            const [cy, cm, cd] = date.split('-').map(Number);
            const wd = new Date(Date.UTC(cy, cm - 1, cd)).getUTCDay();
            return (
              <label className={styles.calPage} title="तारीख निवडा">
                <span className={styles.calRing} aria-hidden="true"><i /><i /></span>
                <span className={styles.calMonth}>{CAL_MON[cm - 1]} {cy}</span>
                <span key={date} className={styles.calDay}>{cd}</span>
                <span className={styles.calWeek}>{CAL_DAY[wd]}</span>
                <input type="date" className={styles.calInput} value={date} min="1900-01-01" max="2099-12-31"
                  aria-label={`तारीख निवडा — ${formatMR(date)}`}
                  onChange={e => { if (e.target.value) { setLive(false); setDate(e.target.value); } }} />
              </label>
            );
          })()}

          <div className={styles.ctlSide}>
            <button type="button" className={styles.timeChip} onClick={() => setShowClock(true)} title="वेळ निवडा">
              <MiniClock time={time} />
              <span className={styles.timeChipText}>
                <small>वेळ</small>
                <b>{formatTime12h(time)}</b>
              </span>
              <span className={styles.timeChipChev} aria-hidden="true">▾</span>
            </button>
            {!live && (
              <button type="button" className={styles.backLive}
                onClick={() => { setDate(todayIST()); setTime(nowISTTime()); setLive(true); }}>
                ⟳ आत्ताच्या वेळेवर या
              </button>
            )}
          </div>

          <div className={styles.ctlPlace}>
            <span className={styles.ctlLabel}>📍 जिल्हा</span>
                <div className={styles.searchDrop} ref={dropRef}>
                  <div className={styles.searchInputWrap}>
                    <span className={styles.searchInputIcon}>🔍</span>
                    <input
                      ref={inputRef}
                      type="text"
                      className={styles.searchInput}
                      placeholder="जिल्हा / District..."
                      value={query}
                      onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
                      onFocus={() => setOpen(true)}
                      onKeyDown={handleDropKey}
                      autoComplete="off"
                    />
                    {query && (
                      <button className={styles.clearBtn} aria-label="जिल्हा पुसा"
                        onClick={() => { setQuery(''); setOpen(true); inputRef.current?.focus(); }}>✕</button>
                    )}
                    <button type="button" className={styles.gpsInline}
                      onClick={detectLocation} disabled={locLoading} title="GPS वरून शोधा" aria-label="GPS वरून जिल्हा शोधा">
                      {locLoading ? '⏳' : '🎯'}
                    </button>
                  </div>
                  {open && filteredDistricts.length > 0 && (
                    <ul className={styles.dropList}>
                      {filteredDistricts.map((d, i) => (
                        <li key={d.name}
                          className={`${styles.dropItem} ${i === highlight ? styles.dropItemActive : ''} ${cityName === d.name ? styles.dropItemSelected : ''}`}
                          onMouseDown={() => selectDistrict(d)}
                          onMouseEnter={() => setHighlight(i)}>
                          <span className={styles.dropItemIcon}>📍</span>
                          {d.name}
                          {cityName === d.name && <span className={styles.dropItemCheck}>✓</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  {open && filteredDistricts.length === 0 && (
                    <div className={styles.dropEmpty}>"{query}" सापडला नाही</div>
                  )}
                </div>
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.errorBox}>❌ {error}</div>}

        {/* Skeleton */}
        {loading && !data && <Skeleton />}

        {/* ═══ tab dock (sticks under the header) ══════════════ */}
        <nav className={styles.dock} role="tablist" aria-label="पंचांग विभाग">
          {PAGE_TABS.map(([k, icon, full, short]) => (
            <button key={k} type="button" role="tab" aria-selected={pageTab === k} title={full}
              className={`${styles.dockBtn} ${pageTab === k ? styles.dockOn : ''}`}
              onClick={() => setPageTab(k)}>
              <span className={styles.dockIcon} aria-hidden="true">{icon}</span>
              <span className={styles.dockFull}>{full}</span>
              <span className={styles.dockShort} aria-hidden="true">{short}</span>
            </button>
          ))}
        </nav>

        {pageTab === 'sankalp' && <SankalpMantra data={data} place={cityName} />}
        {pageTab === 'vel' && (
          <VelMasik lat={Number(lat)} lon={Number(lon)} place={cityName}
            onOpenDay={(d) => { setLive(false); setDate(d); setTime('06:00'); setPageTab('panchang'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        )}
        {pageTab === 'disha' && <DishaYantra3D lat={Number(lat)} lon={Number(lon)} place={cityName} />}
        {pageTab === 'yantra' && (
          <PanchangYantra3D lat={Number(lat)} lon={Number(lon)} place={cityName}
            syncMs={live ? null : Date.parse(`${date}T${time}:00+05:30`)} />
        )}

        {pageTab === 'chakra' && (
          <RashiChakra3D
            lat={Number(lat)}
            lon={Number(lon)}
            place={cityName}
            // follow a date/time the visitor picked above; in live mode the wheel keeps its own clock
            syncMs={live ? null : Date.parse(`${date}T${time}:00+05:30`)}
            onShowKundli={(ms) => {
              const ist = new Date(ms + 330 * 60000).toISOString();
              setLive(false);
              setDate(ist.slice(0, 10));
              setTime(ist.slice(11, 16));
              setPageTab('panchang');
              setTimeout(() => document.getElementById('kundali-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 600);
            }}
          />
        )}

        {/* ═══ RESULTS ══════════════════════════════════════ */}
        {data && pageTab === 'panchang' && (
          <div className={styles.results}>

            {/* ── Date + Time banner ── */}
            <div className={styles.dateBanner}>
              <div className={styles.dateBannerLeft}>
                <span className={styles.bannerDate}>{formatMR(data.date)}</span>
                <span className={styles.bannerVar}>{data.var}</span>
              </div>
              <div className={styles.dateBannerRight}>
                <span className={styles.tagPaksha}>{data.paksha}</span>
                <span className={styles.tagMaas}>{data.maas} मास</span>
                {data.selectedTime && (
                  <span className={styles.tagTime}>
                    ⏰ {formatTime12h(data.selectedTime)}
                  </span>
                )}
                {cityName && <span className={styles.tagCity}>📍 {cityName}</span>}
              </div>
            </div>

            {/* ── Festivals ── */}
            {data.festivals?.length > 0 && (
              <div className={styles.festivalBand}>
                <span className={styles.festivalBandTitle}>🎊 आजचे विशेष</span>
                <div className={styles.festivalPills}>
                  {data.festivals.map((f, i) => (
                    <FestivalPill key={i} event={f} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Panchang cards ── */}
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>📿</span>
                पंचांग तत्त्वे
              </h2>
              <div className={styles.panchangGrid}>
                <PCard icon="🌓" label="तिथी"        value={data.tithi?.name}  sub={`${data.tithi?.num} / ३०`} accent />
                <PCard icon="⭐" label="नक्षत्र"      value={data.nakshatra} />
                <PCard icon="🔮" label="योग"          value={data.yoga} />
                <PCard icon="✋" label="करण"          value={data.karana} />
                <PCard icon="🌗" label="पक्ष"         value={data.paksha} />
                <PCard icon="📅" label="मास"          value={`${data.maas} मास`} />
                <PCard icon="☀️" label="सूर्य राशी"    value={data.suryaRashi} />
                <PCard icon="🌙" label="चंद्र राशी"    value={data.chandraRashi} />
                <PCard
                  icon="🔯"
                  label="लग्न (Lagna)"
                  value={data.lagna}
                  sub={data.lagnaDegs ? `${data.lagnaDegs}°` : undefined}
                  accent
                />
              </div>
            </section>

            {/* ── Sun row ── */}
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>🌅</span>
                सूर्योदय / सूर्यास्त
              </h2>
              <div className={styles.sunRow}>
                <div className={styles.sunBlock}>
                  <span className={styles.sunEmoji}>🌅</span>
                  <span className={styles.sunName}>सूर्योदय</span>
                  <span className={styles.sunTime}>{data.sunrise}</span>
                </div>
                <div className={styles.sunSep} />
                <div className={styles.sunBlock}>
                  <span className={styles.sunEmoji}>🌇</span>
                  <span className={styles.sunName}>सूर्यास्त</span>
                  <span className={styles.sunTime}>{data.sunset}</span>
                </div>
              </div>
            </section>

            {/* ── Muhurtas ── */}
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>⏰</span>
                काळ / मुहूर्त
              </h2>
              <div className={styles.muhurtaGrid}>
                <MuhurtaBlock icon="🙏" label={data.abhijitMuhurat?.avoid ? 'अभिजित मुहूर्त (बुधवारी वर्ज्य)' : 'अभिजित मुहूर्त'}
                  range={data.abhijitMuhurat} tone={data.abhijitMuhurat?.avoid ? 'warn' : 'good'} />
                <MuhurtaBlock icon="🔴" label="राहु काळ"       range={data.rahuKaal}       tone="bad" />
                <MuhurtaBlock icon="⚫" label="गुळिक काळ"      range={data.gulikaKaal}     tone="bad" />
                <MuhurtaBlock icon="🟡" label="यमगंड"           range={data.yamaganda}      tone="bad" />
              </div>
              <p className={styles.muhurtaNote}>
                ℹ️ <strong>राहु काळ, गुळिक काळ, यमगंड</strong> — या काळात महत्त्वाची कामे, प्रवास, व्यवहार टाळावेत.
                {data.abhijitMuhurat?.avoid
                  ? <> <strong>अभिजित मुहूर्त</strong> बुधवारी वर्ज्य मानतात — आज शुभ कामासाठी अमृत, शुभ किंवा लाभ चौघडिया पाहावा.</>
                  : <> <strong>अभिजित मुहूर्त</strong> सर्वोत्तम शुभ वेळ आहे.</>}
              </p>
            </section>

            {/* ── Shubh Muhurat banner ── */}
            {data.shubhMuhurat && (
              <div className={styles.shubhBanner}>
                <div className={styles.shubhBannerIcon}>🪔</div>
                <div className={styles.shubhBannerBody}>
                  <span className={styles.shubhBannerTitle}>आजचा शुभ मुहूर्त</span>
                  <p className={styles.shubhBannerText}>{data.shubhMuhurat}</p>
                </div>
              </div>
            )}

            {/* ── Kundali ── */}
            <section className={styles.section} id="kundali-section">
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>🔯</span>
                उत्तर भारतीय कुंडली
                <span className={styles.sectionBadge}>ग्रह स्थिती</span>
              </h2>
              <p className={styles.kundaliDesc}>
                खालील कुंडलीत निवडलेल्या वेळेचे <span className={styles.lagnaText}>लग्न</span>,{' '}
                <span className={styles.sunText}>सूर्य</span>, <span className={styles.moonText}>चंद्र</span>{' '}
                आणि इतर सात ग्रह त्यांच्या राशीत दर्शविले आहेत.
                वरच्या मधल्या घरात लग्न (पहिले स्थान) असते आणि पुढील स्थाने उलट्या घड्याळाच्या दिशेने मोजली जातात;
                प्रत्येक घरातील आकडा हा राशीचा क्रमांक आहे (१ = मेष … १२ = मीन). वेळ बदलल्यास लग्न आपोआप बदलते.
              </p>
              <KundaliChart
                suryaRashi={data.suryaRashi}
                chandraRashi={data.chandraRashi}
                lagna={data.lagna}
                grahas={data.grahas}
                dark={dark}
              />
            </section>

          </div>
        )}

        {/* ── Panchang Rating Widget ─────────────────────── */}
        {data && pageTab === 'panchang' && (
          <div className={styles.panchangRatingBox}>
            {!ratingDone ? (
              <>
                <p className={styles.panchangRatingTitle}>
                  📅 आजचे पंचांग उपयुक्त वाटले का?
                </p>
                <div className={styles.panchangRatingBtns}>
                  <button className={styles.panRateYes} onClick={() => handlePanchangRate(true)}>
                    👍 हो, उपयुक्त होते
                  </button>
                  <button className={styles.panRateNo} onClick={() => handlePanchangRate(false)}>
                    👎 नाही, सुधारणा हवी
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.panchangRatingDone}>
                {panRating.user_vote
                  ? '🙏 धन्यवाद! तुमचा अभिप्राय नोंदवला.'
                  : '🙏 अभिप्राय नोंदवला. सुधारणा करू.'}
                <div className={styles.panRatingStats}>
                  👍 {panRating.helpful} &nbsp;·&nbsp; 👎 {panRating.not_helpful}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {/* ── Clock time picker modal ── */}
      {showClock && (
        <ClockTimePicker
          value={time}
          onChange={t => { setLive(false); setTime(t); }}
          onClose={() => setShowClock(false)}
        />
      )}
    </div>
  );
}
