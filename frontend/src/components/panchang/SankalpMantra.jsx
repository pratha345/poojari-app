// src/components/panchang/SankalpMantra.jsx — संकल्प मंत्र for the moment shown on the panchang page
//
// Every time-element comes from the panchang API for the selected date/time/place (the same
// numbers as the पंचांग tab); here they are only put into their Sanskrit (locative) forms.
// शके / संवत्सर: Shalivahana shaka changes at Chaitra shukla pratipada (गुढीपाडवा).
// ऋतू follows the lunar month (चैत्र-वैशाख = वसंत …); अयन is nirayana (मकर/कर्क संक्रांती).
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import s from './SankalpMantra.module.css';
import Tamrapatra from './Tamrapatra';

const MAAS = ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'];
const RITU = ['वसन्त', 'ग्रीष्म', 'वर्षा', 'शरद्', 'हेमन्त', 'शिशिर'];
const RITU_MR = ['वसंत', 'ग्रीष्म', 'वर्षा', 'शरद', 'हेमंत', 'शिशिर'];
const TITHI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
  'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी'];
const SAMVATSAR = ['प्रभव', 'विभव', 'शुक्ल', 'प्रमोद', 'प्रजापति', 'अङ्गिरा', 'श्रीमुख', 'भाव', 'युव', 'धाता', 'ईश्वर',
  'बहुधान्य', 'प्रमाथी', 'विक्रम', 'वृष', 'चित्रभानु', 'सुभानु', 'तारण', 'पार्थिव', 'व्यय', 'सर्वजित्', 'सर्वधारी',
  'विरोधी', 'विकृति', 'खर', 'नन्दन', 'विजय', 'जय', 'मन्मथ', 'दुर्मुख', 'हेमलम्बी', 'विलम्बी', 'विकारी', 'शार्वरी',
  'प्लव', 'शुभकृत्', 'शोभकृत्', 'क्रोधी', 'विश्वावसु', 'पराभव', 'प्लवङ्ग', 'कीलक', 'सौम्य', 'साधारण', 'विरोधकृत्',
  'परिधावी', 'प्रमादी', 'आनन्द', 'राक्षस', 'नल', 'पिङ्गल', 'कालयुक्त', 'सिद्धार्थी', 'रौद्र', 'दुर्मति', 'दुन्दुभि',
  'रुधिरोद्गारी', 'रक्ताक्षी', 'क्रोधन', 'क्षय'];
const VAAR = { 'रविवार': 'रविवार', 'सोमवार': 'सोमवार', 'मंगळवार': 'मंगलवार', 'बुधवार': 'बुधवार', 'गुरुवार': 'गुरुवार', 'शुक्रवार': 'शुक्रवार', 'शनिवार': 'शनिवार' };
// Marathi spellings from the API → Sanskrit stems
const SK = {
  'पुनर्वसू': 'पुनर्वसु', 'मूळ': 'मूल', 'पूर्वा फाल्गुनी': 'पूर्वाफाल्गुनी', 'उत्तरा फाल्गुनी': 'उत्तराफाल्गुनी',
  'पूर्वा भाद्रपदा': 'पूर्वाभाद्रपदा', 'उत्तरा भाद्रपदा': 'उत्तराभाद्रपदा', 'आयुष्मान': 'आयुष्मान्', 'वरीयान': 'वरीयान्',
  'विष्कंभ': 'विष्कम्भ', 'प्रीती': 'प्रीति', 'अतिगंड': 'अतिगण्ड', 'धृती': 'धृति', 'गंड': 'गण्ड', 'वृद्धी': 'वृद्धि',
  'सिद्धी': 'सिद्धि', 'ऐंद्र': 'ऐन्द्र', 'वैधृती': 'वैधृति', 'शकुनी': 'शकुनि', 'विष्टी': 'विष्टि', 'गरज': 'गर',
  'तूळ': 'तुला', 'कुंभ': 'कुम्भ', 'सिंह': 'सिंह',
};
const sk = (w) => SK[w] || w;
const DEV = (n) => String(n).replace(/\d/g, d => '०१२३४५६७८९'[d]);
const GRAHA = [  // locative forms — only चंद्र, सूर्य and गुरु are named in the sankalp
  ['Moon', 'चन्द्रे'], ['Sun', 'श्रीसूर्ये'], ['Jupiter', 'देवगुरौ बृहस्पतौ']];

const FIELDS_KEY = 'sankalp_fields', VIEW_KEY = 'sankalp_view', STYLE_KEY = 'sankalp_style';
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };

/** The Sanskrit pieces for the panchang shown on the page. */
function elements(data, place) {
  const adhik = /अधिक/.test(data.maas || '');
  const maasName = (data.maas || '').replace('अधिक', '').trim();
  const mi = MAAS.indexOf(maasName);
  const [gy, gm] = data.date.split('-').map(Number);
  // before गुढीपाडवा (Jan–Apr in मार्गशीर्ष…फाल्गुन) the previous shaka is still running
  const shaka = gm <= 4 && mi >= 8 ? gy - 79 : gy - 78;
  const sunSid = Number(data._sun_sidereal);
  const uttar = Number.isFinite(sunSid) ? (sunSid >= 270 || sunSid < 90) : null;
  const n = data.tithi?.num;
  const tithi = n === 15 ? 'पौर्णिमा' : n === 30 ? 'अमावास्या' : TITHI[(n - 1) % 15] || data.tithi?.name;
  const shukla = /शुक्ल/.test(data.paksha);
  const rashiOf = Object.fromEntries((data.grahas || []).map(g => [g.key, g.rashi]));
  rashiOf.Sun = data.suryaRashi; rashiOf.Moon = data.chandraRashi;
  return {
    shaka, samvatsar: SAMVATSAR[(shaka + 11) % 60],
    ayana: uttar == null ? null : uttar ? 'उत्तरायणे' : 'दक्षिणायने', ayanaMr: uttar ? 'उत्तरायण' : 'दक्षिणायन',
    ritu: mi >= 0 ? RITU[Math.floor(mi / 2)] : null, rituMr: mi >= 0 ? RITU_MR[Math.floor(mi / 2)] : '',
    maas: `${adhik ? 'अधिक ' : ''}${maasName}`, paksha: shukla ? 'शुक्ल' : 'कृष्ण',
    tithi, vaar: VAAR[data.var] || data.var, nakshatra: sk(data.nakshatra), yoga: sk(data.yoga), karana: sk(data.karana),
    grahas: GRAHA.filter(([k]) => rashiOf[k]).map(([k, loc]) => [sk(rashiOf[k]), loc]),
    place,
  };
}

// a sankalp is a list of plain text and highlighted values: ['text', {v}, …]
function build(e, f, full) {
  const V = (v, ph) => ({ v: v || `[${ph}]`, empty: !v });
  const fem = f.gender === 'f';
  const out = [
    'ॐ विष्णुर्विष्णुर्विष्णुः । श्रीमद्भगवतो महापुरुषस्य विष्णोराज्ञया प्रवर्तमानस्य अद्य ब्रह्मणो द्वितीये परार्धे ',
    'श्रीश्वेतवाराहकल्पे वैवस्वतमन्वन्तरे अष्टाविंशतितमे युगे कलियुगे प्रथमचरणे जम्बुद्वीपे भरतवर्षे भरतखण्डे ',
    'दक्षिणापथे ', V(f.place || e.place, 'स्थान'), ' क्षेत्रे बौद्धावतारे ',
    '\n\nशालिवाहन शके ', V(DEV(e.shaka)), ' ', V(e.samvatsar), ' नाम संवत्सरे ',
  ];
  if (e.ayana) out.push(V(e.ayana), ' ');
  if (e.ritu) out.push(V(e.ritu), ' ऋतौ ');
  out.push(full ? 'महामाङ्गल्यप्रदे मासोत्तमे ' : '', V(e.maas), ' मासे ', V(e.paksha), ' पक्षे ', V(e.tithi), ' तिथौ ',
    V(e.vaar), ' शुभवासरे');
  if (full) {
    out.push(' ', V(e.nakshatra), ' नक्षत्रे ', V(e.yoga), ' योगे ', V(e.karana), ' करणे');
    out.push('\n\n');
    e.grahas.forEach(([r, loc], i) => out.push(V(r), ` राशिस्थिते ${loc}`, i < e.grahas.length - 1 ? ', ' : ''));
    out.push(' एवं ग्रहगुणविशेषणविशिष्टायां शुभपुण्यतिथौ');
  }
  out.push('\n\n', V(f.gotra, 'गोत्र'), fem ? ' गोत्रोत्पन्ना ' : ' गोत्रोत्पन्नः ', V(f.name, 'नाम'), ' अहं ');
  out.push('मम आत्मनः श्रुतिस्मृतिपुराणोक्तफलप्राप्त्यर्थं मम सकुटुम्बस्य सपरिवारस्य क्षेमस्थैर्यायुरारोग्यैश्वर्याभिवृद्ध्यर्थं ',
    'समस्तदुरितक्षयद्वारा श्रीपरमेश्वरप्रीत्यर्थं ');
  out.push(V(f.puja, 'पूजा / कार्य'), ' करिष्ये ॥');
  return out;
}
const plain = (parts) => parts.map(p => (typeof p === 'string' ? p : p.v)).join('');

