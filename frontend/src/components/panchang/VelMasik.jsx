// src/components/panchang/VelMasik.jsx — हिंदू वेळ (घटी-पळ clock) and मासिक (Moon calendar)
//
// वेळ: the day runs sunrise → next sunrise = 60 घटी (1 घटी = 60 पळ, 1 पळ = 60 विपळ), so
// 00 is at the top at sunrise; the day and night halves, the eight prahars and the
// ordinary clock hours sit around the dial. Sunrise / sunset come from the panchang API.
// मासिक: one request (/panchang/days) gives each day's tithi at sunrise and the Moon–Sun
// elongation for its phase picture; क्षय tithis show as "16/17", वृद्धी repeats the number.
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { panchangAPI } from '../../api/index.js';
import Moon3D, { MoonDefs } from './Moon3D';
import s from './VelMasik.module.css';

const IST = 330 * 60000;
const ymd = (ms) => new Date(ms + IST).toISOString().slice(0, 10);
const hms = (ms) => new Date(ms + IST).toISOString().slice(11, 19);
const pad = (n) => String(n).padStart(2, '0');
const MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const WEEK = ['रवि', 'सोम', 'मंगळ', 'बुध', 'गुरु', 'शुक्र', 'शनि'];
const VIEW_KEY = 'velmasik_view';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

// ═══════════════════════════ हिंदू वेळ ═══════════════════════════
const C = 300, R_RING = 238, R_TICK = 228, R_NUM = 205, R_HOUR = 150, R_PRAHAR = 272;
const pt = (a, r) => { const t = (a * Math.PI) / 180; return [C + r * Math.sin(t), C - r * Math.cos(t)]; };
const sector = (a1, a2, r) => {
  const [x1, y1] = pt(a1, r), [x2, y2] = pt(a2, r);
  return `M${C},${C} L${x1},${y1} A${r},${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2},${y2} Z`;
};
// tangential text that never reads upside down
const tan = (a) => { const n = ((a % 360) + 360) % 360; return n > 90 && n < 270 ? n + 180 : n; };
const PRAHAR_DAY = ['पूर्वाह्न', 'मध्याह्न', 'अपराह्न', 'सायंकाल'];
const PRAHAR_NIGHT = ['प्रदोष', 'निशीथ', 'त्रियामा', 'उषा'];

/** Sunrise that began the current Hindu day, its sunset and the next sunrise. */
function useHinduDay(lat, lon) {
  const [day, setDay] = useState(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const now = Date.now();
        let r = (await panchangAPI.get({ date: ymd(now), time: hms(now).slice(0, 5), lat, lon })).data.data;
        if (now < Date.parse(r.sunriseAt)) {                         // before sunrise: still yesterday's day
          r = (await panchangAPI.get({ date: ymd(now - 86400000), time: '23:59', lat, lon })).data.data;
        }
        if (alive) { setDay({ rise: Date.parse(r.sunriseAt), set: Date.parse(r.sunsetAt), next: Date.parse(r.nextSunriseAt) }); setError(''); }
      } catch { if (alive) setError('सूर्योदयाची वेळ मिळवता आली नाही.'); }
    })();
    return () => { alive = false; };
  }, [lat, lon, tick]);
  // roll over at the next sunrise
  useEffect(() => {
    if (!day) return;
    const id = setTimeout(() => setTick(t => t + 1), Math.max(1000, day.next - Date.now() + 2000));
    return () => clearTimeout(id);
  }, [day]);
  return { day, error };
}

