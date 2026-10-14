// src/components/panchang/DishaYantra3D.jsx — दिशा यंत्र (compass), CSS-3D like the Rashi Chakra
//
// Heading comes from the phone's compass: `webkitCompassHeading` on iPhone (after the user
// allows motion access) or an absolute `deviceorientation` event on Android. A relative
// orientation is never used as a heading. Without a compass the dial can be turned by hand
// and lined up with the Sun, whose azimuth is computed here (NOAA solar position).
// The dial turns so the direction the user faces is at the top.
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import s from './DishaYantra3D.module.css';

// azimuth (clockwise from north), name, guardian deity (दिक्पाल)
const DIRS = [
  { az: 0,   mr: 'उत्तर',   dik: 'कुबेर', main: true },
  { az: 45,  mr: 'ईशान्य',  dik: 'ईशान' },
  { az: 90,  mr: 'पूर्व',    dik: 'इंद्र', main: true },
  { az: 135, mr: 'आग्नेय',  dik: 'अग्नी' },
  { az: 180, mr: 'दक्षिण',  dik: 'यम', main: true },
  { az: 225, mr: 'नैऋत्य',  dik: 'निऋती' },
  { az: 270, mr: 'पश्चिम',  dik: 'वरुण', main: true },
  { az: 315, mr: 'वायव्य',  dik: 'वायू' },
];
// दिशाशूल by weekday (Sun..Sat): सोम-शनि पूर्व, मंगळ-बुध उत्तर, गुरु दक्षिण, रवि-शुक्र पश्चिम
const SHOOL = [270, 90, 0, 0, 180, 270, 90];
const DAYS = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];

const C = 300, R_BEZEL = 292, R_TICK = 262, R_LABEL = 214;
const norm = (a) => ((a % 360) + 360) % 360;
const wrap = (a) => ((a + 540) % 360) - 180;
const at = (az, r) => [C + r * Math.sin((az * Math.PI) / 180), C - r * Math.cos((az * Math.PI) / 180)];
const dirOf = (az) => DIRS[Math.round(norm(az) / 45) % 8];

// Sun azimuth/elevation (degrees) — NOAA solar position, good to a fraction of a degree
function sunPosition(date, lat, lon) {
  const rad = Math.PI / 180;
  const jd = date.getTime() / 86400000 + 2440587.5, T = (jd - 2451545) / 36525;
  const L0 = norm(280.46646 + T * (36000.76983 + T * 0.0003032));
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T), e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const Cc = Math.sin(M * rad) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * rad) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * rad) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + Cc - 0.00569 - 0.00478 * Math.sin(om * rad);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * rad);
  const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lam * rad));
  const y = Math.tan((eps / 2) * rad) ** 2;
  const eqt = 4 / rad * (y * Math.sin(2 * L0 * rad) - 2 * e * Math.sin(M * rad) + 4 * e * y * Math.sin(M * rad) * Math.cos(2 * L0 * rad) - 0.5 * y * y * Math.sin(4 * L0 * rad) - 1.25 * e * e * Math.sin(2 * M * rad));
  const minutes = (date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60);
  const ha = ((minutes + eqt + 4 * lon) / 4 - 180) * rad;
  const phi = lat * rad;
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) / rad + 180;
  return { az: norm(az), el: el / rad };
}

const Dial = memo(function Dial({ shoolAz }) {
  const ticks = Array.from({ length: 360 }, (_, d) => {
    const len = d % 30 === 0 ? 16 : d % 10 === 0 ? 11 : d % 5 === 0 ? 7 : 4;
    const [x1, y1] = at(d, R_TICK), [x2, y2] = at(d, R_TICK - len);
    return `M${x1.toFixed(1)},${y1.toFixed(1)}L${x2.toFixed(1)},${y2.toFixed(1)}`;
  }).join('');
  const wedge = (az, r) => {
    const [x1, y1] = at(az - 22.5, r), [x2, y2] = at(az + 22.5, r);
    return `M${C},${C} L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z`;
  };
  return (
    <svg viewBox="0 0 600 600" className={s.layer} aria-hidden="true">
      <defs>
        <radialGradient id="dy-face" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#3d2712" /><stop offset="72%" stopColor="#21150a" /><stop offset="100%" stopColor="#140c06" />
        </radialGradient>
        <linearGradient id="dy-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6d58a" /><stop offset="45%" stopColor="#b8862f" /><stop offset="100%" stopColor="#6f4b16" />
        </linearGradient>
      </defs>
      <circle cx={C} cy={C} r={R_BEZEL + 6} fill="url(#dy-gold)" />
      <circle cx={C} cy={C} r={R_BEZEL} fill="url(#dy-face)" />
      <circle cx={C} cy={C} r={R_TICK + 6} fill="none" stroke="rgba(232,196,122,0.35)" strokeWidth="1" />
      <path d={wedge(shoolAz, R_TICK - 18)} className={s.shool} />
      <path d={ticks} className={s.ticks} />
      {Array.from({ length: 12 }, (_, i) => {
        const d = i * 30; const [x, y] = at(d, R_TICK + 18);
        // numbers on the lower half are turned so they never read upside down
        return <text key={d} x={x} y={y} className={s.deg} transform={`rotate(${d > 90 && d < 270 ? d + 180 : d}, ${x}, ${y})`}>{d}</text>;
      })}
      <circle cx={C} cy={C} r={R_LABEL - 34} fill="none" stroke="rgba(232,196,122,0.18)" strokeWidth="1" strokeDasharray="2 5" />
    </svg>
  );
});

