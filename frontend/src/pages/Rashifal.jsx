// src/pages/Rashifal.jsx — राशी भविष्य (आज, उद्या, साप्ताहिक, मासिक, वार्षिक) — खऱ्या गोचरावर आधारित
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header  from '../components/layout/Header';
import Footer  from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { RASHIS } from '../data/rashifalData';
import { rashifalAPI } from '../api/index.js';
import styles from './Rashifal.module.css';

const MONTHS_MR = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
const DAYS_MR   = ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'];

function todayMR() {
  const now = new Date(Date.now() + 330 * 60000);
  return `${DAYS_MR[now.getUTCDay()]}, ${now.getUTCDate()} ${MONTHS_MR[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
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

// ── "हे भविष्य कशावर आधारित आहे" ───────────────────────────────────
function Basis({ rows, title = 'हे भविष्य कशावर आधारित आहे (ग्रहस्थिती)' }) {
  if (!rows?.length) return null;
  return (
    <div className={styles.basisBox}>
      <h3 className={styles.sectionHeading}>🔭 {title}</h3>
      <ul className={styles.basisList}>
        {rows.map(b => (
          <li key={b.key} className={b.good ? styles.basisGood : styles.basisBad}>
            <span>{b.text}{b.retro ? ' (वक्री)' : ''}</span>
            <strong>{b.good ? 'अनुकूल' : 'प्रतिकूल'}</strong>
          </li>
        ))}
      </ul>
      <p className={styles.basisNote}>
        स्थान चंद्र राशीपासून मोजले आहे. शुभ/अशुभ हे शास्त्रीय गोचर नियमांनुसार (फलदीपिका) सर्वसाधारण फळ आहे;
        वैयक्तिक कुंडलीतील दशा-अंतर्दशेनुसार अनुभव बदलू शकतो.
      </p>
    </div>
  );
}

function fmtDate(ymd) {
  const [, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS_MR[m - 1]}`;
}