const Dial = memo(function Dial({ day }) {
  const len = day.next - day.rise;
  const angOf = (ms) => ((ms - day.rise) / len) * 360;
  const setA = angOf(day.set);
  // clock hours every 3 h that fall inside this Hindu day
  const hours = [];
  const first = Math.ceil((day.rise + IST) / 10800000) * 10800000 - IST;
  for (let t = first; t < day.next; t += 10800000) {
    const h = new Date(t + IST).getUTCHours();
    hours.push({ a: angOf(t), label: h === 0 ? '12AM' : h === 12 ? '12PM' : h < 12 ? `${h}AM` : `${h - 12}PM` });
  }
  const prahars = [
    ...PRAHAR_DAY.map((n, i) => ({ n, a: (setA / 4) * (i + 0.5) })),
    ...PRAHAR_NIGHT.map((n, i) => ({ n, a: setA + ((360 - setA) / 4) * (i + 0.5) })),
  ];
  return (
    <svg viewBox="0 0 600 600" className={s.dialSvg} aria-hidden="true">
      <defs>
        <radialGradient id="hv-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#3a2a10" /><stop offset="100%" stopColor="#1e1407" />
        </radialGradient>
        <linearGradient id="hv-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1c9" /><stop offset="30%" stopColor="#e2bf72" /><stop offset="55%" stopColor="#9a7230" />
          <stop offset="78%" stopColor="#f2d58e" /><stop offset="100%" stopColor="#7a5420" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={R_RING + 52} fill="#20160a" stroke="url(#hv-gold)" strokeWidth="4" />
      <circle cx={C} cy={C} r={R_RING} fill="url(#hv-face)" />
      {/* day (lit) and night halves */}
      <path d={sector(0, setA, R_RING)} className={s.dayFill} />
      <path d={sector(setA, 360, R_RING)} className={s.nightFill} />
      <circle cx={C} cy={C} r={R_RING} fill="none" stroke="url(#hv-gold)" strokeWidth="2.5" />
      <circle cx={C} cy={C} r={R_TICK - 14} fill="none" className={s.thin} />
      {/* 60 ghati ticks; every fifth numbered */}
      {Array.from({ length: 60 }, (_, g) => {
        const a = g * 6, big = g % 5 === 0;
        const [x1, y1] = pt(a, R_TICK), [x2, y2] = pt(a, R_TICK - (big ? 18 : 9));
        return <line key={g} x1={x1} y1={y1} x2={x2} y2={y2} className={big ? s.tickBig : s.tick} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const a = i * 30, [x, y] = pt(a, R_NUM);
        return <text key={i} x={x} y={y} className={s.ghatiNum}>{pad(i * 5)}</text>;
      })}
      {hours.map(h => { const [x, y] = pt(h.a, R_HOUR);
        return <text key={h.label + h.a} x={x} y={y} className={s.hour} transform={`rotate(${tan(h.a)}, ${x}, ${y})`}>{h.label}</text>; })}
      {prahars.map(p => { const [x, y] = pt(p.a, R_PRAHAR);
        return <text key={p.n} x={x} y={y} className={s.prahar} transform={`rotate(${tan(p.a)}, ${x}, ${y})`}>{p.n}</text>; })}
      {(() => { const a = setA / 2, [x, y] = pt(a, 92);
        return <text x={x} y={y} className={s.half} transform={`rotate(${tan(a)}, ${x}, ${y})`}>दिवस काळ</text>; })()}
      {(() => { const a = setA + (360 - setA) / 2, [x, y] = pt(a, 92);
        return <text x={x} y={y} className={s.half} transform={`rotate(${tan(a)}, ${x}, ${y})`}>रात्री काळ</text>; })()}
      {/* sunrise and sunset marks */}
      {(() => { const [x, y] = pt(0, R_RING + 26); return <text x={x} y={y + 6} className={s.sunMark}>☀</text>; })()}
      {(() => { const [x1, y1] = pt(setA, R_RING), [x2, y2] = pt(setA, R_RING + 16);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.setMark} />; })()}
    </svg>
  );
});