// eight-point rose: long cardinal points, short intercardinal ones; north tip in red
const Rose = memo(function Rose() {
  const point = (az, long, i) => {
    const L = long ? 190 : 118, W = long ? 20 : 13;
    const [tx, ty] = at(az, L), [lx, ly] = at(az - 90, W), [rx, ry] = at(az + 90, W);
    const north = az === 0;
    return (
      <g key={i}>
        <path d={`M${C},${C} L${lx},${ly} L${tx},${ty} Z`} className={north ? s.roseNorthA : s.roseA} />
        <path d={`M${C},${C} L${tx},${ty} L${rx},${ry} Z`} className={north ? s.roseNorthB : s.roseB} />
      </g>
    );
  };
  return (
    <svg viewBox="0 0 600 600" className={s.layer} aria-hidden="true">
      {[45, 135, 225, 315].map((a, i) => point(a, false, i))}
      {[0, 90, 180, 270].map((a, i) => point(a, true, i + 4))}
    </svg>
  );
});

// heading the back of the phone faces, from alpha/beta/gamma (W3C DeviceOrientation spec example)
function cameraHeading(alpha, beta, gamma) {
  const r = Math.PI / 180, x = beta * r, y = gamma * r, z = alpha * r;
  const cX = Math.cos(x), cY = Math.cos(y), cZ = Math.cos(z), sX = Math.sin(x), sY = Math.sin(y), sZ = Math.sin(z);
  const vx = -cZ * sY - sZ * sX * cY, vy = -sZ * sY + cZ * sX * cY;
  let h = Math.atan(vx / vy);
  if (vy < 0) h += Math.PI; else if (vx < 0) h += 2 * Math.PI;
  return (h * 180) / Math.PI;
}

