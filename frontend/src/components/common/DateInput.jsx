import { useRef, useState, useEffect } from 'react';
import s from './DateInput.module.css';

const MONTHS_MR = ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'];
const DAYS_MR   = ['र','सो','मं','बु','गु','शु','श'];

export default function DateInput({ value = '', onChange, required }) {
  const [dd,      setDD]      = useState('');
  const [mm,      setMM]      = useState('');
  const [yyyy,    setYYYY]    = useState('');
  const [showCal, setShowCal] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMon,  setCalMon]  = useState(new Date().getMonth()); // 0-11

  const ddRef   = useRef(null);
  const mmRef   = useRef(null);
  const yyyyRef = useRef(null);
  const wrapRef = useRef(null);

  // Sync from external YYYY-MM-DD
  useEffect(() => {
    if (value) {
      const [y, mo, d] = value.split('-');
      setDD(d || ''); setMM(mo || ''); setYYYY(y || '');
      if (y) setCalYear(parseInt(y));
      if (mo) setCalMon(parseInt(mo) - 1);
    } else { setDD(''); setMM(''); setYYYY(''); }
  }, [value]);

  // Close calendar on outside click
  useEffect(() => {
    if (!showCal) return;
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showCal]);

  const emit = (d, m, y) => {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      const dN = parseInt(d), mN = parseInt(m), yN = parseInt(y);
      if (dN >= 1 && dN <= 31 && mN >= 1 && mN <= 12 && yN >= 1900 && yN <= 2100)
        onChange(`${y}-${m}-${d}`);
    }
  };

  const handleDD = e => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDD(v); emit(v, mm, yyyy);
    if (v.length === 2) mmRef.current?.focus();
  };
  const handleMM = e => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMM(v); emit(dd, v, yyyy);
    if (v.length === 2) yyyyRef.current?.focus();
  };
  const handleYYYY = e => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYYYY(v); emit(dd, mm, v);
    if (v.length === 4) setShowCal(false);
  };
  const handleMMKey  = e => { if (e.key === 'Backspace' && mm   === '') ddRef.current?.focus(); };
  const handleYKey   = e => { if (e.key === 'Backspace' && yyyy === '') mmRef.current?.focus(); };

  // Calendar helpers
  const daysInMonth  = new Date(calYear, calMon + 1, 0).getDate();
  const firstWeekDay = new Date(calYear, calMon, 1).getDay(); // 0=Sun
  const today        = new Date();

  const calCells = [];
  for (let i = 0; i < firstWeekDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d);

  const selectDay = (d) => {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(calMon + 1).padStart(2, '0');
    const yStr = String(calYear);
    setDD(dStr); setMM(mStr); setYYYY(yStr);
    onChange(`${yStr}-${mStr}-${dStr}`);
    setShowCal(false);
  };

  const prevMonth = () => { if (calMon === 0) { setCalMon(11); setCalYear(y => y - 1); } else setCalMon(m => m - 1); };
  const nextMonth = () => { if (calMon === 11) { setCalMon(0); setCalYear(y => y + 1); } else setCalMon(m => m + 1); };

  const isSelected = d => parseInt(dd) === d && parseInt(mm) === calMon + 1 && parseInt(yyyy) === calYear;
  const isToday    = d => d === today.getDate() && calMon === today.getMonth() && calYear === today.getFullYear();

  return (
    <div className={s.root} ref={wrapRef}>
      {/* Input row */}
      <div className={s.wrap}>
        <input ref={ddRef}   className={s.seg} value={dd}   onChange={handleDD}   placeholder="DD"   maxLength={2} inputMode="numeric" required={required} />
        <span className={s.sep}>/</span>
        <input ref={mmRef}   className={s.seg} value={mm}   onChange={handleMM}   onKeyDown={handleMMKey} placeholder="MM" maxLength={2} inputMode="numeric" />
        <span className={s.sep}>/</span>
        <input ref={yyyyRef} className={s.seg} value={yyyy} onChange={handleYYYY} onKeyDown={handleYKey}  placeholder="YYYY" maxLength={4} inputMode="numeric" style={{ width: '52px' }} />
        <button type="button" className={s.calBtn} onClick={() => setShowCal(v => !v)} title="Calendar">📅</button>
      </div>

      {/* Calendar Popup */}
      {showCal && (
        <div className={s.cal}>
          {/* Month/Year navigation */}
          <div className={s.calHeader}>
            <button type="button" className={s.navBtn} onClick={prevMonth}>‹</button>
            <span className={s.calTitle}>{MONTHS_MR[calMon]} {calYear}</span>
            <button type="button" className={s.navBtn} onClick={nextMonth}>›</button>
          </div>

          {/* Year quick-nav */}
          <div className={s.yearNav}>
            <button type="button" className={s.yrBtn} onClick={() => setCalYear(y => y - 1)}>◀</button>
            <span className={s.yrLabel}>{calYear}</span>
            <button type="button" className={s.yrBtn} onClick={() => setCalYear(y => y + 1)}>▶</button>
          </div>

          {/* Day headers */}
          <div className={s.calGrid}>
            {DAYS_MR.map(d => <div key={d} className={s.dayHead}>{d}</div>)}

            {/* Day cells */}
            {calCells.map((d, i) => (
              <div
                key={i}
                className={`${s.day} ${!d ? s.empty : ''} ${d && isSelected(d) ? s.selected : ''} ${d && isToday(d) ? s.today : ''}`}
                onClick={() => d && selectDay(d)}
              >
                {d || ''}
              </div>
            ))}
          </div>

          {/* Today button */}
          <div className={s.calFooter}>
            <button type="button" className={s.todayBtn} onClick={() => {
              const t = new Date();
              setCalYear(t.getFullYear()); setCalMon(t.getMonth());
              selectDay(t.getDate());
            }}>आज</button>
            <button type="button" className={s.closeCalBtn} onClick={() => setShowCal(false)}>बंद करा</button>
          </div>
        </div>
      )}
    </div>
  );
}
