// src/pages/Panchang.jsx — हिंदू पंचांग + कुंडली पृष्ठ
import { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import ClockTimePicker from '../components/common/ClockTimePicker';
import { panchangAPI } from '../api/index.js';
import styles from '../styles/Panchang.module.css';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const MONTHS_MR = [
  'जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून',
  'जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर',
];

const CITIES = [
  { name: 'पुणे',      lat: '18.5204', lon: '73.8567' },
  { name: 'मुंबई',     lat: '19.0760', lon: '72.8777' },
  { name: 'नाशिक',    lat: '20.0059', lon: '73.7898' },
  { name: 'नागपूर',    lat: '21.1458', lon: '79.0882' },
  { name: 'औरंगाबाद', lat: '19.8762', lon: '75.3433' },
  { name: 'कोल्हापूर', lat: '16.6975', lon: '74.2282' },
  { name: 'रत्नागिरी', lat: '16.9902', lon: '73.3120' },
  { name: 'सोलापूर',   lat: '17.6805', lon: '75.9064' },
  { name: 'नवी दिल्ली',lat: '28.6139', lon: '77.2090' },
];

// North Indian Kundali: house number → { rashi (Marathi), col, row } in 4×4 grid
const KUNDALI_HOUSES = [
  { num: 12, rashi: 'मीन',     symbol: '♓', col: 1, row: 1, corner: true  },
  { num:  1, rashi: 'मेष',     symbol: '♈', col: 2, row: 1, corner: false },
  { num:  2, rashi: 'वृषभ',    symbol: '♉', col: 3, row: 1, corner: false },
  { num:  3, rashi: 'मिथुन',   symbol: '♊', col: 4, row: 1, corner: true  },
  { num: 11, rashi: 'कुंभ',    symbol: '♒', col: 1, row: 2, corner: false },
  { num:  4, rashi: 'कर्क',    symbol: '♋', col: 4, row: 2, corner: false },
  { num: 10, rashi: 'मकर',     symbol: '♑', col: 1, row: 3, corner: false },
  { num:  5, rashi: 'सिंह',    symbol: '♌', col: 4, row: 3, corner: false },
  { num:  9, rashi: 'धनु',     symbol: '♐', col: 1, row: 4, corner: true  },
  { num:  8, rashi: 'वृश्चिक', symbol: '♏', col: 2, row: 4, corner: false },
  { num:  7, rashi: 'तुला',    symbol: '♎', col: 3, row: 4, corner: false },
  { num:  6, rashi: 'कन्या',   symbol: '♍', col: 4, row: 4, corner: true  },
];

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
function MuhurtaBlock({ icon, label, range, bad }) {
  return (
    <div className={`${styles.muhurtaBlock} ${bad ? styles.muhurtaBad : styles.muhurtaGood}`}>
      <div className={styles.muhurtaTop}>
        <span className={styles.muhurtaIcon}>{icon}</span>
        <span className={styles.muhurtaLabel}>{label}</span>
      </div>
      <span className={styles.muhurtaTime}>
        {range ? `${range.start} – ${range.end}` : '—'}
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
function KundaliChart({ suryaRashi, chandraRashi, lagna, dark }) {
  return (
    <div className={`${styles.kundaliWrap} ${dark ? styles.kundaliDark : ''}`}>
      <div className={styles.kundaliGrid}>
        {KUNDALI_HOUSES.map(h => {
          const isSun   = h.rashi === suryaRashi;
          const isMoon  = h.rashi === chandraRashi;
          const isLagna = h.rashi === lagna;
          const isBoth  = isSun && isMoon;
          return (
            <div
              key={h.num}
              className={[
                styles.house,
                h.corner  ? styles.houseCorner  : '',
                isBoth    ? styles.houseBoth    : '',
                isSun     ? styles.houseSun     : '',
                isMoon    ? styles.houseMoon    : '',
                isLagna   ? styles.houseLagna   : '',
              ].filter(Boolean).join(' ')}
              style={{ gridColumn: h.col, gridRow: h.row }}
            >
              <span className={styles.houseNum}>{h.num}</span>
              <div className={styles.houseBody}>
                <span className={styles.houseSymbol}>{h.symbol}</span>
                <span className={styles.houseRashi}>{h.rashi}</span>
              </div>
              {(isSun || isMoon || isLagna) && (
                <div className={styles.housePlanets}>
                  {isSun   && <span className={styles.planetSun}  title="सूर्य">☀</span>}
                  {isMoon  && <span className={styles.planetMoon} title="चंद्र">☽</span>}
                  {isLagna && <span className={styles.planetLagna} title="लग्न">↑</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Center cell (spans col 2-3, row 2-3) */}
        <div className={styles.houseCenter}>
          <span className={styles.centerOm}>🕉</span>
          <span className={styles.centerTitle}>कुंडली</span>
          <div className={styles.centerLegend}>
            <span className={styles.legendSun}>☀ सूर्य</span>
            <span className={styles.legendMoon}>☽ चंद्र</span>
            {lagna && <span className={styles.legendLagna}>↑ लग्न</span>}
          </div>
        </div>
      </div>

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

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function Panchang() {
  const [date,       setDate]       = useState(todayIST());
  const [time,       setTime]       = useState(nowISTTime());
  const [showClock,  setShowClock]  = useState(false);
  const [lat,        setLat]        = useState('');
  const [lon,        setLon]        = useState('');
  const [cityName,   setCityName]   = useState('');
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [locLoading, setLocLoading] = useState(false);
  const [dark,       setDark]       = useState(false);
  const [animKey,    setAnimKey]    = useState(0);
  const [lastRefresh,setLastRefresh]= useState('');

  const debounceRef = useRef(null);

  // ── Fetch ───────────────────────────────────────────────────
  const fetchPanchang = useCallback(async (d, la, lo, t) => {
    setLoading(true);
    setError('');
    try {
      const params = { date: d };
      if (la && lo) { params.lat = la; params.lon = lo; }
      if (t)        { params.time = t; }
      const res = await panchangAPI.get(params);
      setData(res.data.data);
      setAnimKey(k => k + 1);
      setLastRefresh(nowISTTime());
    } catch (err) {
      setError(err.response?.data?.message || 'पंचांग माहिती मिळवण्यात त्रुटी झाली.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Auto-refresh on any input change (debounced 400ms) ──────
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPanchang(date, lat, lon, time);
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [date, time, lat, lon, fetchPanchang]);

  // ── Geolocation ─────────────────────────────────────────────
  const detectLocation = () => {
    if (!navigator.geolocation) { setError('ब्राउझर GPS समर्थित नाही.'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const la = pos.coords.latitude.toFixed(4);
        const lo = pos.coords.longitude.toFixed(4);
        setLat(la); setLon(lo); setCityName('');
        setLocLoading(false);
        fetchPanchang(date, la, lo, time);
      },
      () => { setError('स्थान मिळवता आले नाही.'); setLocLoading(false); },
      { timeout: 8000 }
    );
  };

  const handleCitySelect = c => {
    setLat(c.lat); setLon(c.lon); setCityName(c.name);
    fetchPanchang(date, c.lat, c.lon, time);
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className={`${styles.page} ${dark ? styles.dark : ''}`}>
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

      <div className="container">

        {/* ═══ CONTROLS ════════════════════════════════════ */}
        <div className={styles.controls}>

          <div className={styles.controlRow}>
            {/* Date */}
            <div className={styles.controlGroup}>
              <label className={styles.ctrlLabel}>📅 तारीख निवडा</label>
              <input
                type="date"
                className={styles.dateInput}
                value={date}
                min="1900-01-01"
                max="2099-12-31"
                onChange={e => setDate(e.target.value)}
              />
              {date && (
                <span className={styles.dateMR}>{formatMR(date)}</span>
              )}
            </div>

            {/* Clock time picker */}
            <div className={styles.controlGroup}>
              <label className={styles.ctrlLabel}>⏰ वेळ निवडा</label>
              <button
                type="button"
                className={styles.timePickerBtn}
                onClick={() => setShowClock(true)}
                title="घड्याळ उघडा"
              >
                <span className={styles.timePickerIcon}>🕐</span>
                <span className={styles.timePickerVal}>{formatTime12h(time)}</span>
                <span className={styles.timePickerChevron}>▼</span>
              </button>
              <span className={styles.timeSub}>
                {time}
                <span className={styles.timeNote}> · लग्न बदलते</span>
              </span>
            </div>

            {/* Location */}
            <div className={styles.controlGroup}>
              <label className={styles.ctrlLabel}>📍 स्थान (ऐच्छिक)</label>
              <div className={styles.locRow}>
                <input
                  type="text"
                  className={styles.locInput}
                  placeholder="अक्षांश"
                  value={lat}
                  onChange={e => setLat(e.target.value)}
                />
                <input
                  type="text"
                  className={styles.locInput}
                  placeholder="रेखांश"
                  value={lon}
                  onChange={e => setLon(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.gpsBtn}
                  onClick={detectLocation}
                  disabled={locLoading}
                  title="GPS वरून शोधा"
                >
                  {locLoading ? '⏳' : '🎯'}
                </button>
              </div>
            </div>
          </div>

          {/* City pills */}
          <div className={styles.cityRow}>
            <span className={styles.cityRowLabel}>शहर:</span>
            {CITIES.map(c => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleCitySelect(c)}
                className={`${styles.cityPill} ${cityName === c.name ? styles.cityPillActive : ''}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Auto-refresh indicator */}
          <div className={styles.autoRefreshInfo}>
            <span className={`${styles.autoRefreshDot} ${loading ? styles.autoRefreshDotLoading : ''}`} />
            {loading
              ? 'अपडेट होत आहे...'
              : lastRefresh
                ? `शेवटचे अपडेट: ${formatTime12h(lastRefresh)}`
                : 'आपोआप अपडेट होते'}
          </div>
        </div>

        {/* Error */}
        {error && <div className={styles.errorBox}>❌ {error}</div>}

        {/* Skeleton */}
        {loading && !data && <Skeleton />}

        {/* ═══ RESULTS ══════════════════════════════════════ */}
        {data && (
          <div
            key={animKey}
            className={`${styles.results} ${loading ? styles.resultsRefreshing : ''}`}
          >

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
                <MuhurtaBlock icon="🙏" label="अभिजित मुहूर्त" range={data.abhijitMuhurat} bad={false} />
                <MuhurtaBlock icon="🔴" label="राहु काळ"       range={data.rahuKaal}       bad={true}  />
                <MuhurtaBlock icon="⚫" label="गुळिक काळ"      range={data.gulikaKaal}     bad={true}  />
                <MuhurtaBlock icon="🟡" label="यमगंड"           range={data.yamaganda}      bad={true}  />
              </div>
              <p className={styles.muhurtaNote}>
                ℹ️ <strong>राहु काळ, गुळिक काळ, यमगंड</strong> — या काळात महत्त्वाची कामे, प्रवास, व्यवहार टाळावेत.
                <strong> अभिजित मुहूर्त</strong> सर्वोत्तम शुभ वेळ आहे.
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
            <section className={styles.section}>
              <h2 className={styles.sectionHeading}>
                <span className={styles.sectionIcon}>🔯</span>
                उत्तर भारतीय कुंडली
                <span className={styles.sectionBadge}>ग्रह स्थिती</span>
              </h2>
              <p className={styles.kundaliDesc}>
                खालील कुंडलीत <span className={styles.sunText}>☀ सूर्य</span>,{' '}
                <span className={styles.moonText}>☽ चंद्र</span> आणि{' '}
                <span className={styles.lagnaText}>↑ लग्न</span> यांच्या राशी दर्शविल्या आहेत.
                वेळ बदलल्यास लग्न आपोआप बदलते.
              </p>
              <KundaliChart
                suryaRashi={data.suryaRashi}
                chandraRashi={data.chandraRashi}
                lagna={data.lagna}
                dark={dark}
              />
            </section>

          </div>
        )}
      </div>

      <Footer />

      {/* ── Clock time picker modal ── */}
      {showClock && (
        <ClockTimePicker
          value={time}
          onChange={t => setTime(t)}
          onClose={() => setShowClock(false)}
        />
      )}
    </div>
  );
}
