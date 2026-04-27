// components/common/ClockTimePicker.jsx — SVG clock-dial time picker
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

function polarXY(angleDeg, r) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function angleOf(svgEl, e) {
  const rect  = svgEl.getBoundingClientRect();
  const touch = e.touches?.[0] ?? e;
  const x     = (touch.clientX - rect.left)  * (SIZE / rect.width)  - CX;
  const y     = (touch.clientY - rect.top)   * (SIZE / rect.height) - CY;
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

  // ── Confirm ───────────────────────────────────────────────
  const handleOk = () => {
    onChange(build24(hour, minute, ampm));
    onClose();
  };

  // ── Clock geometry ────────────────────────────────────────
  const hourAngle   = ((hour % 12) / 12) * 360;
  const minuteAngle = (minute / 60) * 360;
  const handAngle   = mode === 'hour' ? hourAngle : minuteAngle;
  const handEnd     = polarXY(handAngle, NUM_R);
  const selPos      = polarXY(handAngle, NUM_R);

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className={styles.overlay}
      onMouseDown={e => e.target === e.currentTarget && onClose()}
      onTouchStart={e => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.picker}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div className={styles.timeDisplay}>
            <button
              className={`${styles.timeUnit} ${mode === 'hour' ? styles.unitActive : ''}`}
              onClick={() => setMode('hour')}
              title="तास बदला"
            >
              {String(hour).padStart(2, '0')}
            </button>
            <span className={styles.colon}>:</span>
            <button
              className={`${styles.timeUnit} ${mode === 'minute' ? styles.unitActive : ''}`}
              onClick={() => setMode('minute')}
              title="मिनिटे बदला"
            >
              {String(minute).padStart(2, '0')}
            </button>
          </div>

          <div className={styles.ampmGroup}>
            <button
              className={`${styles.ampmBtn} ${ampm === 'AM' ? styles.ampmActive : ''}`}
              onClick={() => setAmpm('AM')}
            >AM</button>
            <button
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

        {/* ── SVG Dial ── */}
        <svg
          ref={svgRef}
          className={styles.dial}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        >
          {/* Outer shadow ring */}
          <circle cx={CX} cy={CY} r={FACE_R + 4} className={styles.faceRing} />

          {/* Clock face */}
          <circle cx={CX} cy={CY} r={FACE_R} className={styles.face} />

          {/* Tick marks */}
          {Array.from({ length: 60 }, (_, i) => {
            const a    = i * 6;
            const isMa = i % 5 === 0;
            const p1   = polarXY(a, TICK_OUT);
            const p2   = polarXY(a, isMa ? TICK_MAJ : TICK_MIN);
            return (
              <line
                key={i}
                x1={p1.x} y1={p1.y}
                x2={p2.x} y2={p2.y}
                className={isMa ? styles.tickMaj : styles.tickMin}
              />
            );
          })}

          {/* Hand track line (dim, full length) */}
          <line
            x1={CX} y1={CY}
            x2={polarXY(handAngle, FACE_R - 8).x}
            y2={polarXY(handAngle, FACE_R - 8).y}
            className={styles.handTrack}
          />

          {/* Active hand */}
          <line
            x1={CX} y1={CY}
            x2={handEnd.x} y2={handEnd.y}
            className={styles.hand}
          />

          {/* Selected number background glow */}
          <circle cx={selPos.x} cy={selPos.y} r={22} className={styles.selGlow} />
          <circle cx={selPos.x} cy={selPos.y} r={17} className={styles.selBg} />

          {/* Hand tip */}
          <circle cx={handEnd.x} cy={handEnd.y} r={13} className={styles.handTip} />

          {/* Center pivot */}
          <circle cx={CX} cy={CY} r={5} className={styles.pivot} />

          {/* Hour numbers */}
          {mode === 'hour' && HOUR_NUMS.map((h, i) => {
            const pos = polarXY(i * 30, NUM_R);
            return (
              <text
                key={h}
                x={pos.x} y={pos.y}
                className={`${styles.num} ${h === hour ? styles.numSel : ''}`}
                dominantBaseline="central"
                textAnchor="middle"
              >{h}</text>
            );
          })}

          {/* Minute numbers */}
          {mode === 'minute' && MIN_NUMS.map((label, i) => {
            const pos   = polarXY(i * 30, NUM_R);
            const mVal  = i * 5;
            const isSel = minute >= mVal && minute < mVal + 5;
            return (
              <text
                key={label}
                x={pos.x} y={pos.y}
                className={`${styles.num} ${isSel ? styles.numSel : ''}`}
                dominantBaseline="central"
                textAnchor="middle"
              >{label}</text>
            );
          })}

          {/* Dragging ripple on hand tip */}
          {dragging && (
            <circle cx={handEnd.x} cy={handEnd.y} r={22} className={styles.ripple} />
          )}
        </svg>

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
