// components/common/ClockTimePicker.jsx — 3D watch-face time picker
//
// A gold-bezelled watch under a glass dome: recessed dial, raised numerals, both hands
// casting shadows (the one being set glows), a jewel pivot. Hours and minutes sit on
// flip-clock tiles that flip when the value changes; AM/PM is a raised two-key switch.
// The dial itself stays flat to the screen so a drag maps exactly to the time.
import { useState, useRef, useCallback, useEffect } from 'react';
import styles from '../../styles/ClockTimePicker.module.css';

// ── Geometry ──────────────────────────────────────────────────
const SIZE      = 280;
const CX        = SIZE / 2;   // 140
const CY        = SIZE / 2;   // 140
const FACE_R    = 118;
const NUM_R     = 86;
const TICK_OUT  = 112;
const TICK_MIN  = 106;
const TICK_MAJ  = 98;
const PAD       = 14;         // room for the bezel around the 280-unit dial
const VB        = SIZE + PAD * 2;

function polarXY(angleDeg, r) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function angleOf(svgEl, e) {
  const rect  = svgEl.getBoundingClientRect();
  const touch = e.touches?.[0] ?? e;
  const x     = (touch.clientX - rect.left)  * (VB / rect.width)  - PAD - CX;
  const y     = (touch.clientY - rect.top)   * (VB / rect.height) - PAD - CY;
  let a = Math.atan2(y, x) * 180 / Math.PI + 90;
  if (a < 0) a += 360;
  return a;
}

// ── Parse / format helpers ────────────────────────────────────
function parse24(v = '12:00') {
  const [hh, mm] = v.split(':').map(Number);
  return { h24: hh, m: mm, ampm: hh >= 12 ? 'PM' : 'AM', h12: hh % 12 || 12 };
}

function build24(h12, m, ampm) {
  const h24 = ampm === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12);
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ── Label arrays ──────────────────────────────────────────────
const HOUR_NUMS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MIN_NUMS  = ['00','05','10','15','20','25','30','35','40','45','50','55'];

