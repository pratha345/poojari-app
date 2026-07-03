// src/pages/Rashifal.jsx — राशी भविष्य (आज, उद्या, साप्ताहिक, मासिक)
import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header  from '../components/layout/Header';
import Footer  from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { RASHIS, getPrediction, MONTHLY_BHAVISHYA } from '../data/rashifalData';
import { rashifalAPI } from '../api/index.js';
import styles from './Rashifal.module.css';

const MONTHS_MR = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
const DAYS_MR   = ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

function todayMR() {
  const now = new Date(Date.now() + 330 * 60000);
  return `${DAYS_MR[new Date().getDay()]}, ${now.getUTCDate()} ${MONTHS_MR[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
}

const SCHEMA = {
  '@context': 'https://schema.org', '@type': 'WebPage',
  name: 'आजचे राशिभविष्य | Daily Horoscope Marathi | मराठी राशिभविष्य',
  description: 'आजचे, साप्ताहिक आणि मासिक मराठी राशिभविष्य. बारा राशींसाठी प्रेम, करिअर, आर्थिक आणि आरोग्य भविष्य.',
  url: 'https://panditsnearme.com/rashifal', inLanguage: 'mr',
};

const PLANET_META = {
  Jupiter: { color: '#E65100' },
  Saturn:  { color: '#37474F' },
};

const QC = {
  best:    { bg: '#E8F5E9', color: '#2e7d32', border: '#81C784' },
  good:    { bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9' },
  neutral: { bg: '#FFF8E1', color: '#E65100', border: '#FFD54F' },
  caution: { bg: '#FFF3E0', color: '#BF360C', border: '#FFAB91' },
};

// ── Score bar ──────────────────────────────────────────────────────
function ScoreBar({ score, scoreLabel, quality, dayLabel }) {
  const qc = QC[quality] || QC.neutral;
  return (
    <div className={styles.scoreWrap}>
      <div className={styles.scoreLeft}>
        <span className={styles.scoreDayLabel}>{dayLabel} दर्जा</span>
        <span className={styles.scoreTag} style={{ background: qc.bg, color: qc.color, border: `1.5px solid ${qc.border}` }}>
          {scoreLabel}
        </span>
      </div>
      <div className={styles.scoreBar}>
        <div className={styles.scoreFill} style={{ width: `${Math.round(score / 10 * 100)}%`, background: qc.color }} />
      </div>
      <span className={styles.scoreNum} style={{ color: qc.color }}>{score}/१०</span>
    </div>
  );
}

// ── Bhavishya Summary Card (replaces kundali) ──────────────────────
function BhavishyaSummary({ pred, rashi, label }) {
  const qc = QC[pred.quality] || QC.neutral;
  return (
    <div className={styles.bhavCard} style={{ '--rashiColor': rashi.color, '--rashiBg': rashi.bg }}>
      <div className={styles.bhavTop}>
        <span className={styles.bhavLabel}>📖 {label} राशी भविष्य</span>
        <span className={styles.bhavScore} style={{ background: qc.bg, color: qc.color, border: `1.5px solid ${qc.border}` }}>
          {pred.scoreLabel}
        </span>
      </div>
      <p className={styles.bhavMain}>{pred.general}</p>
      <div className={styles.bhavLucky}>
        <span>🍀 शुभ रंग: <strong>{rashi.luckyColor}</strong></span>
        <span>🔢 शुभ अंक: <strong>{rashi.luckyNums.join(', ')}</strong></span>
        <span>💎 शुभ रत्न: <strong>{rashi.stone}</strong></span>
      </div>
    </div>
  );
}

// ── Category card ──────────────────────────────────────────────────
function CatCard({ icon, label, planet, text, color }) {
  return (
    <div className={styles.catCard} style={{ '--catColor': color }}>
      <div className={styles.catHeader}>
        <span className={styles.catIcon}>{icon}</span>
        <div>
          <span className={styles.catLabel}>{label}</span>
          {planet && <span className={styles.catPlanet}>{planet}</span>}
        </div>
      </div>
      <p className={styles.catText}>{text}</p>
    </div>
  );
}

// ── Weekly View ────────────────────────────────────────────────────
function WeeklyView({ rashiId, rashi }) {
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d    = getPrediction(rashiId, i);
      const date = new Date(Date.now() + i * 86400000);
      const qc   = QC[d.quality] || QC.neutral;
      return {
        ...d,
        dayName: DAYS_MR[date.getDay()],
        dateNum: date.getDate(),
        monthName: MONTHS_MR[date.getMonth()],
        qc,
        isToday: i === 0,
      };
    });
  }, [rashiId]);

  return (
    <div>
      <div className={styles.weeklyHead}>
        <h3 className={styles.sectionHeading}>📅 या आठवड्याचे भविष्य — {rashi.name}</h3>
        <p className={styles.weeklySubtext}>येत्या ७ दिवसांचे दैनंदिन राशिभविष्य</p>
      </div>
      <div className={styles.weekGrid}>
        {weekData.map((d, i) => (
          <div
            key={i}
            className={`${styles.weekCard} ${d.isToday ? styles.weekCardToday : ''}`}
            style={{ '--rashiColor': rashi.color }}
          >
            <span className={styles.weekDayName}>{d.dayName}</span>
            <span className={styles.weekDate}>{d.dateNum} {d.monthName}</span>
            <span
              className={styles.weekScoreTag}
              style={{ background: d.qc.bg, color: d.qc.color }}
            >
              {d.score}/१०
            </span>
            <p className={styles.weekText}>{d.general}</p>
            <div className={styles.weekTip}>🪔 {d.tip}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Monthly View ───────────────────────────────────────────────────
function MonthlyView({ rashiId, rashi }) {
  const m = MONTHLY_BHAVISHYA[rashiId];
  if (!m) return null;

  return (
    <div>
      <div className={styles.monthlyHead} style={{ '--rashiColor': rashi.color, '--rashiBg': rashi.bg }}>
        <div className={styles.monthlyTitleRow}>
          <div className={styles.monthlyImgWrap}>
            <img src={rashi.img} alt={rashi.name} className={styles.predImg}
              onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='inline-block'; }}
            />
            <span className={styles.predSymbolFallback}>{rashi.symbol}</span>
          </div>
          <h3 className={styles.monthlyTitle}>{rashi.name} — {m.month} मासिक भविष्य</h3>
        </div>
        <p className={styles.monthlyOverview}>{m.overview}</p>
        <div className={styles.monthlyMeta}>
          <span>📅 शुभ दिवस: <strong>{m.shubhDin}</strong></span>
          <span>🎨 शुभ रंग: <strong>{m.shubhRang}</strong></span>
          <span>💎 रत्न: <strong>{rashi.stone}</strong></span>
          <span>🔢 शुभ अंक: <strong>{rashi.luckyNums.join(', ')}</strong></span>
        </div>
      </div>

      <div className={styles.catGrid}>
        <CatCard icon="💰" label="आर्थिक स्थिती"  color="#F57F17"  text={m.finance}  />
        <CatCard icon="💑" label="प्रेम / संसार"   color="#C2185B"  text={m.love}     />
        <CatCard icon="💼" label="कार्य / करिअर"   color="#1565C0"  text={m.career}   />
        <CatCard icon="🏥" label="आरोग्य"           color="#2E7D32"  text={m.health}   />
      </div>

      <div className={styles.tipBox}>
        <span className={styles.tipIcon}>🪔</span>
        <div>
          <span className={styles.tipLabel}>या महिन्याचा उपाय</span>
          <p className={styles.tipText}>{m.remedy}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function Rashifal() {
  const [selected,    setSelected]    = useState(null);
  const [tab,         setTab]         = useState('today');
  const [pred,        setPred]        = useState(null);
  const [groqLoading, setGroqLoading] = useState(false);
  const [weekData,    setWeekData]    = useState(null);
  const predPanelRef = useRef(null);

  useEffect(() => {
    if (selected === null) return;

    // आज — local algorithm
    if (tab === 'today') {
      setPred(getPrediction(selected, 0));
      return;
    }

    // उद्या — Groq API
    if (tab === 'tomorrow') {
      setGroqLoading(true);
      setPred(null);
      rashifalAPI.getTomorrow(selected)
        .then(r => setPred(r.data.data))
        .catch(() => setPred(getPrediction(selected, 1))) // fallback
        .finally(() => setGroqLoading(false));
      return;
    }

    // या आठवड्यात — Groq API
    if (tab === 'weekly') {
      setGroqLoading(true);
      setWeekData(null);
      rashifalAPI.getWeekly(selected)
        .then(r => setWeekData(r.data.data))
        .catch(() => setWeekData(null))
        .finally(() => setGroqLoading(false));
    }
  }, [selected, tab]);

  useEffect(() => {
    if (selected !== null && predPanelRef.current) {
      predPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selected]);

  const rashi = selected !== null ? RASHIS[selected] : null;

  const pick = (id) => {
    setSelected(id);
    setTab('today');
  };

  return (
    <div className={styles.page}>
      <SEOHead
        title="आजचे राशिभविष्य | Marathi Daily Horoscope — पूजारी"
        description="बारा राशींचे आजचे, साप्ताहिक आणि मासिक मराठी राशिभविष्य. प्रेम, करिअर, आरोग्य आणि आर्थिक भविष्य वाचा."
        keywords="राशिभविष्य, rashifal marathi, आजचे राशिभविष्य, साप्ताहिक राशिभविष्य, मासिक राशिभविष्य, daily horoscope marathi"
        canonical="/rashifal"
        schema={SCHEMA}
      />
      <Header />

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroLeft}>
              <span className={styles.heroIcon}>🔮</span>
              <div>
                <h1 className={styles.heroTitle}>मराठी राशिभविष्य</h1>
                <p className={styles.heroSub}>आज · उद्या · साप्ताहिक · मासिक भविष्य · वैदिक ज्योतिष</p>
              </div>
            </div>
            <div className={styles.heroRight}>
              <span className={styles.heroDate}>{todayMR()}</span>
              <Link to="/panchang" className={styles.panchangLink}>🕉️ पंचांग</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        {/* ══ RASHI GRID ══════════════════════════════════════════════ */}
        <section className={styles.gridSection}>
          <div className={styles.gridHeader}>
            <h2 className={styles.gridTitle}>तुमची राशी निवडा</h2>
            <p className={styles.gridSub}>राशी निवडल्यावर आजचे, साप्ताहिक आणि मासिक भविष्य पहा</p>
          </div>
          <div className={styles.rashiGrid}>
            {RASHIS.map(r => (
              <button key={r.id}
                className={`${styles.rashiCard} ${selected === r.id ? styles.rashiCardActive : ''}`}
                style={{ '--rashiColor': r.color, '--rashiBg': r.bg }}
                onClick={() => pick(r.id)}
                aria-pressed={selected === r.id}
              >
                <div className={styles.rashiImgWrap}>
                  <img
                    src={r.img} alt={r.name}
                    className={styles.rashiImg}
                    loading={r.id < 6 ? 'eager' : 'lazy'}
                    fetchpriority={r.id < 3 ? 'high' : 'auto'}
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'inline'; }}
                  />
                  <span className={styles.rashiSymbolFallback}>{r.symbol}</span>
                </div>
                <span className={styles.rashiName}>{r.name}</span>
                <span className={styles.rashiEng}>{r.eng}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ══ PREDICTION PANEL ════════════════════════════════════════ */}
        {rashi && (
          <section ref={predPanelRef} className={styles.predPanel} style={{ '--rashiColor': rashi.color, '--rashiBg': rashi.bg }}>

            {/* Rashi info header */}
            <div className={styles.predHeader}>
              <div className={styles.predRashiInfo}>
                <div className={styles.predImgWrap}>
                  <img src={rashi.img} alt={rashi.name} className={styles.predImg}
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'inline-block'; }}
                  />
                  <span className={styles.predSymbolFallback}>{rashi.symbol}</span>
                </div>
                <div>
                  <h2 className={styles.predName}>{rashi.name} <span className={styles.predEng}>({rashi.eng})</span></h2>
                  <p className={styles.predDates}>{rashi.dates}</p>
                </div>
              </div>
              <div className={styles.predMetaBlock}>
                <span className={styles.predMetaTitle}>📌 राशी स्थिर माहिती (दिवस बदलला तरी हे बदलत नाही)</span>
                <div className={styles.predMeta}>
                  <span className={styles.metaPill}>🌙 स्वामी ग्रह: {rashi.lord}</span>
                  <span className={styles.metaPill}>🔥 तत्त्व: {rashi.element}</span>
                  <span className={styles.metaPill}>🎨 शुभ रंग: {rashi.luckyColor}</span>
                  <span className={styles.metaPill}>🔢 शुभ अंक: {rashi.luckyNums.join(', ')}</span>
                  <span className={styles.metaPill}>💎 शुभ रत्न: {rashi.stone}</span>
                </div>
              </div>
            </div>

            {/* Tabs: आज | उद्या | आठवडा | महिना */}
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === 'today'    ? styles.tabActive : ''}`} onClick={() => setTab('today')}>🌅 आज</button>
              <button className={`${styles.tab} ${tab === 'tomorrow' ? styles.tabActive : ''}`} onClick={() => setTab('tomorrow')}>🌄 उद्या</button>
              <button className={`${styles.tab} ${tab === 'weekly'   ? styles.tabActive : ''}`} onClick={() => setTab('weekly')}>📅 या आठवड्यात</button>
              <button className={`${styles.tab} ${tab === 'monthly'  ? styles.tabActive : ''}`} onClick={() => setTab('monthly')}>📆 या महिन्यात</button>
            </div>

            {/* ── Loading ── */}
            {groqLoading && (
              <div className={styles.groqLoading}>
                <span className={styles.groqSpinner} />
                <span>तुमचे भविष्य लोड होत आहे...</span>
              </div>
            )}

            {/* ── Today / Tomorrow ── */}
            {(tab === 'today' || tab === 'tomorrow') && pred && !groqLoading && (
              <>
                {/* Score */}
                <ScoreBar score={pred.score} scoreLabel={pred.scoreLabel} quality={pred.quality} dayLabel={tab === 'today' ? 'आजचा' : 'उद्याचा'} />

                {/* Main Bhavishya Summary (replaces kundali chart) */}
                <BhavishyaSummary
                  pred={pred}
                  rashi={rashi}
                  label={tab === 'today' ? 'आजचे' : 'उद्याचे'}
                />

                {/* Sun monthly context */}
                <div className={styles.sunEffect}>
                  <span className={styles.sunEffectIcon}>☀️</span>
                  <p className={styles.sunEffectText}><strong>सूर्य गोचर (मासिक):</strong> {pred.sunEffect}</p>
                </div>

                {/* 4 category predictions */}
                <h3 className={styles.sectionHeading}>📖 ग्रह स्थितीनुसार भविष्य</h3>
                <div className={styles.catGrid}>
                  <CatCard icon="🌟" label="सर्वसाधारण"    planet="(चंद्र गोचर)" text={pred.general} color={rashi.color} />
                  <CatCard icon="💑" label="प्रेम / संसार"  planet="(शुक्र गोचर)" text={pred.love}    color="#C2185B"    />
                  <CatCard icon="💼" label="कार्य / व्यवसाय" planet="(बुध गोचर)"  text={pred.career}  color="#1565C0"    />
                  <CatCard icon="🏥" label="आरोग्य"          planet="(मंगळ गोचर)" text={pred.health}  color="#2E7D32"    />
                </div>

                {/* Guru & Shani */}
                <div className={styles.guruShaniGrid}>
                  <div className={styles.guruBox}>
                    <div className={styles.gsHeader}>
                      <span style={{ color: PLANET_META.Jupiter.color }}>♃</span>
                      <span className={styles.gsTitle}>गुरू — भाग्य व ज्ञान</span>
                    </div>
                    <p className={styles.gsText}>{pred.guru}</p>
                  </div>
                  <div className={styles.shaniBox}>
                    <div className={styles.gsHeader}>
                      <span style={{ color: PLANET_META.Saturn.color }}>♄</span>
                      <span className={styles.gsTitle}>शनी — कर्म व शिस्त</span>
                    </div>
                    <p className={styles.gsText}>{pred.shani}</p>
                  </div>
                </div>

                {/* Remedy */}
                <div className={styles.tipBox}>
                  <span className={styles.tipIcon}>🪔</span>
                  <div>
                    <span className={styles.tipLabel}>आजचा उपाय</span>
                    <p className={styles.tipText}>{pred.tip}</p>
                  </div>
                </div>

                {/* CTA */}
                <div className={styles.predCta}>
                  <Link to="/pooja"    className={styles.ctaBtn}>🪔 शुभ मुहूर्तावर पूजा बुक करा</Link>
                  <Link to="/panchang" className={styles.ctaBtnSec}>🕉️ आजचे पंचांग पहा</Link>
                </div>
              </>
            )}

            {/* ── Weekly (Groq) ── */}
            {tab === 'weekly' && !groqLoading && weekData && (
              <>
                <div className={styles.weeklyHead}>
                  <h3 className={styles.sectionHeading}>📅 या आठवड्याचे भविष्य — {rashi.name}</h3>
                  <p className={styles.weeklySubtext}>येत्या ७ दिवसांचे दैनंदिन राशिभविष्य</p>
                </div>
                <div className={styles.weekGrid}>
                  {weekData.map((d, i) => {
                    const qc = QC[d.quality] || QC.neutral;
                    return (
                      <div key={i}
                        className={`${styles.weekCard} ${d.isToday ? styles.weekCardToday : ''}`}
                        style={{ '--rashiColor': rashi.color }}
                      >
                        <span className={styles.weekDayName}>{d.dayName}</span>
                        <span className={styles.weekDate}>{d.dateNum} {d.monthName}</span>
                        <span className={styles.weekScoreTag} style={{ background: qc.bg, color: qc.color }}>
                          {d.score}/१०
                        </span>
                        <p className={styles.weekText}>{d.general}</p>
                        <div className={styles.weekTip}>🪔 {d.tip}</div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.predCta}>
                  <Link to="/pooja"    className={styles.ctaBtn}>🪔 पूजा बुक करा</Link>
                  <Link to="/panchang" className={styles.ctaBtnSec}>🕉️ पंचांग पहा</Link>
                </div>
              </>
            )}

            {/* ── Monthly ── */}
            {tab === 'monthly' && (
              <>
                <MonthlyView rashiId={selected} rashi={rashi} />
                <div className={styles.predCta}>
                  <Link to="/pooja"    className={styles.ctaBtn}>🪔 पूजा बुक करा</Link>
                  <Link to="/panchang" className={styles.ctaBtnSec}>🕉️ पंचांग पहा</Link>
                </div>
              </>
            )}

          </section>
        )}

        {/* Placeholder */}
        {selected === null && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>🔮</span>
            <p className={styles.placeholderText}>वर दिलेल्या बारा राशींपैकी तुमची राशी निवडा</p>
            <p className={styles.placeholderSub}>आज, उद्या, साप्ताहिक आणि मासिक भविष्य मिळेल</p>
          </div>
        )}

        {/* Overview */}
        <section className={styles.overviewSection}>
          <h2 className={styles.overviewTitle}>बारा राशींची माहिती</h2>
          <div className={styles.overviewGrid}>
            {RASHIS.map(r => (
              <div key={r.id} className={styles.overviewCard} style={{ '--rashiColor': r.color }}>
                <div className={styles.overviewTop}>
                  <div className={styles.overviewImgWrap}>
                    <img src={r.img} alt={r.name} className={styles.overviewImg}
                      onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling.style.display='inline-block'; }}
                    />
                    <span className={styles.overviewSymbolFallback}>{r.symbol}</span>
                  </div>
                  <div>
                    <span className={styles.overviewName}>{r.name}</span>
                    <span className={styles.overviewEng}>{r.eng}</span>
                  </div>
                </div>
                <div className={styles.overviewDetails}>
                  <span>स्वामी: <strong>{r.lord}</strong></span>
                  <span>तत्त्व: <strong>{r.element}</strong></span>
                  <span>{r.dates}</span>
                </div>
                <button className={styles.overviewBtn} onClick={() => pick(r.id)}>भविष्य पहा →</button>
              </div>
            ))}
          </div>
        </section>


      </div>
      <Footer />
    </div>
  );
}
