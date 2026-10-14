// src/components/panchang/Moon3D.jsx — a lit, textured Moon for a given Moon–Sun elongation
//
// The face (maria, bright craters with rays, limb darkening) is drawn once in <MoonDefs/>
// and reused by every <Moon3D/>. The night side is the lit shape of the opposite phase,
// softened and clipped to the disc; a little earthshine leaves the dark side faintly visible.
// Waxing (शुक्ल) is lit on the right, waning (कृष्ण) on the left, as seen from India.
import { memo } from 'react';

const C = 50, R = 48;
// lit part for elongation e (0 = new, 180 = full); waxing lit on the right
function litPath(e) {
  const k = Math.cos((e * Math.PI) / 180), rx = Math.abs(k) * R, waxing = e < 180;
  const outer = waxing ? 1 : 0, term = (waxing ? k > 0 : k < 0) ? 0 : 1;
  return `M${C},${C - R} A${R},${R} 0 0 ${outer} ${C},${C + R} A${rx.toFixed(2)},${R} 0 0 ${term} ${C},${C - R} Z`;
}

/** Shared gradients, texture and filters — render once per page section. */
export const MoonDefs = memo(function MoonDefs() {
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const craters = Array.from({ length: 46 }, () => {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * 44;
    return { x: C + Math.cos(a) * d, y: C + Math.sin(a) * d, r: 0.5 + rnd() * 1.6 };
  });
  const rays = Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2 + rnd() * 0.2);
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="mn-base" cx="46%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#f7f5ef" /><stop offset="55%" stopColor="#e2dfd6" />
          <stop offset="85%" stopColor="#b9b5ab" /><stop offset="100%" stopColor="#8d897f" />
        </radialGradient>
        <radialGradient id="mn-vign" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="#000" stopOpacity="0" /><stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <radialGradient id="mn-spec-r" cx="68%" cy="36%" r="45%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" /><stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mn-spec-l" cx="32%" cy="36%" r="45%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" /><stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="mn-clip"><circle cx={C} cy={C} r={R} /></clipPath>
        <filter id="mn-blur-maria" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3" /></filter>
        <filter id="mn-blur-term" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6" /></filter>
        {/* the near side, north up: the "seas" and a few landmark craters */}
        <g id="mn-face">
          <g fill="#6f6b66" opacity="0.5" filter="url(#mn-blur-maria)">
            <ellipse cx="27" cy="50" rx="14" ry="22" />{/* Oceanus Procellarum */}
            <ellipse cx="38" cy="32" rx="12" ry="10" />{/* Imbrium */}
            <ellipse cx="58" cy="34" rx="7" ry="7" />{/* Serenitatis */}
            <ellipse cx="64" cy="47" rx="9" ry="8" />{/* Tranquillitatis */}
            <ellipse cx="80" cy="38" rx="5" ry="4.5" />{/* Crisium */}
            <ellipse cx="74" cy="59" rx="6" ry="8" />{/* Fecunditatis */}
            <ellipse cx="66" cy="61" rx="4" ry="4" />{/* Nectaris */}
            <ellipse cx="42" cy="66" rx="9" ry="6" />{/* Nubium */}
            <ellipse cx="28" cy="67" rx="4.5" ry="4.5" />{/* Humorum */}
            <ellipse cx="50" cy="17" rx="17" ry="3.5" />{/* Frigoris */}
            <ellipse cx="50" cy="43" rx="4" ry="3" />{/* Vaporum */}
          </g>
          <g fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="0.5">
            {craters.map((c, i) => <circle key={i} cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r={c.r.toFixed(2)} />)}
          </g>
          <g stroke="#fff" strokeOpacity="0.18" strokeWidth="0.6">
            {rays.map((a, i) => <line key={i} x1="47" y1="80" x2={(47 + Math.cos(a) * 16).toFixed(1)} y2={(80 + Math.sin(a) * 16).toFixed(1)} />)}
          </g>
          <circle cx="47" cy="80" r="1.8" fill="#fff" opacity="0.85" />{/* Tycho */}
          <circle cx="38" cy="47" r="2" fill="#fff" opacity="0.6" />{/* Copernicus */}
          <circle cx="27" cy="46" r="1.2" fill="#fff" opacity="0.55" />{/* Kepler */}
          <circle cx="22" cy="38" r="1" fill="#fff" opacity="0.8" />{/* Aristarchus */}
          <circle cx="46" cy="22" r="1.6" fill="#57534d" opacity="0.7" />{/* Plato */}
        </g>
      </defs>
    </svg>
  );
});

/** One Moon. `el` = Moon–Sun elongation in degrees (0…360). */
export default memo(function Moon3D({ el, size = 48, className, label }) {
  const e = Math.min(359.5, Math.max(0.5, ((el % 360) + 360) % 360));
  const shadow = litPath((e + 180) % 360);          // the dark part is the lit part of the opposite phase
  const waxing = e < 180;
  const lit = (1 - Math.cos((e * Math.PI) / 180)) / 2;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img"
      aria-label={label || `चंद्र ${Math.round(lit * 100)}% प्रकाशित`}
      style={{ filter: `drop-shadow(0 0 ${(2 + lit * 6).toFixed(1)}px rgba(255, 248, 225, ${(0.12 + lit * 0.35).toFixed(2)}))` }}>
      <g clipPath="url(#mn-clip)">
        <circle cx={C} cy={C} r={R} fill="url(#mn-base)" />
        <use href="#mn-face" />
        <circle cx={C} cy={C} r={R} fill={waxing ? 'url(#mn-spec-r)' : 'url(#mn-spec-l)'} />
        <path d={shadow} fill="#0c0d12" opacity="0.9" filter="url(#mn-blur-term)" />
        <circle cx={C} cy={C} r={R} fill="url(#mn-vign)" />
      </g>
    </svg>
  );
});
