// src/pages/admin/ManageConsultations.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';
import { FaPlus, FaPencil, FaToggleOn, FaToggleOff, FaWhatsapp } from 'react-icons/fa6';

const STATUS_LABELS = {
  pending:     { label: 'प्रतीक्षेत', color: 'warning' },
  confirmed:   { label: 'पुष्टी',     color: 'success' },
  in_progress: { label: 'सुरू आहे',   color: 'info'    },
  completed:   { label: 'पूर्ण',      color: 'info'    },
  cancelled:   { label: 'रद्द',       color: 'danger'  },
};

const CONSULT_TYPES = {
  94: { label: '📞 फोन', color: '#1565c0' },
  95: { label: '🏠 गृह भेट', color: '#2e7d32' },
  96: { label: '📜 कुंडली', color: '#6a1b9a' },
};

const EMPTY_SERVICE = { name_mr: '', name_en: '', short_desc: '', price: '', duration_hrs: '1' };

export default function ManageConsultations() {
  const [activeTab,     setActiveTab]     = useState('bookings'); // 'bookings' | 'services'
  const [consultations, setConsultations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState('confirmed');
  const [noteModal,     setNoteModal]     = useState(null);
  const [noteText,      setNoteText]      = useState('');
  const [saving,        setSaving]        = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [completing,    setCompleting]    = useState(false);

  // Services state
  const [services,      setServices]      = useState([]);
  const [svcLoading,    setSvcLoading]    = useState(false);
  const [editSvc,       setEditSvc]       = useState(null);   // service being edited
  const [addMode,       setAddMode]       = useState(false);
  const [svcForm,       setSvcForm]       = useState(EMPTY_SERVICE);
  const [svcSaving,     setSvcSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    const params = { type: 'consultation', ...(filter !== 'all' ? { status: filter } : {}) };
    adminAPI.getConsultations(params)
      .then(r => setConsultations(r.data.data || []))
      .catch(() => toast.error('डेटा लोड करताना त्रुटी.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const loadServices = () => {
    setSvcLoading(true);
    adminAPI.getConsultationServices()
      .then(r => setServices(r.data.data || []))
      .catch(() => toast.error('सेवा लोड करताना त्रुटी.'))
      .finally(() => setSvcLoading(false));
  };
  useEffect(() => { if (activeTab === 'services') loadServices(); }, [activeTab]);

  const handleSvcSave = async () => {
    if (!svcForm.name_mr || !svcForm.price) { toast.error('नाव आणि किंमत आवश्यक.'); return; }
    setSvcSaving(true);
    try {
      if (editSvc) {
        await adminAPI.updateConsultationService(editSvc.id, svcForm);
        toast.success('सेवा अद्यतनित केली ✅');
      } else {
        await adminAPI.createConsultationService(svcForm);
        toast.success('नवीन सेवा जोडली ✅');
      }
      setEditSvc(null); setAddMode(false); setSvcForm(EMPTY_SERVICE);
      loadServices();
    } catch { toast.error('त्रुटी झाली.'); }
    finally { setSvcSaving(false); }
  };

  const handleToggle = async (svc) => {
    try {
      const r = await adminAPI.toggleConsultationService(svc.id);
      toast.success(r.data.message);
      loadServices();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await adminAPI.markComplete(completeModal.id);
      toast.success('सल्लामसलत पूर्ण झाली! ✅');
      setCompleteModal(null);
      load();
    } catch { toast.error('त्रुटी झाली.'); }
    finally { setCompleting(false); }
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) { toast.error('नोट लिहा.'); return; }
    setSaving(true);
    try {
      await adminAPI.updateConsultationNote(noteModal.id, noteText);
      toast.success('नोट जतन केली. ✅');
      setNoteModal(null);
      load();
    } catch { toast.error('त्रुटी झाली.'); }
    finally { setSaving(false); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('mr-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const formatTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const stats = {
    total:     consultations.length,
    confirmed: consultations.filter(c => c.status === 'confirmed').length,
    completed: consultations.filter(c => c.status === 'completed').length,
    revenue:   consultations.filter(c => c.payment_status === 'paid').reduce((s, c) => s + Number(c.total_amount), 0),
  };

  return (
    <AdminLayout>
      <div>
        <h1 className={styles.pageTitle}>🔮 ज्योतिष सल्लामसलत</h1>

        {/* Main Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #eee', paddingBottom: 0 }}>
          {[
            { key: 'bookings', label: '📋 Appointments' },
            { key: 'services', label: '⚙️ सेवा व्यवस्थापन' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '8px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: 14,
                borderBottom: activeTab === t.key ? '3px solid #c0392b' : '3px solid transparent',
                color: activeTab === t.key ? '#c0392b' : '#666',
              }}
            >{t.label}</button>
          ))}
        </div>

        {/* ── SERVICES TAB ── */}
        {activeTab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>WhatsApp Bot वर दिसणाऱ्या सेवा</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#888' }}>
                  <FaWhatsapp style={{ color: '#25d366' }} /> येथे बदल केल्यास Bot वर लगेच दिसतील
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => { setAddMode(true); setEditSvc(null); setSvcForm(EMPTY_SERVICE); }}
              >
                <FaPlus /> नवीन सेवा जोडा
              </button>
            </div>

            {/* Add/Edit Form */}
            {(addMode || editSvc) && (
              <div style={{
                background: '#fffbf0', border: '1px solid #f0d080', borderRadius: 10,
                padding: 20, marginBottom: 20,
              }}>
                <h4 style={{ margin: '0 0 16px', color: '#8B4513' }}>
                  {editSvc ? '✏️ सेवा संपादित करा' : '➕ नवीन सेवा जोडा'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>नाव (मराठी) *</label>
                    <input className={styles.input} placeholder="उदा: फोन सल्लामसलत"
                      value={svcForm.name_mr} onChange={e => setSvcForm(f => ({ ...f, name_mr: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>Name (English)</label>
                    <input className={styles.input} placeholder="e.g. Phone Consultation"
                      value={svcForm.name_en} onChange={e => setSvcForm(f => ({ ...f, name_en: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>किंमत (₹) *</label>
                    <input className={styles.input} type="number" placeholder="500"
                      value={svcForm.price} onChange={e => setSvcForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>कालावधी (तास)</label>
                    <input className={styles.input} type="number" step="0.5" placeholder="1"
                      value={svcForm.duration_hrs} onChange={e => setSvcForm(f => ({ ...f, duration_hrs: e.target.value }))} />
                  </div>
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#555' }}>वर्णन (Bot वर दिसेल)</label>
                    <input className={styles.input} placeholder="उदा: फोनवर ३० मिनिटे मार्गदर्शन"
                      value={svcForm.short_desc} onChange={e => setSvcForm(f => ({ ...f, short_desc: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button className="btn btn-secondary"
                    onClick={() => { setAddMode(false); setEditSvc(null); setSvcForm(EMPTY_SERVICE); }}>
                    रद्द करा
                  </button>
                  <button className="btn btn-primary" onClick={handleSvcSave} disabled={svcSaving}>
                    {svcSaving ? 'जतन...' : '💾 जतन करा'}
                  </button>
                </div>
              </div>
            )}

            {/* Services Table */}
            {svcLoading ? (
              <div className="page-loader"><div className="spinner" /></div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>सेवेचे नाव</th>
                      <th>वर्णन</th>
                      <th>किंमत</th>
                      <th>कालावधी</th>
                      <th>स्थिती (Bot)</th>
                      <th>कृती</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc, i) => (
                      <tr key={svc.id} style={{ opacity: svc.is_active ? 1 : 0.5 }}>
                        <td><code>{i + 1}</code></td>
                        <td>
                          <strong>{svc.name_mr}</strong>
                          {svc.name_en && <><br /><small style={{ color: '#888' }}>{svc.name_en}</small></>}
                        </td>
                        <td style={{ fontSize: 12, color: '#666', maxWidth: 200 }}>{svc.short_desc || '—'}</td>
                        <td>
                          <strong style={{ color: '#2e7d32', fontSize: 16 }}>
                            ₹{Number(svc.price).toLocaleString('mr-IN')}
                          </strong>
                        </td>
                        <td>{svc.duration_hrs} तास</td>
                        <td>
                          {svc.is_active
                            ? <span className="badge badge-success"><FaWhatsapp /> Bot वर दिसतो</span>
                            : <span className="badge badge-danger">बंद आहे</span>
                          }
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#f5f0ff', color: '#6a1b9a', border: '1px solid #ce93d8' }}
                              onClick={() => { setEditSvc(svc); setAddMode(false); setSvcForm({ name_mr: svc.name_mr, name_en: svc.name_en || '', short_desc: svc.short_desc || '', price: svc.price, duration_hrs: svc.duration_hrs }); }}
                            >
                              <FaPencil />
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: svc.is_active ? '#ffebee' : '#e8f5e9', color: svc.is_active ? '#c62828' : '#2e7d32', border: `1px solid ${svc.is_active ? '#ef9a9a' : '#a5d6a7'}` }}
                              onClick={() => handleToggle(svc)}
                              title={svc.is_active ? 'Bot वरून बंद करा' : 'Bot वर सुरू करा'}
                            >
                              {svc.is_active ? <FaToggleOn /> : <FaToggleOff />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!services.length && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', color: '#aaa', padding: 30 }}>
                        कोणतीही सेवा नाही. "+ नवीन सेवा जोडा" वापरा.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === 'bookings' && (<>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'एकूण',       value: stats.total,                  color: '#1565c0' },
            { label: 'प्रतीक्षेत', value: stats.confirmed,              color: '#e65100' },
            { label: 'पूर्ण',      value: stats.completed,              color: '#2e7d32' },
            { label: 'महसूल',      value: `₹${stats.revenue.toLocaleString('mr-IN')}`, color: '#6a1b9a' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#fff', borderRadius: 10, padding: '12px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)', minWidth: 120, textAlign: 'center',
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {[
            { key: 'confirmed',   label: '⏳ प्रतीक्षेत' },
            { key: 'in_progress', label: '🔄 सुरू आहे'   },
            { key: 'completed',   label: '✅ पूर्ण'       },
            { key: 'cancelled',   label: '❌ रद्द'        },
            { key: 'all',         label: 'सर्व'           },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.key)}
            >{f.label}</button>
          ))}
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : consultations.length === 0 ? (
          <div className={styles.empty}>
            <span>🔮</span>
            <p>कोणतीही सल्लामसलत नाही.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>कोड</th>
                  <th>प्रकार</th>
                  <th>वापरकर्ता</th>
                  <th>तारीख & वेळ</th>
                  <th>पत्ता</th>
                  <th>रक्कम</th>
                  <th>स्थिती</th>
                  <th>नोट्स</th>
                  <th>कृती</th>
                </tr>
              </thead>
              <tbody>
                {consultations.map(c => {
                  const st      = STATUS_LABELS[c.status] || { label: c.status, color: 'info' };
                  const cType   = CONSULT_TYPES[c.pooja_id] || { label: '🔮 सल्लामसलत', color: '#555' };
                  const canDone = c.status === 'confirmed' || c.status === 'in_progress';
                  return (
                    <tr key={c.id}>
                      <td><code style={{ fontSize: 12 }}>#{c.booking_code}</code></td>
                      <td>
                        <span style={{
                          background: cType.color + '18', color: cType.color,
                          padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600,
                        }}>
                          {cType.label}
                        </span>
                      </td>
                      <td>
                        <strong>{c.user_name}</strong>
                        <br />
                        <small style={{ color: '#666' }}>📱 {c.user_phone}</small>
                      </td>
                      <td>
                        📅 {formatDate(c.booking_date)}
                        <br />
                        <small>⏰ {formatTime(c.booking_time)}</small>
                      </td>
                      <td style={{ maxWidth: 160, fontSize: 12 }}>
                        {c.address === 'Phone Consultation'
                          ? <span style={{ color: '#1565c0' }}>📞 फोन</span>
                          : <span title={c.address}>{c.address?.substring(0, 50)}{c.address?.length > 50 ? '…' : ''}</span>
                        }
                      </td>
                      <td>
                        <strong>₹{Number(c.total_amount).toLocaleString('mr-IN')}</strong>
                        <br />
                        {c.payment_status === 'paid'
                          ? <span className="badge badge-success" style={{ fontSize: 10 }}>✅ पेड</span>
                          : <span className="badge badge-warning" style={{ fontSize: 10 }}>⏳ बाकी</span>
                        }
                      </td>
                      <td>
                        <span className={`badge badge-${st.color}`}>{st.label}</span>
                      </td>
                      <td style={{ maxWidth: 140, fontSize: 12, color: '#555' }}>
                        {c.admin_notes
                          ? <span title={c.admin_notes}>{c.admin_notes.substring(0, 40)}{c.admin_notes.length > 40 ? '…' : ''}</span>
                          : <em style={{ color: '#aaa' }}>—</em>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {/* Call user */}
                          <a
                            href={`tel:${c.user_phone}`}
                            className="btn btn-primary btn-sm"
                            style={{ textDecoration: 'none', textAlign: 'center' }}
                          >
                            📞 कॉल करा
                          </a>
                          {/* Add note */}
                          <button
                            className="btn btn-sm"
                            style={{ background: '#f5f0ff', color: '#6a1b9a', border: '1px solid #ce93d8' }}
                            onClick={() => { setNoteModal(c); setNoteText(c.admin_notes || ''); }}
                          >
                            📝 नोट
                          </button>
                          {/* Mark complete */}
                          {canDone && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#2e7d32', color: '#fff' }}
                              onClick={() => setCompleteModal(c)}
                            >
                              ✅ पूर्ण
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

      {/* ── Note Modal ────────────────────────────────────────────── */}
      {noteModal && (
        <div className={styles.modalOverlay} onClick={() => setNoteModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h3 className={styles.modalTitle}>📝 नोट जोडा — {noteModal.user_name}</h3>
            <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              {noteModal.booking_code} · {CONSULT_TYPES[noteModal.pooja_id]?.label}
            </p>
            <textarea
              rows={5}
              className={styles.input}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="सल्लामसलत नोट्स, ग्राहकाची माहिती, फॉलो-अप..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setNoteModal(null)}>रद्द करा</button>
              <button className="btn btn-primary" onClick={handleSaveNote} disabled={saving}>
                {saving ? 'जतन...' : '💾 जतन करा'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Complete Confirm Modal ──────────────────────────────────── */}
      {completeModal && (
        <div className={styles.modalOverlay} onClick={() => setCompleteModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 className={styles.modalTitle}>✅ सल्लामसलत पूर्ण?</h3>
            <p style={{ color: '#555', marginBottom: 8 }}>
              <strong>{completeModal.user_name}</strong> यांची{' '}
              {CONSULT_TYPES[completeModal.pooja_id]?.label} सल्लामसलत पूर्ण झाली का?
            </p>
            <p style={{ fontSize: 13, color: '#888' }}>
              📅 {formatDate(completeModal.booking_date)} · ⏰ {formatTime(completeModal.booking_time)}
            </p>
            <div className={styles.modalActions} style={{ marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setCompleteModal(null)}>नाही</button>
              <button
                className="btn btn-primary"
                style={{ background: '#2e7d32' }}
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? 'होत आहे...' : '✅ हो, पूर्ण झाली'}
              </button>
            </div>
          </div>
        </div>
      )}

        </>)}
      </div>
    </AdminLayout>
  );
}
