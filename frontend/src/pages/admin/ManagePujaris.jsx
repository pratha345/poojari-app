// src/pages/admin/ManagePujaris.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaWhatsapp } from 'react-icons/fa6';
import { adminAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import s from './ManagePujaris.module.css';

// WhatsApp URL — strips +91/91 prefix, adds 91 country code
const waUrl = (phone) => {
  if (!phone) return null;
  const clean = String(phone).replace(/\D/g, '').replace(/^(91)/, '');
  return `https://wa.me/91${clean}`;
};

const BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const PAGE_SIZE = 12;

const LANGS_OPTIONS = ['मराठी', 'हिंदी', 'संस्कृत', 'कोकणी', 'गुजराती', 'इंग्रजी'];

const BRAHMIN_TRADITIONS = [
  '',
  'चितपावन (कोकणस्थ)',
  'देशस्थ ऋग्वेदी',
  'देशस्थ यजुर्वेदी',
  'कऱ्हाडे',
  'सारस्वत (गौड सारस्वत)',
  'पालशे',
  'त्रिहोत्री (त्रिहोत्री)',
  'दाक्षिणात्य (अयंगार)',
  'नागर',
  'माधव',
  'इतर',
];

const SORT_OPTIONS = [
  { value: 'rating',   label: '⭐ Rating' },
  { value: 'bookings', label: '📋 Bookings' },
  { value: 'name',     label: '🔤 नाव' },
  { value: 'newest',   label: '🆕 नवीन' },
];

const EMPTY_EDIT = {
  full_name: '', experience_yrs: '', city: '', district: '',
  state: 'महाराष्ट्र', address: '', bio: '', brahmin_tradition: '',
  languages: [], is_available: true,
};

function Avatar({ url, name, size = 44 }) {
  const [errored, setErrored] = useState(false);

  // Build absolute src — handle relative /uploads/... and full http:// URLs
  const src = url
    ? (url.startsWith('http') ? url : `${BASE}${url}`)
    : null;

  const initial = (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--primary)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700,
    }}>{name?.[0]?.toUpperCase() || '?'}</div>
  );

  if (!src || errored) return initial;

  return (
    <img
      src={src}
      alt={name}
      style={{
        width: size, height: size, borderRadius: '50%',
        objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0,
      }}
      onError={() => setErrored(true)}
    />
  );
}

function Stars({ rating }) {
  const r = Math.round(Number(rating || 0) * 2) / 2;
  return (
    <span style={{ color: '#F57F17', fontSize: 13 }}>
      {'★'.repeat(Math.floor(r))}{'½'.repeat(r % 1 ? 1 : 0)}{'☆'.repeat(5 - Math.ceil(r))}
    </span>
  );
}

