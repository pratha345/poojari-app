import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { janamPatrikaAPI } from '../../api/index.js';
import DateInput from '../../components/common/DateInput';
import TimePicker from '../../components/common/TimePicker';
import { MAHARASHTRA_DISTRICTS } from '../../data/maharashtraDistricts.js';
import s from './JanamPatrika.module.css';

const DEFAULT_DISTRICT = MAHARASHTRA_DISTRICTS.find(d => d.en === 'Amravati');

// North Indian chart — house 1 always top-center-left, clockwise
// 4×4 grid: border = 12 houses, center 2×2 = OM
const NI_GRID = [
  {h:12,col:1,row:1},{h:1,col:2,row:1},{h:2,col:3,row:1},{h:3,col:4,row:1},
  {h:11,col:1,row:2},                                    {h:4,col:4,row:2},
  {h:10,col:1,row:3},                                    {h:5,col:4,row:3},
  {h:9,col:1,row:4},{h:8,col:2,row:4},{h:7,col:3,row:4},{h:6,col:4,row:4},
];
const RASHI_S  = ['मेष','वृष','मिथु','कर्क','सिंह','कन्या','तुला','वृश्चि','धनु','मकर','कुंभ','मीन'];
const RASHI_NUM = [1,2,3,4,5,6,7,8,9,10,11,12]; // 1-indexed sign numbers

// ── North Indian Kundali Chart ────────────────────────────
function NIChart({ byHouse, lagnaRashiIdx, title }) {
  const signInHouse = h => (lagnaRashiIdx + h - 1) % 12; // 0-indexed rashi
  return (
    <div className={s.chartWrap}>
      <div className={s.chartTitle}>{title}</div>
      <div className={s.niGrid}>
        {NI_GRID.map(cell => {
          const rashiIdx = signInHouse(cell.h);
          const planets  = byHouse?.[cell.h] || [];
          const isH1     = cell.h === 1;
          return (
            <div key={cell.h}
              className={`${s.niCell} ${isH1 ? s.niH1 : ''}`}
              style={{ gridColumn: cell.col, gridRow: cell.row }}
            >
              <span className={s.niHouseNum}>{cell.h}</span>
              <span className={s.niSign}>{RASHI_NUM[rashiIdx]} {RASHI_S[rashiIdx]}</span>
              {planets.length > 0 && (
                <span className={s.niPlanets}>{planets.join(' ')}</span>
              )}
            </div>
          );
        })}
        <div className={s.niCenter}>🕉</div>
      </div>
    </div>
  );
}

// ── Print HTML Generator (A4, inline styles, Devanagari font) ─
const RASHI_FULL = ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुंभ','मीन'];

function buildNITableHTML(byHouseMap, lagnaRashiIdx) {
  const signInH = h => (lagnaRashiIdx + h - 1) % 12;
  const cell = (h, colSpan = 1, rowSpan = 1) => {
    const ri  = signInH(h);
    const pl  = (byHouseMap[h] || []).join(' ');
    const hl  = h === 1 ? 'background:#fef9c3;border:2px solid #d97706;' : '';
    return `<td colspan="${colSpan}" rowspan="${rowSpan}" style="border:1px solid #c8a87a;padding:4px 3px;vertical-align:top;text-align:center;font-size:9pt;${hl}">
      <div style="font-size:6pt;color:#aaa;text-align:left;">${h}</div>
      <div style="font-size:6pt;color:#7b341e;font-weight:800;border-bottom:1px solid #e8d5b5;">${ri+1} ${RASHI_FULL[ri]}</div>
      <div style="font-size:9pt;font-weight:700;color:#1a1a2e;line-height:1.4;">${pl}</div>
    </td>`;
  };
  return `<table style="width:230px;height:230px;border-collapse:collapse;border:2px solid #7b341e;table-layout:fixed;">
    <tr>${cell(12)}${cell(1)}${cell(2)}${cell(3)}</tr>
    <tr>${cell(11)}<td colspan="2" rowspan="2" style="border:1px solid #c8a87a;text-align:center;vertical-align:middle;font-size:16pt;background:#fff8f0;">🕉</td>${cell(4)}</tr>
    <tr>${cell(10)}${cell(5)}</tr>
    <tr>${cell(9)}${cell(8)}${cell(7)}${cell(6)}</tr>
  </table>`;
}

