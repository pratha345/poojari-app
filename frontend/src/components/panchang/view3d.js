// src/components/panchang/view3d.js — the "camera" for the CSS-3D yantras (no WebGL)
//
// The wheel is a CSS 3D object: translate(pan) scale(zoom) rotateX(tilt) rotateZ(rot).
// Rotation is about the model's centre, so the camera always looks at the middle of the
// chart; pan and zoom are clamped so it can't be lost off-screen. Values are written to
// CSS variables on the stage (wheel, shadow and upright labels inherit them) — pointer
// movement never re-renders React; the small view indicator updates when a gesture ends.
import { useCallback, useEffect, useRef, useState } from 'react';

export const TILT_MAX = 72, ZOOM_MIN = 0.6, ZOOM_MAX = 2.6, FRONT_TILT = 64;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const modeOf = (tilt) => (tilt < 4 ? 'top' : tilt > 52 ? 'front' : '3d');
const KEYS = ['rot', 'tilt', 'zoom', 'px', 'py'];

/**
 * @param defaultTilt   the resting 3D angle
 * @param rotOffsetRef  extra rotation added on top of the user's (lagna view in the chakra)
 * @param onRest        called with the user rotation once a gesture / animation settles
 */
export function useView3D({ defaultTilt = 26, rotOffsetRef, onRest } = {}) {
  const v = useRef({ rot: 0, tilt: defaultTilt, zoom: 1, px: 0, py: 0, vRot: 0 });
  const stageEl = useRef(null);
  const viewerRef = useRef(null);
  const movedAt = useRef(0);                         // last time a drag moved (tap vs drag)
  const raf = useRef(0);
  const onRestRef = useRef(onRest); onRestRef.current = onRest;
  const [hud, setHud] = useState({ mode: modeOf(defaultTilt), zoom: 100 });
  const [full, setFull] = useState(false);           // true fullscreen or the in-page fallback
  const reduce = useRef(typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

  const limit = () => {
    const s = v.current, w = stageEl.current?.clientWidth || 500;
    s.tilt = clamp(s.tilt, 0, TILT_MAX);
    s.zoom = clamp(s.zoom, ZOOM_MIN, ZOOM_MAX);
    const m = w * 0.42 * s.zoom;                     // part of the chart always stays in view
    s.px = clamp(s.px, -m, m); s.py = clamp(s.py, -m, m);
  };
  const apply = useCallback(() => {
    const el = stageEl.current, s = v.current; if (!el) return;
    el.style.setProperty('--rot', `${(s.rot + (rotOffsetRef?.current || 0)).toFixed(2)}deg`);
    el.style.setProperty('--tilt', `${s.tilt.toFixed(2)}deg`);
    el.style.setProperty('--zoom', s.zoom.toFixed(3));
    el.style.setProperty('--px', `${s.px.toFixed(1)}px`);
    el.style.setProperty('--py', `${s.py.toFixed(1)}px`);
  }, [rotOffsetRef]);
  const settle = useCallback(() => {
    const s = v.current, mode = modeOf(s.tilt), zoom = Math.round(s.zoom * 100);
    setHud(h => (h.mode === mode && h.zoom === zoom ? h : { mode, zoom }));
    onRestRef.current?.(s.rot);
  }, []);

  /** Smoothly move to a target camera (respects reduced motion). */
  const animateTo = useCallback((target, ms = 450) => {
    cancelAnimationFrame(raf.current);
    const s = v.current; s.vRot = 0;
    const to = { ...s, ...target };
    { const keep = { ...s }; Object.assign(s, to); limit(); Object.assign(to, s); Object.assign(s, keep); }
    if (reduce.current || ms <= 0) { Object.assign(s, to); apply(); settle(); return; }
    const from = { ...s }, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms), e = 1 - (1 - k) ** 3;
      for (const key of KEYS) s[key] = from[key] + (to[key] - from[key]) * e;
      apply();
      if (k < 1) raf.current = requestAnimationFrame(step); else settle();
    };
    raf.current = requestAnimationFrame(step);
  }, [apply, settle]); // eslint-disable-line react-hooks/exhaustive-deps

  // zoom about a point (stage-centre coordinates) so what is under the finger stays there
  const zoomAbout = (s, k, p) => {
    const z = clamp(s.zoom * k, ZOOM_MIN, ZOOM_MAX), r = z / s.zoom;
    return { zoom: z, px: p[0] - (p[0] - s.px) * r, py: p[1] - (p[1] - s.py) * r };
  };

  // ── toolbar actions: a tap is one animated step, holding runs it continuously ──
  const STEP = { pan: 48, zoom: 1.25, rot: 15 }, HOLD = { pan: 6, zoom: 1.014, rot: 1.4 };
  const change = (kind, dir, amt) => {
    const s = v.current;
    if (kind === 'x') return { px: s.px + dir * amt.pan };
    if (kind === 'y') return { py: s.py + dir * amt.pan };
    if (kind === 'rot') return { rot: s.rot + dir * amt.rot };
    return zoomAbout(s, dir > 0 ? amt.zoom : 1 / amt.zoom, [0, 0]);
  };
  const step = useCallback((kind, dir) => animateTo(change(kind, dir, STEP), 260), [animateTo]); // eslint-disable-line react-hooks/exhaustive-deps
  const hold = useCallback((kind, dir) => {
    cancelAnimationFrame(raf.current);
    Object.assign(v.current, change(kind, dir, HOLD)); limit(); apply();
  }, [apply]); // eslint-disable-line react-hooks/exhaustive-deps

  const setView = useCallback((mode) => {
    const tilt = mode === 'top' ? 0 : mode === 'front' ? FRONT_TILT : defaultTilt;
    animateTo({ tilt, zoom: 1, px: 0, py: 0 }, 550);
  }, [animateTo, defaultTilt]);
  const reset = useCallback(() => animateTo({ rot: 0, tilt: defaultTilt, zoom: 1, px: 0, py: 0 }, 550), [animateTo, defaultTilt]);
  /** Jump the user rotation without animating (e.g. a new chart view). */
  const setRot = useCallback((rot) => { cancelAnimationFrame(raf.current); v.current.rot = rot; v.current.vRot = 0; apply(); settle(); }, [apply, settle]);

  // ── gestures on the stage: 1 finger orbit, 2 fingers pinch + pan, double-tap zoom ──
  const cleanup = useRef(null);
  const stageRef = useCallback((el) => {
    cleanup.current?.(); cleanup.current = null;
    stageEl.current = el;
    if (!el) return;
    apply();
    const pts = new Map();
    let g = null, lastTap = null;
    const centre = () => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const rel = (x, y) => { const [cx, cy] = centre(); return [x - cx, y - cy]; };
    const begin = () => {
      const s = v.current, list = [...pts.values()];
      if (list.length >= 2) {
        const [a, b] = list;
        g = { kind: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, m0: [(a.x + b.x) / 2, (a.y + b.y) / 2],
          zoom: s.zoom, px: s.px, py: s.py, moved: 99 };
      } else if (list.length === 1) {
        const p = list[0];
        g = { kind: p.pan ? 'pan' : 'orbit', x: p.x, y: p.y, lt: performance.now(), moved: g?.moved || 0, t0: g?.t0 || performance.now() };
      } else g = null;
    };
    const down = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1 && e.button !== 2) return;
      cancelAnimationFrame(raf.current); v.current.vRot = 0;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY, pan: e.shiftKey || e.button === 1 || e.button === 2 });
      if (pts.size === 1) g = null;
      begin();
      el.classList.add('is-dragging');
      if (e.button === 1) e.preventDefault();
    };
    const move = (e) => {
      const p = pts.get(e.pointerId); if (!p || !g) return;
      p.x = e.clientX; p.y = e.clientY;
      const s = v.current;
      if (g.kind === 'pinch') {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), m = [(a.x + b.x) / 2, (a.y + b.y) / 2];
        const base = { zoom: g.zoom, px: g.px + (m[0] - g.m0[0]), py: g.py + (m[1] - g.m0[1]) };
        Object.assign(s, zoomAbout(base, d / g.d0, rel(m[0], m[1])));
        movedAt.current = performance.now();
      } else {
        const dx = e.clientX - g.x, dy = e.clientY - g.y, now = performance.now();
        g.moved += Math.abs(dx) + Math.abs(dy);
        if (g.moved > 6) movedAt.current = now;
        if (g.kind === 'pan') { s.px += dx; s.py += dy; } else {
          s.rot += dx * 0.45;
          s.tilt += dy * 0.25;
          // flick speed in degrees per frame, capped so one swipe can't spin the wheel wildly
          s.vRot = clamp((dx * 0.45) / Math.max(8, now - g.lt) * 16, -12, 12);
        }
        g.x = e.clientX; g.y = e.clientY; g.lt = now;
      }
      limit(); apply();
    };
    const up = (e) => {
      if (!pts.has(e.pointerId)) return;
      const wasOrbit = g?.kind === 'orbit', tap = g && g.kind !== 'pinch' && g.moved < 8 && performance.now() - g.t0 < 300;
      pts.delete(e.pointerId);
      if (pts.size) { begin(); return; }                    // 2 → 1 finger: carry on from here
      el.classList.remove('is-dragging');
      g = null;
      if (tap && e.type === 'pointerup') {                  // double-tap: zoom in there / back out
        const now = performance.now(), here = [e.clientX, e.clientY];
        if (lastTap && now - lastTap.t < 320 && Math.hypot(here[0] - lastTap.x, here[1] - lastTap.y) < 30) {
          lastTap = null;
          const s = v.current;
          animateTo(s.zoom < 1.5 ? zoomAbout(s, 1.9 / s.zoom, rel(here[0], here[1])) : { zoom: 1, px: 0, py: 0 }, 380);
          return;
        }
        lastTap = { t: now, x: here[0], y: here[1] };
      }
      const s = v.current;
      if (!wasOrbit || reduce.current || Math.abs(s.vRot) < 0.3) { s.vRot = 0; settle(); return; }
      const spin = () => {                                   // gentle inertia on the rotation
        s.vRot *= 0.92;
        if (Math.abs(s.vRot) < 0.05) { s.vRot = 0; settle(); return; }
        s.rot += s.vRot; apply(); raf.current = requestAnimationFrame(spin);
      };
      raf.current = requestAnimationFrame(spin);
    };
    const wheel = (e) => {                                   // ctrl/⌘ + wheel or trackpad pinch
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      Object.assign(v.current, zoomAbout(v.current, Math.exp(-e.deltaY * 0.01), rel(e.clientX, e.clientY)));
      limit(); apply(); clearTimeout(wheel.t); wheel.t = setTimeout(settle, 150);
    };
    const key = (e) => {
      const a = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['y', -1], ArrowDown: ['y', 1],
        '+': ['zoom', 1], '=': ['zoom', 1], '-': ['zoom', -1], '[': ['rot', -1], ']': ['rot', 1] }[e.key];
      if (a) { e.preventDefault(); step(...a); } else if (e.key === '0' || e.key === 'Home') { e.preventDefault(); reset(); }
    };
    const menu = (e) => e.preventDefault();                  // right-drag pans
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { limit(); apply(); }) : null;
    ro?.observe(el);
    el.addEventListener('pointerdown', down);
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('keydown', key);
    el.addEventListener('contextmenu', menu);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    cleanup.current = () => {
      ro?.disconnect(); cancelAnimationFrame(raf.current); clearTimeout(wheel.t);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('keydown', key);
      el.removeEventListener('contextmenu', menu);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [apply, settle, animateTo, step, reset]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cleanup.current?.(), []);

  // ── fullscreen: the real API where it exists (not iPhone), else an in-page overlay ──
  const toggleFull = useCallback(() => {
    const el = viewerRef.current; if (!el) return;
    if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
    if (full) { setFull(false); return; }
    if (el.requestFullscreen) el.requestFullscreen().catch(() => setFull(true));
    else setFull(true);
  }, [full]);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement && document.fullscreenElement === viewerRef.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  useEffect(() => {                                          // overlay fallback: Esc closes, page doesn't scroll
    if (!full || document.fullscreenElement) return;
    const esc = (e) => { if (e.key === 'Escape') setFull(false); };
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [full]);

  return { stageRef, viewerRef, movedAt, hud, full, apply, step, hold, settle, setView, reset, setRot, toggleFull };
}
