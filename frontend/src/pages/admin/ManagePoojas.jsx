// src/pages/admin/ManagePoojas.jsx
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { poojaAPI, adminAPI, adminSamagriAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';

const EMPTY_FORM = {
  category_id: '', name_mr: '', name_en: '', slug: '',
  short_desc: '', price: '', samagri_price: '', duration_hrs: 2, is_featured: false,
};

// Full edit form initial state (all fields)
const EMPTY_EDIT = {
  category_id: '', name_mr: '', name_en: '', slug: '',
  short_desc: '', price: '', samagri_price: '', duration_hrs: 2, is_featured: false, is_active: true,
};

export default function ManagePoojas() {
  const [poojas,     setPoojas]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,           setEditingId]           = useState(null);
  const [editPrice,           setEditPrice]           = useState('');
  const [editingDurationId,   setEditingDurationId]   = useState(null);
  const [editDuration,        setEditDuration]        = useState('');
  const [saving,        setSaving]        = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [togglingId,    setTogglingId]    = useState(null); // for is_featured toggle
  const [editingFull,   setEditingFull]   = useState(null);
  const [editFullForm,  setEditFullForm]  = useState(EMPTY_EDIT);

  // साहित्य modal
  const [samagriPooja,   setSamagriPooja]   = useState(null);
  const [samagriData,    setSamagriData]    = useState([]);
  const [samagriLoading, setSamagriLoading] = useState(false);
  const [samagriSaving,  setSamagriSaving]  = useState(false);

  // विधी चरण modal
  const [stepsPooja,    setStepsPooja]    = useState(null);
  const [stepsData,     setStepsData]     = useState([]);
  const [stepsLoading,  setStepsLoading]  = useState(false);
  const [aiLoading,     setAiLoading]     = useState(false);
  const [stepsSaving,   setStepsSaving]   = useState(false);
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [uploadingImg,  setUploadingImg]  = useState(null); // pooja id currently uploading
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef    = useRef();
  const imgRefs    = useRef({});

  const loadPoojas = () =>
    adminAPI.getAllPoojas().then(r => setPoojas(r.data.data || []));

  useEffect(() => {
    Promise.all([
      loadPoojas(),
      poojaAPI.getCategories().then(r => setCategories(r.data.data || [])),
    ]).finally(() => setLoading(false));
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const autoSlug = name => name.toLowerCase()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
    setShowForm(false);
  };

  const handleCreate = async e => {
    e.preventDefault();
    if (!form.category_id || !form.name_mr || !form.slug || !form.price) {
      toast.error('सर्व आवश्यक माहिती भरा.'); return;
    }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);

    setSaving(true);
    try {
      await poojaAPI.createPooja(fd);
      toast.success('पूजा यशस्वीरित्या जोडली! 🙏');
      resetForm();
      loadPoojas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  };

  const startEditPrice = (pooja) => {
    setEditingDurationId(null); setEditDuration('');
    setEditingId(pooja.id);
    setEditPrice(pooja.price);
  };

  const cancelEdit = () => { setEditingId(null); setEditPrice(''); };

  const startEditDuration = (pooja) => {
    setEditingId(null); setEditPrice('');
    setEditingDurationId(pooja.id);
    setEditDuration(pooja.duration_hrs);
  };

  const cancelEditDuration = () => { setEditingDurationId(null); setEditDuration(''); };

  const saveDuration = async (id) => {
    const duration = parseFloat(editDuration);
    if (!duration || duration <= 0) { toast.error('वैध कालावधी प्रविष्ट करा.'); return; }
    setSaving(true);
    try {
      await poojaAPI.updatePooja(id, { duration_hrs: duration });
      toast.success('कालावधी यशस्वीरित्या अद्यतनित केली! ✅');
      setEditingDurationId(null);
      setEditDuration('');
      setPoojas(prev => prev.map(p => p.id === id ? { ...p, duration_hrs: duration } : p));
    } catch (err) {
      toast.error(err.response?.data?.message || 'कालावधी अद्यतन करताना त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  };

  const savePrice = async (id) => {
    const price = parseFloat(editPrice);
    if (!price || price <= 0) { toast.error('वैध किंमत प्रविष्ट करा.'); return; }
    setSaving(true);
    try {
      await poojaAPI.updatePooja(id, { price });
      toast.success('किंमत यशस्वीरित्या अद्यतनित केली! ✅');
      setEditingId(null);
      setEditPrice('');
      setPoojas(prev => prev.map(p => p.id === id ? { ...p, price } : p));
    } catch (err) {
      toast.error(err.response?.data?.message || 'किंमत अद्यतन करताना त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" ही पूजा inactive करायची आहे का?\n(Edit मधून is_active चालू करता येईल)`)) return;
    setDeleting(id);
    try {
      await poojaAPI.deletePooja(id);
      toast.success('पूजा inactive केली.');
      setPoojas(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
    } catch (err) {
      toast.error(err.response?.data?.message || 'पूजा काढताना त्रुटी झाली.');
    } finally {
      setDeleting(null);
    }
  };

  // Toggle is_featured
  const toggleFeatured = async (pooja) => {
    setTogglingId(pooja.id);
    try {
      await poojaAPI.updatePooja(pooja.id, { is_featured: !pooja.is_featured });
      toast.success(pooja.is_featured ? '⭐ लोकप्रिय हटवली' : '⭐ लोकप्रिय केली!');
      // Update local state — no full re-fetch → images don't flicker
      setPoojas(prev => prev.map(p => p.id === pooja.id ? { ...p, is_featured: !pooja.is_featured } : p));
    } catch { toast.error('बदल करता आला नाही.'); }
    finally { setTogglingId(null); }
  };

  // Open full edit modal
  const openFullEdit = (pooja) => {
    setEditingFull(pooja);
    setEditFullForm({
      category_id:  pooja.category_id || '',
      name_mr:      pooja.name_mr || '',
      name_en:      pooja.name_en || '',
      slug:         pooja.slug || '',
      short_desc:   pooja.short_desc || '',
      price:         pooja.price || '',
      samagri_price: pooja.samagri_price || 0,
      duration_hrs:  pooja.duration_hrs || 2,
      is_featured:  !!pooja.is_featured,
      is_active:    pooja.is_active !== false,
    });
  };

  const closeFullEdit = () => { setEditingFull(null); setEditFullForm(EMPTY_EDIT); };

  const handleFullEdit = async (e) => {
    e.preventDefault();
    if (!editFullForm.category_id || !editFullForm.name_mr || !editFullForm.slug || !editFullForm.price) {
      toast.error('सर्व आवश्यक माहिती भरा.'); return;
    }
    setSaving(true);
    try {
      await poojaAPI.updatePooja(editingFull.id, editFullForm);
      toast.success('पूजा यशस्वीरित्या अद्यतनित केली! ✅');
      closeFullEdit();
      loadPoojas();
    } catch (err) { toast.error(err.response?.data?.message || 'अद्यतन करताना त्रुटी.'); }
    finally { setSaving(false); }
  };

  const handleImageUpload = async (poojaId, file) => {
    if (!file) return;
    setUploadingImg(poojaId);
    // Show local preview immediately — no flicker on other rows
    const localUrl = URL.createObjectURL(file);
    setPoojas(prev => prev.map(p => p.id === poojaId ? { ...p, image_url: localUrl } : p));
    try {
      const res = await poojaAPI.uploadPoojaImage(poojaId, file);
      toast.success('छायाचित्र यशस्वीरित्या अपलोड केले! ✅');
      // Replace local blob with server URL
      const serverUrl = res.data?.data?.image_url || localUrl;
      setPoojas(prev => prev.map(p => p.id === poojaId ? { ...p, image_url: serverUrl } : p));
    } catch (err) {
      // Revert on failure
      setPoojas(prev => prev.map(p => p.id === poojaId ? { ...p, image_url: null } : p));
      toast.error(err.response?.data?.message || 'छायाचित्र अपलोड करताना त्रुटी झाली.');
    } finally {
      setUploadingImg(null);
    }
  };

  // ── साहित्य handlers ──────────────────────────────────────
  const openSamagriModal = async (pooja) => {
    setSamagriPooja(pooja);
    setSamagriLoading(true);
    try {
      const r = await adminSamagriAPI.getByPooja(pooja.id);
      setSamagriData(r.data.data || []);
    } catch {
      setSamagriData([]);
    } finally {
      setSamagriLoading(false);
    }
  };

  const closeSamagriModal = () => { setSamagriPooja(null); setSamagriData([]); };

  const addSamagriRow = () => setSamagriData(d => [...d, { name_mr: '', quantity: '', unit: 'नग', note: '' }]);

  const updateSamagriRow = (i, field, value) =>
    setSamagriData(d => d.map((item, j) => j === i ? { ...item, [field]: value } : item));

  const removeSamagriRow = (i) => setSamagriData(d => d.filter((_, j) => j !== i));

  const saveSamagri = async () => {
    const valid = samagriData.filter(item => item.name_mr?.trim());
    if (valid.length === 0) { toast.error('किमान एक साहित्य घाला.'); return; }
    setSamagriSaving(true);
    try {
      await adminSamagriAPI.deleteAllByPooja(samagriPooja.id);
      await adminSamagriAPI.bulkCreate(
        samagriPooja.id,
        valid.map(({ name_mr, quantity, unit, note }) => ({ name_mr, quantity, unit, note })),
      );
      toast.success(`✅ ${valid.length} साहित्य जतन केले!`);
      closeSamagriModal();
    } catch {
      toast.error('जतन करता आले नाही.');
    } finally {
      setSamagriSaving(false);
    }
  };

  // ── विधी चरण handlers ──────────────────────────────────────
  const openStepsModal = async (pooja) => {
    setStepsPooja(pooja);
    setStepsLoading(true);
    try {
      const r = await poojaAPI.getPoojaBySlug(pooja.slug);
      const raw = r.data.data?.steps || r.data.steps || [];
      setStepsData(Array.isArray(raw) ? raw : []);
    } catch {
      setStepsData([]);
    } finally {
      setStepsLoading(false);
    }
  };

  const closeStepsModal = () => { setStepsPooja(null); setStepsData([]); };

  const generateAISteps = async () => {
    setAiLoading(true);
    try {
      const r = await poojaAPI.generateSteps(stepsPooja.name_mr, stepsPooja.name_en);
      setStepsData(r.data.steps || []);
      toast.success(`✅ ${r.data.steps.length} चरण धर्मसिंधु संदर्भाने तयार झाले!`);
    } catch {
      toast.error('AI ने चरण तयार करता आले नाहीत.');
    } finally {
      setAiLoading(false);
    }
  };

  const saveSteps = async () => {
    const clean = stepsData.map(s => s.trim()).filter(Boolean);
    setStepsSaving(true);
    try {
      await poojaAPI.updatePooja(stepsPooja.id, { steps: clean });
      toast.success(`✅ ${clean.length} विधी चरण जतन केले!`);
      closeStepsModal();
      loadPoojas();
    } catch {
      toast.error('जतन करता आले नाही.');
    } finally {
      setStepsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <h1 className={styles.pageTitle}>🪔 पूजा व्यवस्थापन</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ बंद करा' : '+ नवीन पूजा जोडा'}
          </button>
        </div>

          {/* Add Pooja Form */}
          {showForm && (
            <div className={styles.addForm}>
              <h2>नवीन पूजा जोडा</h2>
              <form onSubmit={handleCreate}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>श्रेणी *</label>
                    <select name="category_id" value={form.category_id} onChange={handleChange} className="form-control">
                      <option value="">श्रेणी निवडा</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name_mr}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>पूजेचे नाव (मराठी) *</label>
                    <input type="text" name="name_mr" value={form.name_mr}
                      onChange={e => { handleChange(e); setForm(f => ({ ...f, slug: autoSlug(e.target.value) })); }}
                      className="form-control" placeholder="उदा: सत्यनारायण पूजा" />
                  </div>
                  <div className="form-group">
                    <label>पूजेचे नाव (इंग्रजी)</label>
                    <input type="text" name="name_en" value={form.name_en} onChange={handleChange}
                      className="form-control" placeholder="e.g. Satyanarayan Pooja" />
                  </div>
                  <div className="form-group">
                    <label>Slug *</label>
                    <input type="text" name="slug" value={form.slug} onChange={handleChange}
                      className="form-control" placeholder="satyanarayan-pooja" />
                  </div>
                  <div className="form-group">
                    <label>पूजा किंमत (₹) *</label>
                    <input type="number" name="price" value={form.price} onChange={handleChange}
                      className="form-control" placeholder="3963" min="1" />
                  </div>
                  <div className="form-group">
                    <label>सामग्री किंमत (₹)</label>
                    <input type="number" name="samagri_price" value={form.samagri_price} onChange={handleChange}
                      className="form-control" placeholder="0 (सामग्री नसल्यास 0)" min="0" />
                  </div>
                  <div className="form-group">
                    <label>कालावधी (तास)</label>
                    <input type="number" name="duration_hrs" value={form.duration_hrs} onChange={handleChange}
                      className="form-control" step="0.5" min="0.5" max="24" />
                  </div>
                </div>

                <div className="form-group">
                  <label>थोडक्यात वर्णन</label>
                  <textarea name="short_desc" value={form.short_desc} onChange={handleChange}
                    className="form-control" rows={2} placeholder="एक-दोन वाक्यांत पूजेचे वर्णन करा..." />
                </div>

                {/* Image Upload */}
                <div className="form-group">
                  <label>पूजेचे छायाचित्र</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileRef}
                    onChange={handleImageChange}
                    className="form-control"
                  />
                  {imagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={imagePreview}
                        alt="preview"
                        style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--border)' }}
                      />
                      <button
                        type="button"
                        style={{ marginLeft: '10px', fontSize: '12px', color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                      >
                        ✕ काढा
                      </button>
                    </div>
                  )}
                </div>

                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', marginBottom: '16px' }}>
                  <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
                  <span>लोकप्रिय पूजा म्हणून दाखवा</span>
                </label>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '⏳ जोडत आहे...' : '✅ पूजा जोडा'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    ✕ रद्द करा
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Poojas Table */}
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : poojas.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              कोणतीही पूजा आढळली नाही. नवीन पूजा जोडा.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '96px' }}>छायाचित्र</th>
                    <th style={{ width: '22%' }}>नाव</th>
                    <th style={{ width: '14%' }}>श्रेणी</th>
                    <th style={{ width: '12%' }}>किंमत (₹)</th>
                    <th style={{ width: '11%' }}>कालावधी</th>
                    <th style={{ width: '9%' }}>लोकप्रिय</th>
                    <th>कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {poojas.map(p => (
                    <tr key={p.id}>
                      <td style={{ width: '96px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                          {/* Fixed-size image box */}
                          <div style={{
                            width: '64px', height: '48px', borderRadius: '7px',
                            overflow: 'hidden', flexShrink: 0, boxSizing: 'border-box',
                            background: p.image_url ? '#f5ede0' : 'linear-gradient(135deg,#f5ede0,#ead9c4)',
                            border: p.image_url ? '2px solid #c6a04f' : '2px dashed #d4a96a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.name_mr}
                                width={64} height={48}
                                style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                                onError={e => {
                                  e.target.style.display = 'none';
                                  e.target.parentNode.innerHTML = '<span style="font-size:22px">🪔</span>';
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: '22px', opacity: 0.6 }}>🪔</span>
                            )}
                          </div>
                          {/* hidden file input per row */}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            ref={el => imgRefs.current[p.id] = el}
                            onChange={e => handleImageUpload(p.id, e.target.files[0])}
                          />
                          <button
                            className="btn btn-sm"
                            style={{ fontSize: '11px', padding: '2px 8px', background: p.image_url ? '#f0f0f0' : '#ff8c00', color: p.image_url ? '#555' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onClick={() => imgRefs.current[p.id]?.click()}
                            disabled={uploadingImg === p.id}
                          >
                            {uploadingImg === p.id ? '⏳' : p.image_url ? '🔄 बदला' : '📷 जोडा'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong style={{ opacity: p.is_active === false || p.is_active === 0 ? 0.5 : 1 }}>
                          {p.name_mr}
                        </strong>
                        {(p.is_active === false || p.is_active === 0) && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '1px 7px', fontWeight: 700 }}>
                            Inactive
                          </span>
                        )}
                        <br />
                        <small style={{ color: 'var(--text-muted)' }}>{p.slug}</small>
                      </td>
                      <td>{p.category_name}</td>
                      <td>
                        {editingId === p.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>₹</span>
                            <input
                              type="number"
                              value={editPrice}
                              onChange={e => setEditPrice(e.target.value)}
                              className="form-control"
                              style={{ width: '100px', padding: '4px 8px', fontSize: '14px' }}
                              min="1"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') savePrice(p.id); if (e.key === 'Escape') cancelEdit(); }}
                            />
                          </div>
                        ) : (
                          <strong>₹{Number(p.price).toLocaleString('mr-IN')}</strong>
                        )}
                      </td>
                      <td>
                        {editingDurationId === p.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              value={editDuration}
                              onChange={e => setEditDuration(e.target.value)}
                              className="form-control"
                              style={{ width: '80px', padding: '4px 8px', fontSize: '14px' }}
                              step="0.5" min="0.5" max="24"
                              autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') saveDuration(p.id); if (e.key === 'Escape') cancelEditDuration(); }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>तास</span>
                          </div>
                        ) : (
                          <span>{parseFloat(p.duration_hrs) > 0 ? `${parseFloat(p.duration_hrs)} तास` : '—'}</span>
                        )}
                      </td>
                      {/* is_featured toggle */}
                      <td>
                        <button
                          onClick={() => toggleFeatured(p)}
                          disabled={togglingId === p.id}
                          title={p.is_featured ? 'लोकप्रिय काढा' : 'लोकप्रिय करा'}
                          style={{
                            background: p.is_featured ? '#f59e0b' : '#e5e7eb',
                            color:      p.is_featured ? '#fff' : '#6b7280',
                            border:     'none', borderRadius: '20px',
                            padding:    '4px 12px', fontSize: '12px',
                            fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {togglingId === p.id ? '...' : p.is_featured ? '⭐ हो' : '☆ नाही'}
                        </button>
                      </td>
                      <td>
                        {editingId === p.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => savePrice(p.id)} disabled={saving}>
                              {saving ? '...' : '✅ जतन'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit} disabled={saving}>✕</button>
                          </div>
                        ) : editingDurationId === p.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => saveDuration(p.id)} disabled={saving}>
                              {saving ? '...' : '✅ जतन'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEditDuration} disabled={saving}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => openFullEdit(p)}
                              title="सर्व माहिती बदला">✏️ संपादित
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditPrice(p)}>
                              ₹ किंमत
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => startEditDuration(p)}
                              title="कालावधी बदला"
                            >
                              ⏱️ कालावधी
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => openStepsModal(p)}
                              title="विधी चरण जोडा / संपादित करा"
                            >
                              📿 विधी चरण
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                              onClick={() => openSamagriModal(p)}
                              title="साहित्य व्यवस्थापन"
                            >
                              🌿 साहित्य
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#e53e3e', color: '#fff', border: 'none' }}
                              onClick={() => handleDelete(p.id, p.name_mr)}
                              disabled={deleting === p.id}
                            >
                              {deleting === p.id ? '...' : '🗑️ काढा'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* ════════════════════════════════════════
          FULL EDIT MODAL
      ════════════════════════════════════════ */}
      {editingFull && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', overflowY: 'auto',
        }}
          onClick={e => { if (e.target === e.currentTarget) closeFullEdit(); }}
        >
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '32px',
            width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--secondary)', fontSize: '1.3rem' }}>
                ✏️ पूजा संपादित करा
              </h2>
              <button onClick={closeFullEdit}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleFullEdit}>
              <div className="grid-2">
                <div className="form-group">
                  <label>श्रेणी *</label>
                  <select value={editFullForm.category_id}
                    onChange={e => setEditFullForm(f => ({ ...f, category_id: e.target.value }))}
                    className="form-control">
                    <option value="">श्रेणी निवडा</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name_mr}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>पूजेचे नाव (मराठी) *</label>
                  <input type="text" value={editFullForm.name_mr}
                    onChange={e => setEditFullForm(f => ({ ...f, name_mr: e.target.value }))}
                    className="form-control" placeholder="उदा: सत्यनारायण पूजा" />
                </div>
                <div className="form-group">
                  <label>पूजेचे नाव (इंग्रजी)</label>
                  <input type="text" value={editFullForm.name_en}
                    onChange={e => setEditFullForm(f => ({ ...f, name_en: e.target.value }))}
                    className="form-control" placeholder="e.g. Satyanarayan Pooja" />
                </div>
                <div className="form-group">
                  <label>Slug *</label>
                  <input type="text" value={editFullForm.slug}
                    onChange={e => setEditFullForm(f => ({ ...f, slug: e.target.value }))}
                    className="form-control" />
                </div>
                <div className="form-group">
                  <label>पूजा किंमत (₹) *</label>
                  <input type="number" value={editFullForm.price}
                    onChange={e => setEditFullForm(f => ({ ...f, price: e.target.value }))}
                    className="form-control" min="1" />
                </div>
                <div className="form-group">
                  <label>सामग्री किंमत (₹)</label>
                  <input type="number" value={editFullForm.samagri_price}
                    onChange={e => setEditFullForm(f => ({ ...f, samagri_price: e.target.value }))}
                    className="form-control" min="0" placeholder="0" />
                </div>
                <div className="form-group">
                  <label>कालावधी (तास)</label>
                  <input type="number" value={editFullForm.duration_hrs}
                    onChange={e => setEditFullForm(f => ({ ...f, duration_hrs: e.target.value }))}
                    className="form-control" step="0.5" min="0.5" max="24" />
                </div>
              </div>

              <div className="form-group">
                <label>थोडक्यात वर्णन</label>
                <textarea value={editFullForm.short_desc}
                  onChange={e => setEditFullForm(f => ({ ...f, short_desc: e.target.value }))}
                  className="form-control" rows={3} />
              </div>

              <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editFullForm.is_featured}
                    onChange={e => setEditFullForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <span>⭐ लोकप्रिय पूजा म्हणून दाखवा</span>
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" checked={editFullForm.is_active}
                    onChange={e => setEditFullForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <span>✅ सक्रिय (Active)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? '⏳ जतन करत आहे...' : '✅ बदल जतन करा'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeFullEdit}>
                  ✕ रद्द करा
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ════════════════════════════════════════
          साहित्य MODAL
      ════════════════════════════════════════ */}
      {samagriPooja && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={e => { if (e.target === e.currentTarget) closeSamagriModal(); }}
        >
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px',
            width:'100%', maxWidth:'780px', maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-display)', color:'#16a34a', fontSize:'1.2rem', margin:0 }}>
                  🌿 साहित्य व्यवस्थापन — {samagriPooja.name_mr}
                </h2>
                <p style={{ fontSize:'12px', color:'#888', margin:'4px 0 0' }}>
                  या पूजेसाठी लागणारे साहित्य (सामग्री) येथे जोडा
                </p>
              </div>
              <button onClick={closeSamagriModal}
                style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#999' }}>✕</button>
            </div>

            {samagriLoading ? (
              <div style={{ textAlign:'center', padding:'30px', color:'#999' }}>लोड होत आहे...</div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr 32px',
                  gap:'8px', padding:'6px 4px', marginBottom:'6px',
                  borderBottom:'2px solid #d1fae5', fontSize:'12px', fontWeight:700, color:'#16a34a' }}>
                  <span>साहित्याचे नाव *</span>
                  <span>प्रमाण</span>
                  <span>एकक</span>
                  <span>टीप</span>
                  <span></span>
                </div>

                {samagriData.length === 0 && (
                  <div style={{ textAlign:'center', padding:'24px', color:'#bbb',
                    border:'2px dashed #d1fae5', borderRadius:'10px', marginBottom:'12px' }}>
                    <div style={{ fontSize:'32px', marginBottom:'8px' }}>🌿</div>
                    <p style={{ margin:0 }}>अजून साहित्य जोडले नाही. खाली + जोडा बटण दाबा.</p>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'12px' }}>
                  {samagriData.map((item, i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 2fr 32px', gap:'8px', alignItems:'center' }}>
                      <input
                        type="text"
                        value={item.name_mr || ''}
                        onChange={e => updateSamagriRow(i, 'name_mr', e.target.value)}
                        placeholder="उदा: तांदूळ"
                        style={{ border:'1px solid #bbf7d0', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', outline:'none', fontFamily:'var(--font-body)' }}
                        onFocus={e => e.target.style.borderColor='#16a34a'}
                        onBlur={e => e.target.style.borderColor='#bbf7d0'}
                      />
                      <input
                        type="text"
                        value={item.quantity || ''}
                        onChange={e => updateSamagriRow(i, 'quantity', e.target.value)}
                        placeholder="उदा: 250"
                        style={{ border:'1px solid #bbf7d0', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', outline:'none' }}
                        onFocus={e => e.target.style.borderColor='#16a34a'}
                        onBlur={e => e.target.style.borderColor='#bbf7d0'}
                      />
                      <input
                        type="text"
                        value={item.unit || ''}
                        onChange={e => updateSamagriRow(i, 'unit', e.target.value)}
                        placeholder="ग्रॅम / नग"
                        style={{ border:'1px solid #bbf7d0', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', outline:'none' }}
                        onFocus={e => e.target.style.borderColor='#16a34a'}
                        onBlur={e => e.target.style.borderColor='#bbf7d0'}
                      />
                      <input
                        type="text"
                        value={item.note || ''}
                        onChange={e => updateSamagriRow(i, 'note', e.target.value)}
                        placeholder="अतिरिक्त माहिती (ऐच्छिक)"
                        style={{ border:'1px solid #bbf7d0', borderRadius:'6px', padding:'6px 10px', fontSize:'13px', outline:'none' }}
                        onFocus={e => e.target.style.borderColor='#16a34a'}
                        onBlur={e => e.target.style.borderColor='#bbf7d0'}
                      />
                      <button
                        onClick={() => removeSamagriRow(i)}
                        style={{ background:'none', border:'none', color:'#e53e3e', cursor:'pointer', fontSize:'18px', padding:'2px' }}
                        title="काढा"
                      >✕</button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addSamagriRow}
                  style={{ background:'none', border:'1.5px dashed #16a34a', color:'#16a34a',
                    borderRadius:'8px', padding:'7px 16px', cursor:'pointer', fontSize:'13px',
                    fontWeight:600, marginBottom:'20px' }}
                >
                  + साहित्य जोडा
                </button>
              </>
            )}

            {/* Footer */}
            <div style={{ display:'flex', gap:'12px', paddingTop:'16px', borderTop:'1px solid #d1fae5' }}>
              <button
                onClick={saveSamagri}
                disabled={samagriSaving || samagriLoading}
                style={{ background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff',
                  border:'none', borderRadius:'10px', padding:'11px 24px',
                  fontWeight:700, fontSize:'14px', cursor:'pointer',
                  opacity: samagriSaving ? 0.7 : 1 }}
              >
                {samagriSaving ? '⏳ जतन...' : `✅ ${samagriData.filter(i=>i.name_mr?.trim()).length} साहित्य जतन करा`}
              </button>
              <button onClick={closeSamagriModal}
                style={{ background:'none', border:'1.5px solid #ddd', borderRadius:'10px',
                  padding:'11px 20px', cursor:'pointer', fontSize:'14px', color:'#666' }}>
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          विधी चरण MODAL
      ════════════════════════════════════════ */}
      {stepsPooja && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
          onClick={e => { if (e.target === e.currentTarget) closeStepsModal(); }}
        >
          <div style={{ background:'#fff', borderRadius:'16px', padding:'28px',
            width:'100%', maxWidth:'680px', maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
              <div>
                <h2 style={{ fontFamily:'var(--font-display)', color:'#7c3aed', fontSize:'1.2rem', margin:0 }}>
                  📿 विधी चरण — {stepsPooja.name_mr}
                </h2>
                <p style={{ fontSize:'12px', color:'#888', margin:'4px 0 0' }}>
                  धर्मसिंधु संदर्भानुसार पूजेचे Step-by-Step विधी
                </p>
              </div>
              <button onClick={closeStepsModal}
                style={{ background:'none', border:'none', fontSize:'22px', cursor:'pointer', color:'#999' }}>✕</button>
            </div>

            {/* AI Generate Button */}
            <div style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1.5px solid #c4b5fd',
              borderRadius:'12px', padding:'16px', marginBottom:'20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <strong style={{ color:'#7c3aed', fontSize:'14px' }}>🤖 AI ने धर्मसिंधु संदर्भाने तयार करा</strong>
                  <p style={{ fontSize:'12px', color:'#6d28d9', margin:'4px 0 0' }}>
                    Groq AI धर्मसिंधु ग्रंथावर आधारित authentic विधी चरण मराठीत लिहेल
                  </p>
                </div>
                <button
                  onClick={generateAISteps}
                  disabled={aiLoading}
                  style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff',
                    border:'none', borderRadius:'10px', padding:'10px 20px',
                    fontWeight:700, fontSize:'13px', cursor:'pointer', whiteSpace:'nowrap',
                    opacity: aiLoading ? 0.7 : 1 }}
                >
                  {aiLoading ? '⏳ तयार होत आहे...' : '✨ AI ने तयार करा'}
                </button>
              </div>
            </div>

            {/* Steps List */}
            {stepsLoading ? (
              <div style={{ textAlign:'center', padding:'30px', color:'#999' }}>लोड होत आहे...</div>
            ) : (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <span style={{ fontWeight:700, color:'var(--secondary)', fontSize:'14px' }}>
                    चरण यादी ({stepsData.length})
                  </span>
                  <button
                    onClick={() => setStepsData(d => [...d, ''])}
                    style={{ background:'none', border:'1.5px dashed #E07B2A', color:'#E07B2A',
                      borderRadius:'8px', padding:'5px 12px', cursor:'pointer', fontSize:'13px', fontWeight:600 }}
                  >
                    + चरण जोडा
                  </button>
                </div>

                {stepsData.length === 0 && (
                  <div style={{ textAlign:'center', padding:'24px', color:'#bbb',
                    border:'2px dashed #eee', borderRadius:'10px' }}>
                    <div style={{ fontSize:'32px', marginBottom:'8px' }}>📋</div>
                    <p style={{ margin:0 }}>अजून कोणतेही चरण नाहीत. AI ने तयार करा किंवा + जोडा.</p>
                  </div>
                )}

                <ol style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'8px' }}>
                  {stepsData.map((step, i) => (
                    <li key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                      <span style={{ background:'#7c3aed', color:'#fff', borderRadius:'50%',
                        width:'26px', height:'26px', display:'flex', alignItems:'center',
                        justifyContent:'center', fontSize:'12px', fontWeight:700, flexShrink:0, marginTop:'6px' }}>
                        {i + 1}
                      </span>
                      <textarea
                        value={step}
                        onChange={e => setStepsData(d => d.map((s, j) => j === i ? e.target.value : s))}
                        rows={2}
                        style={{ flex:1, border:'1px solid #e0d0ff', borderRadius:'8px',
                          padding:'8px 12px', fontSize:'13.5px', fontFamily:'var(--font-body)',
                          resize:'vertical', outline:'none', lineHeight:1.6 }}
                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                        onBlur={e => e.target.style.borderColor = '#e0d0ff'}
                        placeholder={`चरण ${i + 1} लिहा...`}
                      />
                      <button
                        onClick={() => setStepsData(d => d.filter((_, j) => j !== i))}
                        style={{ background:'none', border:'none', color:'#e53e3e',
                          cursor:'pointer', fontSize:'18px', padding:'4px', marginTop:'4px' }}
                        title="काढा"
                      >✕</button>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Footer */}
            <div style={{ display:'flex', gap:'12px', marginTop:'24px', paddingTop:'16px',
              borderTop:'1px solid #f0e6ff' }}>
              <button
                onClick={saveSteps}
                disabled={stepsSaving || stepsData.every(s => !s.trim())}
                style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff',
                  border:'none', borderRadius:'10px', padding:'11px 24px',
                  fontWeight:700, fontSize:'14px', cursor:'pointer',
                  opacity: stepsSaving ? 0.7 : 1 }}
              >
                {stepsSaving ? '⏳ जतन...' : `✅ ${stepsData.filter(s=>s.trim()).length} चरण जतन करा`}
              </button>
              <button onClick={closeStepsModal}
                style={{ background:'none', border:'1.5px solid #ddd', borderRadius:'10px',
                  padding:'11px 20px', cursor:'pointer', fontSize:'14px', color:'#666' }}>
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
