// src/pages/admin/AdminTheme.jsx
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { themeAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import {
  PRESET_THEMES, THEME_MODE_OPTIONS, ALL_THEMES, getThemeById,
} from '../../themes/themes';
import adminStyles from './Admin.module.css';
import s from '../../styles/AdminTheme.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const EMPTY_FESTIVAL = { festival_name: '', theme_name: '', start_date: '', end_date: '', is_active: true };

export default function AdminTheme() {
  const { theme: activeTheme, mode: activeMode, festival_name, refreshTheme, setThemeManually } = useTheme();

  const [settings,     setSettings]     = useState({ active_theme: activeTheme, theme_mode: activeMode });
  const [festivals,    setFestivals]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);
  const [showModal,    setShowModal]    = useState(false);
  const [editItem,     setEditItem]     = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_FESTIVAL);

  // Manual upload
  const [uploadingId,  setUploadingId]  = useState(null);
  const fileInputRef   = useRef(null);
  const uploadFestIdRef = useRef(null);

  const currentYear = new Date().getFullYear();

  // Detect if current year is missing from DB
  const hasCurrentYearData = festivals.some(f => {
    const y = new Date(f.start_date).getFullYear();
    return y === currentYear;
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await themeAPI.getFestivals();
      const d = res.data.data || {};
      setFestivals(d.festivals || []);
      if (d.settings) setSettings({ active_theme: d.settings.active_theme, theme_mode: d.settings.theme_mode });
    } catch { toast.error('डेटा मिळवताना त्रुटी.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleThemeSelect = async (themeId) => {
    setThemeManually(themeId);
    setSettings(p => ({ ...p, active_theme: themeId }));
    try {
      await themeAPI.update({ active_theme: themeId, theme_mode: settings.theme_mode });
      localStorage.setItem('pojjari_theme', JSON.stringify({ theme: themeId, mode: settings.theme_mode, festival_name: null }));
      toast.success('थीम लागू केली! ✨');
    } catch { toast.error('जतन करताना त्रुटी.'); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await themeAPI.update({ active_theme: settings.active_theme, theme_mode: settings.theme_mode });
      await refreshTheme();
      toast.success('थीम जतन केली! ✨');
    } catch { toast.error('जतन करताना त्रुटी.'); }
    finally { setSaving(false); }
  };

  const openAdd  = () => { setEditItem(null); setFormData(EMPTY_FESTIVAL); setShowModal(true); };
  const openEdit = (f) => {
    setEditItem(f);
    setFormData({
      festival_name: f.festival_name,
      theme_name:    f.theme_name,
      start_date:    f.start_date?.split('T')[0] || '',
      end_date:      f.end_date?.split('T')[0]   || '',
      is_active:     f.is_active,
    });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!formData.festival_name || !formData.theme_name || !formData.start_date || !formData.end_date) {
      return toast.error('सर्व फील्ड भरा.');
    }
    try {
      if (editItem) { await themeAPI.updateFestival(editItem.id, formData); toast.success('सण थीम अपडेट केली.'); }
      else          { await themeAPI.addFestival(formData);                 toast.success('सण थीम जोडली.'); }
      setShowModal(false);
      loadData();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" काढायची का?`)) return;
    try {
      await themeAPI.deleteFestival(id);
      toast.success('सण थीम काढली.');
      loadData();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  // ── Manual image upload ──────────────────────────────────────
  const handleUploadClick = (festival) => {
    uploadFestIdRef.current = festival.id;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const festId = uploadFestIdRef.current;
    setUploadingId(festId);
    e.target.value = '';
    try {
      const res = await themeAPI.uploadImage(festId, file);
      const { image_url } = res.data.data;
      setFestivals(prev => prev.map(f =>
        f.id === festId ? { ...f, image_url, thumb_url: image_url } : f
      ));
      toast.success('✅ इमेज अपलोड झाली!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'अपलोड करताना त्रुटी झाली.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleAutoUpdate = async (year) => {
    if (!window.confirm(
      `${year} वर्षाचे सर्व सण Kalnirnay Panchang नुसार अपडेट करायचे आहेत का?\n\n• सर्व जुने सण (सर्व वर्षांचे) हटवले जातील\n• ${year} वर्षाचे नवीन अचूक तारखांसह सण जोडले जातील`
    )) return;
    setAutoUpdating(true);
    try {
      const res = await themeAPI.autoUpdate(year);
      toast.success(res.data.message || `✅ ${year} वर्षाचे सण अपडेट केले!`, { duration: 4000 });
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Auto-update करताना त्रुटी झाली.');
    } finally { setAutoUpdating(false); }
  };

  const resolvedTheme = getThemeById(activeTheme);

  return (
    <AdminLayout>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <h1 className={adminStyles.pageTitle} style={{ margin: 0 }}>🎨 थीम व्यवस्थापन</h1>
          <Link to="/admin/gallery"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#fff8f0,#ffe0b2)', border: '1.5px solid #E07B2A', color: '#8B2500', fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 2px 8px rgba(224,123,42,0.15)', transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(224,123,42,0.3)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(224,123,42,0.15)'}>
            🖼️ सण गॅलरी
          </Link>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <>
            {/* ── Live Preview ── */}
            <div className={s.previewCard} style={{ marginBottom: 40 }}>
              <div className={s.previewDot}>{resolvedTheme?.emoji || '🎨'}</div>
              <div className={s.previewInfo}>
                <div className={s.previewLabel}>सध्या सक्रिय थीम</div>
                <div className={s.previewTheme}>
                  {resolvedTheme?.nameMarathi || activeTheme}
                  {resolvedTheme?.dark && <span className={s.darkBadge}>🌙 Dark</span>}
                </div>
                <div className={s.previewMode}>मोड: {THEME_MODE_OPTIONS.find(m => m.id === activeMode)?.labelMarathi || activeMode}</div>
                {festival_name && <div className={s.previewFestival}>🎉 सक्रिय सण: {festival_name}</div>}
              </div>
            </div>

            {/* ── SECTION 1: Theme Mode ── */}
            <section className={s.section}>
              <div className={s.sectionTitle}>⚙️ थीम मोड निवडा</div>
              <div className={s.modeGrid}>
                {THEME_MODE_OPTIONS.map(m => (
                  <div key={m.id} className={`${s.modeCard} ${settings.theme_mode === m.id ? s.modeCardActive : ''}`}
                    onClick={() => setSettings(p => ({ ...p, theme_mode: m.id }))}>
                    <span className={s.modeEmoji}>{m.emoji}</span>
                    <span className={s.modeLabel}>{m.label}</span>
                    <span className={s.modeLabelMr}>{m.labelMarathi}</span>
                    <span className={s.modeDesc}>{m.desc}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── SECTION 2: Preset Themes ── */}
            <section className={s.section}>
              <div className={s.sectionTitle}>🎨 थीम निवडा</div>
              <div className={s.themeGrid}>
                {PRESET_THEMES.map(t => {
                  const isActive = settings.active_theme === t.id;
                  return (
                    <div key={t.id} className={`${s.themeCard} ${isActive ? s.themeCardActive : ''}`}
                      onClick={() => handleThemeSelect(t.id)}>
                      {isActive && <div className={s.activeCheck}>✓</div>}
                      <span className={s.themeEmoji}>{t.emoji}</span>
                      <span className={s.themeName}>{t.name}</span>
                      <span className={s.themeNameMr}>{t.nameMarathi}</span>
                      <span className={s.themeDesc}>{t.desc}</span>
                      <div className={s.swatches}>
                        {t.colors.map((c, i) => <div key={i} className={s.swatch} style={{ background: c }} />)}
                      </div>
                      {t.dark && <div className={s.darkBadge}>🌙 Dark Mode</div>}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Festival Theme Preview ── */}
            <section className={s.section}>
              <div className={s.sectionTitle}>🎉 सण थीम पूर्वावलोकन</div>
              <div className={s.themeGrid}>
                {ALL_THEMES.filter(t => !PRESET_THEMES.find(p => p.id === t.id)).map(t => (
                  <div key={t.id} className={s.themeCard} style={{ pointerEvents: 'none', opacity: 0.85 }}>
                    <span className={s.themeEmoji}>{t.emoji}</span>
                    <span className={s.themeName}>{t.name}</span>
                    <span className={s.themeNameMr}>{t.nameMarathi}</span>
                    <div className={s.swatches}>
                      {t.colors.map((c, i) => <div key={i} className={s.swatch} style={{ background: c }} />)}
                    </div>
                    {t.dark && <div className={s.darkBadge}>🌙 Dark</div>}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Save Button ── */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ जतन होत आहे…' : '💾 थीम जतन करा'}
              </button>
            </div>

            {/* ── SECTION 3: Festival Manager ── */}
            <section className={s.section}>
              <div className={s.festivalHeader}>
                <div className={s.sectionTitle} style={{ marginBottom: 0 }}>📅 सण थीम व्यवस्थापक</div>
                <button className="btn btn-primary btn-sm" onClick={openAdd}>+ सण जोडा</button>
              </div>

              {/* ⚠️ Warning: current year data missing */}
              {!hasCurrentYearData && (
                <div style={{ background: '#fff3e0', border: '1.5px solid #E07B2A', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22 }}>⚠️</span>
                  <div>
                    <strong style={{ color: '#8B2500', fontSize: 14 }}>{currentYear} वर्षाचे सण DB मध्ये नाहीत!</strong>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#6D4C41' }}>
                      थीम auto-switch काम करणार नाही. खालील "{currentYear} Update" बटण क्लिक करा.
                    </p>
                  </div>
                  <button
                    onClick={() => handleAutoUpdate(currentYear)}
                    disabled={autoUpdating}
                    style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, border: 'none', background: '#E07B2A', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
                  >
                    🔄 आत्ताच Fix करा
                  </button>
                </div>
              )}

              {/* Kalnirnay Auto-Update Panel */}
              <div style={{ background: 'linear-gradient(135deg,#fff8e1,#fff3e0)', border: '1.5px solid #ffcc02', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 32 }}>📅</div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#8B4513', fontSize: 15 }}>Kalnirnay Panchang — Auto Update</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#6D4C41', lineHeight: 1.6 }}>
                    गणेश चतुर्थी, नवरात्री, दिवाळी, श्रावण मास यांच्या अचूक तारखा Hindu Panchang नुसार
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleAutoUpdate(currentYear)} disabled={autoUpdating}
                    style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#E07B2A', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', opacity: autoUpdating ? 0.7 : 1 }}>
                    {autoUpdating ? '⏳ Update...' : `🔄 ${currentYear} Update`}
                  </button>
                  <button onClick={() => handleAutoUpdate(currentYear + 1)} disabled={autoUpdating}
                    style={{ padding: '9px 16px', borderRadius: 8, border: '1.5px solid #E07B2A', background: '#fff', color: '#E07B2A', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', opacity: autoUpdating ? 0.7 : 1 }}>
                    📆 {currentYear + 1}
                  </button>
                </div>
              </div>

              {festivals.length === 0 ? (
                <div className={adminStyles.empty} style={{ padding: '40px 20px' }}>
                  <span>📅</span><p>कोणतेही सण थीम कॉन्फिगर नाहीत.</p>
                </div>
              ) : (
                <div className={adminStyles.tableWrap}>
                  <table className={adminStyles.table}>
                    <thead>
                      <tr>
                        <th>इमेज</th>
                        <th>सणाचे नाव</th>
                        <th>थीम</th>
                        <th>तारीख</th>
                        <th>स्थिती</th>
                        <th>अपलोड</th>
                        <th>कृती</th>
                      </tr>
                    </thead>
                    <tbody>
                      {festivals.map(f => {
                        const themeInfo  = ALL_THEMES.find(t => t.id === f.theme_name);
                        const today      = new Date().toISOString().split('T')[0];
                        const startDate  = f.start_date?.split('T')[0];
                        const endDate    = f.end_date?.split('T')[0];
                        const isNow      = f.is_active && startDate <= today && endDate >= today;
                        const isPast     = endDate < today;
                        const imgSrc     = f.image_url ? `${BASE_URL}${f.image_url}` : null;
                        const isUploading = uploadingId === f.id;
                        return (
                          <tr key={f.id}>
                            {/* Image thumbnail */}
                            <td style={{ width: 64 }}>
                              {isUploading ? (
                                <div className={s.aiThumb} style={{ background: '#e3f2fd' }}>
                                  <span className={s.aiSpinner}>⏳</span>
                                </div>
                              ) : imgSrc ? (
                                <div className={s.aiThumb}>
                                  <img src={`${imgSrc}?t=${Date.now()}`} alt={f.festival_name} className={s.aiThumbImg}
                                    onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
                                </div>
                              ) : (
                                <div className={s.aiThumb} style={{ background: '#f5f5f5', color: '#bbb', fontSize: 18 }}>🖼️</div>
                              )}
                            </td>

                            <td><strong>{f.festival_name}</strong></td>
                            <td>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {themeInfo?.emoji || '🎨'} {themeInfo?.nameMarathi || f.theme_name}
                              </span>
                            </td>
                            <td style={{ fontSize: 12 }}>
                              {f.start_date?.split('T')[0]} –<br />{f.end_date?.split('T')[0]}
                            </td>
                            <td>
                              {isNow ? (
                                <span className="badge badge-success">● सक्रिय</span>
                              ) : isPast ? (
                                <span className="badge" style={{ background: '#eeeeee', color: '#888', border: '1px solid #ddd' }}>✓ संपला</span>
                              ) : f.is_active ? (
                                <span className="badge badge-warning">○ येणार</span>
                              ) : (
                                <span className="badge badge-danger">✕ बंद</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => handleUploadClick(f)}
                                disabled={isUploading}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #1565c0', background: isUploading ? '#e3f2fd' : '#e8eaf6', color: '#1565c0', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {isUploading ? '⏳ अपलोड...' : '📤 इमेज Upload'}
                              </button>
                            </td>
                            <td>
                              <div className={adminStyles.actionBtns}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>✏️</button>
                                <button className="btn btn-sm" style={{ background: '#c62828', color: '#fff' }}
                                  onClick={() => handleDelete(f.id, f.festival_name)}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* ── Festival Add/Edit Modal ── */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal}>
            <div className={s.modalTitle}>{editItem ? '✏️ सण थीम संपादित करा' : '➕ नवीन सण थीम जोडा'}</div>
            <div className={s.formGroup}>
              <label className={s.label}>सणाचे नाव *</label>
              <input className={s.input} placeholder="उदा. गणेश चतुर्थी"
                value={formData.festival_name} onChange={e => setFormData(p => ({ ...p, festival_name: e.target.value }))} />
            </div>
            <div className={s.formGroup}>
              <label className={s.label}>थीम निवडा *</label>
              <select className={s.select} value={formData.theme_name}
                onChange={e => setFormData(p => ({ ...p, theme_name: e.target.value }))}>
                <option value="">-- थीम निवडा --</option>
                <optgroup label="🎉 सण थीम">
                  {['ganpati', 'diwali', 'navratri', 'pitru-paksha', 'shravan'].map(id => {
                    const t = ALL_THEMES.find(x => x.id === id);
                    return <option key={id} value={id}>{t?.emoji} {t?.nameMarathi || id}</option>;
                  })}
                </optgroup>
                <optgroup label="🎨 Preset थीम">
                  {PRESET_THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.nameMarathi}</option>)}
                </optgroup>
              </select>
            </div>
            <div className={s.formRow}>
              <div className={s.formGroup}>
                <label className={s.label}>सुरुवात *</label>
                <input type="date" className={s.input} value={formData.start_date}
                  onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>शेवट *</label>
                <input type="date" className={s.input} value={formData.end_date}
                  onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className={s.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.is_active}
                  onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} />
                <span className={s.label} style={{ margin: 0 }}>सक्रिय ठेवा</span>
              </label>
            </div>
            <div className={s.modalActions}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>रद्द करा</button>
              <button className="btn btn-primary btn-sm" onClick={handleModalSave}>
                {editItem ? '✅ अपडेट करा' : '➕ जोडा'}
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
