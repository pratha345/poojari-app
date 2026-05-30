// src/pages/Muhurat.jsx — शुभ मुहूर्त & चौघडिया (redesigned)
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { panchangAPI } from '../api/index.js';
import styles from './Muhurat.module.css';

// ── Choghadiya tables ───────────────────────────────────────────────
const DAY_CHOG = [
  ['उद्वेग','चर','लाभ','अमृत','काळ','शुभ','रोग','उद्वेग'],
  ['अमृत','काळ','शुभ','रोग','उद्वेग','चर','लाभ','अमृत'],
  ['रोग','उद्वेग','चर','लाभ','अमृत','काळ','शुभ','रोग'],
  ['लाभ','अमृत','काळ','शुभ','रोग','उद्वेग','चर','लाभ'],
  ['शुभ','रोग','उद्वेग','चर','लाभ','अमृत','काळ','शुभ'],
  ['चर','लाभ','अमृत','काळ','शुभ','रोग','उद्वेग','चर'],
  ['काळ','शुभ','रोग','उद्वेग','चर','लाभ','अमृत','काळ'],
];
const NIGHT_CHOG = [
  ['शुभ','अमृत','चर','रोग','काळ','लाभ','उद्वेग','शुभ'],
  ['चर','रोग','काळ','लाभ','उद्वेग','शुभ','अमृत','चर'],
  ['काळ','लाभ','उद्वेग','शुभ','अमृत','चर','रोग','काळ'],
  ['उद्वेग','शुभ','अमृत','चर','रोग','काळ','लाभ','उद्वेग'],
  ['अमृत','चर','रोग','काळ','लाभ','उद्वेग','शुभ','अमृत'],
  ['रोग','काळ','लाभ','उद्वेग','शुभ','अमृत','चर','रोग'],
  ['लाभ','उद्वेग','शुभ','अमृत','चर','रोग','काळ','लाभ'],
];

const CHOG_META = {
  'अमृत':  { quality: 'best',    color: '#1b7c3b', bg: '#e6f4ea', badge: 'सर्वोत्तम', icon: '🍯', desc: 'सर्व शुभ कार्ये, विवाह, व्यापारासाठी उत्तम काळ' },
  'शुभ':   { quality: 'good',    color: '#1253a4', bg: '#e8f0fb', badge: 'शुभ',       icon: '✨', desc: 'मंगल कार्ये, उद्घाटन, शुभारंभासाठी शुभ' },
  'लाभ':   { quality: 'good',    color: '#6a1b9a', bg: '#f3e5f5', badge: 'लाभदायक',  icon: '💰', desc: 'आर्थिक व्यवहार, व्यापार सुरुवातीसाठी योग्य' },
  'चर':    { quality: 'neutral', color: '#b45309', bg: '#fef3c7', badge: 'मध्यम',     icon: '🚗', desc: 'प्रवास, वाहन खरेदी, बदलासाठी ठीक' },
  'उद्वेग': { quality: 'bad',   color: '#b91c1c', bg: '#fee2e2', badge: 'टाळावे',    icon: '⚠️', desc: 'महत्त्वाची कामे टाळावी, चिंता शक्य' },
  'काळ':   { quality: 'bad',    color: '#374151', bg: '#f3f4f6', badge: 'टाळावे',    icon: '🔴', desc: 'सर्व महत्त्वाची कामे टाळा — अत्यंत अशुभ' },
  'रोग':   { quality: 'bad',    color: '#9d174d', bg: '#fce7f3', badge: 'टाळावे',    icon: '🤒', desc: 'आजार, अडथळे शक्य — महत्त्वाची कामे नको' },
};

