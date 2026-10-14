// src/components/panchang/PanchangYantra3D.jsx — पंचांग यंत्र (CSS-3D)
//
// Shows how the five limbs of the panchang arise from the Sun and Moon: the tithi ring
// starts at the Sun (12° per tithi), the disc is split into शुक्ल / कृष्ण halves, the centre
// shows the Moon's actual phase, and the bars below give each limb's progress and end time.
// Positions: /api/panchang/chakra (sidereal, Lahiri — same engine as the panchang).
// Maas comes from the panchang API, so adhik months are named correctly.
import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { panchangAPI } from '../../api/index.js';
import { RASHIS } from '../../data/rashifalData';
import { useGrahaTimeline, useTimeControls, nextBoundary, norm, istParts, ymd, hhmm, fmtRate, IST } from './yantraTime';
import c from './RashiChakra3D.module.css';            // shared stage / controls styling
import s from './PanchangYantra3D.module.css';

const RASHI = RASHIS.map(r => r.name);
const TITHI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पौर्णिमा'];
const NAKSHATRA = ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशीर्ष', 'आर्द्रा', 'पुनर्वसू', 'पुष्य', 'आश्लेषा',
  'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूळ', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शततारका', 'पूर्वा भाद्रपदा', 'उत्तरा भाद्रपदा', 'रेवती'];
const YOGA = ['विष्कंभ', 'प्रीती', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगंड', 'सुकर्मा', 'धृती', 'शूल', 'गंड', 'वृद्धी',
  'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धी', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल',
  'ब्रह्म', 'ऐंद्र', 'वैधृती'];
const KARANA_MOV = ['बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टी'];
const MAAS = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
const RITU = ['वसंत', 'ग्रीष्म', 'वर्षा', 'शरद', 'हेमंत', 'शिशिर'];
const DAYS = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const MON = ['जाने', 'फेब्रु', 'मार्च', 'एप्रि', 'मे', 'जून', 'जुलै', 'ऑग', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];
const MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
const DEV = (n) => String(n).replace(/\d/g, d => '०१२३४५६७८९'[d]);
const NAK = 360 / 27;

const C = 300, R_OUT = 292, R_RASHI = 252, R_TITHI_O = 248, R_TITHI_I = 214, R_DISC = 210;
const pt = (lon, r) => { const th = ((90 + lon) * Math.PI) / 180; return [C + r * Math.cos(th), C - r * Math.sin(th)]; };
const arc = (r1, r2, a1, a2) => {
  const big = norm(a2 - a1) > 180 ? 1 : 0;
  const [x1, y1] = pt(a1, r2), [x2, y2] = pt(a2, r2), [x3, y3] = pt(a2, r1), [x4, y4] = pt(a1, r1);
  return `M${x1},${y1} A${r2},${r2} 0 ${big} 0 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${big} 1 ${x4},${y4} Z`;
};
const ringTextRot = (mid) => { const m = norm(mid); return m > 90 && m < 270 ? 180 - m : -m; };

// lit part of the Moon for elongation e (0 = new, 180 = full); waxing lit on the right
function moonPath(r, e) {
  const k = Math.cos((e * Math.PI) / 180);             // 1 new … -1 full
  const rx = Math.abs(k) * r;
  const waxing = e < 180;
  const outer = waxing ? 1 : 0;                         // top→bottom along the lit limb (right when waxing)
  // bottom→top along the terminator: crescents curve back towards the lit limb, gibbous away
  const term = (waxing ? k > 0 : k < 0) ? 0 : 1;
  return `M${C},${C - r} A${r},${r} 0 0 ${outer} ${C},${C + r} A${rx},${r} 0 0 ${term} ${C},${C - r} Z`;
}