function HinduClock({ lat, lon, place }) {
  const { day, error } = useHinduDay(lat, lon);
  const ghRef = useRef(null), palRef = useRef(null), vipRef = useRef(null), digRef = useRef(null), clkRef = useRef(null);
  const sceneRef = useRef(null);

  // hands and digits update straight in the DOM (no re-render 10×/s)
  useEffect(() => {
    if (!day) return;
    let raf = 0, last = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 100) return; last = t;
      const now = Date.now(), f = Math.min(1, Math.max(0, (now - day.rise) / (day.next - day.rise)));
      const vip = f * 216000;                                  // 60 × 60 × 60 विपळ per day
      const g = Math.floor(vip / 3600), p = Math.floor((vip % 3600) / 60), v = Math.floor(vip % 60);
      ghRef.current?.setAttribute('transform', `rotate(${(f * 360).toFixed(2)}, ${C}, ${C})`);
      palRef.current?.setAttribute('transform', `rotate(${(((vip / 3600) % 1) * 360).toFixed(2)}, ${C}, ${C})`);
      vipRef.current?.setAttribute('transform', `rotate(${(((vip / 60) % 1) * 360).toFixed(2)}, ${C}, ${C})`);
      if (digRef.current) digRef.current.textContent = `${pad(g)}:${pad(p)}:${pad(v)}`;
      if (clkRef.current) clkRef.current.textContent = hms(now);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [day]);

  // lean toward the mouse on desktop
  useEffect(() => {
    const el = sceneRef.current; if (!el || !window.matchMedia?.('(pointer: fine)').matches) return;
    const move = (ev) => { const r = el.getBoundingClientRect();
      el.style.setProperty('--rx', `${(14 - ((ev.clientY - r.top) / r.height - 0.5) * 14).toFixed(1)}deg`);
      el.style.setProperty('--ry', `${(((ev.clientX - r.left) / r.width - 0.5) * 16).toFixed(1)}deg`); };
    const leave = () => { el.style.setProperty('--rx', '14deg'); el.style.setProperty('--ry', '0deg'); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  if (error) return <p className={s.err}>{error}</p>;
  if (!day) return <p className={s.wait}>सूर्योदयाची वेळ येत आहे…</p>;
  const today = new Date(day.rise + IST);
  return (
    <div className={s.clockWrap}>
      <div className={s.scene} ref={sceneRef}>
        <div className={s.clock}>
          <div className={s.layer}><Dial day={day} /></div>
          <svg viewBox="0 0 600 600" className={`${s.dialSvg} ${s.hands}`} aria-hidden="true">
            <g ref={vipRef}><line x1={C} y1={C + 30} x2={C} y2={C - 210} className={s.handVip} /></g>
            <g ref={palRef}><line x1={C} y1={C + 24} x2={C} y2={C - 190} className={s.handPal} /></g>
            <g ref={ghRef}><line x1={C} y1={C + 18} x2={C} y2={C - 130} className={s.handGhati} /></g>
            <circle cx={C} cy={C} r="11" className={s.hub} />
          </svg>
        </div>
      </div>
      <div className={s.digits}>
        <div><b ref={digRef} className={s.dGhati}>--:--:--</b><span>घटी : पळ : विपळ</span></div>
        <div><b ref={clkRef} className={s.dClock}>--:--:--</b><span>तास : मिनिट : सेकंद</span></div>
      </div>
      <p className={s.meta}>
        {place} · {today.getUTCDate()} {MONTHS[today.getUTCMonth()]} {today.getUTCFullYear()} ·
        सूर्योदय {hms(day.rise).slice(0, 5)} · सूर्यास्त {hms(day.set).slice(0, 5)}
      </p>
      <p className={s.note}>सूर्योदय ते पुढचा सूर्योदय = ६० घटी · १ घटी = ६० पळ · १ पळ = ६० विपळ</p>
    </div>
  );
}

// ═══════════════════════════ मासिक ═══════════════════════════
// weekday blessings are on every week — keep the calendar to real festivals and vrats
const isFestival = (f) => !/^(रवि|सोम|मंगळ|बुध|गुरु|शुक्र|शनि)वार\s*—/.test(f.name);

function Masik({ lat, lon, onOpenDay }) {
  const todayStr = ymd(Date.now());
  const [ym, setYm] = useState(() => todayStr.slice(0, 7));
  const [sel, setSel] = useState(todayStr);
  const [days, setDays] = useState(null);
  const [error, setError] = useState('');

  const [Y, M] = ym.split('-').map(Number);
  const grid = useMemo(() => {
    const first = new Date(Date.UTC(Y, M - 1, 1));
    const start = new Date(Date.UTC(Y, M - 1, 1 - first.getUTCDay()));
    const inMonth = new Date(Date.UTC(Y, M, 0)).getUTCDate();
    const cells = Math.ceil((first.getUTCDay() + inMonth) / 7) * 7;
    return { start: start.toISOString().slice(0, 10), cells };
  }, [Y, M]);

  useEffect(() => {
    let alive = true;
    setError('');
    panchangAPI.days({ start: grid.start, days: grid.cells + 1, lat, lon })   // +1: to spot a क्षय tithi on the last day
      .then(r => { if (alive) setDays(r.data.data); })
      .catch(() => { if (alive) setError('मासिक पंचांग मिळवता आले नाही.'); });
    return () => { alive = false; };
  }, [grid, lat, lon]);

  const move = (dm) => { const d = new Date(Date.UTC(Y, M - 1 + dm, 1)); setYm(d.toISOString().slice(0, 7)); };
  const label = (i) => {
    const t = days[i].tithi.num, n = days[i + 1]?.tithi.num;
    return n && ((n - t + 30) % 30) === 2 ? `${t}/${(t % 30) + 1}` : String(t);   // a tithi that never meets a sunrise
  };
  const selDay = days?.find(d => d.date === sel);
  const monthFest = days ? days.slice(0, grid.cells).filter(d => d.date.slice(0, 7) === ym && d.festivals.some(isFestival)) : [];

  return (
    <div className={s.masik}>
      <MoonDefs />
      <div className={s.monthBar}>
        <button type="button" className={s.navBtn} onClick={() => move(-1)} aria-label="मागचा महिना">‹</button>
        <h3 className={s.monthName}>{MONTHS[M - 1]} {Y}</h3>
        <button type="button" className={s.navBtn} onClick={() => move(1)} aria-label="पुढचा महिना">›</button>
      </div>
      {ym !== todayStr.slice(0, 7) && (
        <button type="button" className={s.todayBtn} onClick={() => { setYm(todayStr.slice(0, 7)); setSel(todayStr); }}>आज</button>
      )}

      {selDay && (
        <div className={s.selCard}>
          <Moon3D el={selDay.el} size={104} className={s.bigMoon} />
          <div className={s.selText}>
            <b>{Number(selDay.date.slice(8))} {MONTHS[Number(selDay.date.slice(5, 7)) - 1]} {selDay.date.slice(0, 4)}, {selDay.var}</b>
            <span>{selDay.tithi.name}, {selDay.paksha}, {selDay.maas}</span>
            <span className={s.small}>नक्षत्र {selDay.nakshatra} · सूर्योदय {selDay.sunrise} · सूर्यास्त {selDay.sunset}</span>
            {selDay.festivals.filter(isFestival).length > 0 && (
              <span className={s.fest}>{selDay.festivals.filter(isFestival).map(f => `${f.icon} ${f.name}`).join(' · ')}</span>
            )}
            {onOpenDay && <button type="button" className={s.openBtn} onClick={() => onOpenDay(selDay.date)}>या दिवसाचे पंचांग ›</button>}
          </div>
        </div>
      )}
      <p className={s.hint}>तिथी सूर्योदयाच्या वेळची · दिवसावर टॅप करा</p>

      {error && <p className={s.err}>{error}</p>}
      <div className={s.week}>{WEEK.map(w => <span key={w}>{w}</span>)}</div>
      <div className={s.grid} aria-busy={!days}>
        {(days ? days.slice(0, grid.cells) : Array.from({ length: grid.cells }, () => null)).map((d, i) => {
          if (!d) return <div key={i} className={`${s.cell} ${s.ghost}`} />;
          const out = d.date.slice(0, 7) !== ym, fest = d.festivals.filter(isFestival);
          const t = d.tithi.num;
          const kind = t === 30 ? s.amavasya : t === 15 ? s.purnima : (t === 11 || t === 26) ? s.ekadashi : '';
          return (
            <button key={d.date} type="button"
              className={`${s.cell} ${kind} ${out ? s.out : ''} ${d.date === todayStr ? s.today : ''} ${d.date === sel ? s.sel : ''}`}
              onClick={() => setSel(d.date)} aria-pressed={d.date === sel}
              aria-label={`${Number(d.date.slice(8))} ${MONTHS[Number(d.date.slice(5, 7)) - 1]}: ${d.tithi.name}, ${d.paksha}${fest.length ? ', ' + fest.map(f => f.name).join(', ') : ''}`}>
              <span className={s.moonBox}><Moon3D el={d.el} size={44} /><em className={s.tNum}>{label(i)}</em></span>
              {fest[0] && <span className={s.icon} aria-hidden="true">{fest[0].icon}</span>}
              <span className={s.date}>{Number(d.date.slice(8))}</span>
            </button>
          );
        })}
      </div>
      <div className={s.legend}>
        <span><i className={s.lgToday} />आज</span><span><i className={s.lgPurn} />पौर्णिमा</span>
        <span><i className={s.lgAmav} />अमावस्या</span><span><i className={s.lgEk} />एकादशी</span>
        <span>१-१५ शुक्ल · १६-३० कृष्ण · "१६/१७" = क्षय तिथी</span>
      </div>

      {monthFest.length > 0 && (
        <ul className={s.festList}>
          {monthFest.map(d => (
            <li key={d.date}>
              <button type="button" onClick={() => setSel(d.date)}>
                <b>{Number(d.date.slice(8))} {MONTHS[M - 1].slice(0, 3)}</b>
                <span>{d.festivals.filter(isFestival).map(f => `${f.icon} ${f.name}`).join(' · ')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ═══════════════════════════ tab ═══════════════════════════
export default function VelMasik({ lat, lon, place, onOpenDay }) {
  const [view, setView] = useState(() => load(VIEW_KEY, 'vel'));
  const pick = (v) => { setView(v); save(VIEW_KEY, v); };
  return (
    <div className={s.root}>
      <div className={s.tabs} role="tablist">
        {[['vel', '🕰 हिंदू वेळ'], ['masik', '🌙 मासिक']].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k}
            className={`${s.tab} ${view === k ? s.tabOn : ''}`} onClick={() => pick(k)}>{label}</button>
        ))}
      </div>
      {view === 'vel' ? <HinduClock lat={lat} lon={lon} place={place} /> : <Masik lat={lat} lon={lon} onOpenDay={onOpenDay} />}
    </div>
  );
}
