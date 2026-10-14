// src/components/panchang/yantraTime.js — shared time/data helpers for the yantra tabs
//
// Sidereal (Lahiri) graha + lagna longitudes come from /api/panchang/chakra as half-hourly
// samples; between samples we interpolate (error < 0.05° for the lagna, ~0 for grahas).
// Exact values are fetched once the time settles. Nothing astronomical is computed here.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { panchangAPI } from '../../api/index.js';

export const IST = 330 * 60000;
export const KEYS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu', 'lagna'];
const WINDOW_H = 240, STEP_MIN = 30;

export const norm = (a) => ((a % 360) + 360) % 360;
export const istParts = (ms) => {
  const d = new Date(ms + IST);
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), wd: d.getUTCDay() };
};
export const ymd = (ms) => new Date(ms + IST).toISOString().slice(0, 10);
export const hhmm = (ms) => new Date(ms + IST).toISOString().slice(11, 16);

export function interpolate(samples, t) {
  if (!samples?.length) return null;
  const step = samples.length > 1 ? samples[1].t - samples[0].t : 1;
  const i = Math.min(samples.length - 2, Math.max(0, Math.floor((t - samples[0].t) / step)));
  const a = samples[i], b = samples[i + 1] || a;
  const f = Math.min(1, Math.max(0, (t - a.t) / step));
  const out = {};
  for (const k of KEYS) {
    let d = b[k] - a[k];
    if (d > 180) d -= 360; if (d < -180) d += 360;
    out[k] = norm(a[k] + d * f);
    out[k + '_speed'] = (d / step) * 86400000;
  }
  return out;
}

/**
 * When does a quantity next cross a boundary? `value(sample)` must grow with time
 * (tithi: Moon−Sun, nakshatra: Moon, yoga: Sun+Moon); boundaries every `width` degrees.
 * Returns the time (ms) of the next boundary after t, or null if beyond the samples.
 */
export function nextBoundary(samples, t, value, width) {
  if (!samples?.length) return null;
  const at = (s) => value(s);
  const cur = interpolate(samples, t); if (!cur) return null;
  const v0 = value(cur);
  const target = (Math.floor(v0 / width) + 1) * width;           // in unwrapped degrees
  let prevT = t, prevV = v0;
  for (const s of samples) {
    if (s.t <= t) continue;
    let v = at(s);
    while (v < prevV - 180) v += 360;                               // unwrap 360 → 0
    if (v >= target) {
      const f = (target - prevV) / (v - prevV);
      return prevT + f * (s.t - prevT);
    }
    prevT = s.t; prevV = v;
  }
  return null;
}

/** Samples around `t`, interpolated positions, and exact positions once `t` settles. */
export function useGrahaTimeline(t, lat, lon) {
  const [samples, setSamples] = useState(null);
  const [exact, setExact]     = useState(null);
  const [error, setError]     = useState('');
  const fetching = useRef(false);
  const tRef = useRef(t); tRef.current = t;

  useEffect(() => { setSamples(null); }, [lat, lon]);
  const ensure = useCallback(async (at) => {
    const margin = 36 * 3600000;                                   // keep ≥1.5 days ahead for end times
    if (samples && at > samples[0].t + margin && at < samples[samples.length - 1].t - margin) return;
    if (fetching.current) return;
    fetching.current = true;
    try {
      const start = new Date(at - (WINDOW_H / 2) * 3600000).toISOString();
      const r = await panchangAPI.chakra({ start, hours: WINDOW_H, step: STEP_MIN, lat, lon });
      setSamples(r.data.data.samples); setError('');
    } catch { setError('ग्रहस्थिती मिळवता आली नाही.'); }
    finally { fetching.current = false; }
  }, [samples, lat, lon]);
  useEffect(() => { ensure(t); }, [t, ensure]);

  const minute = Math.floor(t / 60000);
  useEffect(() => {
    const id = setTimeout(() => {
      const at = tRef.current;
      panchangAPI.chakra({ start: new Date(at).toISOString(), hours: 1, step: 60, lat, lon })
        .then(r => setExact({ t: at, row: r.data.data.samples[0] })).catch(() => {});
    }, 600);
    return () => clearTimeout(id);
  }, [minute, lat, lon]);

  const pos = useMemo(() => {
    const p = interpolate(samples, t);
    if (p && exact && Math.abs(exact.t - t) < 1000) for (const k of KEYS) p[k] = exact.row[k];
    return p;
  }, [samples, t, exact]);
  return { samples, pos, error };
}