const OCCASIONS = [
  { icon: '💍', label: 'विवाह',        good: ['अमृत','शुभ','लाभ'] },
  { icon: '🏠', label: 'गृहप्रवेश',    good: ['अमृत','शुभ','लाभ'] },
  { icon: '🚗', label: 'वाहन खरेदी',  good: ['अमृत','शुभ','लाभ','चर'] },
  { icon: '💼', label: 'व्यापार सुरू', good: ['अमृत','लाभ','शुभ'] },
  { icon: '👶', label: 'नामकरण',       good: ['अमृत','शुभ'] },
  { icon: '✂️', label: 'मुंडन',        good: ['अमृत','शुभ','लाभ'] },
  { icon: '🍚', label: 'अन्नप्राशन',   good: ['अमृत','शुभ'] },
  { icon: '🏗️', label: 'भूमिपूजन',    good: ['अमृत','शुभ','लाभ'] },
];

const DISTRICTS = [
  { name: 'पुणे',          eng: 'pune poona',                lat: '18.5204', lon: '73.8567' },
  { name: 'मुंबई शहर',     eng: 'mumbai city bombay',        lat: '18.9388', lon: '72.8354' },
  { name: 'मुंबई उपनगर',  eng: 'mumbai suburban upnagar',    lat: '19.0760', lon: '72.8777' },
  { name: 'ठाणे',          eng: 'thane',                      lat: '19.2183', lon: '72.9781' },
  { name: 'पालघर',         eng: 'palghar',                    lat: '19.6967', lon: '72.7697' },
  { name: 'रायगड',         eng: 'raigad',                     lat: '18.5158', lon: '73.1186' },
  { name: 'रत्नागिरी',     eng: 'ratnagiri',                  lat: '16.9902', lon: '73.3120' },
  { name: 'सिंधुदुर्ग',    eng: 'sindhudurg',                 lat: '16.3490', lon: '73.8530' },
  { name: 'सातारा',        eng: 'satara',                     lat: '17.6805', lon: '74.0183' },
  { name: 'सांगली',        eng: 'sangli',                     lat: '16.8524', lon: '74.5815' },
  { name: 'कोल्हापूर',     eng: 'kolhapur',                   lat: '16.6975', lon: '74.2282' },
  { name: 'सोलापूर',       eng: 'solapur',                    lat: '17.6805', lon: '75.9064' },
  { name: 'नाशिक',        eng: 'nashik',                     lat: '20.0059', lon: '73.7898' },
  { name: 'धुळे',          eng: 'dhule',                      lat: '20.9042', lon: '74.7749' },
  { name: 'नंदुरबार',      eng: 'nandurbar',                  lat: '21.3667', lon: '74.2333' },
  { name: 'जळगाव',        eng: 'jalgaon',                    lat: '21.0077', lon: '75.5626' },
  { name: 'अहमदनगर',      eng: 'ahmednagar',                 lat: '19.0950', lon: '74.7493' },
  { name: 'औरंगाबाद',     eng: 'aurangabad',                 lat: '19.8762', lon: '75.3433' },
  { name: 'जालना',         eng: 'jalna',                      lat: '19.8415', lon: '75.8816' },
  { name: 'बीड',           eng: 'beed',                       lat: '18.9893', lon: '75.7602' },
  { name: 'लातूर',         eng: 'latur',                      lat: '18.4088', lon: '76.5604' },
  { name: 'उस्मानाबाद',    eng: 'osmanabad',                  lat: '18.1860', lon: '76.0388' },
  { name: 'नांदेड',        eng: 'nanded',                     lat: '19.1383', lon: '77.2985' },
  { name: 'परभणी',         eng: 'parbhani',                   lat: '19.2704', lon: '76.6076' },
  { name: 'हिंगोली',       eng: 'hingoli',                    lat: '19.7177', lon: '77.1548' },
  { name: 'नागपूर',        eng: 'nagpur',                     lat: '21.1458', lon: '79.0882' },
  { name: 'वर्धा',         eng: 'wardha',                     lat: '20.7453', lon: '78.5966' },
  { name: 'यवतमाळ',       eng: 'yavatmal',                   lat: '20.3888', lon: '78.1204' },
  { name: 'अमरावती',       eng: 'amravati',                   lat: '20.9333', lon: '77.7500' },
  { name: 'अकोला',         eng: 'akola',                      lat: '20.7063', lon: '77.0024' },
  { name: 'वाशिम',         eng: 'washim',                     lat: '20.1000', lon: '77.1333' },
  { name: 'बुलढाणा',       eng: 'buldhana',                   lat: '20.5333', lon: '76.1833' },
  { name: 'चंद्रपूर',      eng: 'chandrapur',                 lat: '19.9615', lon: '79.2961' },
  { name: 'गडचिरोली',      eng: 'gadchiroli',                 lat: '20.1809', lon: '80.0000' },
  { name: 'गोंदिया',       eng: 'gondia',                     lat: '21.4592', lon: '80.1953' },
  { name: 'भंडारा',        eng: 'bhandara',                   lat: '21.1667', lon: '79.6500' },
];

