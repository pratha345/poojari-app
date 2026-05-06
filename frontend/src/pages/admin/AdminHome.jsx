// src/pages/admin/AdminHome.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { homeAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import styles from './Admin.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

function imgSrc(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BASE_URL}${path}`;
}

export default function AdminHome() {
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  // Hero content form
  const [form, setForm] = useState({
    title:         '',
    subtitle:      '',
    description:   '',
    button_text_1: '',
    button_text_2: '',
  });
  const [heroImage,    setHeroImage]    = useState(null);   // existing path from DB
  const [heroPreview,  setHeroPreview]  = useState(null);   // local blob for preview
  const heroFileRef = useRef();

  // Slider state
  const [sliders,       setSliders]       = useState([]);
  const [sliderFile,    setSliderFile]    = useState(null);
  const [sliderPreview, setSliderPreview] = useState(null);
  const [sliderTitle,   setSliderTitle]   = useState('');
  const [sliderDesc,    setSliderDesc]    = useState('');
  const [sliderOrder,   setSliderOrder]   = useState(0);
  const [addingSlider,  setAddingSlider]  = useState(false);
  const sliderFileRef = useRef();

  // ── Load existing data ─────────────────────────────────────────
  useEffect(() => {
    homeAPI.get()
      .then(r => {
        const { content, sliders: sl } = r.data.data;
        if (content) {
          setForm({
            title:         content.title         || '',
            subtitle:      content.subtitle      || '',
            description:   content.description   || '',
            button_text_1: content.button_text_1 || '',
            button_text_2: content.button_text_2 || '',
          });
          setHeroImage(content.hero_image || null);
        }
        setSliders(sl || []);
      })
      .catch(() => toast.error('माहिती लोड करण्यात त्रुटी झाली.'))
      .finally(() => setLoading(false));
  }, []);

  // ── Hero image local preview ───────────────────────────────────
  function onHeroFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setHeroPreview(URL.createObjectURL(file));
  }

  // ── Save hero content ──────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const file = heroFileRef.current?.files[0];
      if (file) fd.append('hero_image', file);

      await homeAPI.upsert(fd);
      toast.success('होमपेज सामग्री जतन केली! 🙏');
      if (heroPreview) {
        setHeroImage(heroPreview);
        setHeroPreview(null);
      }
    } catch {
      toast.error('जतन करण्यात त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  }

  // ── Add slider ────────────────────────────────────────────────
  function onSliderFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSliderFile(file);
    setSliderPreview(URL.createObjectURL(file));
  }

  async function handleAddSlider(e) {
    e.preventDefault();
    if (!sliderFile) { toast.error('इमेज निवडा.'); return; }
    setAddingSlider(true);
    try {
      const fd = new FormData();
      fd.append('image', sliderFile);
      fd.append('title', sliderTitle);
      fd.append('description', sliderDesc);
      fd.append('sort_order', sliderOrder);

      const r = await homeAPI.addSlider(fd);
      setSliders(prev => [...prev, r.data.data]);
      setSliderFile(null);
      setSliderPreview(null);
      setSliderTitle('');
      setSliderDesc('');
      setSliderOrder(0);
      if (sliderFileRef.current) sliderFileRef.current.value = '';
      toast.success('स्लाइडर जोडला! 🎉');
    } catch {
      toast.error('स्लाइडर जोडण्यात त्रुटी झाली.');
    } finally {
      setAddingSlider(false);
    }
  }

  // ── Delete slider ─────────────────────────────────────────────
  async function handleDeleteSlider(id) {
    if (!window.confirm('हा स्लाइडर काढायचा आहे का?')) return;
    try {
      await homeAPI.deleteSlider(id);
      setSliders(prev => prev.filter(s => s.id !== id));
      toast.success('स्लाइडर काढला.');
    } catch {
      toast.error('स्लाइडर काढण्यात त्रुटी झाली.');
    }
  }

  // ── Toggle slider active ───────────────────────────────────────
  async function handleToggle(id) {
    try {
      await homeAPI.toggleSlider(id);
      setSliders(prev => prev.map(s => s.id === id ? { ...s, is_active: s.is_active ? 0 : 1 } : s));
    } catch {
      toast.error('अपडेट करण्यात त्रुटी झाली.');
    }
  }

  if (loading) return (
    <AdminLayout><div className="page-loader"><div className="spinner" /></div></AdminLayout>
  );

  const previewImg = heroPreview || imgSrc(heroImage);

  return (
    <AdminLayout>
      <div>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>🏠 होमपेज संपादक</h1>
            <Link to="/admin" className={styles.adminBadge} style={{ textDecoration: 'none' }}>← डॅशबोर्ड</Link>
          </div>

          {/* ── Hero Content Form ────────────────────────────────── */}
          <div className={styles.card} style={{ marginBottom: '2rem' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>🌅 हिरो सेक्शन</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

                <div className={styles.formGroup}>
                  <label className={styles.label}>शीर्षक (Title)</label>
                  <input
                    className={styles.input}
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="आपल्या सर्व पूजांसाठी..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>उप-शीर्षक (Subtitle)</label>
                  <input
                    className={styles.input}
                    value={form.subtitle}
                    onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                    placeholder="घरी पूजा, मनासारखी"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>बटण १ मजकूर</label>
                  <input
                    className={styles.input}
                    value={form.button_text_1}
                    onChange={e => setForm(p => ({ ...p, button_text_1: e.target.value }))}
                    placeholder="पूजा बुक करा"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>बटण २ मजकूर</label>
                  <input
                    className={styles.input}
                    value={form.button_text_2}
                    onChange={e => setForm(p => ({ ...p, button_text_2: e.target.value }))}
                    placeholder="अधिक जाणून घ्या"
                  />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
                <label className={styles.label}>वर्णन (Description)</label>
                <textarea
                  className={styles.input}
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="वेबसाइटबद्दल थोडे लिहा..."
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Hero Image Upload */}
              <div className={styles.formGroup} style={{ marginBottom: '1.5rem' }}>
                <label className={styles.label}>हिरो इमेज</label>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {previewImg && (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={previewImg}
                        alt="Hero Preview"
                        style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '50%', border: '3px solid #E07B2A', boxShadow: '0 4px 16px rgba(224,123,42,0.3)' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      {heroPreview && (
                        <span style={{ position: 'absolute', top: 4, right: 4, background: '#E07B2A', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>नवीन</span>
                      )}
                    </div>
                  )}
                  <div>
                    <input
                      ref={heroFileRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={onHeroFileChange}
                    />
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => heroFileRef.current?.click()}
                    >
                      📷 इमेज बदला
                    </button>
                    <p style={{ marginTop: 6, fontSize: 12, color: '#888' }}>JPEG, PNG, WEBP — max 5MB</p>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.btn} disabled={saving}>
                {saving ? '⏳ जतन होत आहे...' : '💾 जतन करा'}
              </button>
            </form>
          </div>

          {/* ── Slider Management ─────────────────────────────────── */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '1.5rem' }}>🖼️ इमेज स्लाइडर</h2>

            {/* Add new slider */}
            <form onSubmit={handleAddSlider} style={{ marginBottom: '2rem', padding: '1.25rem', background: '#faf6f0', borderRadius: 10, border: '1px dashed #E07B2A' }}>
              <h3 style={{ marginBottom: '1rem', color: '#8B1A1A', fontWeight: 600 }}>+ नवीन स्लाइड जोडा</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>स्लाइड शीर्षक (optional)</label>
                  <input
                    className={styles.input}
                    value={sliderTitle}
                    onChange={e => setSliderTitle(e.target.value)}
                    placeholder="गणपती बाप्पा..."
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>क्रम (Sort Order)</label>
                  <input
                    className={styles.input}
                    type="number"
                    min={0}
                    value={sliderOrder}
                    onChange={e => setSliderOrder(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                <label className={styles.label}>वर्णन (optional)</label>
                <input
                  className={styles.input}
                  value={sliderDesc}
                  onChange={e => setSliderDesc(e.target.value)}
                  placeholder="स्लाइडचे वर्णन..."
                />
              </div>

              {/* Slider image picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {sliderPreview && (
                  <img
                    src={sliderPreview}
                    alt="Slider Preview"
                    style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #E07B2A' }}
                  />
                )}
                <div>
                  <input
                    ref={sliderFileRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={onSliderFileChange}
                  />
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => sliderFileRef.current?.click()}
                  >
                    🖼️ इमेज निवडा
                  </button>
                  {sliderFile && <p style={{ marginTop: 4, fontSize: 12, color: '#4caf50' }}>✓ {sliderFile.name}</p>}
                </div>
              </div>

              <button type="submit" className={styles.btn} disabled={addingSlider || !sliderFile}>
                {addingSlider ? '⏳ जोडत आहे...' : '+ स्लाइड जोडा'}
              </button>
            </form>

            {/* Existing sliders grid */}
            {sliders.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>अद्याप कोणताही स्लाइड नाही.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {sliders.map(sl => (
                  <div
                    key={sl.id}
                    style={{
                      borderRadius: 10,
                      overflow: 'hidden',
                      border: `2px solid ${sl.is_active ? '#E07B2A' : '#ddd'}`,
                      background: '#fff',
                      boxShadow: sl.is_active ? '0 2px 12px rgba(224,123,42,0.2)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ position: 'relative', height: 140 }}>
                      <img
                        src={imgSrc(sl.image_url)}
                        alt={sl.title || 'slide'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          background: sl.is_active ? '#4caf50' : '#9e9e9e',
                          color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11,
                        }}
                      >
                        {sl.is_active ? 'Active' : 'Off'}
                      </span>
                    </div>
                    {sl.title && (
                      <div style={{ padding: '6px 10px', fontSize: 13, fontWeight: 600, color: '#333', borderTop: '1px solid #f0e6d3' }}>
                        {sl.title}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6, padding: '8px 10px' }}>
                      <button
                        onClick={() => handleToggle(sl.id)}
                        style={{
                          flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: sl.is_active ? '#fff3e0' : '#e8f5e9',
                          color: sl.is_active ? '#E07B2A' : '#4caf50',
                          fontSize: 12, fontWeight: 600,
                        }}
                      >
                        {sl.is_active ? '⏸ बंद करा' : '▶ चालू करा'}
                      </button>
                      <button
                        onClick={() => handleDeleteSlider(sl.id)}
                        style={{
                          padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: '#ffebee', color: '#c62828', fontSize: 13,
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      </div>
    </AdminLayout>
  );
}