const ZodiacRing = memo(function ZodiacRing() {
  return (
    <svg viewBox="0 0 600 600" className={c.layer} aria-hidden="true">
      <defs>
        <linearGradient id="py-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6d58a" /><stop offset="45%" stopColor="#b8862f" /><stop offset="100%" stopColor="#6f4b16" />
        </linearGradient>
        <radialGradient id="py-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#33220f" /><stop offset="75%" stopColor="#1c1209" /><stop offset="100%" stopColor="#120b05" />
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_OUT + 5} fill="url(#py-gold)" />
      <circle cx={C} cy={C} r={R_OUT} fill="#22160b" />
      {RASHI.map((n, i) => {
        const a = i * 30, mid = a + 15, [x, y] = pt(mid, (R_OUT + R_RASHI) / 2 + 2);
        const [bx1, by1] = pt(a, R_RASHI), [bx2, by2] = pt(a, R_OUT);
        return (
          <g key={n}>
            <line x1={bx1} y1={by1} x2={bx2} y2={by2} className={s.rashiDiv} />
            <text x={x} y={y} className={s.rashiText} transform={`rotate(${ringTextRot(mid)}, ${x}, ${y})`}>{n}</text>
          </g>
        );
      })}
      <path className={s.ticks} d={Array.from({ length: 360 }, (_, d) => {
        const len = d % 10 === 0 ? 8 : d % 5 === 0 ? 5 : 2.5;
        const [x1, y1] = pt(d, R_RASHI), [x2, y2] = pt(d, R_RASHI + len);
        return `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`;
      }).join('')} />
      <circle cx={C} cy={C} r={R_RASHI} fill="url(#py-face)" stroke="url(#py-gold)" strokeWidth="2.5" />
    </svg>
  );
});

