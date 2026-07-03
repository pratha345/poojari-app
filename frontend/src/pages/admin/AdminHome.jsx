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
    title:          '',
    subtitle:       '',
    description:    '',
    button_text_1:  '',
    button_text_2:  '',
    stat_bookings:  '५,०००+',
    stat_pujaris:   '५००+',
    stat_cities:    '३५+',
    stat_years:     '५+',
  });
  const [heroImage,    setHeroImage]    = useState(null);
  const [heroPreview,  setHeroPreview]  = useState(null);
  const heroFileRef = useRef();

  // Background image
  const [bgImage,    setBgImage]    = useState(null);
  const [bgPreview,  setBgPreview]  = useState(null);
  const [clearBg,    setClearBg]    = useState(false);
  const bgFileRef = useRef();

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
            stat_bookings: content.stat_bookings || '५,०००+',
            stat_pujaris:  content.stat_pujaris  || '५००+',
            stat_cities:   content.stat_cities   || '३५+',
            stat_years:    content.stat_years    || '५+',
          });
          setHeroImage(content.hero_image || null);
          setBgImage(content.bg_image || null);
        }
        setSliders(sl || []);
      })
      .catch(() => toast.error('माहिती लोड करण्यात त्रुटी झाली.'))
      .finally(() => setLoading(false));
  }, []);

  function onHeroFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setHeroPreview(URL.createObjectURL(file));
  }

  function onBgFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBgPreview(URL.createObjectURL(file));
  }

  // ── Save hero content ──────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const heroFile = heroFileRef.current?.files[0];
      const bgFile   = bgFileRef.current?.files[0];
      if (heroFile) fd.append('hero_image', heroFile);
      if (bgFile)   fd.append('bg_image',   bgFile);
      if (clearBg)  fd.append('clear_bg_image', '1');

      await homeAPI.upsert(fd);
      toast.success('होमपेज सामग्री जतन केली! 🙏');
      if (heroPreview) { setHeroImage(heroPreview); setHeroPreview(null); }
      if (bgPreview)   { setBgImage(bgPreview);     setBgPreview(null); }
      if (clearBg)     { setBgImage(null);           setClearBg(false); }
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
            <Link to="/admin/report" className={styles.adminBadge} style={{ textDecoration: 'none' }}>← अहवाल</Link>
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

              {/* Stats Section */}
              <div style={{ gridColumn: '1 / -1', background: '#faf6f0', borderRadius: 10, padding: '1.25rem', border: '1px solid #f0dfc0', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#8B1A1A', fontWeight: 700, fontSize: 14 }}>📊 आकडेवारी (Stats Strip)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  {[
                    { key: 'stat_bookings', label: '📅 बुकिंग', placeholder: '५,०००+' },
                    { key: 'stat_pujaris',  label: '🙏 पुजारी',  placeholder: '५००+' },
                    { key: 'stat_cities',   label: '📍 शहरे',    placeholder: '३५+' },
                    { key: 'stat_years',    label: '⭐ वर्षे',   placeholder: '५+' },
                  ].map(s => (
                    <div className={styles.formGroup} key={s.key}>
                      <label className={styles.label}>{s.label}</label>
                      <input
                        className={styles.input}
                        value={form[s.key]}
                        onChange={e => setForm(p => ({ ...p, [s.key]: e.target.value }))}
                        placeholder={s.placeholder}
                      />
                    </div>
                  ))}
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 11, color: '#aaa' }}>
                  उदा: "५,०००+" किंवा "500+" — homepage वर hero section च्या खाली stats strip मध्ये दिसेल
                </p>
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
                <label className={styles.label}>🖼️ हिरो इमेज <span style={{fontWeight:400,fontSize:12,color:'#888'}}>(उजव्या बाजूचे decorative image — fallback)</span></label>
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#888' }}>Desktop hero च्या उजव्या panel मध्ये हे दिसते. जर खाली Slider images असतील तर त्या priority मध्ये येतात.</p>
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

              {/* Auto featured-pooja background info */}
              <div style={{ marginBottom: '1.25rem', padding: '14px 18px', background: 'linear-gradient(135deg,#e8f5e9,#f1f8e9)', borderRadius: 10, border: '1.5px solid #a5d6a7', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🔄</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#2e7d32' }}>Hero Background — Auto Featured Pooja Cycling</p>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#388e3c', lineHeight: 1.6 }}>
                    Homepage च्या hero background मध्ये आता <strong>featured पूजा इमेज आपोआप बदलत राहतात</strong> (दर ७ सेकंदांनी). <br />
                    खाली custom background इमेज upload केल्यास ती <strong>सर्वात जास्त प्राधान्य</strong> मिळेल आणि cycling बंद होईल.
                    Manage Poojas → पूजेला "featured" केल्यावर ती आपोआप background मध्ये येते.
                  </p>
                </div>
              </div>

              {/* Background Image Upload */}
              <div className={styles.formGroup} style={{ marginBottom: '1.5rem', background: '#faf6f0', borderRadius: 10, padding: '1.25rem', border: '1px solid #f0dfc0' }}>
                <label className={styles.label} style={{ marginBottom: 4 }}>🌅 Custom Background इमेज (optional override)</label>
                <p style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
                  येथे इमेज upload केल्यास ती hero background मध्ये <strong>0.75 opacity</strong> + gradient overlay सह दिसेल आणि auto-cycling बंद होईल. सणासुदीचे फोटो, मंदिराचे फोटो इ. साठी उपयुक्त.
                </p>

                <input ref={bgFileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => { onBgFileChange(e); setClearBg(false); }} />

                {/* Case 1: clearBg marked — show undo option */}
                {clearBg && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#ffebee', borderRadius: 8, border: '1px solid #ffcdd2' }}>
                    <span style={{ fontSize: 20 }}>🗑️</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#c62828' }}>Background इमेज काढली जाईल</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#c62828' }}>जतन केल्यावर homepage वर फक्त gradient दिसेल</p>
                    </div>
                    <button type="button"
                      onClick={() => setClearBg(false)}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #c62828', background: '#fff', color: '#c62828', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      ↩️ रद्द करा
                    </button>
                  </div>
                )}

                {/* Case 2: image set and not clearing */}
                {!clearBg && (bgPreview || imgSrc(bgImage)) && (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Preview */}
                    <div style={{ position: 'relative', width: 200, height: 110, borderRadius: 10, overflow: 'hidden', border: '2px solid #E07B2A', background: 'linear-gradient(125deg,#fffdf8,#feefd5,#fde0a0)', flexShrink: 0 }}>
                      <img src={bgPreview || imgSrc(bgImage)} alt=""
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.13, filter: 'blur(1.5px)' }}
                        onError={e => { e.currentTarget.style.display = 'none'; }} />
                      <div style={{ position: 'relative', inset: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 20, opacity: 0.25, fontFamily: 'serif' }}>ॐ</span>
                        <span style={{ fontSize: 10, color: '#8B4513', fontWeight: 600, marginTop: 4 }}>Homepage preview</span>
                      </div>
                      {bgPreview && <span style={{ position: 'absolute', top: 4, left: 4, background: '#E07B2A', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>नवीन</span>}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button type="button" className={styles.btnSecondary}
                        onClick={() => bgFileRef.current?.click()}>
                        🔄 वेगळी इमेज निवडा
                      </button>
                      <button type="button"
                        onClick={() => { setBgPreview(null); if (bgFileRef.current) bgFileRef.current.value = ''; if (bgImage) setClearBg(true); }}
                        style={{ padding: '8px 16px', borderRadius: 6, border: '1.5px solid #c62828', background: '#fff', color: '#c62828', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        🗑️ Background इमेज काढा
                      </button>
                      <p style={{ margin: 0, fontSize: 11, color: '#888' }}>JPEG, PNG, WEBP — max 5MB</p>
                    </div>
                  </div>
                )}

                {/* Case 3: no image set yet */}
                {!clearBg && !bgPreview && !bgImage && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button type="button" className={styles.btnSecondary}
                      onClick={() => bgFileRef.current?.click()}>
                      🖼️ Background इमेज निवडा
                    </button>
                    <p style={{ margin: 0, fontSize: 12, color: '#aaa' }}>JPEG, PNG, WEBP — max 5MB</p>
                  </div>
                )}
              </div>

              <button type="submit" className={styles.btn} disabled={saving}>
                {saving ? '⏳ जतन होत आहे...' : '💾 जतन करा'}
              </button>
            </form>
          </div>

          {/* ── Slider Management ─────────────────────────────────── */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>🖼️ Hero उजवा पॅनल — Slider Images</h2>
            <div style={{ marginBottom: '1.5rem', padding: '12px 16px', background: '#fff8e1', borderRadius: 8, border: '1px solid #ffe082', fontSize: 13, color: '#6d4c41', lineHeight: 1.7 }}>
              <strong>📌 हे कशासाठी आहे?</strong><br />
              येथे upload केलेल्या images desktop hero च्या <strong>उजव्या बाजूच्या decorative frame</strong> मध्ये आणि mobile वर hero image म्हणून slideshow मध्ये दिसतात.<br />
              <span style={{color:'#388e3c',fontWeight:600}}>★ Featured Poojas Slider</span> (homepage च्या खालच्या भागात): ते <strong>Manage Poojas</strong> मधून पूजेला "Featured" केल्यावर आपोआप येते — वेगळे manage करावे लागत नाही.
            </div>

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
