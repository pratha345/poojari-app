// src/components/panchang/RashiChakra3D.jsx — राशि चक्र (interactive, CSS-3D)
//
// Positions come from /api/panchang/chakra (sidereal, Lahiri, astronomy-engine — the same
// engine as the panchang and rashifal). The wheel only draws them; nothing is estimated here
// except linear interpolation between half-hourly samples while the time is being scrubbed.
//
// 3D is plain CSS: a perspective stage, a wheel tilted with rotateX/rotateZ and layers lifted
// with translateZ. Dragging the wheel changes only the view (rotation/tilt), never the time.
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { panchangAPI } from '../../api/index.js';
import { RASHIS } from '../../data/rashifalData';
import s from './RashiChakra3D.module.css';
import { useTimeControls, fmtOffset } from './yantraTime';
import { useView3D } from './view3d';
import ViewToolbar from './ViewToolbar';

const RASHI = RASHIS.map(r => r.name);
const NAKSHATRA = ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशीर्ष', 'आर्द्रा', 'पुनर्वसू', 'पुष्य', 'आश्लेषा',
  'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा',
  'मूळ', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शततारका', 'पूर्वा भाद्रपदा', 'उत्तरा भाद्रपदा', 'रेवती'];
const NAK_SHORT = { 'पूर्वा फाल्गुनी': 'पू. फाल्गुनी', 'उत्तरा फाल्गुनी': 'उ. फाल्गुनी', 'पूर्वाषाढा': 'पू. षाढा',
  'उत्तराषाढा': 'उ. षाढा', 'पूर्वा भाद्रपदा': 'पू. भाद्रपदा', 'उत्तरा भाद्रपदा': 'उ. भाद्रपदा' };
const TITHI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी'];
const DAYS = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

// orbit radius (inner → outer), colour, Marathi name
const GRAHA = [
  { key: 'Moon',    mr: 'चंद्र', r: 72,  c: '#cfd8dc' },
  { key: 'Mercury', mr: 'बुध',   r: 88,  c: '#4caf50' },
  { key: 'Venus',   mr: 'शुक्र', r: 104, c: '#ec407a' },
  { key: 'Sun',     mr: 'सूर्य', r: 120, c: '#f08a24' },
  { key: 'Mars',    mr: 'मंगळ',  r: 136, c: '#e53935' },
  { key: 'Jupiter', mr: 'गुरू',  r: 152, c: '#f9a825' },
  { key: 'Saturn',  mr: 'शनी',   r: 168, c: '#7986cb' },
  { key: 'Rahu',    mr: 'राहू',  r: 184, c: '#ab47bc' },
  { key: 'Ketu',    mr: 'केतू',  r: 184, c: '#26a69a' },
];
const NODE = new Set(['Rahu', 'Ketu']);      // mean nodes: always retrograde

const C = 300;                                // SVG centre (viewBox 600)
const R_OUT = 292, R_NAK = 252, R_RASHI = 206;
const IST = 330 * 60000;
const WINDOW_H = 240, STEP_MIN = 30;          // fetch 10 days of half-hourly samples
const DEFAULT_TILT = 26;

const norm = (a) => ((a % 360) + 360) % 360;
// screen point for longitude λ at radius r (Mesha at top-left, signs run anti-clockwise)
const pt = (lon, r) => {
  const th = ((90 + lon) * Math.PI) / 180;
  return [C + r * Math.cos(th), C - r * Math.sin(th)];
};
const arc = (r1, r2, a1, a2) => {            // ring sector between longitudes a1..a2
  const [x1, y1] = pt(a1, r2), [x2, y2] = pt(a2, r2), [x3, y3] = pt(a2, r1), [x4, y4] = pt(a1, r1);
  return `M${x1},${y1} A${r2},${r2} 0 0 0 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 1 ${x4},${y4} Z`;
};
// rotation for text written along the ring at longitude `mid`, never upside down
const ringTextRot = (mid) => { const m = norm(mid); return m > 90 && m < 270 ? 180 - m : -m; };
const dms = (x) => { const d = Math.floor(x); const m = Math.floor((x - d) * 60); return `${d}°${String(m).padStart(2, '0')}′`; };
const istParts = (ms) => { const d = new Date(ms + IST); return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), wd: d.getUTCDay() }; };
const toLocalInput = (ms) => new Date(ms + IST).toISOString().slice(0, 16);
const fromLocalInput = (v) => Date.parse(v + ':00+05:30');