export default function ManagePujaris({ initialTab = 'approved' }) {
  const [tab, setTab] = useState(initialTab);

  // Pending
  const [pending,    setPending]   = useState([]);
  const [rejectId,   setRejectId]  = useState(null);
  const [reason,     setReason]    = useState('');

  // Approved
  const [approved,   setApproved]  = useState([]);
  const [total,      setTotal]     = useState(0);
  const [page,       setPage]      = useState(1);
  const [sort,       setSort]      = useState('rating');
  const [search,     setSearch]    = useState('');
  const [searchQ,    setSearchQ]   = useState('');

  const [loading,    setLoading]   = useState(true);
  const [approvedLoading, setApprovedLoading] = useState(false);

  // Edit modal
  const [editPujari, setEditPujari] = useState(null);
  const [editForm,   setEditForm]   = useState(EMPTY_EDIT);
  const [saving,     setSaving]     = useState(false);

  // ── Load pending (once) ──────────────────────────────────────
  const loadPending = useCallback(() => {
    adminAPI.getPendingPujaris()
      .then(r => setPending(r.data.data || []))
      .catch(() => toast.error('प्रलंबित यादी मिळवता आली नाही.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Load approved (paginated + sorted) ──────────────────────
  const loadApproved = useCallback(() => {
    setApprovedLoading(true);
    adminAPI.getApprovedPujaris({ sort, page, limit: PAGE_SIZE, search: searchQ })
      .then(r => {
        const d = r.data.data;
        setApproved(d.rows || []);
        setTotal(d.total || 0);
      })
      .catch(() => toast.error('मंजूर पुजारी यादी मिळवता आली नाही.'))
      .finally(() => setApprovedLoading(false));
  }, [sort, page, searchQ]);

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadApproved(); }, [loadApproved]);

  // reset page on sort/search change
  useEffect(() => { setPage(1); }, [sort, searchQ]);

  // ── Approve / Reject ─────────────────────────────────────────
  const handleApprove = async (id) => {
    try {
      await adminAPI.respondPujari(id, { action: 'approve' });
      toast.success('पुजारी मंजूर केला! ✅');
      loadPending(); loadApproved();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await adminAPI.respondPujari(rejectId, { action: 'reject', reason: reason || 'पात्रता नाही' });
      toast.success('पुजारी नाकारला.');
      setRejectId(null); setReason('');
      loadPending();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  // ── Open Edit Modal ──────────────────────────────────────────
  const openEdit = (p) => {
    setEditPujari(p);
    setEditForm({
      full_name:         p.full_name || '',
      experience_yrs:    String(p.experience_yrs || ''),
      city:              p.city || '',
      district:          p.district || '',
      state:             p.state || 'महाराष्ट्र',
      address:           p.address || '',
      bio:               p.bio || '',
      brahmin_tradition: p.brahmin_tradition || '',
      languages:         Array.isArray(p.languages) ? p.languages : [],
      is_available:      !!p.is_available,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleLang = (lang) => {
    setEditForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.full_name.trim()) { toast.error('नाव आवश्यक आहे.'); return; }
    setSaving(true);
    try {
      await adminAPI.updatePujari(editPujari.id, editForm);
      toast.success('माहिती अद्यतनित केली! ✅');
      setEditPujari(null);
      loadApproved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'अद्यतनित करताना त्रुटी झाली.');
    } finally { setSaving(false); }
  };

  // ── Pagination ───────────────────────────────────────────────
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className={s.wrap}>

        {/* ══ TABS ═══════════════════════════════════════════ */}
        <div className={s.tabs}>
          <button
            className={`${s.tab} ${tab === 'pending' ? s.tabActive : ''}`}
            onClick={() => setTab('pending')}
          >
            ⏳ विनंत्या
            {pending.length > 0 && (
              <span className={s.tabBadge}>{pending.length}</span>
            )}
          </button>
          <button
            className={`${s.tab} ${tab === 'approved' ? s.tabActive : ''}`}
            onClick={() => setTab('approved')}
          >
            ✅ मंजूर पुजारी
            <span className={s.tabBadge} style={{ background: 'var(--primary)', color: '#fff' }}>
              {total}
            </span>
          </button>
        </div>

        {/* ══ SECTION 1: PENDING ══════════════════════════════ */}
        {tab === 'pending' && <section className={s.section}>
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : pending.length === 0 ? (
            <div className={s.empty}>
              <span>✅</span><p>कोणतेही प्रलंबित अर्ज नाहीत.</p>
            </div>
          ) : (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>फोटो</th>
                    <th>नाव</th>
                    <th>फोन / ईमेल</th>
                    <th>शहर</th>
                    <th>अनुभव</th>
                    <th>तारीख</th>
                    <th>कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(p => (
                    <tr key={p.id}>
                      <td><Avatar url={p.photo_url} name={p.full_name} /></td>
                      <td>
                        <strong>{p.full_name}</strong>
                        {p.bio && <div className={s.bio}>{p.bio.slice(0, 60)}{p.bio.length > 60 ? '…' : ''}</div>}
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span>{p.phone}</span>
                          {waUrl(p.phone) && (
                            <a href={waUrl(p.phone)} target="_blank" rel="noreferrer"
                              className={s.waBtn} title={`WhatsApp: ${p.phone}`}>
                              <FaWhatsapp />
                            </a>
                          )}
                        </div>
                        {p.email && <div className={s.muted}>{p.email}</div>}
                      </td>
                      <td>{p.city}{p.district ? `, ${p.district}` : ''}</td>
                      <td>{p.experience_yrs} वर्षे</td>
                      <td className={s.muted}>{new Date(p.created_at).toLocaleDateString('mr-IN')}</td>
                      <td>
                        <div className={s.actionBtns}>
                          <button className={s.btnApprove} onClick={() => handleApprove(p.id)}>✅ मंजूर</button>
                          <button className={s.btnReject} onClick={() => { setRejectId(p.id); setReason(''); }}>❌ नाकार</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>}

        {/* ══ SECTION 2: APPROVED ═════════════════════════════ */}
        {tab === 'approved' && <section className={s.section}>
          <div className={s.approvedHeader}>
            <h2 className={s.sectionTitle}>
              ✅ मंजूर पुजारी
              <span className={s.countBadge} style={{ background: '#2E7D32' }}>{total}</span>
            </h2>

            {/* Controls */}
            <div className={s.controls}>
              {/* Search */}
              <div className={s.searchWrap}>
                <input
                  className={s.searchInput}
                  placeholder="🔍 नाव, शहर, जिल्हा..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setSearchQ(search)}
                />
                {search && (
                  <button className={s.clearSearch} onClick={() => { setSearch(''); setSearchQ(''); }}>✕</button>
                )}
                <button className={s.searchBtn} onClick={() => setSearchQ(search)}>शोधा</button>
              </div>

              {/* Sort */}
              <div className={s.sortWrap}>
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={`${s.sortBtn} ${sort === o.value ? s.sortActive : ''}`}
                    onClick={() => setSort(o.value)}
                  >{o.label}</button>
                ))}
              </div>
            </div>
          </div>

          {approvedLoading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : approved.length === 0 ? (
            <div className={s.empty}>
              <span>🧑‍🦳</span>
              <p>{searchQ ? `"${searchQ}" साठी कोणी सापडला नाही.` : 'अद्याप कोणी मंजूर नाही.'}</p>
            </div>
          ) : (
            <>
              <div className={s.cardGrid}>
                {approved.map(p => (
                  <div key={p.id} className={s.pujariCard}>
                    {/* Card Header */}
                    <div className={s.cardHead}>
                      <Avatar url={p.photo_url} name={p.full_name} size={52} />
                      <div className={s.cardHeadInfo}>
                        <div className={s.cardName}>{p.full_name}</div>
                        <div className={s.cardPhone}>{p.phone}</div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        {waUrl(p.phone) && (
                          <a href={waUrl(p.phone)} target="_blank" rel="noreferrer"
                            className={s.waBtnCard} title={`WhatsApp: ${p.phone}`}>
                            <FaWhatsapp />
                          </a>
                        )}
                        <button className={s.editBtn} onClick={() => openEdit(p)} title="माहिती संपादित करा">
                          ✏️
                        </button>
                      </div>
                    </div>

                    {/* Location & Experience */}
                    <div className={s.cardMeta}>
                      <span>📍 {p.city}{p.district ? `, ${p.district}` : ''}</span>
                      <span>🕐 {p.experience_yrs} वर्षे</span>
                    </div>

                    {/* Bio */}
                    {p.bio && (
                      <p className={s.cardBio}>
                        {p.bio.length > 90 ? p.bio.slice(0, 90) + '…' : p.bio}
                      </p>
                    )}

                    {/* Languages */}
                    {Array.isArray(p.languages) && p.languages.length > 0 && (
                      <div className={s.langs}>
                        {p.languages.map(l => <span key={l} className={s.langChip}>{l}</span>)}
                      </div>
                    )}

                    {/* Stats */}
                    <div className={s.cardStats}>
                      <div className={s.statItem}>
                        <Stars rating={p.avg_rating} />
                        <span className={s.statVal}>{Number(p.avg_rating || 0).toFixed(1)}</span>
                        <span className={s.statSub}>({p.total_reviews} रेटिंग)</span>
                      </div>
                      <div className={s.statItem}>
                        <span>📋</span>
                        <span className={s.statVal}>{p.total_bookings}</span>
                        <span className={s.statSub}>बुकिंग</span>
                      </div>
                    </div>

                    {/* Availability badge */}
                    <div>
                      <span className={p.is_available ? s.badgeAvail : s.badgeUnavail}>
                        {p.is_available ? '● उपलब्ध' : '● अनुपलब्ध'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={s.pagination}>
                  <button className={s.pageBtn} disabled={page === 1} onClick={() => setPage(1)}>«</button>
                  <button className={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                    .reduce((acc, n, i, arr) => {
                      if (i > 0 && n - arr[i - 1] > 1) acc.push('…');
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === '…'
                        ? <span key={`dot-${i}`} className={s.pageDots}>…</span>
                        : <button key={n} className={`${s.pageBtn} ${page === n ? s.pageActive : ''}`} onClick={() => setPage(n)}>{n}</button>
                    )
                  }

                  <button className={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                  <button className={s.pageBtn} disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
                  <span className={s.pageInfo}>{total} पैकी {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)}</span>
                </div>
              )}
            </>
          )}
        </section>}
      </div>

      {/* ══ REJECT MODAL ═══════════════════════════════════════ */}
      {rejectId && (
        <div className={s.overlay} onClick={() => setRejectId(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <h3 className={s.modalTitle}>❌ नाकारण्याचे कारण</h3>
            <textarea
              rows={4} className={s.textarea}
              placeholder="नाकारण्याचे कारण लिहा (ऐच्छिक)…"
              value={reason} onChange={e => setReason(e.target.value)}
            />
            <div className={s.modalActions}>
              <button className={s.btnCancel} onClick={() => setRejectId(null)}>रद्द करा</button>
              <button className={s.btnRejectConfirm} onClick={handleReject}>❌ नाकार</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT MODAL ═════════════════════════════════════════ */}
      {editPujari && (
        <div className={s.overlay} onClick={() => setEditPujari(null)}>
          <div className={s.editModal} onClick={e => e.stopPropagation()}>
            <div className={s.editModalHead}>
              <div className={s.editModalTitle}>
                <Avatar url={editPujari.photo_url} name={editPujari.full_name} size={40} />
                <div>
                  <h3>✏️ माहिती संपादित करा</h3>
                  <p className={s.muted}>{editPujari.phone}</p>
                </div>
              </div>
              <button className={s.closeBtn} onClick={() => setEditPujari(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className={s.editForm}>
              {/* Row 1 */}
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.label}>पूर्ण नाव *</label>
                  <input className={s.input} name="full_name" value={editForm.full_name}
                    onChange={handleEditChange} required placeholder="पं. नाव शर्मा" />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>अनुभव (वर्षे)</label>
                  <input className={s.input} name="experience_yrs" type="number" min="0" max="60"
                    value={editForm.experience_yrs} onChange={handleEditChange} />
                </div>
              </div>

              {/* Row 2 */}
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.label}>शहर</label>
                  <input className={s.input} name="city" value={editForm.city}
                    onChange={handleEditChange} placeholder="पुणे" />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>जिल्हा</label>
                  <input className={s.input} name="district" value={editForm.district}
                    onChange={handleEditChange} placeholder="पुणे" />
                </div>
                <div className={s.formGroup}>
                  <label className={s.label}>राज्य</label>
                  <input className={s.input} name="state" value={editForm.state}
                    onChange={handleEditChange} placeholder="महाराष्ट्र" />
                </div>
              </div>

              {/* Row 3 */}
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.label}>ब्राह्मण परंपरा</label>
                  <select className={s.input} name="brahmin_tradition" value={editForm.brahmin_tradition} onChange={handleEditChange}>
                    {BRAHMIN_TRADITIONS.map(t => (
                      <option key={t} value={t}>{t || '— निवडा —'}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div className={s.formGroup}>
                <label className={s.label}>परिचय (Bio)</label>
                <textarea className={s.textarea} name="bio" rows={3}
                  value={editForm.bio} onChange={handleEditChange}
                  placeholder="पुजाऱ्याबद्दल थोडक्यात माहिती..." />
              </div>

              {/* Address */}
              <div className={s.formGroup}>
                <label className={s.label}>पत्ता</label>
                <input className={s.input} name="address" value={editForm.address}
                  onChange={handleEditChange} placeholder="संपूर्ण पत्ता" />
              </div>

              {/* Languages */}
              <div className={s.formGroup}>
                <label className={s.label}>भाषा</label>
                <div className={s.langToggleWrap}>
                  {LANGS_OPTIONS.map(l => (
                    <button
                      key={l} type="button"
                      className={`${s.langToggle} ${editForm.languages.includes(l) ? s.langToggleActive : ''}`}
                      onClick={() => toggleLang(l)}
                    >{l}</button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <label className={s.availToggle}>
                <input type="checkbox" name="is_available" checked={editForm.is_available}
                  onChange={handleEditChange} />
                <span className={editForm.is_available ? s.availOn : s.availOff}>
                  {editForm.is_available ? '● उपलब्ध आहे' : '● अनुपलब्ध आहे'}
                </span>
              </label>

              <div className={s.modalActions}>
                <button type="button" className={s.btnCancel} onClick={() => setEditPujari(null)}>रद्द करा</button>
                <button type="submit" className={s.btnSave} disabled={saving}>
                  {saving ? '⏳ जतन होत आहे...' : '✅ बदल जतन करा'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
