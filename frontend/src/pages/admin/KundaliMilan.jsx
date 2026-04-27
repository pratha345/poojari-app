// src/pages/admin/KundaliMilan.jsx — कुंडली मिलान (Admin Only)
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { kundaliAPI } from '../../api/index.js';
import styles from '../../styles/KundaliMilan.module.css';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const PRESET_CITIES = [
  { name: 'पुणे',       lat: '18.5204', lon: '73.8567' },
  { name: 'मुंबई',      lat: '19.0760', lon: '72.8777' },
  { name: 'नाशिक',     lat: '20.0059', lon: '73.7898' },
  { name: 'नागपूर',     lat: '21.1458', lon: '79.0882' },
  { name: 'औरंगाबाद',  lat: '19.8762', lon: '75.3433' },
  { name: 'कोल्हापूर',  lat: '16.6975', lon: '74.2282' },
  { name: 'सोलापूर',    lat: '17.6805', lon: '75.9064' },
  { name: 'नवी दिल्ली', lat: '28.6139', lon: '77.2090' },
];

const EMPTY_PERSON = { name: '', dob: '', tob: '', city: '' };

const GRADE_COLORS = { 'A+': '#2e7d32', A: '#388e3c', B: '#f57f17', C: '#e65100', D: '#c62828' };

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

