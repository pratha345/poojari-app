// src/components/panchang/Tamrapatra.jsx — the sankalp engraved on a 3D copper plate (CSS 3D only)
//
// A copper plate with real edge thickness (stacked layers), a ring and seal through the top,
// engraved text and gold-inlaid values. It leans toward the mouse on desktop and follows the
// phone's tilt on Android; a light reflection moves with it. It only moves when you do: once
// still, the browser redraws the text at full resolution (a plate that never stops moving is
// kept as a soft, low-resolution picture).
// Touch scrolling over the plate is left alone (no drag), so a long sankalp still scrolls.
import { useEffect, useRef } from 'react';
import s from './Tamrapatra.module.css';

const REST_X = 4, REST_Y = -3;              // resting lean (deg) — small, so the text stays crisp
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const EDGES = [1, 2, 3, 4, 5, 6, 7];

export default function Tamrapatra({ parts, title, footer, children }) {
  const sceneRef = useRef(null), plateRef = useRef(null);

  useEffect(() => {
    const scene = sceneRef.current, plate = plateRef.current; if (!scene || !plate) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia?.('(pointer: fine)').matches;
    const cur = { x: REST_X, y: REST_Y }, tgt = { x: REST_X, y: REST_Y };
    let hovering = false, base = null, raf = 0, visible = true;

    const write = () => {
      plate.style.setProperty('--rx', `${cur.x.toFixed(2)}deg`);
      plate.style.setProperty('--ry', `${cur.y.toFixed(2)}deg`);
      // light comes from the upper left; the reflection slides opposite to the lean
      plate.style.setProperty('--lx', `${(50 - cur.y * 3).toFixed(1)}%`);
      plate.style.setProperty('--ly', `${(30 + cur.x * 3).toFixed(1)}%`);
    };
    const loop = () => {
      raf = 0;
      if (!visible || document.hidden) return;
      cur.x += (tgt.x - cur.x) * 0.12; cur.y += (tgt.y - cur.y) * 0.12;
      const moving = Math.abs(tgt.x - cur.x) > 0.03 || Math.abs(tgt.y - cur.y) > 0.03;
      if (!moving) { cur.x = tgt.x; cur.y = tgt.y; }                  // land exactly, then stop
      write();
      // at rest the plate lies flat (no 3D layer) so the text is drawn at full resolution
      plate.dataset.flat = !moving && !hovering && cur.x === REST_X && cur.y === REST_Y ? '1' : '';
      if (moving) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const move = (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = scene.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      tgt.y = clamp(px * 22, -14, 14); tgt.x = clamp(REST_X - py * 16, -6, 18);
      hovering = true; kick();
    };
    const leave = () => { if (!hovering) return; hovering = false; tgt.x = REST_X; tgt.y = REST_Y; kick(); };
    // Android reports tilt without a permission prompt; use it relative to how the phone was held
    const orient = (e) => {
      if (e.beta == null || e.gamma == null) return;
      if (!base) base = { b: e.beta, g: e.gamma };
      const x = clamp(REST_X + (e.beta - base.b) * 0.45, -8, 20);
      const y = clamp(REST_Y + (e.gamma - base.g) * 0.6, -18, 18);
      if (Math.abs(x - tgt.x) < 0.4 && Math.abs(y - tgt.y) < 0.4) return;   // ignore sensor jitter
      tgt.x = x; tgt.y = y; kick();
    };
    const io = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) kick(); }) : null;
    io?.observe(scene);
    const vis = () => { if (!document.hidden) kick(); };

    write(); plate.dataset.flat = '1';
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', vis);
    const needsPermission = typeof window.DeviceOrientationEvent?.requestPermission === 'function';
    if (!fine && !needsPermission && !reduce) window.addEventListener('deviceorientation', orient);
    return () => {
      cancelAnimationFrame(raf); io?.disconnect();
      scene.removeEventListener('pointermove', move);
      scene.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('deviceorientation', orient);
    };
  }, []);

  return (
    <div className={s.scene} ref={sceneRef}>
      <div className={s.plate} ref={plateRef}>
        {EDGES.map(z => <div key={z} className={s.edge} style={{ transform: `translateZ(-${z}px)` }} aria-hidden="true" />)}
        <div className={s.face}>
          <div className={s.border} aria-hidden="true" />
          <div className={s.hole} aria-hidden="true" />
          <p className={s.head} aria-hidden="true">॥ श्री ॥</p>
          <h3 className={s.title}>{title}</h3>
          {children || (
            <p className={s.text} lang="sa">
              {parts.map((p, i) => (typeof p === 'string'
                ? <span key={i}>{p}</span>
                : <span key={i} className={p.empty ? s.ph : s.inlay}>{p.v}</span>))}
            </p>
          )}
          {footer && <p className={s.foot}>{footer}</p>}
          <p className={s.end} aria-hidden="true">॥ शुभं भवतु ॥</p>
          <div className={s.sheen} aria-hidden="true" />
        </div>
        {/* ring through the hole, with the seal */}
        <svg className={s.ring} viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="tp-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd0a0" /><stop offset="35%" stopColor="#c0703a" />
              <stop offset="65%" stopColor="#7a3a16" /><stop offset="100%" stopColor="#e09a60" />
            </linearGradient>
            <radialGradient id="tp-seal" cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#f2b27a" /><stop offset="60%" stopColor="#b5622e" /><stop offset="100%" stopColor="#6b3112" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="44" r="30" fill="none" stroke="#2a1206" strokeWidth="10" opacity="0.35" transform="translate(2 3)" />
          <circle cx="60" cy="44" r="30" fill="none" stroke="url(#tp-ring)" strokeWidth="9" />
          <circle cx="60" cy="82" r="24" fill="url(#tp-seal)" stroke="#5a2a0e" strokeWidth="2" />
          <circle cx="60" cy="82" r="18" fill="none" stroke="#f5c999" strokeWidth="1" opacity="0.6" />
          <text x="60" y="90" textAnchor="middle" className={s.om}>ॐ</text>
        </svg>
      </div>
      <div className={s.shadow} aria-hidden="true" />
    </div>
  );
}