// a hand as a tapered blade from the centre to (r, angle)
function blade(angle, r, w) {
  const tip = polarXY(angle, r), tail = polarXY(angle + 180, 14);
  const l = polarXY(angle - 90, w), rr = polarXY(angle + 90, w);
  const dx = l.x - CX, dy = l.y - CY, ex = rr.x - CX, ey = rr.y - CY;
  return `M${tail.x + dx * 0.6},${tail.y + dy * 0.6} L${CX + dx},${CY + dy} L${tip.x},${tip.y} L${CX + ex},${CY + ey} L${tail.x + ex * 0.6},${tail.y + ey * 0.6} Z`;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ClockTimePicker({ value, onChange, onClose }) {
  const init = parse24(value);
  const [mode,    setMode]    = useState('hour');
  const [hour,    setHour]    = useState(init.h12);
  const [minute,  setMinute]  = useState(init.m);
  const [ampm,    setAmpm]    = useState(init.ampm);
  const [dragging,setDragging]= useState(false);

  const svgRef   = useRef(null);
  const modeRef  = useRef(mode);
  modeRef.current = mode;

  // ── Snap helpers ──────────────────────────────────────────
  const snapHour   = a => Math.round(a / 30) % 12 || 12;
  const snapMinute = a => Math.round(a / 6)  % 60;

  const applyAngle = useCallback((e) => {
    const a = angleOf(svgRef.current, e);
    if (modeRef.current === 'hour')   setHour(snapHour(a));
    else                              setMinute(snapMinute(a));
  }, []);

  // ── Pointer events ────────────────────────────────────────
  const onPointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    applyAngle(e);
  };

  // Global move / up so drag continues outside the SVG
  useEffect(() => {
    if (!dragging) return;
    const move = (e) => { e.preventDefault(); applyAngle(e); };
    const up   = ()  => {
      setDragging(false);
      if (modeRef.current === 'hour') {
        // auto-advance to minute after a short visual pause
        setTimeout(() => setMode('minute'), 180);
      }
    };
    document.addEventListener('mousemove', move, { passive: false });
    document.addEventListener('mouseup',   up);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend',  up);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup',   up);
      document.removeEventListener('touchmove', move);
      document.removeEventListener('touchend',  up);
    };
  }, [dragging, applyAngle]);

  // Esc closes, Enter confirms
  useEffect(() => {
    const key = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [onClose]);

  // ── Confirm ───────────────────────────────────────────────
  const handleOk = () => {
    onChange(build24(hour, minute, ampm));
    onClose();
  };

  // ── Clock geometry ────────────────────────────────────────
  const hourAngle   = ((hour % 12) / 12) * 360 + (minute / 60) * 30;   // the hour hand creeps with the minutes
  const minuteAngle = (minute / 60) * 360;
  const selAngle    = mode === 'hour' ? ((hour % 12) / 12) * 360 : minuteAngle;
  const selPos      = polarXY(selAngle, NUM_R);
  const hh = String(hour).padStart(2, '0'), mm = String(minute).padStart(2, '0');

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className={styles.overlay}
      onMouseDown={e => e.target === e.currentTarget && onClose()}
      onTouchStart={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.picker} role="dialog" aria-label="वेळ निवडा">

        {/* ── Header: flip-clock tiles + AM/PM switch ── */}
        <div className={styles.header}>
          <div className={styles.timeDisplay}>
            <button
              className={`${styles.timeUnit} ${mode === 'hour' ? styles.unitActive : ''}`}
              onClick={() => setMode('hour')}
              title="तास बदला" aria-label={`तास ${hh}`}
            >
              <span key={hh} className={styles.flip}>{hh}</span>
            </button>
            <span className={styles.colon}><i /><i /></span>
            <button
              className={`${styles.timeUnit} ${mode === 'minute' ? styles.unitActive : ''}`}
              onClick={() => setMode('minute')}
              title="मिनिटे बदला" aria-label={`मिनिटे ${mm}`}
            >
              <span key={mm} className={styles.flip}>{mm}</span>
            </button>
          </div>

          <div className={styles.ampmGroup} role="radiogroup" aria-label="AM / PM">
            <button role="radio" aria-checked={ampm === 'AM'}
              className={`${styles.ampmBtn} ${ampm === 'AM' ? styles.ampmActive : ''}`}
              onClick={() => setAmpm('AM')}
            >AM</button>
            <button role="radio" aria-checked={ampm === 'PM'}
              className={`${styles.ampmBtn} ${ampm === 'PM' ? styles.ampmActive : ''}`}
              onClick={() => setAmpm('PM')}
            >PM</button>
          </div>
        </div>

        {/* ── Step label ── */}
        <div className={styles.stepLabel}>
          <span className={`${styles.stepDot} ${mode === 'hour' ? styles.stepDotActive : ''}`} />
          <span className={mode === 'hour' ? styles.stepTextActive : styles.stepText}>तास</span>
          <span className={styles.stepArrow}>→</span>
          <span className={`${styles.stepDot} ${mode === 'minute' ? styles.stepDotActive : ''}`} />
          <span className={mode === 'minute' ? styles.stepTextActive : styles.stepText}>मिनिटे</span>
        </div>

        {/* ── 3D watch dial ── */}
        <div className={styles.watch}>
          <svg
            ref={svgRef}
            className={styles.dial}
            viewBox={`${-PAD} ${-PAD} ${VB} ${VB}`}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
          >
            <defs>
              <linearGradient id="ctp-bezel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fff1c9" /><stop offset="22%" stopColor="#e2bf72" />
                <stop offset="48%" stopColor="#8a6424" /><stop offset="72%" stopColor="#f2d58e" />
                <stop offset="100%" stopColor="#6f4b16" />
              </linearGradient>
              <linearGradient id="ctp-bezel-in" x1="1" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#fff1c9" /><stop offset="50%" stopColor="#a8843e" /><stop offset="100%" stopColor="#5a3a10" />
              </linearGradient>
              <radialGradient id="ctp-face" cx="42%" cy="36%" r="70%">
                <stop offset="0%" stopColor="#4a2a12" /><stop offset="60%" stopColor="#2a1607" /><stop offset="100%" stopColor="#140a03" />
              </radialGradient>
              <radialGradient id="ctp-glass" cx="35%" cy="25%" r="65%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.22" /><stop offset="45%" stopColor="#fff" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="ctp-ball" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffd9a0" /><stop offset="45%" stopColor="#e07000" /><stop offset="100%" stopColor="#7a2e00" />
              </radialGradient>
              <radialGradient id="ctp-jewel" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffd0d0" /><stop offset="50%" stopColor="#c0392b" /><stop offset="100%" stopColor="#5a0e08" />
              </radialGradient>
              <linearGradient id="ctp-hand-on" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#b84a00" /><stop offset="50%" stopColor="#ffb347" /><stop offset="100%" stopColor="#b84a00" />
              </linearGradient>
              <linearGradient id="ctp-hand-off" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a8936a" /><stop offset="50%" stopColor="#f3e6c8" /><stop offset="100%" stopColor="#a8936a" />
              </linearGradient>
              <filter id="ctp-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
              <filter id="ctp-inset" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5" /></filter>
              <clipPath id="ctp-clip"><circle cx={CX} cy={CY} r={FACE_R + 1} /></clipPath>
            </defs>

            {/* bezel: polished outer ring, cut inner step */}
            <circle cx={CX} cy={CY} r={FACE_R + 13} fill="url(#ctp-bezel)" />
            <circle cx={CX} cy={CY} r={FACE_R + 6} fill="url(#ctp-bezel-in)" />
            {/* recessed dial with an inner shadow along the top edge */}
            <circle cx={CX} cy={CY} r={FACE_R + 1} className={styles.face} fill="url(#ctp-face)" />
            <circle cx={CX} cy={CY + 3} r={FACE_R - 2} fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="8" filter="url(#ctp-inset)" clipPath="url(#ctp-clip)" />

            {/* Tick marks */}
            {Array.from({ length: 60 }, (_, i) => {
              const a    = i * 6;
              const isMa = i % 5 === 0;
              const p1   = polarXY(a, TICK_OUT);
              const p2   = polarXY(a, isMa ? TICK_MAJ : TICK_MIN);
              return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={isMa ? styles.tickMaj : styles.tickMin} />;
            })}

            {/* selected numeral: a raised orange ball */}
            <circle cx={selPos.x + 2} cy={selPos.y + 4} r={18} fill="#000" opacity="0.45" filter="url(#ctp-shadow)" />
            <circle cx={selPos.x} cy={selPos.y} r={18} fill="url(#ctp-ball)" className={styles.selBall} />

            {/* numerals (embossed) */}
            {(mode === 'hour' ? HOUR_NUMS : MIN_NUMS).map((label, i) => {
              const pos = polarXY(i * 30, NUM_R);
              const sel = mode === 'hour' ? label === hour : (minute >= i * 5 && minute < i * 5 + 5);
              return (
                <text key={label} x={pos.x} y={pos.y} dominantBaseline="central" textAnchor="middle"
                  className={`${styles.num} ${sel ? styles.numSel : ''}`}>{label}</text>
              );
            })}

            {/* hands: shadows first, then the blades; the one being set is lit */}
            <path d={blade(hourAngle, 58, 5)} transform="translate(3 5)" fill="#000" opacity="0.5" filter="url(#ctp-shadow)" />
            <path d={blade(minuteAngle, 92, 3.6)} transform="translate(4 6)" fill="#000" opacity="0.5" filter="url(#ctp-shadow)" />
            <path d={blade(hourAngle, 58, 5)} fill={mode === 'hour' ? 'url(#ctp-hand-on)' : 'url(#ctp-hand-off)'} className={styles.handPath} />
            <path d={blade(minuteAngle, 92, 3.6)} fill={mode === 'minute' ? 'url(#ctp-hand-on)' : 'url(#ctp-hand-off)'} className={styles.handPath} />

            {/* jewel pivot */}
            <circle cx={CX} cy={CY} r={8} fill="url(#ctp-bezel)" />
            <circle cx={CX} cy={CY} r={4.5} fill="url(#ctp-jewel)" />

            {/* Dragging ripple on the selected ball */}
            {dragging && <circle cx={selPos.x} cy={selPos.y} r={22} className={styles.ripple} />}

            {/* glass dome: soft highlight and a curved reflection */}
            <circle cx={CX} cy={CY} r={FACE_R + 1} fill="url(#ctp-glass)" pointerEvents="none" />
            <path d={`M ${CX - 82} ${CY - 54} A ${FACE_R - 14} ${FACE_R - 14} 0 0 1 ${CX + 30} ${CY - 100}`}
              fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="6" strokeLinecap="round" pointerEvents="none" />
          </svg>
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>रद्द करा</button>
          <button className={styles.okBtn} onClick={handleOk}>
            <span>✓</span> ठीक आहे
          </button>
        </div>
      </div>
    </div>
  );
}
