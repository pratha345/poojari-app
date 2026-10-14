// src/components/panchang/KaalKram.jsx — कालक्रम पायऱ्या: the sankalp's time-units as a 3D staircase
//
// From the largest unit (शके · संवत्सर) step by step down to this moment (नक्षत्र · योग · करण),
// each slab showing how much of its unit has passed. Tap a step to lift it and read what it
// means. The stair leans toward the mouse on desktop; CSS 3D only, no WebGL.
import { useEffect, useRef, useState } from 'react';
import s from './KaalKram.module.css';

const DEV = (n) => String(n).replace(/\d/g, d => '०१२३४५६७८९'[d]);
const pct = (f) => (f == null ? null : `${DEV(Math.round(f * 100))}%`);

export default function KaalKram({ e, data }) {
  const [open, setOpen] = useState(null);
  const sceneRef = useRef(null);

  const steps = [
    { k: 'year', unit: 'वर्ष', sk: `शालिवाहन शके ${DEV(e.shaka)}`, sk2: `${e.samvatsar} नाम संवत्सरे`,
      mr: `${e.samvatsar} संवत्सर`, f: e.frac.year, done: 'वर्ष',
      why: 'शालिवाहन शक आणि ६० संवत्सरांच्या चक्रातील या वर्षाचे नाव. नवे वर्ष गुढीपाडव्याला (चैत्र शुक्ल प्रतिपदा) सुरू होते.' },
    e.ayana && { k: 'ayana', unit: 'अयन · ६ महिने', sk: e.ayana, mr: e.ayanaMr, f: e.frac.ayana, done: 'अयन',
      why: 'सूर्य मकर संक्रांतीपासून उत्तरायणात आणि कर्क संक्रांतीपासून दक्षिणायनात असतो (निरयन).' },
    e.ritu && { k: 'ritu', unit: 'ऋतू · २ महिने', sk: `${e.ritu} ऋतौ`, mr: `${e.rituMr} ऋतू`, f: e.frac.ritu, done: 'ऋतू',
      why: 'दोन चांद्रमासांचा एक ऋतू: चैत्र-वैशाख वसंत, ज्येष्ठ-आषाढ ग्रीष्म, श्रावण-भाद्रपद वर्षा, आश्विन-कार्तिक शरद, मार्गशीर्ष-पौष हेमंत, माघ-फाल्गुन शिशिर.' },
    { k: 'maas', unit: 'मास', sk: `${e.maas} मासे`, mr: `${data.maas} महिना`, f: e.frac.maas, done: 'महिना',
      why: 'अमावास्येनंतर सुरू होऊन पुढच्या अमावास्येला संपणारा चांद्रमास (अमांत).' },
    { k: 'paksha', unit: 'पक्ष · १५ तिथी', sk: `${e.paksha} पक्षे`, mr: data.paksha, f: e.frac.paksha, done: 'पक्ष',
      why: 'अमावास्या ते पौर्णिमा शुक्ल पक्ष, पौर्णिमा ते अमावास्या कृष्ण पक्ष.' },
    { k: 'tithi', unit: 'तिथी', sk: `${e.tithi} तिथौ`, mr: data.tithi?.name, f: e.frac.tithi, done: 'तिथी',
      why: 'चंद्र सूर्याच्या प्रत्येकी १२° पुढे गेला की एक तिथी पूर्ण होते — म्हणून तिथी कधी लहान, कधी मोठी असते.' },
    { k: 'vaar', unit: 'वार', sk: `${e.vaar} शुभवासरे`, mr: data.var, f: e.frac.vaar, done: 'दिवस',
      why: 'पंचांगात वार सूर्योदयापासून पुढच्या सूर्योदयापर्यंत मानतात.' },
    { k: 'now', unit: 'हा क्षण', sk: `${e.nakshatra} नक्षत्रे · ${e.yoga} योगे · ${e.karana} करणे`,
      mr: `${data.nakshatra} · ${data.yoga} · ${data.karana}`, now: true,
      why: 'चंद्र ज्या नक्षत्रात आहे ते नक्षत्र; सूर्य-चंद्र भोगांच्या बेरजेवरून योग; अर्धी तिथी म्हणजे करण. संकल्प करताना याच क्षणाचे घ्यावे.' },
  ].filter(Boolean);

  // the whole stair leans toward the mouse (desktop only); nothing to do on touch
  useEffect(() => {
    const el = sceneRef.current; if (!el || !window.matchMedia?.('(pointer: fine)').matches) return;
    let raf = 0;
    const set = (rx, ry) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`); el.style.setProperty('--ry', `${ry.toFixed(2)}deg`); }); };
    const move = (ev) => {
      const r = el.getBoundingClientRect();
      set(8 - ((ev.clientY - r.top) / r.height - 0.5) * 6, ((ev.clientX - r.left) / r.width - 0.5) * 10);
    };
    const leave = () => set(8, -4);
    el.addEventListener('pointermove', move); el.addEventListener('pointerleave', leave);
    return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
  }, []);

  return (
    <div className={s.scene} ref={sceneRef}>
      <p className={s.cap}>विशाल कालापासून या क्षणापर्यंत — संकल्पाचा कालक्रम</p>
      <ol className={s.stair}>
        {steps.map((st, i) => (
          <li key={st.k} className={`${s.step} ${st.now ? s.now : ''} ${open === st.k ? s.open : ''}`}
            style={{ '--i': i, '--n': steps.length }}>
            <button type="button" className={s.slab} aria-expanded={open === st.k}
              onClick={() => setOpen(o => (o === st.k ? null : st.k))}>
              <span className={s.unit}>{st.now && <i className={s.pulse} />}{st.unit}</span>
              <span className={s.sk} lang="sa">{st.sk}{st.sk2 && <><br />{st.sk2}</>}</span>
              <span className={s.mr}>{st.mr}</span>
              {st.f != null && (
                <span className={s.bar} aria-label={`${st.done} ${Math.round(st.f * 100)}% झाले`}>
                  <i style={{ width: `${(st.f * 100).toFixed(1)}%` }} />
                  <em>{st.done} {pct(st.f)} झाले</em>
                </span>
              )}
            </button>
            {open === st.k && <p className={s.why}>{st.why}</p>}
          </li>
        ))}
      </ol>
      <div className={s.base}>
        <span className={s.baseTitle}>ग्रहस्थिती</span>
        {e.grahas.map(([r, loc]) => <span key={loc} className={s.graha} lang="sa">{r} राशिस्थिते {loc}</span>)}
      </div>
    </div>
  );
}
