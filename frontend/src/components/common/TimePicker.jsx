import { useState, useEffect, useRef } from 'react';
import s from './TimePicker.module.css';

const R  = 110; // clock radius (SVG units)
const CX = 120; // center x
const CY = 120; // center y
const HR = 78;  // hour number radius
const MR = 78;  // minute number radius

function toXY(angleDeg, r) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

// Show the chosen time in 12h form with AM/PM and part of day, so a birth
// time saved as AM by mistake (e.g. 10:10 instead of 22:10) is easy to spot.
function fmt12(v) {
  const [h, m] = v.split(':').map(Number);
  if (Number.isNaN(h)) return v;
  const h12  = h % 12 === 0 ? 12 : h % 12;
  const part = h < 4 ? 'पहाटे' : h < 12 ? 'सकाळी' : h < 16 ? 'दुपारी' : h < 20 ? 'संध्याकाळी' : 'रात्री';
  return `${String(h12).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'} · ${part}`;
}

export default function TimePicker({ value = '', onChange }) {
  const [open,   setOpen]   = useState(false);
  const [mode,   setMode]   = useState('hour');   // 'hour' | 'minute'
  const [hour,   setHour]   = useState(12);        // 1-12
  const [minute, setMinute] = useState(0);         // 0-59
  const [ampm,   setAmpm]   = useState('AM');

  const clockRef = useRef(null);

  // Parse external value (HH:MM 24h)
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      const isPM   = h >= 12;
      setAmpm(isPM ? 'PM' : 'AM');
      setHour(h === 0 ? 12 : h > 12 ? h - 12 : h);
      setMinute(m || 0);
    }
  }, [value]);

  const displayH  = String(hour).padStart(2, '0');
  const displayM  = String(minute).padStart(2, '0');

  // Hand angles
  const hourAngle   = hour * 30 + minute * 0.5;    // 0° = 12 o'clock
  const minuteAngle = minute * 6;

  const handAngle = mode === 'hour' ? hourAngle : minuteAngle;
  const handEnd   = toXY(handAngle, mode === 'hour' ? 68 : 68);
  const selEnd    = toXY(handAngle, mode === 'hour' ? 68 : 68);

  // Click on SVG clock face
  const handleClockClick = e => {
    const svg  = clockRef.current;
    const rect = svg.getBoundingClientRect();
    const scaleX = 240 / rect.width;
    const scaleY = 240 / rect.height;
    const x = (e.clientX - rect.left) * scaleX - CX;
    const y = (e.clientY - rect.top)  * scaleY - CY;

    let angle = Math.atan2(x, -y) * 180 / Math.PI;
    if (angle < 0) angle += 360;

    if (mode === 'hour') {
      const h = Math.round(angle / 30) || 12;
      setHour(h > 12 ? 12 : h < 1 ? 1 : h);
      setMode('minute');
    } else {
      const m = Math.round(angle / 6) % 60;
      setMinute(m < 0 ? 0 : m);
    }
  };

  const handleOK = () => {
    let h24 = hour;
    if (ampm === 'AM' && hour === 12) h24 = 0;
    if (ampm === 'PM' && hour !== 12) h24 = hour + 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  // Hour labels 1-12
  const hourLabels = Array.from({ length: 12 }, (_, i) => {
    const h   = i + 1;
    const pos = toXY(h * 30, HR);
    const sel = h === hour && mode === 'hour';
    return { h, pos, sel };
  });

  // Minute labels: 0,5,10,...55
  const minuteLabels = Array.from({ length: 12 }, (_, i) => {
    const m   = i * 5;
    const pos = toXY(m * 6, MR);
    const sel = mode === 'minute' && minute >= m - 2 && minute <= m + 2;
    return { m, pos, sel };
  });

  return (
    <div className={s.root}>
      {/* Trigger input */}
      <div className={s.trigger} onClick={() => setOpen(true)}>
        <span className={s.clockIcon}>🕐</span>
        <span className={s.triggerText}>{value ? fmt12(value) : 'वेळ निवडा'}</span>
      </div>

      {/* Overlay */}
      {open && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && handleCancel()}>
          <div className={s.picker}>
            <div className={s.pickerTitle}>वेळ निवडा</div>

            {/* Digital display */}
            <div className={s.digital}>
              <span
                className={`${s.dNum} ${mode === 'hour' ? s.dActive : ''}`}
                onClick={() => setMode('hour')}
              >
                {displayH}
              </span>
              <span className={s.dColon}>:</span>
              <span
                className={`${s.dNum} ${mode === 'minute' ? s.dActive : ''}`}
                onClick={() => setMode('minute')}
              >
                {displayM}
              </span>
              <div className={s.ampmCol}>
                <button type="button" className={`${s.ampmBtn} ${ampm === 'AM' ? s.ampmActive : ''}`} onClick={() => setAmpm('AM')}>AM<br/><small>सकाळ</small></button>
                <button type="button" className={`${s.ampmBtn} ${ampm === 'PM' ? s.ampmActive : ''}`} onClick={() => setAmpm('PM')}>PM<br/><small>दुपार/रात्र</small></button>
              </div>
            </div>

            {/* SVG Clock */}
            <svg
              ref={clockRef}
              viewBox="0 0 240 240"
              className={s.clock}
              onClick={handleClockClick}
            >
              {/* Outer ring */}
              <circle cx={CX} cy={CY} r={R} fill="#2a2a2a" />
              {/* Inner circle */}
              <circle cx={CX} cy={CY} r={R - 20} fill="#3a3a3a" />

              {/* Hour / Minute labels */}
              {mode === 'hour'
                ? hourLabels.map(({ h, pos, sel }) => (
                    <g key={h}>
                      {sel && <circle cx={pos.x} cy={pos.y} r={13} fill="#c8820a" />}
                      <text
                        x={pos.x} y={pos.y}
                        textAnchor="middle" dominantBaseline="central"
                        fill={sel ? '#fff' : '#ddd'}
                        fontSize={sel ? 14 : 13}
                        fontFamily="Noto Serif Devanagari, serif"
                        style={{ userSelect: 'none' }}
                      >
                        {h}
                      </text>
                    </g>
                  ))
                : minuteLabels.map(({ m, pos, sel }) => (
                    <g key={m}>
                      {sel && <circle cx={pos.x} cy={pos.y} r={13} fill="#c8820a" />}
                      <text
                        x={pos.x} y={pos.y}
                        textAnchor="middle" dominantBaseline="central"
                        fill={sel ? '#fff' : '#ddd'}
                        fontSize={13}
                        fontFamily="Noto Serif Devanagari, serif"
                        style={{ userSelect: 'none' }}
                      >
                        {String(m).padStart(2, '0')}
                      </text>
                    </g>
                  ))
              }

              {/* Hand line */}
              <line
                x1={CX} y1={CY}
                x2={handEnd.x} y2={handEnd.y}
                stroke="#f59e0b" strokeWidth={2} strokeLinecap="round"
              />
              {/* Hand end circle */}
              <circle cx={selEnd.x} cy={selEnd.y} r={12} fill="#f59e0b" />
              {/* Center dot */}
              <circle cx={CX} cy={CY} r={5} fill="#f59e0b" />
            </svg>

            {/* Footer buttons */}
            <div className={s.footer}>
              <button type="button" className={s.cancelBtn} onClick={handleCancel}>रद्द करा</button>
              <button type="button" className={s.okBtn}     onClick={handleOK}>ओके</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
