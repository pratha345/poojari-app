// src/pages/admin/ManageReviews.jsx — Admin: Review Management with Bulk Select
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';

const FILTERS = [
  { value: 'all',      label: '📋 सर्व'       },
  { value: 'pending',  label: '⏳ प्रतीक्षेत'  },
  { value: 'approved', label: '✅ मंजूर'       },
];

function Stars({ rating }) {
  return (
    <span style={{ color: '#f59e0b', letterSpacing: 1, fontSize: 15 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ManageReviews() {
  const [reviews,   setReviews]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('all');
  const [selected,  setSelected]  = useState(new Set()); // selected IDs
  const [actingId,  setActingId]  = useState(null);
  const [bulkBusy,  setBulkBusy]  = useState(false);

  const load = (f = filter) => {
    setLoading(true);
    setSelected(new Set());
    adminAPI.getReviews(f)
      .then(r => setReviews(r.data.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  // Pending reviews — eligible for approval
  const pendingReviews = useMemo(() => reviews.filter(r => !r.is_approved), [reviews]);
  const approvedCount  = useMemo(() => reviews.filter(r => r.is_approved).length, [reviews]);

  // ── Selection helpers ─────────────────────────────────────────
  const isAllPendingSelected = pendingReviews.length > 0 &&
    pendingReviews.every(r => selected.has(r.id));

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllPending = () => {
    if (isAllPendingSelected) {
      setSelected(new Set()); // deselect all
    } else {
      setSelected(new Set(pendingReviews.map(r => r.id))); // select all pending
    }
  };

  // ── Actions ───────────────────────────────────────────────────
  const handleBulkApprove = async () => {
    if (selected.size === 0) { toast.error('कृपया किमान एक अभिप्राय निवडा.'); return; }
    if (!window.confirm(`${selected.size} अभिप्राय एकत्र मंजूर करायचे आहेत का?`)) return;
    setBulkBusy(true);
    try {
      await adminAPI.bulkApproveReviews([...selected]);
      toast.success(`${selected.size} अभिप्राय मंजूर केले! ✅`);
      setSelected(new Set());
      load();
    } catch { toast.error('Bulk approve करताना त्रुटी.'); }
    finally { setBulkBusy(false); }
  };

  const handleApproveOne = async (id) => {
    setActingId(id);
    try {
      await adminAPI.approveReview(id);
      toast.success('अभिप्राय मंजूर केला! ✅');
      load();
    } catch { toast.error('मंजूर करताना त्रुटी.'); }
    finally { setActingId(null); }
  };

  const handleDelete = async (id, comment) => {
    const preview = comment ? `"${comment.slice(0, 40)}..."` : 'हा अभिप्राय';
    if (!window.confirm(`${preview} — कायमचा काढायचा आहे का?`)) return;
    setActingId(id);
    try {
      await adminAPI.deleteReview(id);
      toast.success('अभिप्राय काढला गेला.');
      setReviews(prev => prev.filter(r => r.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch { toast.error('काढताना त्रुटी.'); }
    finally { setActingId(null); }
  };

  return (
    <AdminLayout>
      <div>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <h1 className={styles.pageTitle}>⭐ अभिप्राय व्यवस्थापन</h1>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <span style={{ background:'#fef3c7', color:'#92400e',
                           padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:700 }}>
              ⏳ प्रतीक्षेत: {pendingReviews.length}
            </span>
            <span style={{ background:'#d1fae5', color:'#065f46',
                           padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:700 }}>
              ✅ मंजूर: {approvedCount}
            </span>
          </div>
        </div>

        {/* ── Filter + Bulk Action Bar ────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          {/* Filter tabs */}
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}>
              {f.label}
            </button>
          ))}

          {/* Bulk approve — shows only when something selected */}
          {selected.size > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleBulkApprove}
              disabled={bulkBusy}
              style={{ marginLeft:'auto', background:'#059669', borderColor:'#059669' }}
            >
              {bulkBusy
                ? '⏳ मंजूर करत आहे...'
                : `✅ ${selected.size} निवडलेले मंजूर करा`}
            </button>
          )}
        </div>

        {/* ── Bulk select hint ────────────────────────────────── */}
        {pendingReviews.length > 0 && filter !== 'approved' && (
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe',
                        borderRadius:8, padding:'10px 16px', marginBottom:16,
                        fontSize:13, color:'#1e40af', display:'flex', alignItems:'center', gap:8 }}>
            💡 <strong>Tip:</strong> वरील checkbox वापरून सर्व pending reviews एकत्र select करा,
            मग एकाच click मध्ये सर्व approve करा. खराब reviews आधी 🗑️ ने काढा.
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────── */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:52 }}>⭐</div>
            <p style={{ marginTop:12, fontSize:16, fontWeight:600, color:'var(--secondary)' }}>
              अद्याप कोणताही अभिप्राय नाही.
            </p>
            <div style={{ maxWidth:560, margin:'20px auto 0', background:'#fff8f0', border:'1.5px solid #ffe0b2', borderRadius:12, padding:'20px 24px', textAlign:'left' }}>
              <p style={{ fontWeight:700, color:'var(--secondary)', marginBottom:14, fontSize:14 }}>
                📋 User अभिप्राय कसा देतो — Flow:
              </p>
              {[
                { step:'1', icon:'📋', text:'Admin → Bookings → "🪔 पूर्ण झाली" button दाबा' },
                { step:'2', icon:'📱', text:'User → "माझ्या बुकिंग्ज" (/my-bookings) वर जातो' },
                { step:'3', icon:'⭐', text:'"⭐ अभिप्राय द्या" button दिसतो (फक्त completed बुकिंगवर)' },
                { step:'4', icon:'✍️', text:'User ⭐⭐⭐⭐⭐ stars + comment लिहून "पाठवा" करतो' },
                { step:'5', icon:'✅', text:'Admin येथे "मंजूर" करतो → website वर दिसतो' },
              ].map(s => (
                <div key={s.step} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>
                    {s.step}
                  </span>
                  <span style={{ fontSize:13, color:'var(--text)', paddingTop:3 }}>
                    {s.icon} {s.text}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:14, padding:'10px 14px', background:'#e8f5e9', borderRadius:8, fontSize:13, color:'#2e7d32', display:'flex', alignItems:'center', gap:8 }}>
                💡 <strong>Tip:</strong> आधी Bookings page वर जाऊन एखादी booking "🪔 पूर्ण झाली" करा.
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {/* Select-all header checkbox — only selects pending */}
                  <th style={{ width:40, textAlign:'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllPendingSelected}
                      onChange={toggleAllPending}
                      title="सर्व pending select करा"
                      style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--primary)' }}
                    />
                  </th>
                  <th>रेटिंग</th>
                  <th>अभिप्राय</th>
                  <th>ग्राहक</th>
                  <th>पुजारी</th>
                  <th>पूजा</th>
                  <th>तारीख</th>
                  <th>स्थिती</th>
                  <th>कृती</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => {
                  const isPending  = !r.is_approved;
                  const isSelected = selected.has(r.id);
                  return (
                    <tr key={r.id} style={{
                      background: isSelected ? '#ecfdf5'
                                : isPending  ? '#fffbeb'
                                : '#fff',
                      transition: 'background 0.15s',
                    }}>

                      {/* Checkbox — only pending can be selected */}
                      <td style={{ textAlign:'center' }}>
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(r.id)}
                            style={{ width:16, height:16, cursor:'pointer', accentColor:'var(--primary)' }}
                          />
                        ) : (
                          <span style={{ color:'#9ca3af', fontSize:18 }}>✓</span>
                        )}
                      </td>

                      <td style={{ whiteSpace:'nowrap' }}>
                        <Stars rating={r.rating} />
                        <br />
                        <strong style={{ color:'#f59e0b' }}>{r.rating}/5</strong>
                      </td>

                      <td style={{ maxWidth:200 }}>
                        <p style={{ fontSize:13, lineHeight:1.5, margin:0, color:'var(--text)' }}>
                          {r.comment
                            ? `"${r.comment}"`
                            : <em style={{ color:'var(--text-muted)' }}>कोणताही मजकूर नाही</em>
                          }
                        </p>
                      </td>

                      <td style={{ fontSize:13 }}>📞 {r.user_phone || '—'}</td>
                      <td style={{ fontSize:13 }}>{r.pujari_name || '—'}</td>
                      <td style={{ fontSize:13, maxWidth:120 }}>{r.pooja_name || '—'}</td>

                      <td style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                        {new Date(r.created_at).toLocaleDateString('mr-IN',
                          { day:'numeric', month:'short', year:'numeric' })}
                      </td>

                      <td>
                        {r.is_approved ? (
                          <span style={{ background:'#d1fae5', color:'#065f46',
                                         padding:'3px 10px', borderRadius:20,
                                         fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
                            ✅ मंजूर
                          </span>
                        ) : (
                          <span style={{ background:'#fef3c7', color:'#92400e',
                                         padding:'3px 10px', borderRadius:20,
                                         fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>
                            ⏳ प्रतीक्षेत
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                          {isPending && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveOne(r.id)}
                              disabled={actingId === r.id || bulkBusy}
                            >
                              {actingId === r.id ? '...' : '✅'}
                            </button>
                          )}
                          <button
                            className="btn btn-sm"
                            style={{ background:'#e53e3e', color:'#fff', border:'none' }}
                            onClick={() => handleDelete(r.id, r.comment)}
                            disabled={actingId === r.id || bulkBusy}
                          >
                            {actingId === r.id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