// linear interpolation between samples, unwrapping 360° jumps
function interpolate(samples, t) {
  if (!samples?.length) return null;
  const step = samples.length > 1 ? samples[1].t - samples[0].t : 1;
  const i = Math.min(samples.length - 2, Math.max(0, Math.floor((t - samples[0].t) / step)));
  const a = samples[i], b = samples[i + 1] || a;
  const f = Math.min(1, Math.max(0, (t - a.t) / step));
  const out = {};
  for (const k of [...GRAHA.map(g => g.key), 'lagna']) {
    let d = b[k] - a[k];
    if (d > 180) d -= 360; if (d < -180) d += 360;
    out[k] = norm(a[k] + d * f);
    out[k + '_retro'] = NODE.has(k) || (k !== 'lagna' && d < 0);
    out[k + '_speed'] = (d / step) * 86400000;          // degrees per day
  }
  return out;
}

// ── static rings (memoised: drawn once) ──
const Rings = memo(function Rings() {
  return (
    <svg viewBox="0 0 600 600" className={s.layer} aria-hidden="true">
      <defs>
        <radialGradient id="rc-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#3a2614" /><stop offset="70%" stopColor="#1f140b" /><stop offset="100%" stopColor="#140d07" />
        </radialGradient>
        <linearGradient id="rc-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d98a" /><stop offset="45%" stopColor="#b8862f" /><stop offset="100%" stopColor="#6f4b16" />
        </linearGradient>
      </defs>
      {/* bevelled outer rim */}
      <circle cx={C} cy={C} r={R_OUT + 5} fill="url(#rc-gold)" />
      <circle cx={C} cy={C} r={R_OUT} fill="#24180d" />
      {/* nakshatra band */}
      {NAKSHATRA.map((n, i) => {
        const a = i * (360 / 27), mid = a + 360 / 54, [x, y] = pt(mid, (R_OUT + R_NAK) / 2);
        return (
          <g key={n}>
            <path d={arc(R_NAK, R_OUT, a, a + 360 / 27)} className={i % 2 ? s.nakA : s.nakB} />
            <text x={x} y={y} className={s.nakText} transform={`rotate(${ringTextRot(mid)}, ${x}, ${y})`}>{NAK_SHORT[n] || n}</text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r={R_NAK} fill="none" stroke="#b8862f" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* rashi band */}
      {RASHI.map((n, i) => {
        const a = i * 30, mid = a + 15, [x, y] = pt(mid, (R_NAK + R_RASHI) / 2);
        return (
          <g key={n}>
            <path d={arc(R_RASHI, R_NAK, a, a + 30)} className={s.rashiCell} />
            <text x={x} y={y} className={s.rashiText} transform={`rotate(${ringTextRot(mid)}, ${x}, ${y})`}>{n}</text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r={R_RASHI} fill="url(#rc-face)" stroke="url(#rc-gold)" strokeWidth="3" />
      {/* degree scale: 1° / 5° / 10° ticks, like an engraved instrument */}
      <path className={s.ticks} d={Array.from({ length: 360 }, (_, d) => {
        const len = d % 10 === 0 ? 9 : d % 5 === 0 ? 6 : 3;
        const [x1, y1] = pt(d, R_RASHI + 2), [x2, y2] = pt(d, R_RASHI + 2 + len);
        return `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`;
      }).join('')} />
      {/* faint spokes at sign boundaries and orbit circles */}
      {RASHI.map((_, i) => { const [x, y] = pt(i * 30, R_RASHI); return <line key={i} x1={C} y1={C} x2={x} y2={y} className={s.spoke} />; })}
      {[72, 104, 136, 168].map(r => <circle key={r} cx={C} cy={C} r={r} className={s.orbit} />)}
    </svg>
  );
});

export default function RashiChakra3D({ lat, lon, place, syncMs, onShowKundli }) {
  const [view, setView]       = useState('rashi');      // lagna | rashi | info
  const { t, setT, playing, setPlaying, offset, knobRef, knobStyle, nudge, now } = useTimeControls(syncMs);
  const [samples, setSamples] = useState(null);
  const [error, setError]     = useState('');
  const [day, setDay]         = useState(null);          // panchang for the shown time (maas etc.)
  const [exact, setExact]     = useState(null);          // exact positions once the time settles
  const [sel, setSel]         = useState(null);          // selected graha (info card)

  const fetching = useRef(false);
  const tRef = useRef(t); tRef.current = t;


  // ── data: keep a 10-day window of samples around t ──
  const ensureWindow = useCallback(async (at) => {
    const cur = samples;
    const margin = 12 * 3600000;
    if (cur && at > cur[0].t + margin && at < cur[cur.length - 1].t - margin) return;
    if (fetching.current) return;
    fetching.current = true;
    try {
      const start = new Date(at - (WINDOW_H / 2) * 3600000).toISOString();
      const r = await panchangAPI.chakra({ start, hours: WINDOW_H, step: STEP_MIN, lat, lon });
      setSamples(r.data.data.samples); setError('');
    } catch {
      setError('ग्रहस्थिती मिळवता आली नाही.');
    } finally { fetching.current = false; }
  }, [samples, lat, lon]);

  useEffect(() => { setSamples(null); }, [lat, lon]);           // new place → fresh lagna
  useEffect(() => { ensureWindow(t); }, [t, ensureWindow]);

  const pos = useMemo(() => interpolate(samples, t), [samples, t]);

  // panchang (maas, var) for the shown minute, once the time settles
  const minuteKey = Math.floor(t / 60000);
  useEffect(() => {
    const id = setTimeout(() => {
      const p = istParts(t);
      const date = `${p.y}-${String(p.mo + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
      panchangAPI.get({ date, time: `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`, lat, lon })
        .then(r => setDay(r.data.data)).catch(() => {});
      const at = tRef.current;
      panchangAPI.chakra({ start: new Date(at).toISOString(), hours: 1, step: 60, lat, lon })
        .then(r => setExact({ t: at, row: r.data.data.samples[0] })).catch(() => {});
    }, 700);
    return () => clearTimeout(id);
  }, [minuteKey, lat, lon]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── camera (view only): rotate / tilt / pan / zoom live in CSS variables — see view3d.js ──
  const lagnaOffset = view === 'lagna' && pos ? pos.lagna - 90 : 0;   // lagna at the left (east)
  const [restRot, setRestRot] = useState(0);     // user rotation once a gesture has settled
  const offsetRef = useRef(0);
  const cam = useView3D({ defaultTilt: DEFAULT_TILT, rotOffsetRef: offsetRef, onRest: setRestRot });
  const movedRef = cam.movedAt;                  // tap vs drag on the graha markers
  const { apply: applyView, setRot } = cam;
  useEffect(() => { offsetRef.current = lagnaOffset; applyView(); }, [lagnaOffset, applyView, view]);
  // a new view starts from the default orientation (lagna then sits exactly at the left)
  useEffect(() => { setRot(0); }, [view, setRot]);


  // ── what the bottom line says ──
  const p = istParts(t);
  const info = pos && (() => {
    const el = norm(pos.Moon - pos.Sun);
    const tn = Math.floor(el / 12);                     // 0..29
    const tithi = tn === 14 ? 'पौर्णिमा' : tn === 29 ? 'अमावस्या' : TITHI[tn % 15];
    const nk = Math.floor(pos.Moon / (360 / 27));
    const pada = Math.floor((pos.Moon % (360 / 27)) / (360 / 108)) + 1;
    return { tithi, paksha: tn < 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष', nak: NAKSHATRA[nk], pada };
  })();

  // planet markers; labels counter-rotate so they stay upright while the wheel turns
  const markers = useMemo(() => {
    if (!pos) return null;
    const rot = ((restRot + lagnaOffset) * Math.PI) / 180;           // CSS rotateZ, clockwise
    const toScreen = (x, y) => [C + (x - C) * Math.cos(rot) - (y - C) * Math.sin(rot), C + (x - C) * Math.sin(rot) + (y - C) * Math.cos(rot)];
    const list = GRAHA.map(g => { const [x, y] = pt(pos[g.key], g.r); return { ...g, x, y, lon: pos[g.key], retro: pos[g.key + '_retro'] }; });
    const boxes = list.map(m => { const [sx, sy] = toScreen(m.x, m.y); return [sx - 9, sy - 9, sx + 9, sy + 9]; });
    const hit = (b) => boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    for (const m of list) {
      const [sx, sy] = toScreen(m.x, m.y);
      const w = (m.mr.length + (m.retro ? 1 : 0)) * 8 + 4, h = 16;
      const tries = [[12, 5, 'start'], [-12, 5, 'end'], [-w / 2, -14, 'start'], [-w / 2, 22, 'start'], [12, -12, 'start'], [12, 20, 'start']];
      let pick = tries[0];
      for (const tr of tries) {
        const x0 = tr[2] === 'end' ? sx + tr[0] - w : sx + tr[0];
        const b = [x0, sy + tr[1] - 12, x0 + w, sy + tr[1] - 12 + h];
        if (!hit(b)) { pick = tr; boxes.push(b); break; }
      }
      m.dx = pick[0]; m.dy = pick[1]; m.anchor = pick[2];
    }
    return list;
  }, [pos, restRot, lagnaOffset]);
  const [lx, ly] = pos ? pt(pos.lagna, R_RASHI - 6) : [0, 0];

  // exact values at rest; interpolated while the time is moving
  const val = (k) => (exact && Math.abs(exact.t - t) < 1000 ? exact.row[k] : pos?.[k]);
  const rows = pos && [...GRAHA.map(g => ({ ...g, lon: val(g.key), retro: pos[g.key + '_retro'], speed: pos[g.key + '_speed'] })),
    { key: 'lagna', mr: 'लग्न', c: '#f5d98a', lon: val('lagna'), retro: false, speed: null }];
  const nakOf = (lon) => `${NAKSHATRA[Math.floor(lon / (360 / 27))]} (${Math.floor((lon % (360 / 27)) / (360 / 108)) + 1})`;
  const selRow = sel && rows?.find(r => r.key === sel);
  // whole-sign houses for the lagna view: house 1 = the lagna's rashi
  const houses = view === 'lagna' && pos ? Array.from({ length: 12 }, (_, h) => {
    const r = (Math.floor(pos.lagna / 30) + h) % 12;
    const [x, y] = pt(r * 30 + 15, R_RASHI - 18);
    return { h: h + 1, x, y };
  }) : [];

  return (
    <div className={s.root}>
      <div className={s.tabs} role="tablist">
        {[['lagna', 'लग्न'], ['rashi', 'राशि'], ['info', 'माहिती']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={view === k} className={`${s.tab} ${view === k ? s.tabOn : ''}`} onClick={() => setView(k)}>{label}</button>
        ))}
      </div>

      <p className={s.caption}>
        निरयन · लाहिरी अयनांश · {place || 'निवडलेले ठिकाण'} ({Math.abs(lat).toFixed(2)}°{lat >= 0 ? 'उ' : 'द'}, {Math.abs(lon).toFixed(2)}°{lon >= 0 ? 'पू' : 'प'})
      </p>
      {error && <p className={s.error}>{error}</p>}

      {view !== 'info' ? (
        <div ref={cam.viewerRef} className={`${s.viewer} ${cam.full && !document.fullscreenElement ? s.viewerFull : ''}`}>
        <div className={s.stage} ref={cam.stageRef} tabIndex={0} role="group"
          aria-label="राशि चक्र — ओढून फिरवा; बाण कळा: सरकवा, + / −: झूम, 0: मूळ दृश्य">
          <div className={s.shadow} />
          {!pos && !error && <div className={s.loading}>ग्रहस्थितीचे गणित होत आहे…</div>}
          <div className={s.wheel}>
            <div className={`${s.plate} ${s.z0}`}><Rings /></div>
            <div className={s.sheen} />
            <svg viewBox="0 0 600 600" className={`${s.layer} ${s.z1}`} aria-label="ग्रहस्थिती">
              {pos && (
                <g>
                  {view === 'lagna' && (
                    <g>
                      <line x1={C} y1={C} x2={lx} y2={ly} className={s.lagnaLine} />
                      <circle cx={lx} cy={ly} r="7" className={s.lagnaDot} />
                    </g>
                  )}
                  {markers.map(m => <line key={m.key} x1={C} y1={C} x2={m.x} y2={m.y} stroke={m.c}
                    className={`${s.ray} ${sel && sel !== m.key ? s.dim : ''}`} />)}
                </g>
              )}
            </svg>
            <svg viewBox="0 0 600 600" className={`${s.layer} ${s.z2}`}>
              {houses.map(hh => (
                <g key={hh.h} className={s.upright} style={{ transformOrigin: `${hh.x}px ${hh.y}px` }}>
                  <text x={hh.x} y={hh.y} className={s.houseNum}>{hh.h}</text>
                </g>
              ))}
              {markers?.map(m => (
                <g key={m.key} className={`${s.marker} ${sel === m.key ? s.markerSel : ''} ${sel && sel !== m.key ? s.dim : ''}`}
                  role="button" tabIndex={0} aria-label={`${m.mr} — तपशील`}
                  onClick={() => { if (performance.now() - movedRef.current > 250) setSel(x => (x === m.key ? null : m.key)); }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSel(x => (x === m.key ? null : m.key)); }}>
                  <circle cx={m.x} cy={m.y} r="14" className={s.hit} />
                  {sel === m.key && <circle cx={m.x} cy={m.y} r="12" className={s.selRing} />}
                  <circle cx={m.x} cy={m.y + 2.5} r="7.5" className={s.markerShadow} />
                  <circle cx={m.x} cy={m.y} r="7.5" fill={m.c} className={s.markerBody} />
                  <circle cx={m.x - 2.2} cy={m.y - 2.4} r="2.4" className={s.markerShine} />
                  <g className={s.upright} style={{ transformOrigin: `${m.x}px ${m.y}px` }}>
                    <text x={m.x + m.dx} y={m.y + m.dy} fill={m.c} textAnchor={m.anchor} className={s.markerText}>{m.mr}{m.retro ? '*' : ''}</text>
                  </g>
                </g>
              ))}
              {view === 'lagna' && pos && (
                <g className={s.upright} style={{ transformOrigin: `${lx}px ${ly}px` }}>
                  <text x={lx + 12} y={ly - 10} className={s.lagnaText}>लग्न</text>
                </g>
              )}
            </svg>
            <div className={`${s.hub} ${s.z3}`}><span /></div>
          </div>
          {selRow && (
            <div className={s.card} role="dialog" aria-label={`${selRow.mr} तपशील`}>
              <button type="button" className={s.cardX} onClick={() => setSel(null)} aria-label="बंद करा">×</button>
              <div className={s.cardHead}><span className={s.dot} style={{ background: selRow.c }} />{selRow.mr}
                {selRow.retro && !NODE.has(selRow.key) && <em> वक्री</em>}</div>
              <dl>
                <dt>राशी</dt><dd>{RASHI[Math.floor(selRow.lon / 30)]} {dms(selRow.lon % 30)}</dd>
                <dt>नक्षत्र</dt><dd>{nakOf(selRow.lon)}</dd>
                {selRow.speed != null && <><dt>गती</dt><dd>{Math.abs(selRow.speed).toFixed(selRow.key === 'Moon' ? 1 : 2)}°/दिवस</dd></>}
              </dl>
            </div>
          )}
        </div>
        <ViewToolbar cam={cam} />
        </div>
      ) : (
        <div className={s.infoWrap}>
          <table className={s.table}>
            <thead><tr><th>ग्रह</th><th>राशी</th><th>अंश</th><th>नक्षत्र (चरण)</th><th>गती / दिवस</th></tr></thead>
            <tbody>
              {rows?.map(g => (
                <tr key={g.key} className={g.retro && !NODE.has(g.key) ? s.retroRow : ''}>
                  <td><span className={s.dot} style={{ background: g.c }} />{g.mr}{g.retro && !NODE.has(g.key) ? ' (वक्री)' : ''}</td>
                  <td>{RASHI[Math.floor(g.lon / 30)]}</td>
                  <td className={s.num}>{dms(g.lon % 30)}</td>
                  <td>{nakOf(g.lon)}</td>
                  <td className={s.num}>{g.speed == null ? '—' : `${g.speed < 0 ? '−' : ''}${Math.abs(g.speed).toFixed(g.key === 'Moon' ? 1 : 2)}°`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={s.note}>निरयन (लाहिरी अयनांश). * = वक्री; राहू-केतू मध्यम पात, नेहमी वक्री गतीने.</p>
        </div>
      )}

      {/* time controls */}
      <div className={s.timeRow}>
        {fmtOffset(offset) && <span className={s.rate}>{fmtOffset(offset)}</span>}
        <button type="button" className={s.play} onClick={() => setPlaying(x => !x)} aria-pressed={playing}>
          {playing ? '⏸' : '▶'} <span>{playing ? 'चालू' : 'स्थिर'}</span>
        </button>
      </div>
      <div className={s.jogRow}>
        <button type="button" className={s.stepBtn} onClick={() => nudge(-60)} aria-label="एक तास मागे">−1ता</button>
        <div className={s.jogTrack} aria-label="वेळ पुढे-मागे: ओढा (±15 दिवस)">
          {Array.from({ length: 9 }, (_, i) => <i key={i} />)}
          <button type="button" ref={knobRef} className={s.knob} style={knobStyle} aria-label="वेळ ओढा; बाण कळांनी ±1 तास">‹›</button>
        </div>
        <button type="button" className={s.stepBtn} onClick={() => nudge(60)} aria-label="एक तास पुढे">+1ता</button>
        <button type="button" className={s.now} onClick={now}>आता</button>
      </div>

      <div className={s.when}>
        <label className={s.dateBox}>
          <span className={s.date}>{p.d} {MONTHS[p.mo]} {p.y}</span>
          <span className={s.time}>{String(p.h).padStart(2, '0')}:{String(p.mi).padStart(2, '0')}</span>
          <input type="datetime-local" value={toLocalInput(t)} aria-label="तारीख व वेळ निवडा"
            onChange={e => { const v = fromLocalInput(e.target.value); if (Number.isFinite(v)) { setPlaying(false); setT(v); } }} />
        </label>
        {onShowKundli && <button type="button" className={s.kundliBtn} onClick={() => onShowKundli(t)}>कुंडली</button>}
      </div>
      {info && (
        <p className={s.summary}>
          {info.tithi}, {info.paksha}{day?.maas ? `, ${day.maas}` : ''}<br />
          {info.nak} ({info.pada}), {DAYS[p.wd]}
        </p>
      )}
    </div>
  );
}