export default function PanchangYantra3D({ lat, lon, place, syncMs }) {
  const tc = useTimeControls(syncMs);
  const { t } = tc;
  const { samples, pos, error } = useGrahaTimeline(t, lat, lon);
  const [day, setDay] = useState(null);
  const stageRef = useRef(null), wheelRef = useRef(null);
  const view = useRef({ rot: 0, tilt: 24 });

  // maas (incl. adhik) and vaar from the panchang for the shown minute
  const minute = Math.floor(t / 60000);
  useEffect(() => {
    const id = setTimeout(() => {
      panchangAPI.get({ date: ymd(t), time: hhmm(t), lat, lon }).then(r => setDay(r.data.data)).catch(() => {});
    }, 600);
    return () => clearTimeout(id);
  }, [minute, lat, lon]); // eslint-disable-line react-hooks/exhaustive-deps

  // drag to rotate / tilt (view only)
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    let drag = null;
    const apply = () => {
      wheelRef.current?.style.setProperty('--rot', `${view.current.rot}deg`);
      wheelRef.current?.style.setProperty('--tilt', `${view.current.tilt}deg`);
    };
    apply();
    const down = (e) => { drag = { x: e.clientX, y: e.clientY }; stage.classList.add(c.dragging); };
    const move = (e) => {
      if (!drag) return;
      view.current.rot += (e.clientX - drag.x) * 0.45;
      view.current.tilt = Math.max(0, Math.min(55, view.current.tilt + (e.clientY - drag.y) * 0.25));
      drag = { x: e.clientX, y: e.clientY }; apply();
    };
    const up = () => { drag = null; stage.classList.remove(c.dragging); };
    stage.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      stage.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);
  const resetView = () => {
    view.current = { rot: 0, tilt: 24 };
    wheelRef.current?.style.setProperty('--rot', '0deg');
    wheelRef.current?.style.setProperty('--tilt', '24deg');
  };

  // ── the five limbs, their progress and end times ──
  const limbs = useMemo(() => {
    if (!pos) return null;
    const sun = pos.Sun, moon = pos.Moon, el = norm(moon - sun), yg = norm(sun + moon);
    const tn = Math.floor(el / 12);                        // 0..29
    const half = Math.floor(el / 6);                       // 0..59 (karana)
    const karana = half === 0 ? 'किंस्तुघ्न' : half >= 57 ? ['शकुनी', 'चतुष्पाद', 'नाग'][half - 57] : KARANA_MOV[(half - 1) % 7];
    const end = (fn, w) => nextBoundary(samples, t, fn, w);
    const maasName = day?.maas || '';
    const adhik = /अधिक/.test(maasName);
    const mi = MAAS.findIndex(m => maasName.endsWith(m));
    const uttar = sun >= 270 || sun < 90;
    const ayFrac = uttar ? norm(sun - 270) / 180 : (sun - 90) / 180;
    return {
      el, sun, moon,
      tithi: { idx: tn % 15, frac: (el % 12) / 12, name: tn === 29 ? 'अमावस्या' : TITHI[tn % 15], karana,
               end: end(p => norm(p.Moon - p.Sun), 12) },
      paksha: { idx: tn < 15 ? 0 : 1, frac: (el % 180) / 180 },
      nak: { idx: Math.floor(moon / NAK), frac: (moon % NAK) / NAK, pada: Math.floor((moon % NAK) / (NAK / 4)) + 1,
             end: end(p => p.Moon, NAK) },
      yoga: { idx: Math.floor(yg / NAK), frac: (yg % NAK) / NAK, end: end(p => norm(p.Sun + p.Moon), NAK) },
      maas: { idx: mi, frac: el / 360, name: maasName, adhik },
      ritu: { idx: mi >= 0 ? Math.floor(mi / 2) : -1, frac: mi >= 0 ? ((mi % 2) + el / 360) / 2 : 0 },
      ayana: { idx: uttar ? 0 : 1, frac: ayFrac },
    };
  }, [pos, samples, t, day]);

  const fmtEnd = (ms) => {
    if (!ms) return '';
    const p = istParts(ms), h = p.h % 12 || 12;
    const left = Math.max(0, ms - t), lh = Math.floor(left / 3600000), lm = Math.round((left % 3600000) / 60000);
    return `समाप्ती ${p.d} ${MON[p.mo]}, ${h}:${String(p.mi).padStart(2, '0')} ${p.h < 12 ? 'AM' : 'PM'} (आणखी ${lh} ता ${lm} मि)`;
  };

  const p = istParts(t);
  const sunPt = pos ? pt(pos.Sun, (R_TITHI_O + R_TITHI_I) / 2) : null;
  const moonPt = pos ? pt(pos.Moon, (R_TITHI_O + R_TITHI_I) / 2) : null;
  const lagnaPt = pos ? pt(pos.lagna, R_OUT + 1) : null;

  const Bar = ({ label, n, idx, frac, names, info }) => (
    <div className={s.row}>
      <span className={s.rowLabel}>{label}</span>
      <div className={s.track} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={n} aria-valuenow={idx + frac}>
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className={`${s.seg} ${i < idx ? s.done : ''} ${i === idx ? s.cur : ''}`}>
            {i === idx && <i style={{ width: `${Math.round(frac * 100)}%` }} />}
            {names && <b>{names[i]}</b>}
          </span>
        ))}
      </div>
      {info && <span className={s.rowInfo}>{info}</span>}
    </div>
  );

  return (
    <div className={c.root}>
      <p className={c.caption}>
        {DAYS[p.wd]}, {p.d} {MONTHS[p.mo]} {p.y} · {String(p.h).padStart(2, '0')}:{String(p.mi).padStart(2, '0')} · {place || 'निवडलेले ठिकाण'} · निरयन, लाहिरी
      </p>
      {error && <p className={c.error}>{error}</p>}

      <div className={c.stage} ref={stageRef} title="फिरवण्यासाठी ओढा · झुकवण्यासाठी वर-खाली ओढा">
        <div className={c.shadow} />
        {!pos && !error && <div className={c.loading}>गणित होत आहे…</div>}
        <div className={c.wheel} ref={wheelRef}>
          <div className={`${c.plate} ${c.z0}`}><ZodiacRing /></div>
          {limbs && (
            <svg viewBox="0 0 600 600" className={`${c.layer} ${c.z1}`} aria-label="तिथी चक्र">
              {/* शुक्ल / कृष्ण halves */}
              <path d={arc(0.01, R_DISC, limbs.sun, limbs.sun + 180)} className={s.shuklaHalf} />
              <path d={arc(0.01, R_DISC, limbs.sun + 180, limbs.sun + 360)} className={s.krishnaHalf} />
              {/* 30 tithis, starting at the Sun */}
              {Array.from({ length: 30 }, (_, i) => {
                const a1 = limbs.sun + i * 12, mid = a1 + 6, [x, y] = pt(mid, (R_TITHI_O + R_TITHI_I) / 2);
                const cur = i === Math.floor(limbs.el / 12);
                return (
                  <g key={i}>
                    <path d={arc(R_TITHI_I, R_TITHI_O, a1, a1 + 12)}
                      className={`${i < 15 ? s.tShukla : s.tKrishna} ${cur ? s.tCur : ''}`} />
                    <text x={x} y={y} className={`${s.tNum} ${cur ? s.tNumCur : ''}`}
                      transform={`rotate(${ringTextRot(mid)}, ${x}, ${y})`}>{i === 14 ? 'पौ' : i === 29 ? 'अ' : DEV((i % 15) + 1)}</text>
                  </g>
                );
              })}
              {(() => { const [x1, y1] = pt(limbs.sun, R_TITHI_I), [x2, y2] = pt(limbs.sun + 180, R_TITHI_I);
                return <line x1={x1} y1={y1} x2={x2} y2={y2} className={s.axis} />; })()}
              <line x1={C} y1={C} x2={moonPt[0]} y2={moonPt[1]} className={s.moonRay} />
              <line x1={C} y1={C} x2={sunPt[0]} y2={sunPt[1]} className={s.sunRay} />
            </svg>
          )}
          {limbs && (
            <svg viewBox="0 0 600 600" className={`${c.layer} ${c.z2}`}>
              {[[limbs.sun + 90, 'शुक्ल पक्ष'], [limbs.sun + 270, 'कृष्ण पक्ष']].map(([a, label]) => {
                const [x, y] = pt(a, 132);
                return <g key={label} className={c.upright} style={{ transformOrigin: `${x}px ${y}px` }}><text x={x} y={y} className={s.pakshaText}>{label}</text></g>;
              })}
              <circle cx={sunPt[0]} cy={sunPt[1]} r="13" className={s.sun} />
              <circle cx={moonPt[0]} cy={moonPt[1]} r="11" className={s.moon} />
              <g className={c.upright} style={{ transformOrigin: `${sunPt[0]}px ${sunPt[1]}px` }}>
                <text x={sunPt[0]} y={sunPt[1] - 20} className={s.bodyText}>सूर्य</text>
              </g>
              <g className={c.upright} style={{ transformOrigin: `${moonPt[0]}px ${moonPt[1]}px` }}>
                <text x={moonPt[0]} y={moonPt[1] + 27} className={s.bodyText}>चंद्र {Math.round(limbs.el)}°</text>
              </g>
              <path d={`M${lagnaPt[0]},${lagnaPt[1]} L${pt(pos.lagna, R_RASHI)[0]},${pt(pos.lagna, R_RASHI)[1]}`} className={s.lagnaMark} />
              <g className={c.upright} style={{ transformOrigin: `${lagnaPt[0]}px ${lagnaPt[1]}px` }}>
                <text x={lagnaPt[0]} y={lagnaPt[1] - 10} className={s.lagnaText}>लग्न</text>
              </g>
              {/* the Moon's real phase in the centre */}
              <g className={c.upright} style={{ transformOrigin: `${C}px ${C}px` }}>
                <circle cx={C} cy={C} r="62" className={s.moonRim} />
                <circle cx={C} cy={C} r="56" className={s.moonDark} />
                <path d={moonPath(56, limbs.el)} className={s.moonLit} />
              </g>
            </svg>
          )}
        </div>
        <button type="button" className={c.reset} onClick={resetView} title="मूळ दृश्य">⟲</button>
      </div>

      {limbs && (
        <div className={s.bars}>
          <Bar label="तिथी" n={15} idx={limbs.tithi.idx} frac={limbs.tithi.frac}
            info={`${limbs.tithi.name} · करण ${limbs.tithi.karana} · ${fmtEnd(limbs.tithi.end)}`} />
          <Bar label="पक्ष" n={2} idx={limbs.paksha.idx} frac={limbs.paksha.frac} names={['शुक्ल', 'कृष्ण']} />
          <Bar label="नक्षत्र" n={27} idx={limbs.nak.idx} frac={limbs.nak.frac}
            info={`${NAKSHATRA[limbs.nak.idx]} (चरण ${limbs.nak.pada}) · ${fmtEnd(limbs.nak.end)}`} />
          <Bar label="योग" n={27} idx={limbs.yoga.idx} frac={limbs.yoga.frac}
            info={`${YOGA[limbs.yoga.idx]} · ${fmtEnd(limbs.yoga.end)}`} />
          {limbs.maas.idx >= 0 && (
            <Bar label="मास" n={12} idx={limbs.maas.idx} frac={limbs.maas.frac}
              info={`${limbs.maas.name}${limbs.maas.adhik ? ' (अधिक मास)' : ''} · अमांत`} />
          )}
          {limbs.ritu.idx >= 0 && <Bar label="ऋतू" n={6} idx={limbs.ritu.idx} frac={limbs.ritu.frac} names={RITU} />}
          <Bar label="अयन" n={2} idx={limbs.ayana.idx} frac={limbs.ayana.frac} names={['उत्तरायण', 'दक्षिणायन']}
            info="निरयन — मकर संक्रांतीपासून उत्तरायण, कर्क संक्रांतीपासून दक्षिणायन" />
        </div>
      )}

      <div className={c.timeRow}>
        {tc.jogRate !== 0 && <span className={c.rate}>{fmtRate(tc.jogRate)}</span>}
        <button type="button" className={c.play} onClick={() => tc.setPlaying(x => !x)} aria-pressed={tc.playing}>
          {tc.playing ? '⏸' : '▶'} <span>{tc.playing ? 'चालू' : 'स्थिर'}</span>
        </button>
      </div>
      <div className={c.jogRow}>
        <button type="button" className={c.stepBtn} onClick={() => tc.nudge(-60)} aria-label="एक तास मागे">−1ता</button>
        <div className={c.jogTrack} aria-label="वेळ पुढे-मागे: ओढा">
          {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
          <button type="button" ref={tc.knobRef} className={`${c.knob} ${s.knob}`} aria-label="वेळ ओढा">‹›</button>
        </div>
        <button type="button" className={c.stepBtn} onClick={() => tc.nudge(60)} aria-label="एक तास पुढे">+1ता</button>
        <button type="button" className={c.now} onClick={tc.now}>आता</button>
      </div>
      <div className={c.when}>
        <label className={c.dateBox}>
          <span className={c.date}>{p.d} {MONTHS[p.mo]} {p.y}</span>
          <span className={c.time}>{String(p.h).padStart(2, '0')}:{String(p.mi).padStart(2, '0')}</span>
          <input type="datetime-local" value={new Date(t + IST).toISOString().slice(0, 16)} aria-label="तारीख व वेळ निवडा"
            onChange={e => { const v = Date.parse(e.target.value + ':00+05:30'); if (Number.isFinite(v)) { tc.setPlaying(false); tc.setT(v); } }} />
        </label>
      </div>
    </div>
  );
}