const DAYS_MR   = ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];
const MONTHS_MR = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];

// ── Helpers ──────────────────────────────────────────────────────────
function todayIST() {
  return new Date(Date.now() + 330 * 60000).toISOString().split('T')[0];
}
function formatMR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS_MR[parseInt(m) - 1]}, ${y}`;
}
function minsToTime(m) {
  const total = ((m % 1440) + 1440) % 1440;
  const hh = Math.floor(total / 60);
  const mm = Math.floor(total % 60);
  const ampm = hh < 12 ? 'AM' : 'PM';
  const h12  = hh % 12 || 12;
  return `${h12}:${String(mm).padStart(2,'0')} ${ampm}`;
}
function parseDisplayTime(t) {
  // parse "6:04 AM" or "7:03 PM" → minutes since midnight
  if (!t) return 0;
  const parts = t.trim().split(' ');
  const ampm  = parts[1] || 'AM';
  const [hStr, mStr] = parts[0].split(':');
  let h = parseInt(hStr);
  const m = parseInt(mStr);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}
function timeToMins(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minsToHHMM(totalMins) {
  const h = Math.floor(totalMins / 60);
  const m = Math.floor(totalMins % 60);
  return `${h}ता ${m}मि`;
}

function buildChoghadiya(sunriseStr, sunsetStr, dateStr) {
  const date    = new Date(dateStr + 'T00:00:00+05:30');
  const dowIdx  = date.getDay();
  const sunrise = timeToMins(sunriseStr);
  const sunset  = timeToMins(sunsetStr);
  const nextSunrise = sunset + (sunrise + 1440 - sunset);
  const dayPeriod   = (sunset - sunrise) / 8;
  const nightPeriod = (nextSunrise - sunset) / 8;

  const day = DAY_CHOG[dowIdx].map((name, i) => ({
    name, ...CHOG_META[name],
    start: minsToTime(sunrise + i * dayPeriod),
    end:   minsToTime(sunrise + (i + 1) * dayPeriod),
    startMins: sunrise + i * dayPeriod,
    endMins:   sunrise + (i + 1) * dayPeriod,
  }));
  const night = NIGHT_CHOG[dowIdx].map((name, i) => ({
    name, ...CHOG_META[name],
    start: minsToTime(sunset + i * nightPeriod),
    end:   minsToTime(sunset + (i + 1) * nightPeriod),
    startMins: sunset + i * nightPeriod,
    endMins:   sunset + (i + 1) * nightPeriod,
  }));
  return { day, night };
}

function getActiveSlot(chog, nowMins) {
  const all = [...chog.day, ...chog.night];
  for (const c of all) {
    let s = parseDisplayTime(c.start);
    let e = parseDisplayTime(c.end);
    if (e < s) e += 1440;
    if (nowMins >= s && nowMins < e) return c;
  }
  return null;
}

function isSlotActive(slot, nowMins) {
  let s = parseDisplayTime(slot.start);
  let e = parseDisplayTime(slot.end);
  if (e < s) e += 1440;
  return nowMins >= s && nowMins < e;
}

// ── Component ────────────────────────────────────────────────────────
export default function Muhurat() {
  const [date,       setDate]       = useState(todayIST());
  const [cityName,   setCityName]   = useState('पुणे');
  const [lat,        setLat]        = useState('18.5204');
  const [lon,        setLon]        = useState('73.8567');
  const [locLoading, setLocLoading] = useState(false);
  const [panData,    setPanData]    = useState(null);
  const [chog,       setChog]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [tab,        setTab]        = useState('choghadiya');
  const [nowTime,    setNowTime]    = useState(new Date());

  // searchable dropdown
  const [query,     setQuery]     = useState('पुणे');
  const [open,      setOpen]      = useState(false);
  const [highlight, setHighlight] = useState(0);
  const dropRef  = useRef(null);
  const inputRef = useRef(null);

  // live clock — updates every second
  useEffect(() => {
    const id = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = query.trim()
    ? DISTRICTS.filter(d => d.name.includes(query.trim()) || d.eng.toLowerCase().includes(query.trim().toLowerCase()))
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
  const handleInputKey = e => {
    if (!open) { setOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h+1, filtered.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlight(h => Math.max(h-1, 0)); }
    if (e.key === 'Enter')     { e.preventDefault(); if (filtered[highlight]) selectDistrict(filtered[highlight]); }
    if (e.key === 'Escape')    { setOpen(false); }
  };

  const fetchData = useCallback(async (d, la, lo) => {
    setLoading(true);
    try {
      const res = await panchangAPI.get({ date: d, lat: la, lon: lo });
      const pd  = res.data.data;
      setPanData(pd);
      if (pd.sunrise && pd.sunset) setChog(buildChoghadiya(pd.sunrise, pd.sunset, d));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(date, lat, lon); }, [date, lat, lon, fetchData]);

  // Auto-detect location on page load
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude.toFixed(4);
        const lo = pos.coords.longitude.toFixed(4);
        setLat(la); setLon(lo);
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&accept-language=en`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const candidates = [
            addr.county, addr.state_district, addr.district,
            addr.city, addr.town, addr.village,
          ].filter(Boolean).map(s => s.toLowerCase().replace(/\s*district\s*/gi, '').trim());

          let found = null;
          for (const raw of candidates) {
            found = DISTRICTS.find(d => {
              const engParts = d.eng.toLowerCase().split(' ').filter(e => e.length > 3);
              return engParts.some(e => raw.includes(e) || e.includes(raw));
            });
            if (found) break;
          }
          if (found) { selectDistrict(found); }
        } catch { /* keep default Pune */ }
      },
      () => { /* permission denied — keep default Pune */ },
      { timeout: 8000 }
    );
  }, []); // runs once on mount

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude.toFixed(4);
        const lo = pos.coords.longitude.toFixed(4);
        setLat(la); setLon(lo);
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${la}&lon=${lo}&format=json&accept-language=en`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          // All candidate location names from Nominatim (most specific first)
          const candidates = [
            addr.county, addr.state_district, addr.district,
            addr.city, addr.town, addr.village, addr.municipality,
          ].filter(Boolean).map(s => s.toLowerCase().replace(/\s*district\s*/gi, '').trim());

          // Match against our DISTRICTS list — English name match (precise)
          let found = null;
          for (const raw of candidates) {
            found = DISTRICTS.find(d => {
              const engParts = d.eng.toLowerCase().split(' ').filter(e => e.length > 3);
              return engParts.some(e => raw.includes(e) || e.includes(raw));
            });
            if (found) break;
          }

          if (found) {
            selectDistrict(found);
          } else {
            const label = candidates[0] || 'माझे स्थान';
            setCityName(label); setQuery(label);
          }
        } catch {
          setCityName('माझे स्थान'); setQuery('माझे स्थान');
        }
        setLocLoading(false);
      },
      () => setLocLoading(false), { timeout: 10000 }
    );
  };

  const dateObj = new Date(date + 'T00:00:00+05:30');
  const dayMR   = DAYS_MR[dateObj.getDay()];
  const isToday = date === todayIST();
  const nowMins = nowTime.getHours() * 60 + nowTime.getMinutes();
  const activeSlot = chog && isToday ? getActiveSlot(chog, nowMins) : null;

  // duration
  const dayDuration = panData
    ? minsToHHMM(timeToMins(panData.sunset) - timeToMins(panData.sunrise))
    : null;
  const nightDuration = panData
    ? minsToHHMM((timeToMins(panData.sunrise) + 1440) - timeToMins(panData.sunset))
    : null;

  // live clock display
  const liveTime = nowTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className={styles.page}>
      <SEOHead
        title="शुभ मुहूर्त | चौघडिया | Muhurat Today — पूजारी"
        description="आजचे शुभ मुहूर्त, चौघडिया, विवाह मुहूर्त, गृहप्रवेश, वाहन खरेदी मुहूर्त. महाराष्ट्रातील सर्व शहरांसाठी."
        canonical="/muhurat"
      />
      <Header />

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <span className={styles.heroIcon}>🪔</span>
              <div>
                <h1 className={styles.heroTitle}>शुभ मुहूर्त & चौघडिया</h1>
                <p className={styles.heroSub}>{dayMR}, {formatMR(date)} · {cityName}</p>
              </div>
            </div>
            {isToday && (
              <div className={styles.heroClock}>
                <span className={styles.heroClockDot} />
                <span className={styles.heroClockTime}>{liveTime}</span>
              </div>
            )}
            <Link to="/panchang" className={styles.panchangLinkHero}>🕉️ पंचांग</Link>
          </div>

          {/* Live clock */}
          {/* Controls inside hero */}
          <div className={styles.controlsBar}>
            {/* Location */}
            <div className={styles.controlItem} ref={dropRef}>
              <span className={styles.controlIcon}>📍</span>
              <input
                ref={inputRef}
                type="text"
                className={styles.controlInput}
                placeholder="जिल्हा शोधा..."
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true); setHighlight(0); }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleInputKey}
                autoComplete="off"
              />
              {open && filtered.length > 0 && (
                <ul className={styles.dropList}>
                  {filtered.slice(0, 8).map((d, i) => (
                    <li key={d.name}
                      className={`${styles.dropItem} ${i === highlight ? styles.dropItemActive : ''}`}
                      onMouseDown={() => selectDistrict(d)}>
                      📍 {d.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Date */}
            <div className={styles.controlItem}>
              <span className={styles.controlIcon}>📅</span>
              <input type="date" className={styles.controlInput}
                value={date} min="2020-01-01" max="2030-12-31"
                onChange={e => setDate(e.target.value)} />
            </div>

            {/* GPS */}
            <button className={styles.gpsBtn} onClick={detectLocation} disabled={locLoading}>
              {locLoading ? '⏳' : '🎯'} GPS
            </button>
          </div>

          {/* ══ 4 STAT CARDS (inside dark hero) ══════════════════════ */}
          {panData && (
            <div className={styles.statCards}>
              <div className={`${styles.statCard} ${styles.statSunrise}`}>
                <span className={styles.statIcon}>🌅</span>
                <span className={styles.statLabel}>SUNRISE</span>
                <span className={styles.statValue}>{panData.sunrise}</span>
              </div>
              <div className={`${styles.statCard} ${styles.statSunset}`}>
                <span className={styles.statIcon}>🌇</span>
                <span className={styles.statLabel}>SUNSET</span>
                <span className={styles.statValue}>{panData.sunset}</span>
              </div>
              <div className={`${styles.statCard} ${styles.statDay}`}>
                <span className={styles.statIcon}>☀️</span>
                <span className={styles.statLabel}>DAY PERIOD</span>
                <span className={styles.statValue}>{dayDuration}</span>
              </div>
              <div className={`${styles.statCard} ${styles.statNight}`}>
                <span className={styles.statIcon}>🌙</span>
                <span className={styles.statLabel}>NIGHT PERIOD</span>
                <span className={styles.statValue}>{nightDuration}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container" style={{ paddingTop: '24px' }}>

        {/* ══ ACTIVE CHOGHADIYA BANNER ══════════════════════════════════ */}
        {activeSlot && (
          <div className={styles.activeBanner} style={{ background: activeSlot.bg, borderColor: activeSlot.color }}>
            <div className={styles.activeBannerLeft}>
              <span className={styles.activeDot} style={{ background: activeSlot.color }} />
              <span className={styles.activeLabel}>आत्ताचा चौघडिया</span>
              <span className={styles.activeIcon}>{activeSlot.icon}</span>
              <span className={styles.activeName} style={{ color: activeSlot.color }}>{activeSlot.name}</span>
            </div>
            <div className={styles.activeBannerRight}>
              <span className={styles.activeTime} style={{ color: activeSlot.color }}>
                {activeSlot.start} – {activeSlot.end}
              </span>
              <span className={styles.activeBadge} style={{ background: activeSlot.color }}>
                {activeSlot.badge}
              </span>
            </div>
          </div>
        )}

        {/* ══ TABS ══════════════════════════════════════════════════════ */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'choghadiya' ? styles.tabActive : ''}`}
            onClick={() => setTab('choghadiya')}>🕐 चौघडिया</button>
          <button className={`${styles.tab} ${tab === 'occasions' ? styles.tabActive : ''}`}
            onClick={() => setTab('occasions')}>📋 प्रसंगनिहाय मुहूर्त</button>
        </div>

        {loading && <div className={styles.loader}><div className={styles.spinner} /></div>}

        {/* ══ CHOGHADIYA TAB ════════════════════════════════════════════ */}
        {!loading && tab === 'choghadiya' && chog && (
          <div className={styles.chogWrap}>
            <div className={styles.chogColumns}>

              {/* Day Choghadiya */}
              <div className={styles.chogCol}>
                <div className={styles.chogColHead}>
                  <span className={styles.chogColIcon}>☀️</span>
                  <div>
                    <h2 className={styles.chogColTitle}>दिवसाचे चौघडिया</h2>
                    <p className={styles.chogColSub}>सूर्योदय → सूर्यास्त · ८ काळ</p>
                  </div>
                </div>
                <div className={styles.chogGrid}>
                  {chog.day.map((c, i) => {
                    const active = isToday && isSlotActive(c, nowMins);
                    return (
                      <div key={i}
                        className={`${styles.chogCard} ${active ? styles.chogCardActive : ''} ${c.quality === 'bad' ? styles.chogCardBad : ''}`}
                        style={{ '--cColor': c.color, '--cBg': c.bg }}>
                        {active && <span className={styles.chogNowTag}>▶ आत्ता</span>}
                        <div className={styles.chogCardTop}>
                          <div className={styles.chogCardLeft2}>
                            <span className={styles.chogNumCircle}>{String(i+1).padStart(2,'0')}</span>
                            <span className={styles.chogCardIcon}>{c.icon}</span>
                          </div>
                          <span className={styles.chogBadge}>{c.badge}</span>
                        </div>
                        <span className={styles.chogName}>{c.name}</span>
                        <span className={styles.chogDesc}>{c.desc}</span>
                        <span className={styles.chogTime}>{c.start} – {c.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Night Choghadiya */}
              <div className={styles.chogCol}>
                <div className={styles.chogColHead}>
                  <span className={styles.chogColIcon}>🌙</span>
                  <div>
                    <h2 className={styles.chogColTitle}>रात्रीचे चौघडिया</h2>
                    <p className={styles.chogColSub}>सूर्यास्त → पुढील सूर्योदय · ८ काळ</p>
                  </div>
                </div>
                <div className={styles.chogGrid}>
                  {chog.night.map((c, i) => {
                    const active = isToday && isSlotActive(c, nowMins);
                    return (
                      <div key={i}
                        className={`${styles.chogCard} ${active ? styles.chogCardActive : ''} ${c.quality === 'bad' ? styles.chogCardBad : ''}`}
                        style={{ '--cColor': c.color, '--cBg': c.bg }}>
                        {active && <span className={styles.chogNowTag}>▶ आत्ता</span>}
                        <div className={styles.chogCardTop}>
                          <div className={styles.chogCardLeft2}>
                            <span className={styles.chogNumCircle}>{String(i+1).padStart(2,'0')}</span>
                            <span className={styles.chogCardIcon}>{c.icon}</span>
                          </div>
                          <span className={styles.chogBadge}>{c.badge}</span>
                        </div>
                        <span className={styles.chogName}>{c.name}</span>
                        <span className={styles.chogDesc}>{c.desc}</span>
                        <span className={styles.chogTime}>{c.start} – {c.end}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Legend */}
            <div className={styles.legend}>
              {Object.entries(CHOG_META).map(([name, m]) => (
                <span key={name} className={styles.legendItem}
                  style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}40` }}>
                  {m.icon} {name} — {m.badge}
                </span>
              ))}
            </div>

            {/* Bad Times */}
            {panData && (
              <div className={styles.badTimes}>
                <h3 className={styles.badTimesTitle}>🔴 या काळात महत्त्वाची कामे टाळा</h3>
                <div className={styles.badGrid}>
                  {[
                    { label: 'राहु काळ',   range: panData.rahuKaal,   icon: '🔴' },
                    { label: 'गुळिक काळ',  range: panData.gulikaKaal, icon: '⚫' },
                    { label: 'यमगंड',      range: panData.yamaganda,  icon: '🟡' },
                    panData.abhijitMuhurat && { label: 'अभिजित मुहूर्त ✨', range: panData.abhijitMuhurat, icon: '✨' },
                  ].filter(Boolean).map(b => b.range && (
                    <div key={b.label} className={styles.badCard}>
                      <span className={styles.badIcon}>{b.icon}</span>
                      <div>
                        <span className={styles.badLabel}>{b.label}</span>
                        <span className={styles.badTime}>{b.range.start} – {b.range.end}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ OCCASIONS TAB ═════════════════════════════════════════════ */}
        {!loading && tab === 'occasions' && chog && (
          <div className={styles.occasionsWrap}>
            <p className={styles.occasionsSub}>शुभ चौघडिया काळातील वेळा निवडणे महत्त्वाच्या प्रसंगांसाठी उत्तम.</p>
            <div className={styles.occasionsGrid}>
              {OCCASIONS.map(occ => {
                const goodSlots = [
                  ...chog.day.filter(c => occ.good.includes(c.name)),
                  ...chog.night.filter(c => occ.good.includes(c.name)),
                ];
                return (
                  <div key={occ.label} className={styles.occasionCard}>
                    <div className={styles.occasionHeader}>
                      <span className={styles.occasionIcon}>{occ.icon}</span>
                      <h3 className={styles.occasionTitle}>{occ.label}</h3>
                    </div>
                    <div className={styles.occasionSlots}>
                      {goodSlots.length === 0
                        ? <span className={styles.noSlot}>आज शुभ काळ नाही</span>
                        : goodSlots.map((s, i) => (
                            <div key={i} className={styles.slot}
                              style={{ borderColor: s.color, background: s.bg }}>
                              <span style={{ color: s.color }}>{s.icon} {s.name}</span>
                              <span className={styles.slotTime}>{s.start} – {s.end}</span>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ CTA ═══════════════════════════════════════════════════════ */}
        <div className={styles.cta}>
          <div className={styles.ctaInner}>
            <span className={styles.ctaIcon}>🙏</span>
            <div>
              <h3 className={styles.ctaTitle}>शुभ मुहूर्तावर पूजा बुक करा</h3>
              <p className={styles.ctaSub}>अनुभवी पुजारी घरी बोलवा — विधी भक्तीभावाने होऊ द्या</p>
            </div>
            <Link to="/pooja" className={styles.ctaBtn}>पूजा बुक करा →</Link>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
