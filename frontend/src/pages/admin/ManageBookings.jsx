// src/pages/admin/ManageBookings.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';

const STATUS_LABELS = {
  pending:     { label: 'प्रतीक्षेत', color: 'warning' },
  confirmed:   { label: 'पुष्टी',     color: 'success' },
  in_progress: { label: 'सुरू आहे',  color: 'info'    },
  completed:   { label: 'पूर्ण',      color: 'info'    },
  cancelled:   { label: 'रद्द',       color: 'danger'  },
};

export default function ManageBookings() {
  const [bookings,  setBookings]  = useState([]);
  const [pujaris,   setPujaris]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('pending');

  // assign modal state
  const [modal,       setModal]       = useState(null);
  const [selectedPuj, setSelectedPuj] = useState('');
  const [assigning,   setAssigning]   = useState(false);

  // cash modal state
  const [cashModal,      setCashModal]      = useState(null);
  const [actualAmount,   setActualAmount]   = useState('');
  const [cashSaving,     setCashSaving]     = useState(false);

  // complete confirm state
  const [completeModal,  setCompleteModal]  = useState(null);
  const [completing,     setCompleting]     = useState(false);

  const loadBookings = () => {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    adminAPI.getAllBookings(params)
      .then(r => setBookings(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, [filter]);

  // Load approved pujaris once for the dropdown
  useEffect(() => {
    adminAPI.getApprovedPujaris({ limit: 500 })
      .then(r => setPujaris(r.data.data || []))
      .catch(() => {});
  }, []);

  const openAssign = (booking) => {
    setModal(booking);
    setSelectedPuj(booking.pujari_id ? String(booking.pujari_id) : '');
  };

  const openCashModal = (booking) => {
    setCashModal(booking);
    setActualAmount(booking.total_amount || '');
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await adminAPI.markComplete(completeModal.id);
      toast.success('बुकिंग पूर्ण झाली! वापरकर्ता आता अभिप्राय देऊ शकतो. 🎉');
      setCompleteModal(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'त्रुटी झाली.');
    } finally { setCompleting(false); }
  };

  const handleCashConfirm = async () => {
    if (!actualAmount) { toast.error('रक्कम टाका.'); return; }
    setCashSaving(true);
    try {
      await adminAPI.markCashReceived(cashModal.id, { actual_amount: parseFloat(actualAmount) });
      toast.success('रोख पेमेंट नोंदवले. बुकिंग पूर्ण! ✅');
      setCashModal(null);
      loadBookings();
    } catch { toast.error('त्रुटी झाली.'); }
    finally { setCashSaving(false); }
  };

  const handleAssign = async () => {
    if (!selectedPuj) { toast.error('पुजारी निवडा.'); return; }
    setAssigning(true);
    try {
      const res = await adminAPI.assignPujari(modal.id, parseInt(selectedPuj));
      const pujariPhone = res.data.data?.pujari_phone;
      toast.success(res.data.message || 'पुजारी नियुक्त केला.');
      if (pujariPhone) toast.success(`📱 SMS पाठवला: ${pujariPhone}`, { duration: 4000 });
      setModal(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'नियुक्त करताना त्रुटी झाली.');
    } finally {
      setAssigning(false);
    }
  };

  const isReplacement = modal && modal.pujari_id && String(modal.pujari_id) !== selectedPuj && selectedPuj;

  return (
    <AdminLayout>
      <div>
        <h1 className={styles.pageTitle}>📋 बुकिंग व्यवस्थापन</h1>

        <div className={styles.filters}>
          <select
            className={styles.filterBtn}
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer' }}
          >
            <option value="pending">⏳ प्रतीक्षेत</option>
            <option value="confirmed">✅ पुष्टी</option>
            <option value="completed">🪔 पूर्ण</option>
            <option value="cancelled">❌ रद्द</option>
            <option value="all">सर्व</option>
          </select>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner"/></div>
        ) : bookings.length === 0 ? (
          <div className={styles.empty}><span>📭</span><p>कोणतीही बुकिंग नाही.</p></div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>कोड</th><th>पूजा</th><th>वापरकर्ता</th>
                  <th>तारीख</th><th>रक्कम</th><th>स्थिती</th><th>पेमेंट</th><th>पुजारी</th><th>कृती</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const st = STATUS_LABELS[b.status] || { label: b.status, color: 'info' };
                  const canAssign    = !['completed','cancelled'].includes(b.status);
                  const canComplete  = b.status === 'confirmed' && b.pujari_id;
                  return (
                    <tr key={b.id}>
                      <td><code>#{b.booking_code}</code></td>
                      <td>{b.pooja_name}</td>
                      <td>{b.user_name}<br/><small>{b.user_phone}</small></td>
                      <td>{new Date(b.booking_date).toLocaleDateString('mr-IN')}</td>
                      <td>₹{Number(b.total_amount).toLocaleString('mr-IN')}</td>
                      <td><span className={`badge badge-${st.color}`}>{st.label}</span></td>
                      <td>
                        {b.payment_status === 'paid' && (
                          <span className="badge badge-success">✅ Online</span>
                        )}
                        {b.payment_status === 'cash_paid' && (
                          <span className="badge badge-success">✅ रोख</span>
                        )}
                        {b.payment_status === 'unpaid' && b.payment_method === 'cash' && (
                          <span className="badge badge-warning">🏠 रोख बाकी</span>
                        )}
                        {b.payment_status === 'unpaid' && !b.payment_method && (
                          <span className="badge badge-warning">⏳ बाकी</span>
                        )}
                      </td>
                      <td>
                        {b.pujari_name
                          ? <span>
                              <span style={{color:'#2d7a2d',fontWeight:600}}>{b.pujari_name}</span>
                              {b.pujari_phone && <><br/><small style={{color:'#888'}}>{b.pujari_phone}</small></>}
                            </span>
                          : <em className={styles.noPujari}>नियुक्त नाही</em>
                        }
                      </td>
                      <td>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {canAssign && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openAssign(b)}
                            >
                              {b.pujari_name ? '🔄 बदला' : '+ नियुक्त करा'}
                            </button>
                          )}
                          {canComplete && (
                            <button
                              className="btn btn-sm"
                              style={{background:'#1565c0',color:'#fff'}}
                              onClick={() => setCompleteModal(b)}
                              title="पूजा पूर्ण झाली — वापरकर्त्याला review देता येईल"
                            >
                              🪔 पूर्ण झाली
                            </button>
                          )}
                          {b.payment_status === 'unpaid' && b.payment_method === 'cash' && b.status !== 'completed' && (
                            <button
                              className="btn btn-sm"
                              style={{background:'#2e7d32',color:'#fff'}}
                              onClick={() => openCashModal(b)}
                            >
                              💵 रोख मिळाले
                            </button>
                          )}
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

      {/* ── Assign / Replace Pujari Modal ──────────────────────── */}
      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:6}}>
              {modal.pujari_name ? '🔄 पुजारी बदला' : '🧑‍🦳 पुजारी नियुक्त करा'}
            </h2>
            <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>
              बुकिंग: <strong>#{modal.booking_code}</strong> — {modal.pooja_name}
            </p>

            {modal.pujari_name && (
              <div style={{
                background:'#fff8e1', border:'1px solid #f0c040',
                borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13
              }}>
                <strong>सध्याचे पुजारी:</strong> {modal.pujari_name}
                {modal.user_phone && <span> • {modal.user_phone}</span>}
              </div>
            )}

            <div className="form-group">
              <label>नवीन पुजारी निवडा *</label>
              <select
                className="form-control"
                value={selectedPuj}
                onChange={e => setSelectedPuj(e.target.value)}
              >
                <option value="">— पुजारी निवडा —</option>
                {pujaris.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} — {p.city} ({p.experience_yrs} वर्षे){p.phone ? ` | 📱 ${p.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Show selected pujari's phone prominently */}
            {selectedPuj && (() => {
              const sel = pujaris.find(p => String(p.id) === selectedPuj);
              return sel?.phone ? (
                <div style={{
                  background: '#e8f5e9', border: '1px solid #a5d6a7',
                  borderRadius: 8, padding: '8px 14px', marginTop: -8, marginBottom: 10,
                  fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <strong>📱 पुजारी नंबर:</strong>
                  <a href={`tel:${sel.phone}`} style={{ color: '#1565c0', fontWeight: 700 }}>{sel.phone}</a>
                  <span style={{ color: '#888' }}>• नियुक्त केल्यावर SMS जाईल</span>
                </div>
              ) : null;
            })()}

            {isReplacement && (
              <div style={{
                background:'#fff3cd', border:'1px solid #ffc107',
                borderRadius:6, padding:'8px 12px', marginTop:8, fontSize:12,
                color:'#856404'
              }}>
                ⚠️ हे नियुक्ती बदल आहे — जुन्या पुजारीची बुकिंग काउंट कमी होईल.
              </div>
            )}

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button className="btn btn-secondary" onClick={() => setModal(null)}>
                रद्द करा
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAssign}
                disabled={assigning || !selectedPuj}
              >
                {assigning ? 'होत आहे…' : isReplacement ? 'बदला व नियुक्त करा' : 'नियुक्त करा'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Cash Payment Modal ──────────────────────────────── */}
      {cashModal && (
        <div className={styles.modalOverlay} onClick={() => setCashModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:6}}>💵 रोख पेमेंट नोंदवा</h2>
            <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>
              बुकिंग: <strong>#{cashModal.booking_code}</strong> — {cashModal.pooja_name}
            </p>

            <div style={{
              background:'#f0fdf4', border:'1px solid #86efac',
              borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13
            }}>
              <strong>ठरलेली किंमत:</strong> ₹{Number(cashModal.total_amount).toLocaleString('mr-IN')}
            </div>

            <div className="form-group">
              <label>प्रत्यक्ष मिळालेली रक्कम *</label>
              <input
                type="number"
                className="form-control"
                value={actualAmount}
                onChange={e => setActualAmount(e.target.value)}
                placeholder="रक्कम टाका"
                min="0"
              />
              {actualAmount && Number(actualAmount) !== Number(cashModal.total_amount) && (
                <small style={{
                  color: Number(actualAmount) > Number(cashModal.total_amount) ? '#2e7d32' : '#c62828',
                  marginTop: 6, display: 'block'
                }}>
                  {Number(actualAmount) > Number(cashModal.total_amount)
                    ? `✅ ₹${Number(actualAmount) - Number(cashModal.total_amount)} जास्त मिळाले (tip!)`
                    : `⚠️ ₹${Number(cashModal.total_amount) - Number(actualAmount)} कमी मिळाले`
                  }
                </small>
              )}
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20}}>
              <button className="btn btn-secondary" onClick={() => setCashModal(null)}>
                रद्द करा
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCashConfirm}
                disabled={cashSaving || !actualAmount}
                style={{background:'#2e7d32'}}
              >
                {cashSaving ? 'नोंदवत आहे...' : '✅ पूर्ण झाले'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Complete Confirm Modal ──────────────────────────── */}
      {completeModal && (
        <div className={styles.modalOverlay} onClick={() => setCompleteModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={{marginBottom:8}}>🪔 पूजा पूर्ण झाली का?</h2>
            <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>
              बुकिंग: <strong>#{completeModal.booking_code}</strong> — {completeModal.pooja_name}
            </p>

            <div style={{
              background:'#e3f2fd', border:'1px solid #90caf9',
              borderRadius:8, padding:'12px 16px', fontSize:13,
              lineHeight:1.6, marginBottom:20,
            }}>
              <strong>पुजारी:</strong> {completeModal.pujari_name || '—'}<br/>
              <strong>तारीख:</strong> {new Date(completeModal.booking_date).toLocaleDateString('mr-IN')}<br/>
              <br/>
              ✅ "पूर्ण झाली" केल्यावर वापरकर्त्याला <strong>⭐ अभिप्राय देण्याचा पर्याय</strong> दिसेल.
            </div>

            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button className="btn btn-secondary" onClick={() => setCompleteModal(null)}>
                रद्द करा
              </button>
              <button
                className="btn btn-primary"
                onClick={handleMarkComplete}
                disabled={completing}
                style={{background:'#1565c0'}}
              >
                {completing ? '⏳ होत आहे...' : '🪔 हो, पूर्ण झाली'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
