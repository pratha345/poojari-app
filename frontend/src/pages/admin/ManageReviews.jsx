// src/pages/admin/ManageReviews.jsx — Admin: Review Management (auto-approved, delete only)
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';

function Stars({ rating }) {
  return (
    <span style={{ color: '#f59e0b', letterSpacing: 1, fontSize: 15 }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default function ManageReviews() {
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [actingId, setActingId] = useState(null);

  const load = () => {
    setLoading(true);
    adminAPI.getReviews('all')
      .then(r => setReviews(r.data.data || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, comment) => {
    const preview = comment ? `"${comment.slice(0, 40)}..."` : 'हा अभिप्राय';
    if (!window.confirm(`${preview} — कायमचा काढायचा आहे का?`)) return;
    setActingId(id);
    try {
      await adminAPI.deleteReview(id);
      toast.success('अभिप्राय काढला गेला.');
      setReviews(prev => prev.filter(r => r.id !== id));
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
          <span style={{ background:'#d1fae5', color:'#065f46',
                         padding:'5px 14px', borderRadius:20, fontSize:13, fontWeight:700 }}>
            ✅ एकूण: {reviews.length} अभिप्राय
          </span>
        </div>

        {/* ── Info banner ──────────────────────────────────────── */}
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8,
                      padding:'10px 16px', marginBottom:18, fontSize:13, color:'#1e40af',
                      display:'flex', alignItems:'center', gap:8 }}>
          💡 Reviews आता <strong>auto-approved</strong> आहेत — user submit करताच pujari profile वर दिसतात.
          खराब review असेल तर 🗑️ ने काढता येते.
        </div>

        {/* ── Table ───────────────────────────────────────────── */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:52 }}>⭐</div>
            <p style={{ marginTop:12, fontSize:16, fontWeight:600, color:'var(--secondary)' }}>
              अद्याप कोणताही अभिप्राय नाही.
            </p>
            <div style={{ maxWidth:520, margin:'20px auto 0', background:'#fff8f0',
                          border:'1.5px solid #ffe0b2', borderRadius:12, padding:'20px 24px', textAlign:'left' }}>
              <p style={{ fontWeight:700, color:'var(--secondary)', marginBottom:14, fontSize:14 }}>
                📋 User अभिप्राय कसा देतो — Flow:
              </p>
              {[
                { step:'1', icon:'📋', text:'Admin → Bookings → "🪔 पूर्ण झाली" button दाबा' },
                { step:'2', icon:'📱', text:'User → "माझ्या बुकिंग्ज" (/my-bookings) वर जातो' },
                { step:'3', icon:'⭐', text:'"⭐ अभिप्राय द्या" button दिसतो (completed बुकिंगवर)' },
                { step:'4', icon:'✍️', text:'User ⭐⭐⭐⭐⭐ stars + comment लिहून "पाठवा" करतो' },
                { step:'5', icon:'✅', text:'Review लगेच approved — pujari profile वर दिसतो' },
              ].map(s => (
                <div key={s.step} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
                  <span style={{ width:24, height:24, borderRadius:'50%', background:'var(--primary)',
                                 color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                                 fontSize:12, fontWeight:700, flexShrink:0 }}>
                    {s.step}
                  </span>
                  <span style={{ fontSize:13, color:'var(--text)', paddingTop:3 }}>{s.icon} {s.text}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>रेटिंग</th>
                  <th>अभिप्राय</th>
                  <th>ग्राहक</th>
                  <th>पुजारी</th>
                  <th>पूजा</th>
                  <th>तारीख</th>
                  <th>कृती</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id}>
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
                      <button
                        className="btn btn-sm"
                        style={{ background:'#e53e3e', color:'#fff', border:'none' }}
                        onClick={() => handleDelete(r.id, r.comment)}
                        disabled={actingId === r.id}
                      >
                        {actingId === r.id ? '...' : '🗑️ काढा'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
