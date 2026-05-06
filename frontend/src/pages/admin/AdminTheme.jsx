// src/pages/admin/AdminTheme.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { themeAPI } from '../../api/index.js';
import AdminLayout from './AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import {
  PRESET_THEMES, FESTIVAL_THEME_OPTIONS, THEME_MODE_OPTIONS, ALL_THEMES, getThemeById,
} from '../../themes/themes';
import adminStyles from './Admin.module.css';
import s from '../../styles/AdminTheme.module.css';

const EMPTY_FESTIVAL = { festival_name: '', theme_name: '', start_date: '', end_date: '', is_active: true };

export default function AdminTheme() {
  const { theme: activeTheme, mode: activeMode, festival_name, refreshTheme, setThemeManually } = useTheme();

  const [settings,   setSettings]   = useState({ active_theme: activeTheme, theme_mode: activeMode });
  const [festivals,  setFestivals]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [formData,   setFormData]   = useState(EMPTY_FESTIVAL);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await themeAPI.getFestivals();
      const d = res.data.data || {};
      setFestivals(d.festivals || []);
      if (d.settings) {
        setSettings({ active_theme: d.settings.active_theme, theme_mode: d.settings.theme_mode });
      }
    } catch { toast.error('डेटा मिळवताना त्रुटी.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // Save theme settings
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
      if (editItem) {
        await themeAPI.updateFestival(editItem.id, formData);
        toast.success('सण थीम अपडेट केली.');
      } else {
        await themeAPI.addFestival(formData);
        toast.success('सण थीम जोडली.');
      }
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

  const resolvedTheme = getThemeById(activeTheme);

  return (
    <AdminLayout>
      <div>
          <h1 className={adminStyles.pageTitle}>🎨 थीम व्यवस्थापन</h1>

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
                  <div className={s.previewMode}>
                    मोड: {THEME_MODE_OPTIONS.find(m => m.id === activeMode)?.labelMarathi || activeMode}
                  </div>
                  {festival_name && (
                    <div className={s.previewFestival}>🎉 सक्रिय सण: {festival_name}</div>
                  )}
                </div>
              </div>

              {/* ── SECTION 1: Theme Mode ── */}
              <section className={s.section}>
                <div className={s.sectionTitle}>⚙️ थीम मोड निवडा</div>
                <div className={s.modeGrid}>
                  {THEME_MODE_OPTIONS.map(m => (
                    <div
                      key={m.id}
                      className={`${s.modeCard} ${settings.theme_mode === m.id ? s.modeCardActive : ''}`}
                      onClick={() => setSettings(p => ({ ...p, theme_mode: m.id }))}
                    >
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
                <div className={s.sectionTitle}>🎨 थीम निवडा (डिफॉल्ट / Manual)</div>
                <div className={s.themeGrid}>
                  {PRESET_THEMES.map(t => {
                    const isActive = settings.active_theme === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`${s.themeCard} ${isActive ? s.themeCardActive : ''}`}
                        onClick={() => handleThemeSelect(t.id)}
                      >
                        {isActive && <div className={s.activeCheck}>✓</div>}
                        <span className={s.themeEmoji}>{t.emoji}</span>
                        <span className={s.themeName}>{t.name}</span>
                        <span className={s.themeNameMr}>{t.nameMarathi}</span>
                        <span className={s.themeDesc}>{t.desc}</span>
                        <div className={s.swatches}>
                          {t.colors.map((c, i) => (
                            <div key={i} className={s.swatch} style={{ background: c }} title={c} />
                          ))}
                        </div>
                        {t.dark && <div className={s.darkBadge}>🌙 Dark Mode</div>}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── Festival Preview ── */}
              <section className={s.section}>
                <div className={s.sectionTitle}>🎉 सण थीम पूर्वावलोकन</div>
                <div className={s.themeGrid}>
                  {ALL_THEMES.filter(t => !PRESET_THEMES.find(p => p.id === t.id)).map(t => (
                    <div key={t.id} className={s.themeCard} style={{ pointerEvents: 'none', opacity: 0.85 }}>
                      <span className={s.themeEmoji}>{t.emoji}</span>
                      <span className={s.themeName}>{t.name}</span>
                      <span className={s.themeNameMr}>{t.nameMarathi}</span>
                      <div className={s.swatches}>
                        {t.colors.map((c, i) => (
                          <div key={i} className={s.swatch} style={{ background: c }} title={c} />
                        ))}
                      </div>
                      {t.dark && <div className={s.darkBadge}>🌙 Dark</div>}
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                  💡 सण थीम आपोआप तारखेनुसार लागू होतात (festival/auto मोडमध्ये).
                </p>
              </section>

              {/* ── Save Button ── */}
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ जतन होत आहे…' : '💾 थीम जतन करा'}
                </button>
              </div>

              {/* ── SECTION 3: Festival Theme Manager ── */}
              <section className={s.section}>
                <div className={s.festivalHeader}>
                  <div className={s.sectionTitle} style={{ marginBottom: 0 }}>📅 सण थीम व्यवस्थापक</div>
                  <button className="btn btn-primary btn-sm" onClick={openAdd}>+ सण जोडा</button>
                </div>

                {festivals.length === 0 ? (
                  <div className={adminStyles.empty} style={{ padding: '40px 20px' }}>
                    <span>📅</span>
                    <p>कोणतेही सण थीम कॉन्फिगर नाहीत.</p>
                  </div>
                ) : (
                  <div className={adminStyles.tableWrap}>
                    <table className={adminStyles.table}>
                      <thead>
                        <tr>
                          <th>सणाचे नाव</th>
                          <th>थीम</th>
                          <th>सुरुवात</th>
                          <th>शेवट</th>
                          <th>स्थिती</th>
                          <th>कृती</th>
                        </tr>
                      </thead>
                      <tbody>
                        {festivals.map(f => {
                          const themeInfo = ALL_THEMES.find(t => t.id === f.theme_name);
                          const today = new Date().toISOString().split('T')[0];
                          const isNow = f.is_active && f.start_date?.split('T')[0] <= today && f.end_date?.split('T')[0] >= today;
                          return (
                            <tr key={f.id}>
                              <td><strong>{f.festival_name}</strong></td>
                              <td>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {themeInfo?.emoji || '🎨'} {themeInfo?.nameMarathi || f.theme_name}
                                </span>
                              </td>
                              <td>{f.start_date?.split('T')[0]}</td>
                              <td>{f.end_date?.split('T')[0]}</td>
                              <td>
                                {isNow ? (
                                  <span className="badge badge-success">● सक्रिय आता</span>
                                ) : f.is_active ? (
                                  <span className="badge badge-warning">○ येणार</span>
                                ) : (
                                  <span className="badge badge-danger">✕ बंद</span>
                                )}
                              </td>
                              <td>
                                <div className={adminStyles.actionBtns}>
                                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f)}>✏️ संपादित</button>
                                  <button className="btn btn-sm" style={{ background: '#c62828', color: '#fff' }} onClick={() => handleDelete(f.id, f.festival_name)}>🗑️ काढा</button>
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

      {/* ── Festival Modal ── */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal}>
            <div className={s.modalTitle}>{editItem ? '✏️ सण थीम संपादित करा' : '➕ नवीन सण थीम जोडा'}</div>

            <div className={s.formGroup}>
              <label className={s.label}>सणाचे नाव *</label>
              <input
                className={s.input}
                placeholder="उदा. गणेश चतुर्थी"
                value={formData.festival_name}
                onChange={e => setFormData(p => ({ ...p, festival_name: e.target.value }))}
              />
            </div>

            <div className={s.formGroup}>
              <label className={s.label}>थीम निवडा *</label>
              <select
                className={s.select}
                value={formData.theme_name}
                onChange={e => setFormData(p => ({ ...p, theme_name: e.target.value }))}
              >
                <option value="">-- थीम निवडा --</option>
                <optgroup label="🎉 सण थीम">
                  {['ganpati','diwali','navratri','pitru-paksha','shravan'].map(id => {
                    const t = ALL_THEMES.find(x => x.id === id);
                    return <option key={id} value={id}>{t?.emoji} {t?.nameMarathi || id}</option>;
                  })}
                </optgroup>
                <optgroup label="🎨 Preset थीम">
                  {PRESET_THEMES.map(t => (
                    <option key={t.id} value={t.id}>{t.emoji} {t.nameMarathi}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className={s.formRow}>
              <div className={s.formGroup}>
                <label className={s.label}>सुरुवात तारीख *</label>
                <input type="date" className={s.input} value={formData.start_date}
                  onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className={s.formGroup}>
                <label className={s.label}>शेवट तारीख *</label>
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