function buildPrintHTML(data) {
  const { info, panchang, planets, byHouse, lagnaRashiIdx, dasha } = data;

  // Rashi chart: moon as H1
  const moonRashi = planets.find(p => p.key === 'moon')?.rashiIdx ?? 0;
  const rashiByH  = {};
  for (let h = 1; h <= 12; h++) rashiByH[h] = [];
  planets.forEach(p => { const h = ((p.rashiIdx - moonRashi + 12) % 12) + 1; rashiByH[h].push(p.short); });
  rashiByH[1] = ['च', ...rashiByH[1]];

  const today = new Date().toLocaleDateString('mr-IN', { day:'2-digit', month:'2-digit', year:'numeric' });

  const panchangRows = [
    ['वार', panchang.vara],        ['विक्रम संवत', panchang.samvat],
    ['हिंदू मास', panchang.mas],   ['पक्ष', panchang.paksha],
    ['तिथी', panchang.tithi],       ['नक्षत्र', panchang.nakshatra],
    ['राशी', panchang.rashi],       ['लग्न', panchang.lagna],
    ['योग', panchang.yoga],          ['करण', panchang.karana],
  ].map(([k,v]) => `<tr><td style="font-weight:700;color:#7b341e;padding:4px 10px 4px 0;width:130px;border-bottom:1px solid #f0e0c0;">${k}</td><td style="padding:4px 0;border-bottom:1px solid #f0e0c0;">${v}</td></tr>`).join('');

  const planetRows = [...planets, { name:'लग्न', rashiIdx: lagnaRashiIdx, degree: data.lagna.degree }]
    .map(p => `<tr><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${p.name}</td><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${RASHI_FULL[p.rashiIdx]}</td><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${p.degree}°</td></tr>`).join('');

  const dashaRows = dasha.sequence.map((d,i) => {
    const isCur = d.lord === dasha.current?.lord;
    const bg    = isCur ? 'background:#e8f5e9;font-weight:700;' : '';
    return `<tr style="${bg}"><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${d.lord}${isCur?' ◀':''}</td><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${d.years} वर्षे</td><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${d.start}</td><td style="padding:4px 8px;border-bottom:1px solid #f0e0c0;">${d.end}</td></tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="UTF-8">
<title>जन्म पत्रिका — ${info.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Serif Devanagari', serif; background: white; color: #1a1a2e; font-size: 11pt; line-height: 1.5; }
  @page { size: A4 portrait; margin: 12mm 14mm; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  .page { max-width: 182mm; margin: 0 auto; padding: 10px; }
  h1, h2, h3 { font-family: 'Noto Serif Devanagari', serif; }
  table { border-collapse: collapse; }
  .sec-title { font-size: 11pt; font-weight: 800; color: #7b341e; border-bottom: 1px solid #e0c9a0; padding-bottom: 4px; margin: 12px 0 6px; }
  .charts-row { display: flex; gap: 20px; justify-content: center; align-items: flex-start; margin: 10px 0; }
  .chart-box  { display: flex; flex-direction: column; align-items: center; gap: 5px; }
  .chart-title{ font-size: 8pt; font-weight: 700; color: #7b341e; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="text-align:center;border-bottom:2px solid #c8a87a;padding-bottom:10px;margin-bottom:12px;">
    <div style="font-size:20pt;">🕉</div>
    <h1 style="font-size:14pt;color:#7b341e;font-weight:900;margin:4px 0 2px;">|| श्री गणेशाय नमः ||</h1>
    <h2 style="font-size:12pt;color:#555;font-weight:700;">जन्म पत्रिका</h2>
    <div style="color:#c8a87a;font-size:10pt;margin-top:4px;">✦ ──────── ✦ ──────── ✦</div>
  </div>

  <!-- Personal Info -->
  <table style="width:100%;font-size:10pt;">
    <tr>
      <td style="font-weight:700;color:#7b341e;width:80px;padding:3px 8px 3px 0;">नाव</td>
      <td style="width:40%;padding:3px 8px 3px 0;">${info.name}</td>
      <td style="font-weight:700;color:#7b341e;width:80px;padding:3px 8px 3px 0;">जन्म तारीख</td>
      <td style="padding:3px 0;">${info.dob}</td>
    </tr>
    <tr>
      <td style="font-weight:700;color:#7b341e;padding:3px 8px 3px 0;">जन्म वेळ</td>
      <td style="padding:3px 8px 3px 0;">${info.tob || '—'}</td>
      <td style="font-weight:700;color:#7b341e;padding:3px 8px 3px 0;">जन्म स्थळ</td>
      <td style="padding:3px 0;">${info.place || '—'}</td>
    </tr>
  </table>

  <!-- Charts -->
  <div class="sec-title">🔮 कुंडली चार्ट</div>
  <div class="charts-row">
    <div class="chart-box">
      <div class="chart-title">जन्म कुंडली (लग्न चार्ट)</div>
      ${buildNITableHTML(byHouse, lagnaRashiIdx)}
    </div>
    <div class="chart-box">
      <div class="chart-title">राशी कुंडली (चंद्र चार्ट)</div>
      ${buildNITableHTML(rashiByH, moonRashi)}
    </div>
  </div>

  <!-- Panchang -->
  <div class="sec-title">🗓️ पंचांग विवरण</div>
  <table style="width:100%;font-size:10pt;">${panchangRows}</table>

  <!-- Planets + Dasha side by side -->
  <div style="display:flex;gap:16px;margin-top:2px;">
    <div style="flex:1;">
      <div class="sec-title">🪐 ग्रह स्थिती</div>
      <table style="width:100%;font-size:9.5pt;">
        <thead><tr style="background:#7b341e;color:#fff;"><th style="padding:5px 8px;text-align:left;">ग्रह</th><th style="padding:5px 8px;text-align:left;">राशी</th><th style="padding:5px 8px;text-align:left;">अंश</th></tr></thead>
        <tbody>${planetRows}</tbody>
      </table>
    </div>
    <div style="flex:1.4;">
      <div class="sec-title">⏳ विमशोत्तरी दशा</div>
      <div style="font-size:9.5pt;margin-bottom:5px;padding:5px 8px;background:#fff3cd;border-left:3px solid #f59e0b;">
        जन्म दशा: <b>${dasha.balance.lord}</b> — शिल्लक: <b>${dasha.balance.years} वर्षे</b>
      </div>
      <table style="width:100%;font-size:9pt;">
        <thead><tr style="background:#7b341e;color:#fff;"><th style="padding:4px 8px;text-align:left;">महादशा</th><th style="padding:4px 8px;text-align:left;">वर्षे</th><th style="padding:4px 8px;text-align:left;">प्रारंभ</th><th style="padding:4px 8px;text-align:left;">समाप्ती</th></tr></thead>
        <tbody>${dashaRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;margin-top:14px;border-top:2px solid #c8a87a;padding-top:10px;color:#7b341e;">
    <div style="font-size:10pt;color:#c8a87a;">✦ ──────── ✦ ──────── ✦</div>
    <p style="font-size:11pt;margin:4px 0;">🕉 शुभं भवतु 🕉</p>
    <p style="font-size:8pt;color:#aaa;">निर्मिती तारीख: ${today} | पूजारी — Pojjari</p>
  </div>

</div>
</body>
</html>`;
}

// Build byHouse map with Moon as H1 (for Rashi chart)
function buildRashiChart(planets) {
  const moon = planets.find(p => p.key === 'moon');
  const moonRashi = moon ? moon.rashiIdx : 0;
  const bh = {};
  for (let h = 1; h <= 12; h++) bh[h] = [];
  planets.forEach(p => {
    const h = ((p.rashiIdx - moonRashi + 12) % 12) + 1;
    bh[h].push(p.short);
  });
  bh[1] = ['च', ...bh[1]];
  return bh;
}

// ── Printable Janam Patrika ───────────────────────────────
function PatrikaPreview({ data, printRef }) {
  const { info, panchang, planets, byHouse, lagnaRashiIdx, lagna, dasha } = data;

  const today = new Date().toLocaleDateString('mr-IN', { day:'2-digit', month:'2-digit', year:'numeric' });

  return (
    <div ref={printRef} className={s.patrika}>
      {/* Header */}
      <div className={s.pHeader}>
        <div className={s.pOm}>🕉</div>
        <h1 className={s.pTitle}>|| श्री गणेशाय नमः ||</h1>
        <h2 className={s.pSubtitle}>जन्म पत्रिका</h2>
        <div className={s.pDecor}>✦ ──────── ✦ ──────── ✦</div>
      </div>

      {/* Personal Info */}
      <div className={s.pSection}>
        <table className={s.pInfoTable}>
          <tbody>
            <tr><td className={s.pLabel}>नाव</td><td className={s.pValue}>{info.name}</td>
                <td className={s.pLabel}>जन्म तारीख</td><td className={s.pValue}>{info.dob}</td></tr>
            <tr><td className={s.pLabel}>जन्म वेळ</td><td className={s.pValue}>{info.tob}</td>
                <td className={s.pLabel}>जन्म स्थळ</td><td className={s.pValue}>{info.place}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Kundali Charts — North Indian style */}
      <div className={s.pCharts}>
        <NIChart byHouse={byHouse} lagnaRashiIdx={lagnaRashiIdx} title="जन्म कुंडली (लग्न चार्ट)" />
        <NIChart
          byHouse={buildRashiChart(planets)}
          lagnaRashiIdx={planets.find(p=>p.key==='moon')?.rashiIdx ?? 0}
          title="राशी कुंडली (चंद्र चार्ट)"
        />
      </div>

      {/* Panchang */}
      <div className={s.pSection}>
        <h3 className={s.pSectionTitle}>🗓️ पंचांग विवरण</h3>
        <table className={s.pPanchTable}>
          <tbody>
            {[
              ['वार', panchang.vara],        ['संवत', panchang.samvat],
              ['हिंदू मास', panchang.mas],   ['पक्ष', panchang.paksha],
              ['तिथी', panchang.tithi],       ['नक्षत्र', panchang.nakshatra],
              ['राशी', panchang.rashi],       ['लग्न', panchang.lagna],
              ['योग', panchang.yoga],          ['करण', panchang.karana],
            ].map(([k,v]) => (
              <tr key={k}>
                <td className={s.pPanchLabel}>{k}</td>
                <td className={s.pPanchValue}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Planet positions */}
      <div className={s.pSection}>
        <h3 className={s.pSectionTitle}>🪐 ग्रह स्थिती</h3>
        <table className={s.pPlanetTable}>
          <thead>
            <tr><th>ग्रह</th><th>राशी</th><th>अंश</th></tr>
          </thead>
          <tbody>
            {planets.map(p => (
              <tr key={p.key}>
                <td>{p.name}</td>
                <td>{RASHI_S[p.rashiIdx] || '—'}</td>
                <td>{p.degree}°</td>
              </tr>
            ))}
            <tr>
              <td><strong>लग्न</strong></td>
              <td>{RASHI_S[lagna.rashiIdx]}</td>
              <td>{lagna.degree}°</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dasha */}
      <div className={s.pSection}>
        <h3 className={s.pSectionTitle}>⏳ विमशोत्तरी दशा</h3>
        <div className={s.pDashaBalance}>
          जन्म दशा: <strong>{dasha.balance.lord}</strong> — शिल्लक: <strong>{dasha.balance.years} वर्षे</strong>
        </div>
        <table className={s.pDashaTable}>
          <thead><tr><th>महादशा</th><th>वर्षे</th><th>प्रारंभ</th><th>समाप्ती</th></tr></thead>
          <tbody>
            {dasha.sequence.map((d, i) => {
              const isCurrent = d.lord === dasha.current?.lord;
              return (
                <tr key={i} className={isCurrent ? s.currentDasha : ''}>
                  <td>{d.lord} {isCurrent ? '◀ सध्या' : ''}</td>
                  <td>{d.years} वर्षे</td>
                  <td>{d.start}</td>
                  <td>{d.end}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className={s.pFooter}>
        <div className={s.pDecor}>✦ ──────── ✦ ──────── ✦</div>
        <p>🕉 शुभं भवतु 🕉</p>
        <p className={s.pGenDate}>निर्मिती तारीख: {today}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function JanamPatrika() {
  const [form,    setForm]    = useState({
    name: '', dob: '', tob: '',
    city: DEFAULT_DISTRICT.name,
    lat:  DEFAULT_DISTRICT.lat,
    lon:  DEFAULT_DISTRICT.lon,
  });
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [tab,     setTab]     = useState('form');
  const printRef              = useRef(null);

  const handleDistrictChange = useCallback((e) => {
    const dist = MAHARASHTRA_DISTRICTS.find(d => d.name === e.target.value);
    setForm(f => ({ ...f, city: e.target.value, lat: dist ? dist.lat : '', lon: dist ? dist.lon : '' }));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.dob) { toast.error('नाव आणि जन्मतारीख आवश्यक आहे.'); return; }
    if (!form.lat || !form.lon)  { toast.error('जन्मस्थळ निवडा.'); return; }
    setLoading(true); setData(null); setSaved(false);
    try {
      const res = await janamPatrikaAPI.generate({
        name: form.name, dob: form.dob, tob: form.tob,
        place: form.city, lat: form.lat, lon: form.lon,
      });
      setData(res.data.data);
      setTab('preview');
      toast.success('जन्म पत्रिका तयार झाली!');
    } catch {
      toast.error('जन्म पत्रिका तयार करता आली नाही.');
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await janamPatrikaAPI.save({ name: form.name, dob: form.dob, tob: form.tob, place: form.city, lat: form.lat, lon: form.lon });
      setSaved(true);
      toast.success('जन्म पत्रिका जतन झाली!');
    } catch { toast.error('जतन करता आले नाही.'); }
    finally { setSaving(false); }
  };

  const handlePrint = () => {
    if (!data) return;
    const html = buildPrintHTML(data);
    const win  = window.open('', '_blank', 'width=900,height=700');
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  return (
    <AdminLayout>
      <div className={s.page}>
        <div className={s.pageHeader}>
          <h2 className={s.pageTitle}>📜 जन्म पत्रिका</h2>
          <p className={s.pageSubtitle}>पारंपरिक मराठी जन्म पत्रिका तयार करा</p>
        </div>

        {/* Tabs */}
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab==='form'?s.tabActive:''}`} onClick={()=>setTab('form')}>📝 माहिती भरा</button>
          {data && <button className={`${s.tab} ${tab==='preview'?s.tabActive:''}`} onClick={()=>setTab('preview')}>👁️ पत्रिका पहा</button>}
        </div>

        {/* FORM TAB */}
        {tab === 'form' && (
          <form onSubmit={handleGenerate} className={s.form}>
            <div className={s.formGrid}>
              <label className={s.label}>नाव (Name) *
                <input className={s.input} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="पूर्ण नाव" required />
              </label>
              <label className={s.label}>जन्म तारीख * (DD/MM/YYYY)
                <DateInput value={form.dob} onChange={v=>setForm(f=>({...f,dob:v}))} required />
              </label>
              <label className={s.label}>जन्म वेळ
                <TimePicker value={form.tob} onChange={v=>setForm(f=>({...f,tob:v}))} />
              </label>
              <label className={s.label}>जन्म जिल्हा *
                <select className={s.input} value={form.city} onChange={handleDistrictChange} required>
                  {MAHARASHTRA_DISTRICTS.map(d => (
                    <option key={d.en} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </label>
              <label className={s.label}>Latitude
                <input className={s.input} type="number" step="0.0001" value={form.lat} onChange={e=>setForm(f=>({...f,lat:e.target.value}))} placeholder="18.5204" />
              </label>
              <label className={s.label}>Longitude
                <input className={s.input} type="number" step="0.0001" value={form.lon} onChange={e=>setForm(f=>({...f,lon:e.target.value}))} placeholder="73.8567" />
              </label>
            </div>
            <div className={s.formActions}>
              <button type="submit" className={s.generateBtn} disabled={loading}>
                {loading ? '⏳ गणना होत आहे...' : '📜 जन्म पत्रिका तयार करा'}
              </button>
            </div>
          </form>
        )}

        {/* PREVIEW TAB */}
        {tab === 'preview' && data && (
          <div className={s.previewSection}>
            {/* Action buttons */}
            <div className={s.actionBar}>
              <button className={s.printBtn} onClick={handlePrint}>🖨️ प्रिंट / PDF</button>
              {!saved ? (
                <button className={s.saveBtn} onClick={handleSave} disabled={saving}>
                  {saving ? '⏳...' : '💾 जतन करा'}
                </button>
              ) : (
                <span className={s.savedBadge}>✅ जतन झाली</span>
              )}
              <button className={s.editBtn} onClick={()=>setTab('form')}>✏️ Edit</button>
            </div>

            <PatrikaPreview data={data} printRef={printRef} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
