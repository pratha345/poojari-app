// src/components/panchang/ViewToolbar.jsx — camera controls under a CSS-3D yantra
import { useEffect, useRef, useState } from 'react';
import s from './ViewToolbar.module.css';

const MODES = [['top', 'वरून', 'वरून दृश्य — संपूर्ण चक्र सपाट'], ['3d', '3D', '3D दृश्य — मुक्तपणे फिरवा'], ['front', 'समोरून', 'समोरून दृश्य — थरांची खोली']];
const MODE_NAME = { top: 'वरून', '3d': '3D', front: 'समोरून' };
const OPEN_KEY = 'yantra_nav_open';
const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;

/** A tap is one step; holding repeats smoothly until released. */
function HoldBtn({ label, onStep, onHold, onDone, children, className = '' }) {
  const timer = useRef(0), raf = useRef(0), held = useRef(false);
  const stop = () => {
    clearTimeout(timer.current); cancelAnimationFrame(raf.current);
    if (held.current) { held.current = false; onDone(); }
  };
  useEffect(() => () => { clearTimeout(timer.current); cancelAnimationFrame(raf.current); }, []);
  return (
    <button type="button" className={`${s.btn} ${className}`} aria-label={label} title={label}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        onStep();
        timer.current = setTimeout(() => {
          held.current = true;
          const loop = () => { onHold(); raf.current = requestAnimationFrame(loop); };
          loop();
        }, 380);
      }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onClick={(e) => { if (e.detail === 0) onStep(); }}                 /* keyboard Enter / Space */
    >{children}</button>
  );
}

export default function ViewToolbar({ cam }) {
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(OPEN_KEY) !== '0'; } catch { return true; } });
  const toggle = () => setOpen(o => { try { localStorage.setItem(OPEN_KEY, o ? '0' : '1'); } catch { /* private mode */ } return !o; });
  const H = (kind, dir) => ({ onStep: () => cam.step(kind, dir), onHold: () => cam.hold(kind, dir), onDone: cam.settle });

  return (
    <div className={s.bar} role="toolbar" aria-label="दृश्य नियंत्रणे">
      <div className={s.top}>
        <div className={s.modes} role="group" aria-label="दृश्य निवडा">
          {MODES.map(([k, label, tip]) => (
            <button key={k} type="button" className={`${s.mode} ${cam.hud.mode === k ? s.modeOn : ''}`}
              aria-pressed={cam.hud.mode === k} title={tip} onClick={() => cam.setView(k)}>{label}</button>
          ))}
        </div>
        <span className={s.hud} aria-live="polite">{MODE_NAME[cam.hud.mode]} · {cam.hud.zoom}%</span>
        <button type="button" className={s.toggle} onClick={toggle} aria-expanded={open}
          title={open ? 'नियंत्रणे लपवा' : 'नियंत्रणे दाखवा'}>{open ? 'लपवा ▴' : 'नियंत्रणे ▾'}</button>
      </div>

      {open && (
        <div className={s.pad}>
          <div className={s.dpad}>
            <HoldBtn label="वर सरकवा" className={s.up} {...H('y', -1)}>▲</HoldBtn>
            <HoldBtn label="डावीकडे सरकवा" className={s.left} {...H('x', -1)}>◀</HoldBtn>
            <button type="button" className={`${s.btn} ${s.home}`} onClick={cam.reset} aria-label="मूळ दृश्य" title="मूळ दृश्य (0)">⌂</button>
            <HoldBtn label="उजवीकडे सरकवा" className={s.right} {...H('x', 1)}>▶</HoldBtn>
            <HoldBtn label="खाली सरकवा" className={s.down} {...H('y', 1)}>▼</HoldBtn>
          </div>
          <div className={s.grid}>
            <HoldBtn label="झूम इन" {...H('zoom', 1)}>＋</HoldBtn>
            <HoldBtn label="डावीकडे फिरवा" {...H('rot', -1)}>⟲</HoldBtn>
            <HoldBtn label="झूम आउट" {...H('zoom', -1)}>－</HoldBtn>
            <HoldBtn label="उजवीकडे फिरवा" {...H('rot', 1)}>⟳</HoldBtn>
          </div>
          <button type="button" className={`${s.btn} ${s.full}`} onClick={cam.toggleFull}
            aria-label={cam.full ? 'पूर्ण स्क्रीन बंद' : 'पूर्ण स्क्रीन'} title={cam.full ? 'पूर्ण स्क्रीन बंद (Esc)' : 'पूर्ण स्क्रीन'}>
            {cam.full ? '✕' : '⛶'}
          </button>
        </div>
      )}
      {open && (
        <p className={s.hint}>
          {coarse ? 'एक बोट: फिरवा/झुकवा · दोन बोटे: झूम व सरकवा · दोनदा टॅप: झूम'
                  : 'ओढा: फिरवा/झुकवा · Shift/उजवे बटण + ओढा: सरकवा · Ctrl + स्क्रोल: झूम · दोनदा क्लिक: झूम'}
        </p>
      )}
    </div>
  );
}