// planet → its stays ("पासून – पर्यंत") with the result of each
function PlanetStays({ planets }) {
  return (
    <div className={styles.staysGrid}>
      {planets.map(p => (
        <div key={p.key} className={styles.staysCard}>
          <span className={styles.staysPlanet}>{p.planet}</span>
          {p.stays.map((s, i) => (
            <div key={i} className={`${styles.stayRow} ${s.good ? styles.basisGood : styles.basisBad}`}>
              {p.stays.length > 1 && <span className={styles.stayDates}>{fmtDate(s.from)} – {fmtDate(s.to)}</span>}
              <p className={styles.stayText}>{s.text}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Events({ events, title }) {
  if (!events?.length) return null;
  return (
    <div className={styles.eventsBox}>
      <h3 className={styles.sectionHeading}>🗓️ {title}</h3>
      <ul className={styles.eventsList}>
        {events.map((e, i) => (
          <li key={i}><strong>{e.dateMR}, {e.time}:</strong> {e.text}</li>
        ))}
      </ul>
    </div>
  );
}

function SadeSati({ text }) {
  if (!text) return null;
  return <div className={styles.warnBox}>🪐 <strong>शनी:</strong> {text} चालू आहे.</div>;
}

function Remedy({ label, text }) {
  return (
    <div className={styles.tipBox}>
      <span className={styles.tipIcon}>🪔</span>
      <div>
        <span className={styles.tipLabel}>{label}</span>
        <p className={styles.tipText}>{text}</p>
      </div>
    </div>
  );
}

// ── Monthly View ───────────────────────────────────────────────────
function MonthlyView({ m, rashi }) {
  return (
    <div>
      <div className={styles.monthlyHead} style={{ '--rashiColor': rashi.color, '--rashiBg': rashi.bg }}>
        <h3 className={styles.monthlyTitle}>{rashi.name} — {m.month} मासिक भविष्य</h3>
        <p className={styles.monthlyOverview}>{m.overview}</p>
        <div className={styles.monthlyMeta}>
          <span>✅ अनुकूल दिवस (तारखा): <strong>{m.goodDays.join(', ')}</strong></span>
          {m.chandrashtamaDays.length > 0 && <span>⚠️ चंद्राष्टम: <strong>{m.chandrashtamaDays.join(', ')}</strong></span>}
        </div>
      </div>
      <SadeSati text={m.sadesati} />
      <h3 className={styles.sectionHeading}>📖 ग्रहनिहाय फळ — {m.month}</h3>
      <PlanetStays planets={m.planets} />
      <Events events={m.events} title="या महिन्यातील ग्रहबदल" />
      <Remedy label="या महिन्याचा उपाय" text={m.remedy} />
      <Basis rows={m.basis} title="महिन्याच्या मध्यावरील ग्रहस्थिती" />
    </div>
  );
}

// ── Yearly View ────────────────────────────────────────────────────
function YearlyView({ y, rashi }) {
  return (
    <div>
      <div className={styles.monthlyHead} style={{ '--rashiColor': rashi.color, '--rashiBg': rashi.bg }}>
        <h3 className={styles.monthlyTitle}>{rashi.name} — वार्षिक भविष्य {y.year}</h3>
        <p className={styles.monthlyOverview}>{y.overview}</p>
      </div>
      <h3 className={styles.sectionHeading}>📖 गुरू, शनी, राहू, केतू — वर्षभराचा गोचर</h3>
      <PlanetStays planets={y.planets} />
      <Events events={y.events} title={`${y.year} मधील महत्त्वाचे ग्रहबदल`} />
      <Remedy label="वर्षभराचा उपाय" text={y.remedy} />
      <p className={styles.basisNote}>
        वार्षिक भविष्य मंद ग्रहांच्या (गुरू, शनी, राहू-केतू) गोचरावर आधारित आहे; सर्व तारखा प्रत्यक्ष खगोलीय गणितावरून.
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function Rashifal() {
  const [selected,    setSelected]    = useState(null);
  const [tab,         setTab]         = useState('today');
  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(false);
  const predPanelRef = useRef(null);

  // every tab comes from the gochar engine on the server
  useEffect(() => {
    if (selected === null) return;
    const period = { today: 'today', tomorrow: 'tomorrow', weekly: 'week', monthly: 'month', yearly: 'year' }[tab];
    let alive = true;
    setLoading(true); setError(false); setData(null);
    rashifalAPI.getGochar(selected, period)
      .then(r => { if (alive) setData(r.data.data); })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
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
                <p className={styles.heroSub}>आज · उद्या · साप्ताहिक · मासिक · वार्षिक — प्रत्यक्ष ग्रहस्थितीवर आधारित</p>
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
            <p className={styles.gridSub}>राशी निवडल्यावर आजचे, साप्ताहिक, मासिक आणि वार्षिक भविष्य पहा</p>
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
                  <p className={styles.predDates}>चंद्र राशी — जन्मवेळी चंद्र ज्या राशीत होता ती रास</p>
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
              <button className={`${styles.tab} ${tab === 'yearly'   ? styles.tabActive : ''}`} onClick={() => setTab('yearly')}>🗓️ वार्षिक</button>
            </div>

            {/* ── Loading / error ── */}
            {loading && (
              <div className={styles.groqLoading}>
                <span className={styles.groqSpinner} />
                <span>ग्रहस्थितीचे गणित होत आहे...</span>
              </div>
            )}
            {error && !loading && (
              <div className={styles.warnBox}>भविष्य आत्ता मिळवता आले नाही. थोड्या वेळाने पुन्हा प्रयत्न करा.</div>
            )}

            {/* ── Today / Tomorrow ── */}
            {(tab === 'today' || tab === 'tomorrow') && data?.general && !loading && (
              <>
                <ScoreBar score={data.score} scoreLabel={data.scoreLabel} quality={data.quality} dayLabel={tab === 'today' ? 'आजचा' : 'उद्याचा'} />
                <p className={styles.predDay}>{data.dayName}, {data.dateMR}</p>

                {data.chandrashtama && (
                  <div className={styles.warnBox}>⚠️ <strong>चंद्राष्टम:</strong> चंद्र आपल्या राशीपासून आठव्या स्थानी. महत्त्वाची कामे, मोठे व्यवहार व वाद टाळा.</div>
                )}
                <SadeSati text={data.sadesati} />

                <BhavishyaSummary pred={data} rashi={rashi} label={tab === 'today' ? 'आजचे' : 'उद्याचे'} />
                {data.moonNote && (
                  <div className={styles.sunEffect}>
                    <span className={styles.sunEffectIcon}>🌙</span>
                    <p className={styles.sunEffectText}>{data.moonNote}</p>
                  </div>
                )}
                <div className={styles.sunEffect}>
                  <span className={styles.sunEffectIcon}>☀️</span>
                  <p className={styles.sunEffectText}><strong>सूर्य गोचर (मासिक):</strong> {data.sunEffect}</p>
                </div>

                <h3 className={styles.sectionHeading}>📖 ग्रहस्थितीनुसार भविष्य</h3>
                <div className={styles.catGrid}>
                  <CatCard icon="🌟" label="सर्वसाधारण"     planet="(चंद्र गोचर)" text={data.general} color={rashi.color} />
                  <CatCard icon="💑" label="प्रेम / संसार"   planet="(शुक्र गोचर)" text={data.love}    color="#C2185B"    />
                  <CatCard icon="💼" label="कार्य / व्यवसाय" planet="(बुध गोचर)"  text={data.career}  color="#1565C0"    />
                  <CatCard icon="🏥" label="आरोग्य / ऊर्जा"  planet="(मंगळ गोचर)" text={data.health}  color="#2E7D32"    />
                </div>

                <div className={styles.guruShaniGrid}>
                  <div className={styles.guruBox}>
                    <div className={styles.gsHeader}>
                      <span style={{ color: PLANET_META.Jupiter.color }}>♃</span>
                      <span className={styles.gsTitle}>गुरू — भाग्य व ज्ञान</span>
                    </div>
                    <p className={styles.gsText}>{data.guru}</p>
                  </div>
                  <div className={styles.shaniBox}>
                    <div className={styles.gsHeader}>
                      <span style={{ color: PLANET_META.Saturn.color }}>♄</span>
                      <span className={styles.gsTitle}>शनी — कर्म व शिस्त</span>
                    </div>
                    <p className={styles.gsText}>{data.shani}</p>
                  </div>
                </div>

                <Remedy label={tab === 'today' ? 'आजचा उपाय' : 'उद्याचा उपाय'} text={data.tip} />
                <Basis rows={data.basis} />
              </>
            )}

            {/* ── Weekly ── */}
            {tab === 'weekly' && data?.days && !loading && (
              <>
                <div className={styles.weeklyHead}>
                  <h3 className={styles.sectionHeading}>📅 या आठवड्याचे भविष्य — {rashi.name}</h3>
                  <p className={styles.weeklySubtext}>
                    येत्या ७ दिवसांचे भविष्य (चंद्र गोचरानुसार). अनुकूल दिवस: {data.bestDays.join(', ')}
                    {data.chandrashtamaDays.length > 0 && <> · चंद्राष्टम (सावधानी): {data.chandrashtamaDays.join(', ')}</>}
                  </p>
                </div>
                <div className={styles.weekGrid}>
                  {data.days.map((d, i) => {
                    const qc = QC[d.quality] || QC.neutral;
                    return (
                      <div key={i}
                        className={`${styles.weekCard} ${d.isToday ? styles.weekCardToday : ''}`}
                        style={{ '--rashiColor': rashi.color }}
                      >
                        <span className={styles.weekDayName}>{d.dayName}</span>
                        <span className={styles.weekDate}>{d.dateNum} {d.monthName}</span>
                        <span className={styles.weekScoreTag} style={{ background: qc.bg, color: qc.color }}>
                          {d.score}/१० · {d.scoreLabel}
                        </span>
                        <p className={styles.weekText}>{d.general}</p>
                        {d.moonNote && <p className={styles.weekText}>🌙 {d.moonNote}</p>}
                        <div className={styles.weekTip}>🪔 {d.tip}</div>
                      </div>
                    );
                  })}
                </div>
                <Events events={data.events} title="या आठवड्यातील ग्रहबदल" />
              </>
            )}

            {/* ── Monthly / Yearly ── */}
            {tab === 'monthly' && data?.month && !loading && <MonthlyView m={data} rashi={rashi} />}
            {tab === 'yearly'  && data?.year  && !loading && <YearlyView  y={data} rashi={rashi} />}

            {data && !loading && (
              <div className={styles.predCta}>
                <Link to="/pooja"    className={styles.ctaBtn}>🪔 शुभ मुहूर्तावर पूजा बुक करा</Link>
                <Link to="/panchang" className={styles.ctaBtnSec}>🕉️ आजचे पंचांग पहा</Link>
              </div>
            )}

          </section>
        )}

        {/* Placeholder */}
        {selected === null && (
          <div className={styles.placeholder}>
            <span className={styles.placeholderIcon}>🔮</span>
            <p className={styles.placeholderText}>वर दिलेल्या बारा राशींपैकी तुमची राशी निवडा</p>
            <p className={styles.placeholderSub}>आज, उद्या, साप्ताहिक, मासिक आणि वार्षिक भविष्य मिळेल</p>
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
