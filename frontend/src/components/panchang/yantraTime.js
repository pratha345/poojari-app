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

/** Time state with live play, ±step and the jog dial (drag sideways = run time). */
export function useTimeControls(initial) {
  const [t, setT] = useState(() => initial || Date.now());
  const [playing, setPlaying] = useState(false);
  const [jogRate, setJogRate] = useState(0);
  const knobRef = useRef(null);
  useEffect(() => { if (initial) { setT(initial); setPlaying(false); } }, [initial]);
  useEffect(() => {
    if (!playing) return;
    setT(Date.now());
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, [playing]);
  useEffect(() => {
    const knob = knobRef.current; if (!knob) return;
    const track = knob.parentElement, MAX = 3 * 86400000;
    let jog = null, raf = 0;
    const loop = (now) => {
      if (!jog) return;
      const dt = (now - jog.last) / 1000; jog.last = now;
      const f = jog.off / jog.max;
      setT(x => x + Math.sign(f) * f * f * MAX * dt);
      raf = requestAnimationFrame(loop);
    };
    const down = (e) => {
      setPlaying(false);
      jog = { x0: e.clientX, off: 0, max: Math.max(40, track.clientWidth / 2 - 30), last: performance.now() };
      knob.dataset.active = '1';
      raf = requestAnimationFrame(loop); e.preventDefault();
    };
    const move = (e) => {
      if (!jog) return;
      jog.off = Math.max(-jog.max, Math.min(jog.max, e.clientX - jog.x0));
      knob.style.transform = `translateX(${jog.off}px)`;
      const f = jog.off / jog.max; setJogRate(Math.sign(f) * f * f * MAX);
    };
    const up = () => {
      if (!jog) return;
      jog = null; cancelAnimationFrame(raf);
      delete knob.dataset.active; knob.style.transform = ''; setJogRate(0);
    };
    knob.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      cancelAnimationFrame(raf);
      knob.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);
  const nudge = (min) => { setPlaying(false); setT(x => x + min * 60000); };
  const now = () => { setPlaying(false); setT(Date.now()); };
  return { t, setT, playing, setPlaying, jogRate, knobRef, nudge, now };
}

export const fmtRate = (ms) => {
  const h = Math.abs(ms) / 3600000;
  const txt = h >= 24 ? `${(h / 24).toFixed(1)} दिवस` : `${h.toFixed(h < 10 ? 1 : 0)} तास`;
  return `${ms > 0 ? '⏩' : '⏪'} ${txt}/सेकंद`;
};