export default function DishaYantra3D({ lat = 18.5204, lon = 73.8567, place }) {
  const [mode, setMode]       = useState('idle');   // idle | sensor | manual
  const [shown, setShown]     = useState(0);        // heading shown in text (updated ~5×/s)
  const [now, setNow]         = useState(() => new Date());
  const target = useRef(0), current = useRef(0), gotAbsolute = useRef(false);
  const wheelRef = useRef(null), stageRef = useRef(null);

  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);

  const ist = new Date(now.getTime() + 330 * 60000);
  const wd = ist.getUTCDay();
  const shoolAz = SHOOL[wd];
  const sun = useMemo(() => sunPosition(now, lat, lon), [now, lat, lon]);

  // smooth the needle towards the target heading; write straight to CSS (no re-render per frame)
  useEffect(() => {
    let raf = 0, lastShown = 0;
    const tick = (ts) => {
      current.current = norm(current.current + wrap(target.current - current.current) * 0.18);
      wheelRef.current?.style.setProperty('--rot', `${-current.current}deg`);
      if (ts - lastShown > 200) { lastShown = ts; setShown(Math.round(current.current) % 360); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // compass events — any browser that gives an Earth-referenced reading is used:
  // iPhone: webkitCompassHeading; Android Chrome: deviceorientationabsolute; Firefox &
  // others: deviceorientation with absolute = true. Relative-only readings are ignored.
  const onOrient = useCallback((e) => {
    let h = null;
    const screenAngle = (window.screen?.orientation?.angle ?? window.orientation ?? 0) || 0;
    if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
      h = e.webkitCompassHeading + screenAngle;                                   // iPhone
    } else if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha != null) {
      h = Math.abs(e.beta ?? 0) < 50
        ? 360 - e.alpha + screenAngle                                             // lying flat: where the top points
        : cameraHeading(e.alpha, e.beta, e.gamma ?? 0);                           // held upright: where the back faces
    }
    if (h == null || !Number.isFinite(h)) return;
    if (!gotAbsolute.current) { gotAbsolute.current = true; setMode('sensor'); }   // sensor answered
    target.current = norm(h);
  }, []);

  // Always on: listen from the start and switch to the live heading as soon as the sensor
  // answers. Without a compass (desktop) the dial simply stays hand-turnable — no prompts.
  const listen = useCallback(() => {
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
  }, [onOrient]);
  const askPermission = async () => {
    try { await window.DeviceOrientationEvent.requestPermission(); } catch { /* not allowed here */ }
  };
  useEffect(() => () => {
    window.removeEventListener('deviceorientationabsolute', onOrient, true);
    window.removeEventListener('deviceorientation', onOrient, true);
  }, [onOrient]);

  // Compass on by default: listen straight away (Android needs no prompt). Where the browser
  // asks for permission (iPhone Safari), the prompt can only come from a tap, so the first tap
  // anywhere asks. Without a sensor (laptop) the dial stays hand-turnable.
  useEffect(() => {
    listen();
    const noSensor = setTimeout(() => { if (!gotAbsolute.current) setMode('manual'); }, 2500);
    let cleanup = () => {};
    if (typeof window.DeviceOrientationEvent?.requestPermission === 'function') {
      const once = () => { cleanup(); askPermission(); };
      cleanup = () => { window.removeEventListener('touchend', once); window.removeEventListener('click', once); };
      window.addEventListener('touchend', once, { once: true });
      window.addEventListener('click', once, { once: true });
    }
    return () => { clearTimeout(noSensor); cleanup(); };
  }, [listen]);

  // drag: sideways turns the dial (only without a compass); with a mouse, up/down tilts the view.
  // On touch the browser keeps vertical swipes (touch-action: pan-y) so the page scrolls.
  useEffect(() => {
    const stage = stageRef.current; if (!stage) return;
    let drag = null, tilt = 18;
    const down = (e) => { drag = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' }; stage.classList.add(s.dragging); };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag = { ...drag, x: e.clientX, y: e.clientY };
      if (drag.mouse) {
        tilt = Math.max(0, Math.min(45, tilt + dy * 0.25));
        wheelRef.current?.style.setProperty('--tilt', `${tilt}deg`);
      }
      if (mode !== 'sensor') target.current = norm(target.current - dx * 0.5);
    };
    const up = () => { drag = null; stage.classList.remove(s.dragging); };
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
  }, [mode]);

  const facing = dirOf(shown);
  const [sx, sy] = at(sun.az, R_TICK - 34);
  const [shx, shy] = at(shoolAz, R_LABEL - 62);

  return (
    <div className={s.root}>
      <div className={s.pointer} aria-live="polite">
        <span className={s.caret}>▲</span>
        <strong>{facing.mr}</strong>
        <span className={s.headingDeg}>{shown}°</span>
      </div>

      <div className={s.stage} ref={stageRef}>
        <div className={s.shadow} />
        <div className={s.wheel} ref={wheelRef}>
          <div className={`${s.plate} ${s.z0}`}><Dial shoolAz={shoolAz} /></div>
          <div className={`${s.plate} ${s.z1}`}><Rose /></div>
          <svg viewBox="0 0 600 600" className={`${s.layer} ${s.z2}`} aria-label="दिशा">
            {DIRS.map(d => {
              const [x, y] = at(d.az, d.main ? R_LABEL : R_LABEL - 8);
              return (
                <g key={d.az} className={s.upright} style={{ transformOrigin: `${x}px ${y}px` }}>
                  <text x={x} y={y} className={d.main ? s.mainDir : s.subDir}>{d.mr}</text>
                  <text x={x} y={y + (d.main ? 22 : 18)} className={s.dik}>{d.dik}</text>
                </g>
              );
            })}
            <g className={s.upright} style={{ transformOrigin: `${shx}px ${shy}px` }}>
              <text x={shx} y={shy} className={s.shoolText}>दिशाशूल</text>
            </g>
            <g className={`${s.upright} ${sun.el < -0.8 ? s.sunDown : ''}`} style={{ transformOrigin: `${sx}px ${sy}px` }}>
              <circle cx={sx} cy={sy} r="13" className={s.sunDisc} />
              <text x={sx} y={sy + 1} className={s.sunGlyph}>☀</text>
            </g>
          </svg>
          <div className={`${s.hub} ${s.z3}`}><span /></div>
        </div>
      </div>

      <div className={s.controls}>
        <button type="button" className={s.reset} onClick={() => { target.current = 0; wheelRef.current?.style.setProperty('--tilt', '18deg'); }}
          title="उत्तर वर">उत्तर ↑</button>
      </div>

      <dl className={s.facts}>
        <dt>आत्ता तोंड</dt>
        <dd>{facing.mr} ({shown}°) · दिक्पाल {facing.dik}{mode === 'manual' ? ' · (हाताने ठरवलेली दिशा)' : ''}</dd>
        <dt>आजची दिशाशूल</dt>
        <dd className={s.shoolRow}>{DAYS[wd]}: {dirOf(shoolAz).mr} — या दिशेला प्रवासाची सुरुवात टाळावी.</dd>
        <dt>पूजेसाठी</dt>
        <dd>पूजा करताना पूर्व किंवा उत्तरेकडे तोंड; देवघर ईशान्य कोपऱ्यात.</dd>
        <dt>सूर्य</dt>
        <dd>{sun.el > -0.8
          ? `${dirOf(sun.az).mr} दिशेला, ${Math.round(sun.az)}° (क्षितिजापासून ${Math.round(sun.el)}° वर) — compass तपासण्यासाठी ☀ खूण सूर्याकडे जुळवा.`
          : 'सूर्य सध्या क्षितिजाखाली आहे.'}{place ? ` · ${place}` : ''}</dd>
      </dl>
    </div>
  );
}