/* ── Person form (bride OR groom) ── */
function PersonForm({ label, icon, color, data, onChange }) {
  return (
    <div className={styles.personCard} style={{ '--person-color': color }}>
      <div className={styles.personHeader}>
        <span className={styles.personIcon}>{icon}</span>
        <h3 className={styles.personTitle}>{label}</h3>
      </div>

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.fieldLabel}>👤 नाव *</label>
          <input
            className={styles.input}
            type="text"
            placeholder={`${label} चे नाव`}
            value={data.name}
            onChange={e => onChange('name', e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>📅 जन्मतारीख *</label>
          <input
            className={styles.input}
            type="date"
            value={data.dob}
            onChange={e => onChange('dob', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>🕐 जन्मवेळ <span className={styles.optional}>(ऐच्छिक)</span></label>
          <input
            className={styles.input}
            type="time"
            value={data.tob}
            onChange={e => onChange('tob', e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>📍 शहर <span className={styles.optional}>(ऐच्छिक)</span></label>
          <select
            className={styles.input}
            value={data.city}
            onChange={e => onChange('city', e.target.value)}
          >
            <option value="">-- शहर निवडा --</option>
            {PRESET_CITIES.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ── Score bar ── */
function ScoreBar({ score, max, status }) {
  const pct = (score / max) * 100;
  const barColor = status === 'good' ? '#2e7d32' : status === 'average' ? '#f57f17' : '#c62828';
  return (
    <div className={styles.scoreBar}>
      <div
        className={styles.scoreBarFill}
        style={{ width: `${pct}%`, background: barColor }}
      />
    </div>
  );
}

/* ── Gun Milan result table ── */
function GunTable({ kootas }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>कूट</th>
            <th>Koota</th>
            <th>गुण</th>
            <th>कमाल</th>
            <th>बार</th>
            <th>तपशील</th>
          </tr>
        </thead>
        <tbody>
          {kootas.map((k, i) => (
            <tr key={i} className={styles[`row_${k.status}`]}>
              <td className={styles.tdKoota}>{k.name}</td>
              <td className={styles.tdEn}>{k.nameEn}</td>
              <td className={styles.tdScore}>
                <span className={`${styles.scoreBadge} ${styles[`badge_${k.status}`]}`}>
                  {k.score}
                </span>
              </td>
              <td className={styles.tdMax}>{k.max}</td>
              <td className={styles.tdBar}>
                <ScoreBar score={k.score} max={k.max} status={k.status} />
              </td>
              <td className={styles.tdNote}>{k.note}</td>
            </tr>
          ))}
          {/* Total row */}
          <tr className={styles.totalRow}>
            <td colSpan={2}><strong>एकूण (Total)</strong></td>
            <td>
              <strong className={styles.totalScore}>
                {kootas.reduce((s, k) => s + k.score, 0)}
              </strong>
            </td>
            <td><strong>36</strong></td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ── North Indian Kundali grid (single person) ── */
const KUNDALI_HOUSES = [
  { num: 12, rashi: 'मीन',    sym: '♓', col: 1, row: 1 },
  { num:  1, rashi: 'मेष',    sym: '♈', col: 2, row: 1 },
  { num:  2, rashi: 'वृषभ',   sym: '♉', col: 3, row: 1 },
  { num:  3, rashi: 'मिथुन',  sym: '♊', col: 4, row: 1 },
  { num: 11, rashi: 'कुंभ',   sym: '♒', col: 1, row: 2 },
  { num:  4, rashi: 'कर्क',   sym: '♋', col: 4, row: 2 },
  { num: 10, rashi: 'मकर',    sym: '♑', col: 1, row: 3 },
  { num:  5, rashi: 'सिंह',   sym: '♌', col: 4, row: 3 },
  { num:  9, rashi: 'धनु',    sym: '♐', col: 1, row: 4 },
  { num:  8, rashi: 'वृश्चिक',sym: '♏', col: 2, row: 4 },
  { num:  7, rashi: 'तुला',   sym: '♎', col: 3, row: 4 },
  { num:  6, rashi: 'कन्या',  sym: '♍', col: 4, row: 4 },
];

function MiniKundali({ label, color, moonRashi, sunRashi }) {
  return (
    <div className={styles.miniKundaliWrap}>
      <h4 className={styles.miniLabel} style={{ color }}>{label}</h4>
      <div className={styles.miniGrid}>
        {KUNDALI_HOUSES.map(h => {
          const isMoon = h.rashi === moonRashi;
          const isSun  = h.rashi === sunRashi;
          return (
            <div
              key={h.num}
              className={`${styles.miniHouse} ${isMoon ? styles.miniMoon : ''} ${isSun ? styles.miniSun : ''}`}
              style={{ gridColumn: h.col, gridRow: h.row, '--hc': color }}
            >
              <span className={styles.miniHouseNum}>{h.num}</span>
              <span className={styles.miniRashi}>{h.rashi}</span>
              {isMoon && <span className={styles.miniPlanet}>☽</span>}
              {isSun  && <span className={styles.miniPlanet}>☀</span>}
            </div>
          );
        })}
        {/* Center */}
        <div className={styles.miniCenter}>
          <span>🕉</span>
        </div>
      </div>
    </div>
  );
}

/* ── Result summary card ── */
function ResultSummary({ result }) {
  const { totalGun, maxGun, percent, result: verdict, grade, doshas, recommendation, bride, groom } = result;
  const gradeColor = GRADE_COLORS[grade] || '#666';

  return (
    <div className={styles.resultSummary}>
      {/* Score circle */}
      <div className={styles.scoreCircle} style={{ '--gc': gradeColor }}>
        <span className={styles.scoreNum}>{totalGun}</span>
        <span className={styles.scoreDen}>/{maxGun}</span>
        <span className={styles.gradeBadge} style={{ background: gradeColor }}>{grade}</span>
      </div>

      {/* Verdict */}
      <div className={styles.verdictBlock}>
        <h3 className={styles.verdict} style={{ color: gradeColor }}>{verdict}</h3>
        <p className={styles.verdictPct}>{percent}% जुळणी</p>

        {/* Dosha alerts */}
        {doshas?.length > 0 && (
          <div className={styles.doshaList}>
            {doshas.map((d, i) => (
              <span key={i} className={styles.doshaChip}>⚠️ {d}</span>
            ))}
          </div>
        )}

        {/* Persons summary */}
        <div className={styles.personsSummary}>
          <div className={styles.pSumCard} style={{ borderColor: '#e91e8c' }}>
            <span className={styles.pSumIcon}>👰</span>
            <div>
              <span className={styles.pSumName}>{bride.name}</span>
              <span className={styles.pSumDetails}>{bride.nakshatra} | {bride.rashi}</span>
            </div>
          </div>
          <span className={styles.pSumHeart}>💕</span>
          <div className={styles.pSumCard} style={{ borderColor: '#1565c0' }}>
            <span className={styles.pSumIcon}>🤵</span>
            <div>
              <span className={styles.pSumName}>{groom.name}</span>
              <span className={styles.pSumDetails}>{groom.nakshatra} | {groom.rashi}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Previous matches row ── */
function MatchRow({ record, onView, onDelete }) {
  const gc = GRADE_COLORS[record.grade] || '#666';
  return (
    <div className={styles.matchRow}>
      <div className={styles.matchNames}>
        <span className={styles.matchBride}>👰 {record.bride_name}</span>
        <span>+</span>
        <span className={styles.matchGroom}>🤵 {record.groom_name}</span>
      </div>
      <div className={styles.matchMeta}>
        <span className={styles.matchDate}>
          {new Date(record.created_at).toLocaleDateString('mr-IN')}
        </span>
        <span className={styles.matchGrade} style={{ background: gc }}>
          {record.total_gun}/36 · {record.grade}
        </span>
        <span className={styles.matchVerdict}>{record.match_result}</span>
      </div>
      <div className={styles.matchActions}>
        <button className={styles.viewBtn} onClick={() => onView(record.id)}>पहा</button>
        <button className={styles.delBtn}  onClick={() => onDelete(record.id)}>🗑️</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function KundaliMilan() {
  const [bride,     setBride]     = useState({ ...EMPTY_PERSON });
  const [groom,     setGroom]     = useState({ ...EMPTY_PERSON });
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [saved,     setSaved]     = useState(false);
  const [matches,   setMatches]   = useState([]);
  const [listLoad,  setListLoad]  = useState(true);
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('match'); // 'match' | 'history'

  // Load saved matches on mount
  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async (q = '') => {
    setListLoad(true);
    try {
      const res = await kundaliAPI.list({ search: q });
      setMatches(res.data.data.rows || []);
    } catch { /* silent */ }
    finally { setListLoad(false); }
  };

  // ── Match submit ──────────────────────────────────────────────
  const handleMatch = async (e) => {
    e.preventDefault();
    if (!bride.name || !bride.dob) { setError('वधूचे नाव व जन्मतारीख आवश्यक आहे.'); return; }
    if (!groom.name || !groom.dob) { setError('वराचे नाव व जन्मतारीख आवश्यक आहे.'); return; }

    setLoading(true); setError(''); setResult(null); setSaved(false);
    try {
      const res = await kundaliAPI.match({ bride, groom });
      setResult(res.data.data);
      setActiveTab('match');
      // Scroll to result
      setTimeout(() => document.getElementById('kundali-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'मिलान करताना त्रुटी झाली.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save result ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await kundaliAPI.save({ bride, groom });
      setSaved(true);
      loadMatches();
    } catch (err) {
      setError(err.response?.data?.message || 'जतन करताना त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('ही नोंद हटवायची आहे का?')) return;
    try {
      await kundaliAPI.delete(id);
      setMatches(m => m.filter(r => r.id !== id));
    } catch { setError('हटवताना त्रुटी झाली.'); }
  };

  // ── View saved match ─────────────────────────────────────────
  const handleView = async (id) => {
    try {
      const res  = await kundaliAPI.get(id);
      const rec  = res.data.data;
      // Reconstruct a result-shaped object to display
      const displayResult = {
        totalGun:      rec.total_gun,
        maxGun:        36,
        percent:       Math.round((rec.total_gun / 36) * 100),
        result:        rec.match_result,
        grade:         rec.grade,
        kootas:        rec.details,
        doshas:        rec.doshas || [],
        recommendation: rec.recommendation,
        bride: {
          name:         rec.bride_name,
          dob:          rec.bride_dob,
          city:         rec.bride_city,
          nakshatraIdx: rec.bride_nak_idx,
          rashiIdx:     rec.bride_rashi_idx,
          nakshatra:    NAKSHATRA_MR[rec.bride_nak_idx] || '',
          rashi:        RASHI_MR[rec.bride_rashi_idx]   || '',
        },
        groom: {
          name:         rec.groom_name,
          dob:          rec.groom_dob,
          city:         rec.groom_city,
          nakshatraIdx: rec.groom_nak_idx,
          rashiIdx:     rec.groom_rashi_idx,
          nakshatra:    NAKSHATRA_MR[rec.groom_nak_idx] || '',
          rashi:        RASHI_MR[rec.groom_rashi_idx]   || '',
        },
      };
      setResult(displayResult);
      setActiveTab('match');
      setBride({ name: rec.bride_name, dob: rec.bride_dob?.split('T')[0] || '', tob: rec.bride_tob || '', city: rec.bride_city || '' });
      setGroom({ name: rec.groom_name, dob: rec.groom_dob?.split('T')[0] || '', tob: rec.groom_tob || '', city: rec.groom_city || '' });
      setTimeout(() => document.getElementById('kundali-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch { setError('नोंद उघडताना त्रुटी झाली.'); }
  };

  // ── Print / Export ───────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Reset ────────────────────────────────────────────────────
  const handleReset = () => {
    setBride({ ...EMPTY_PERSON });
    setGroom({ ...EMPTY_PERSON });
    setResult(null);
    setError('');
    setSaved(false);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className="container">

          {/* Page header */}
          <div className={styles.pageHeader}>
            <Link to="/admin" className={styles.backLink}>← प्रशासन</Link>
            <div className={styles.pageTitle}>
              <span className={styles.pageTitleIcon}>🔯</span>
              <div>
                <h1>कुंडली मिलान</h1>
                <p>अष्ट कूट गुण मिलान प्रणाली</p>
              </div>
            </div>
            <span className={styles.adminBadge}>Admin Only</span>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'match' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('match')}
            >🔯 गुण मिलान करा</button>
            <button
              className={`${styles.tab} ${activeTab === 'history' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📜 जुनी नोंदी
              {matches.length > 0 && <span className={styles.tabCount}>{matches.length}</span>}
            </button>
          </div>

          {error && <div className={styles.errorBox}>❌ {error}</div>}

          {/* ═══ TAB: MATCH ═══════════════════════════════════ */}
          {activeTab === 'match' && (
            <>
              {/* Form */}
              <form className={styles.matchForm} onSubmit={handleMatch}>
                <div className={styles.personsRow}>
                  <PersonForm
                    label="वधू (Bride)"
                    icon="👰"
                    color="#e91e8c"
                    data={bride}
                    onChange={(f, v) => setBride(p => ({ ...p, [f]: v }))}
                  />
                  <div className={styles.vs}>
                    <span>VS</span>
                    <span className={styles.vsHeart}>💕</span>
                  </div>
                  <PersonForm
                    label="वर (Groom)"
                    icon="🤵"
                    color="#1565c0"
                    data={groom}
                    onChange={(f, v) => setGroom(p => ({ ...p, [f]: v }))}
                  />
                </div>

                <div className={styles.formActions}>
                  <button type="submit" className={`btn btn-primary ${styles.matchBtn}`} disabled={loading}>
                    {loading ? '⏳ गणना होत आहे...' : '🔯 कुंडली जुळणी करा'}
                  </button>
                  <button type="button" className={`btn btn-secondary ${styles.resetBtn}`} onClick={handleReset}>
                    🔄 रीसेट
                  </button>
                </div>
              </form>

              {/* Results */}
              {loading && (
                <div className={styles.loadingCard}>
                  <div className={styles.loadingSpinner} />
                  <p>कुंडली मिलान गणना होत आहे...</p>
                </div>
              )}

              {result && !loading && (
                <div id="kundali-result" className={styles.resultSection}>

                  {/* Summary */}
                  <div className={styles.resultCard}>
                    <h2 className={styles.sectionTitle}>📊 मिलान सारांश</h2>
                    <ResultSummary result={result} />
                  </div>

                  {/* Recommendation */}
                  <div className={styles.recommendationCard}>
                    <span className={styles.recIcon}>💬</span>
                    <div>
                      <strong>ज्योतिष शिफारस:</strong>
                      <p>{result.recommendation}</p>
                    </div>
                  </div>

                  {/* Ashta Koota table */}
                  <div className={styles.resultCard}>
                    <h2 className={styles.sectionTitle}>📋 अष्ट कूट तक्ता</h2>
                    <GunTable kootas={result.kootas} />
                  </div>

                  {/* Dual Kundali charts */}
                  <div className={styles.resultCard}>
                    <h2 className={styles.sectionTitle}>🔮 कुंडली चार्ट</h2>
                    <div className={styles.kundaliRow}>
                      <MiniKundali
                        label={`👰 ${result.bride.name} (वधू)`}
                        color="#e91e8c"
                        moonRashi={result.bride.rashi}
                      />
                      <MiniKundali
                        label={`🤵 ${result.groom.name} (वर)`}
                        color="#1565c0"
                        moonRashi={result.groom.rashi}
                      />
                    </div>
                    <p className={styles.kundaliNote}>
                      ℹ️ रंगीत घर = चंद्र राशी. उत्तर भारतीय पद्धत (राशी स्थिर).
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className={styles.resultActions}>
                    {!saved ? (
                      <button
                        className={`btn btn-primary ${styles.saveBtn}`}
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? '⏳ जतन होत आहे...' : '💾 नोंद जतन करा'}
                      </button>
                    ) : (
                      <span className={styles.savedBadge}>✅ नोंद जतन झाली!</span>
                    )}
                    <button className={`btn btn-secondary ${styles.printBtn}`} onClick={handlePrint}>
                      🖨️ प्रिंट / PDF
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ TAB: HISTORY ══════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className={styles.historySection}>
              <div className={styles.historyTop}>
                <input
                  className={styles.searchInput}
                  type="text"
                  placeholder="नाव शोधा..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); loadMatches(e.target.value); }}
                />
              </div>

              {listLoad ? (
                <div className={styles.loadingCard}><div className={styles.loadingSpinner}/><p>लोड होत आहे...</p></div>
              ) : matches.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>📭</span>
                  <p>अजून कोणतीही कुंडली जतन केलेली नाही.</p>
                </div>
              ) : (
                <div className={styles.matchList}>
                  {matches.map(rec => (
                    <MatchRow
                      key={rec.id}
                      record={rec}
                      onView={handleView}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}

// Local nakshatra/rashi name arrays for viewing saved records
const NAKSHATRA_MR = [
  'अश्विनी','भरणी','कृत्तिका','रोहिणी','मृगशिरा','आर्द्रा','पुनर्वसु','पुष्य','अश्लेषा','मघा',
  'पूर्वा फाल्गुनी','उत्तरा फाल्गुनी','हस्त','चित्रा','स्वाती','विशाखा','अनुराधा','ज्येष्ठा',
  'मूळ','पूर्वाषाढा','उत्तराषाढा','श्रवण','धनिष्ठा','शतभिषा','पूर्वाभाद्रपदा','उत्तराभाद्रपदा','रेवती',
];
const RASHI_MR = [
  'मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या',
  'तुला','वृश्चिक','धनु','मकर','कुंभ','मीन',
];