export default function SankalpMantra({ data, place }) {
  const [view, setView] = useState(() => load(VIEW_KEY, 'info'));
  const [f, setF] = useState(() => ({ name: '', gotra: '', puja: '', place: '', gender: 'm', ...load(FIELDS_KEY, {}) }));
  const setField = (k, v) => setF(x => { const n = { ...x, [k]: v }; save(FIELDS_KEY, n); return n; });
  const pick = (v) => { setView(v); save(VIEW_KEY, v); };
  const [style, setStyle] = useState(() => load(STYLE_KEY, 'plate'));     // plate | text
  const pickStyle = (v) => { setStyle(v); save(STYLE_KEY, v); };

  const e = useMemo(() => (data ? elements(data, place) : null), [data, place]);
  if (!e) return <div className={s.root}><p className={s.wait}>पंचांग माहिती येत आहे…</p></div>;

  const parts = view === 'info' ? null : build(e, f, view === 'full');
  const copy = async () => {
    try { await navigator.clipboard.writeText(plain(parts)); toast.success('संकल्प कॉपी केला'); }
    catch { toast.error('कॉपी करता आले नाही'); }
  };
  const [y, m, d] = data.date.split('-');

  return (
    <div className={s.root}>
      <h2 className={s.title}>संकल्प मंत्र</h2>
      <p className={s.when}>
        {Number(d)}-{Number(m)}-{y} · {data.selectedTime} · {place} — या क्षणाच्या पंचांगानुसार
      </p>

      <div className={s.tabs} role="tablist">
        {[['info', 'माहिती'], ['short', 'लघु'], ['full', 'विस्तृत']].map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k}
            className={`${s.tab} ${view === k ? s.tabOn : ''}`} onClick={() => pick(k)}>{label}</button>
        ))}
      </div>

      {view === 'info' ? (
        <>
          <ul className={s.list}>
            <li><b>शालिवाहन शके {DEV(e.shaka)}</b><span>{e.samvatsar} नाम संवत्सरे</span></li>
            {e.ayana && <li><b>{e.ayana}</b><span>{e.ayanaMr}</span></li>}
            {e.ritu && <li><b>{e.ritu} ऋतौ</b><span>{e.rituMr} ऋतू</span></li>}
            <li><b>{e.maas} मासे</b><span>{data.maas} महिना (अमांत)</span></li>
            <li><b>{e.paksha} पक्षे</b><span>{data.paksha}</span></li>
            <li><b>{e.tithi} तिथौ</b><span>{data.tithi?.name}</span></li>
            <li><b>{e.vaar} शुभवासरे</b><span>{data.var}</span></li>
            <li><b>{e.nakshatra} नक्षत्रे</b><span>{data.nakshatra}</span></li>
            <li><b>{e.yoga} योगे</b><span>{data.yoga}</span></li>
            <li><b>{e.karana} करणे</b><span>{data.karana}</span></li>
          </ul>
          <ul className={`${s.list} ${s.grahaList}`}>
            {e.grahas.map(([r, loc]) => <li key={loc}><b>{r} राशिस्थिते {loc}</b></li>)}
          </ul>
          <p className={s.note}>
            संकल्प ज्या क्षणी करता त्या क्षणाची तिथी, नक्षत्र, योग व करण घ्यावे — वर तारीख, वेळ व जिल्हा बदलल्यास हा
            संकल्प त्याप्रमाणे बदलतो. ऋतू चांद्रमासानुसार, अयन निरयन. स्थानिक आचारानुसार शब्दरचनेत थोडा फरक असू शकतो.
          </p>
        </>
      ) : (
        <>
          <div className={s.form}>
            <label>नाव<input value={f.name} onChange={ev => setField('name', ev.target.value)} placeholder="उदा. रामचंद्र शर्मा" /></label>
            <label>गोत्र<input value={f.gotra} onChange={ev => setField('gotra', ev.target.value)} placeholder="उदा. काश्यप" /></label>
            <label>पूजा / कार्य<input value={f.puja} onChange={ev => setField('puja', ev.target.value)} placeholder="उदा. श्रीगणपतिपूजनं" /></label>
            <label>स्थान<input value={f.place} onChange={ev => setField('place', ev.target.value)} placeholder={place} /></label>
            <div className={s.gender} role="radiogroup" aria-label="संकल्प करणारे">
              {[['m', 'पुरुष (उत्पन्नः)'], ['f', 'स्त्री (उत्पन्ना)']].map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={f.gender === k}
                  className={`${s.chip} ${f.gender === k ? s.chipOn : ''}`} onClick={() => setField('gender', k)}>{label}</button>
              ))}
            </div>
          </div>
          <div className={s.styleRow} role="radiogroup" aria-label="दाखवण्याची पद्धत">
            {[['plate', '📜 ताम्रपत्र'], ['text', '📝 मजकूर']].map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={style === k}
                className={`${s.chip} ${style === k ? s.chipOn : ''}`} onClick={() => pickStyle(k)}>{label}</button>
            ))}
          </div>
          {style === 'plate' ? (
            <Tamrapatra parts={parts} title={view === 'full' ? 'विस्तृत संकल्पः' : 'संकल्पः'}
              footer={`${Number(d)}-${Number(m)}-${y} · ${data.selectedTime} · ${f.place || place}`} />
          ) : (
            <p className={s.mantra} lang="sa">
              {parts.map((p, i) => (typeof p === 'string'
                ? <span key={i}>{p}</span>
                : <span key={i} className={p.empty ? s.ph : s.val}>{p.v}</span>))}
            </p>
          )}
          <div className={s.actions}>
            <button type="button" className={s.copy} onClick={copy}>📋 संकल्प कॉपी करा</button>
          </div>
        </>
      )}
    </div>
  );
}
