// src/pages/admin/ManagePujaris.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function Avatar({ url, name }) {
  if (url) {
    return (
      <img
        src={`${BASE}${url}`}
        alt={name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{
      width: 44, height: 44, borderRadius: '50%',
      background: 'var(--primary)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, fontWeight: 700,
    }}>
      {name?.[0] || '?'}
    </div>
  );
}

export default function ManagePujaris() {
  const [pending,  setPending]  = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [rejectId, setRejectId] = useState(null);
  const [reason,   setReason]   = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      adminAPI.getPendingPujaris(),
      adminAPI.getApprovedPujaris(),
    ])
      .then(([p, a]) => {
        setPending(p.data.data || []);
        setApproved(a.data.data || []);
      })
      .catch(() => toast.error('डेटा मिळवताना त्रुटी झाली.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await adminAPI.respondPujari(id, { action: 'approve' });
      toast.success('पुजारी मंजूर केला! ✅');
      load();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await adminAPI.respondPujari(rejectId, { action: 'reject', reason: reason || 'पात्रता नाही' });
      toast.success('पुजारी नाकारला.');
      setRejectId(null); setReason('');
      load();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  return (
    <AdminLayout>
      <div>
          <h1 className={styles.pageTitle}>🧑‍🦳 पुजारी व्यवस्थापन</h1>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : (
            <>
              {/* ── Section 1: Pending Requests ── */}
              <section style={{ marginBottom: 48 }}>
                <h2 className={styles.sectionTitle}>
                  ⏳ प्रलंबित नोंदणी अर्ज
                  <span style={{ marginLeft: 10, fontSize: 14, background: '#F57F17', color: '#fff', borderRadius: 20, padding: '2px 12px' }}>
                    {pending.length}
                  </span>
                </h2>

                {pending.length === 0 ? (
                  <div className={styles.empty} style={{ padding: '40px 20px' }}>
                    <span>✅</span>
                    <p>कोणतीही प्रलंबित नोंदणी नाही.</p>
                  </div>
                ) : (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>फोटो</th>
                          <th>नाव</th>
                          <th>फोन / ईमेल</th>
                          <th>शहर / जिल्हा</th>
                          <th>अनुभव</th>
                          <th>नोंदणी तारीख</th>
                          <th>कृती</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pending.map(p => (
                          <tr key={p.id}>
                            <td><Avatar url={p.photo_url} name={p.full_name} /></td>
                            <td><strong>{p.full_name}</strong></td>
                            <td>
                              <div>{p.phone}</div>
                              {p.email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.email}</div>}
                            </td>
                            <td>{p.city}{p.district ? `, ${p.district}` : ''}</td>
                            <td>{p.experience_yrs} वर्षे</td>
                            <td>{new Date(p.created_at).toLocaleDateString('mr-IN')}</td>
                            <td>
                              <div className={styles.actionBtns}>
                                <button className="btn btn-primary btn-sm" onClick={() => handleApprove(p.id)}>
                                  ✅ मंजूर
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => { setRejectId(p.id); setReason(''); }}>
                                  ❌ नाकार
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* ── Section 2: Approved Pujaris ── */}
              <section>
                <h2 className={styles.sectionTitle}>
                  ✅ मंजूर पुजारी
                  <span style={{ marginLeft: 10, fontSize: 14, background: '#2E7D32', color: '#fff', borderRadius: 20, padding: '2px 12px' }}>
                    {approved.length}
                  </span>
                </h2>

                {approved.length === 0 ? (
                  <div className={styles.empty} style={{ padding: '40px 20px' }}>
                    <span>🧑‍🦳</span>
                    <p>अद्याप कोणताही पुजारी मंजूर केलेला नाही.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                    {approved.map(p => (
                      <div key={p.id} className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                          <Avatar url={p.photo_url} name={p.full_name} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--secondary)' }}>{p.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.phone}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div>📍 {p.city}{p.district ? `, ${p.district}` : ''}{p.state ? `, ${p.state}` : ''}</div>
                          <div>🕐 अनुभव: {p.experience_yrs} वर्षे</div>
                          {p.email && <div>✉️ {p.email}</div>}
                          {p.bio && (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                              {p.bio.length > 100 ? p.bio.slice(0, 100) + '…' : p.bio}
                            </div>
                          )}
                          {Array.isArray(p.languages) && p.languages.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                              {p.languages.map(l => (
                                <span key={l} style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 12, padding: '2px 10px', fontSize: 12 }}>{l}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                          <span>⭐ {Number(p.avg_rating || 0).toFixed(1)} ({p.total_reviews} रेटिंग)</span>
                          <span>📋 {p.total_bookings} बुकिंग</span>
                        </div>
                        <div>
                          <span style={{
                            display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: p.is_available ? '#e8f5e9' : '#fce4ec',
                            color: p.is_available ? '#2E7D32' : '#c62828',
                          }}>
                            {p.is_available ? '● उपलब्ध' : '● अनुपलब्ध'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 32,
            width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ marginBottom: 16, color: 'var(--secondary)', fontFamily: 'var(--font-display)' }}>
              ❌ नाकारण्याचे कारण
            </h3>
            <textarea
              rows={4}
              placeholder="नाकारण्याचे कारण लिहा (ऐच्छिक)…"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)',
                borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-body)',
                resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setRejectId(null)}>रद्द करा</button>
              <button className="btn btn-primary btn-sm" style={{ background: '#c62828' }} onClick={handleReject}>
                ❌ नाकार
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
