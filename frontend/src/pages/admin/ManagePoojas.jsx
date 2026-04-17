// src/pages/admin/ManagePoojas.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { poojaAPI } from '../../api/index.js';
import styles from './Admin.module.css';

const EMPTY_FORM = {
  category_id: '', name_mr: '', name_en: '', slug: '',
  short_desc: '', price: '', duration_hrs: 2, is_featured: false,
};

export default function ManagePoojas() {
  const [poojas,     setPoojas]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [editPrice,  setEditPrice]  = useState('');
  const [saving,     setSaving]     = useState(false);
  const [deleting,      setDeleting]      = useState(null);
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState(null);
  const [uploadingImg,  setUploadingImg]  = useState(null); // pooja id currently uploading
  const [form, setForm] = useState(EMPTY_FORM);
  const fileRef    = useRef();
  const imgRefs    = useRef({});

  const loadPoojas = () =>
    poojaAPI.getPoojas({ limit: 50 }).then(r => setPoojas(r.data.data.poojas || []));

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
    setEditingId(pooja.id);
    setEditPrice(pooja.price);
  };

  const cancelEdit = () => { setEditingId(null); setEditPrice(''); };

  const savePrice = async (id) => {
    const price = parseFloat(editPrice);
    if (!price || price <= 0) { toast.error('वैध किंमत प्रविष्ट करा.'); return; }
    setSaving(true);
    try {
      await poojaAPI.updatePooja(id, { price });
      toast.success('किंमत यशस्वीरित्या अद्यतनित केली! ✅');
      setEditingId(null);
      setEditPrice('');
      loadPoojas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'किंमत अद्यतन करताना त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" ही पूजा काढायची आहे का?`)) return;
    setDeleting(id);
    try {
      await poojaAPI.deletePooja(id);
      toast.success('पूजा काढली गेली.');
      setPoojas(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'पूजा काढताना त्रुटी झाली.');
    } finally {
      setDeleting(null);
    }
  };

  const handleImageUpload = async (poojaId, file) => {
    if (!file) return;
    setUploadingImg(poojaId);
    try {
      await poojaAPI.uploadPoojaImage(poojaId, file);
      toast.success('छायाचित्र यशस्वीरित्या अपलोड केले! ✅');
      loadPoojas();
    } catch (err) {
      toast.error(err.response?.data?.message || 'छायाचित्र अपलोड करताना त्रुटी झाली.');
    } finally {
      setUploadingImg(null);
    }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <Link to="/admin" className={styles.backLink}>← प्रशासन</Link>
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
                    <label>किंमत (₹) *</label>
                    <input type="number" name="price" value={form.price} onChange={handleChange}
                      className="form-control" placeholder="3963" min="1" />
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
                    <th>छायाचित्र</th>
                    <th>नाव</th>
                    <th>श्रेणी</th>
                    <th>किंमत (₹)</th>
                    <th>कालावधी</th>
                    <th>लोकप्रिय</th>
                    <th>कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {poojas.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <img
                            src={p.image_url || '/placeholder-pooja.jpg'}
                            alt={p.name_mr}
                            style={{ width: '60px', height: '45px', objectFit: 'cover', borderRadius: '6px', border: p.image_url ? '2px solid #c6a04f' : '2px dashed #ccc' }}
                            onError={e => { e.target.src = '/placeholder-pooja.jpg'; }}
                          />
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
                            style={{ fontSize: '11px', padding: '2px 6px', background: p.image_url ? '#f0f0f0' : '#ff8c00', color: p.image_url ? '#555' : '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onClick={() => imgRefs.current[p.id]?.click()}
                            disabled={uploadingImg === p.id}
                          >
                            {uploadingImg === p.id ? '⏳...' : p.image_url ? '🔄 बदला' : '📷 जोडा'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong>{p.name_mr}</strong><br />
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
                      <td>{parseFloat(p.duration_hrs) > 0 ? `${parseFloat(p.duration_hrs)} तास` : '—'}</td>
                      <td>{!!p.is_featured ? '⭐ हो' : '—'}</td>
                      <td>
                        {editingId === p.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => savePrice(p.id)} disabled={saving}>
                              {saving ? '...' : '✅ जतन'}
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={cancelEdit} disabled={saving}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEditPrice(p)}>
                              ✏️ किंमत
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
      </main>
      <Footer />
    </div>
  );
}