/**
 * Time state with live play, ±step and the scrub slider. The knob stays where it is left:
 * its position is the offset from an anchor time (centre = anchor), squared so small moves
 * are fine-grained (full travel = ±RANGE). "आता" / a new page time re-anchors and centres it.
 */
export const SCRUB_RANGE = 15 * 86400000;
const toF = (d) => Math.max(-1, Math.min(1, Math.sign(d) * Math.sqrt(Math.abs(d) / SCRUB_RANGE)));
const fromF = (f) => Math.sign(f) * f * f * SCRUB_RANGE;

export function useTimeControls(initial) {
  const [t, setT] = useState(() => initial || Date.now());
  const [base, setBase] = useState(() => initial || Date.now());
  const [playing, setPlaying] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [half, setHalf] = useState(0);                           // usable knob travel each side (px)
  const knobRef = useRef(null);
  const live = useRef({ t, base }); live.current = { t, base };

  const anchor = useCallback((ms) => { setPlaying(false); setT(ms); setBase(ms); }, []);
  useEffect(() => { if (initial) anchor(initial); }, [initial, anchor]);
  useEffect(() => {
    if (!playing) return;
    const tick = () => { const n = Date.now(); setT(n); setBase(n); };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const knob = knobRef.current; if (!knob) return;
    const track = knob.parentElement;
    const measure = () => setHalf(Math.max(40, track.clientWidth / 2 - 30));
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(track);
    let drag = null;
    const down = (e) => {
      setPlaying(false);
      let { t: t0, base: b } = live.current;
      if (Math.abs(t0 - b) > SCRUB_RANGE) { b = t0; setBase(b); }   // pushed past the end by ± → re-centre
      drag = { x0: e.clientX, f0: toF(t0 - b), base: b, max: Math.max(40, track.clientWidth / 2 - 30) };
      knob.setPointerCapture?.(e.pointerId);
      setDragging(true); e.preventDefault();
    };
    const move = (e) => {
      if (!drag) return;
      const f = Math.max(-1, Math.min(1, drag.f0 + (e.clientX - drag.x0) / drag.max));
      setT(Math.round(drag.base + fromF(f)));
    };
    const up = () => { if (drag) { drag = null; setDragging(false); } };
    const key = (e) => {
      const step = { ArrowLeft: -60, ArrowRight: 60, PageDown: -1440, PageUp: 1440 }[e.key];
      if (step) { e.preventDefault(); setPlaying(false); setT(x => x + step * 60000); }
    };
    knob.addEventListener('pointerdown', down);
    knob.addEventListener('keydown', key);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      ro?.disconnect();
      knob.removeEventListener('pointerdown', down);
      knob.removeEventListener('keydown', key);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const offset = t - base;
  const knobStyle = { transform: `translateX(${(toF(offset) * half).toFixed(1)}px)`, ...(dragging ? { transition: 'none' } : {}) };
  const nudge = (min) => { setPlaying(false); setT(x => x + min * 60000); };
  const now = () => anchor(Date.now());
  return { t, setT, playing, setPlaying, dragging, offset, knobRef, knobStyle, nudge, now };
}

/** "+2 दिवस 4 तास" — how far the slider has moved time from its anchor. */
export const fmtOffset = (ms) => {
  const m = Math.round(Math.abs(ms) / 60000);
  if (m < 1) return '';
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
  const parts = [d && `${d} दिवस`, h && `${h} तास`, !d && mi && `${mi} मि`].filter(Boolean);
  return `${ms > 0 ? '⏩ +' : '⏪ −'}${parts.join(' ')}`;
};
