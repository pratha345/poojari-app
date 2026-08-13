// src/pages/admin/ManageAarti.jsx — Admin aarti management with photo-OCR intake
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { aartiAPI } from '../../api/index.js';
import adminStyles from './Admin.module.css';
import s from './ManageAarti.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const DEITIES = ['गणपती', 'शिव', 'देवी', 'विठ्ठल-पांडुरंग', 'कृष्ण', 'राम', 'विष्णु', 'संत आरत्या', 'इतर देवता', 'सामान्य'];

const EMPTY = {
  title: '', slug: '', deity_category: 'गणपती',
  lyrics: '', meaning: '', occasion: '', source_note: '',
  author_name: '', is_published: true, is_featured: false,
};

function slugify(t) {
  return t.toLowerCase()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    .slice(0, 100) || `aarti-${Date.now()}`;
}

// ── Featured-image upload zone (drag/drop + preview) — mirrors ManageBlog.jsx ──
function ImageUpload({ preview, existingUrl, onFile, onClear }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  const displaySrc = preview || (existingUrl
    ? (existingUrl.startsWith('http') ? existingUrl : `${BASE_URL}${existingUrl}`)
    : null);

  return (
    <div
      className={`${s.uploadZone} ${drag ? s.uploadDrag : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
        onClick={e => e.stopPropagation()}
      />
      {displaySrc ? (
        <div className={s.previewWrap}>
          <img src={displaySrc} alt="preview" className={s.previewImg} />
          <div className={s.previewOverlay}>
            <button
              type="button"
              className={s.changeImgBtn}
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
            >🔄 इमेज बदला</button>
            <button
              type="button"
              className={s.removeImgBtn}
              onClick={e => { e.stopPropagation(); onClear(); }}
            >🗑️ काढा</button>
          </div>
          {preview && <span className={s.newBadge}>नवीन</span>}
          {!preview && existingUrl && <span className={s.existingBadge}>सध्याची इमेज</span>}
        </div>
      ) : (
        <div className={s.uploadPlaceholder}>
          <span className={s.uploadIcon}>🖼️</span>
          <p className={s.uploadText}>देवतेची इमेज येथे drag करा किंवा क्लिक करा</p>
          <p className={s.uploadHint}>JPG, PNG, WEBP — जास्तीत जास्त 5MB (आपोआप .webp मध्ये रूपांतरित होईल)</p>
        </div>
      )}
    </div>
  );
}

export default function ManageAarti() {
  const [aartis,   setAartis]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [slugLocked, setSlugLocked] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Intake — two ways to fill the form without typing everything by hand:
  //   'photo' → OCR a picture of a printed/handwritten aarti
  //   'paste' → paste ANY raw text (WhatsApp forward, PDF copy, roman transliteration,
  //             stray emoji/spam lines) and let Gemini clean it into the same shape
  const [intakeMode, setIntakeMode] = useState('photo');
  const [ocrFile,    setOcrFile]    = useState(null);
  const [ocrPreview, setOcrPreview] = useState(null);
  const [ocrBusy,    setOcrBusy]    = useState(false);
  const [rawText,    setRawText]    = useState('');
  const fileRef = useRef(null);

  // Featured image (deity photo shown on the public /aarti card + detail page)
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState(null);
  const [existImg, setExistImg] = useState(null);

  const handleImgFile = (file) => {
    setImgFile(file);
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgPrev(URL.createObjectURL(file));
  };
  const clearImg = () => {
    setImgFile(null);
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgPrev(null);
    setExistImg(null);
  };

  // Quick image upload directly from a list row — for aartis that already
  // exist without a photo (bulk-adding images without opening the full form)
  const [quickImgId, setQuickImgId] = useState(null);
  const handleQuickImg = async (id, file) => {
    if (!file) return;
    setQuickImgId(id);
    try {
      const r = await aartiAPI.uploadImage(id, file);
      setAartis(prev => prev.map(a => a.id === id ? { ...a, image_url: r.data.data.image_url } : a));
      toast.success('इमेज अपलोड झाली! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'इमेज अपलोड करताना त्रुटी झाली.');
    } finally {
      setQuickImgId(null);
    }
  };

  const load = () => {
    setLoading(true);
    aartiAPI.adminList()
      .then(r => setAartis(r.data.data || []))
      .catch(() => toast.error('आरती यादी लोड झाली नाही.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      const next = { ...f, [name]: type === 'checkbox' ? checked : value };
      if (name === 'title' && !slugLocked) next.slug = slugify(value);
      return next;
    });
  };

  // ── OCR flow ────────────────────────────────────────────────
  const pickOcrFile = (file) => {
    if (!file) return;
    setOcrFile(file);
    if (ocrPreview) URL.revokeObjectURL(ocrPreview);
    setOcrPreview(URL.createObjectURL(file));
  };

  const clearOcr = () => {
    setOcrFile(null);
    if (ocrPreview) URL.revokeObjectURL(ocrPreview);
    setOcrPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const runOcr = async () => {
    if (!ocrFile) return toast.error('आधी आरतीचा फोटो निवडा.');
    setOcrBusy(true);
    const t = toast.loading('फोटोमधून मजकूर वाचत आहे... ⏳');
    try {
      const fd = new FormData();
      fd.append('image', ocrFile);
      const r = await aartiAPI.ocr(fd);
      const d = r.data.data;
      setForm(f => ({
        ...f,
        title:          d.title || f.title,
        slug:           slugLocked ? f.slug : slugify(d.title || f.title),
        deity_category: d.deity_category || f.deity_category,
        lyrics:         d.lyrics,
        source_note:    f.source_note || 'फोटोमधून OCR ने घेतले — शब्द तपासले',
      }));
      toast.success('मजकूर आला! जतन करण्यापूर्वी शब्द तपासून घ्या. 🔍', { id: t, duration: 6000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'OCR करताना त्रुटी झाली.', { id: t });
    } finally {
      setOcrBusy(false);
    }
  };

  // ── Paste-text flow (whatever text a caretaker has — WhatsApp forward,
  //     PDF copy-paste, roman transliteration, stray emoji/spam — cleaned by Gemini) ──
  const runTextClean = async () => {
    if (!rawText.trim()) return toast.error('आधी मजकूर पेस्ट करा.');
    setOcrBusy(true);
    const t = toast.loading('मजकूर साफ करत आहे... ⏳');
    try {
      const r = await aartiAPI.cleanText(rawText);
      const d = r.data.data;
      setForm(f => ({
        ...f,
        title:          d.title || f.title,
        slug:           slugLocked ? f.slug : slugify(d.title || f.title),
        deity_category: d.deity_category || f.deity_category,
        lyrics:         d.lyrics,
        source_note:    f.source_note || 'पेस्ट केलेल्या मजकुरातून साफ केले — शब्द तपासले',
      }));
      toast.success('मजकूर आला! जतन करण्यापूर्वी शब्द तपासून घ्या. 🔍', { id: t, duration: 6000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'मजकूर साफ करताना त्रुटी झाली.', { id: t });
    } finally {
      setOcrBusy(false);
    }
  };

  const clearRawText = () => setRawText('');

  // ── Form open/close ─────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setSlugLocked(false);
    setForm(EMPTY);
    clearOcr();
    clearRawText();
    clearImg();
    setIntakeMode('photo');
    setShowForm(true);
    setTimeout(() => document.getElementById('aartiForm')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openEdit = async (a) => {
    // adminList is a slim listing — fetch full row (lyrics/meaning) by slug
    let full = a;
    try { full = (await aartiAPI.getBySlug(a.slug)).data.data; }
    catch { /* unpublished rows 404 on the public route — fall back to slim row */ }
    setEditing(a.id);
    setSlugLocked(true);
    setForm({
      title:          full.title          || '',
      slug:           full.slug           || '',
      deity_category: full.deity_category || 'गणपती',
      lyrics:         full.lyrics         || '',
      meaning:        full.meaning        || '',
      occasion:       full.occasion       || '',
      source_note:    full.source_note    || '',
      author_name:    full.author_name    || '',
      is_published:   !!full.is_published,
      is_featured:    !!(full.is_featured ?? a.is_featured),
    });
    clearOcr();
    clearRawText();
    setImgFile(null); setImgPrev(null); setExistImg(full.image_url || null);
    setIntakeMode('photo');
    setShowForm(true);
    setTimeout(() => document.getElementById('aartiForm')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); clearOcr(); clearRawText(); clearImg(); };

  // ── Save / publish / delete ─────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.lyrics)
      return toast.error('शीर्षक, slug आणि आरतीचे शब्द आवश्यक आहेत.');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imgFile) fd.append('image', imgFile);

    setSaving(true);
    try {
      if (editing) {
        await aartiAPI.update(editing, fd);
        toast.success('आरती अद्यतनित झाली! ✅');
      } else {
        await aartiAPI.create(fd);
        toast.success('नवीन आरती जोडली! 🪔');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'त्रुटी झाली.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (id) => {
    try {
      await aartiAPI.togglePublish(id);
      setAartis(prev => prev.map(a => a.id === id ? { ...a, is_published: a.is_published ? 0 : 1 } : a));
      toast.success('स्थिती बदलली.');
    } catch { toast.error('स्थिती बदलता आली नाही.'); }
  };

  const toggleFeatured = async (a) => {
    try {
      await aartiAPI.toggleFeatured(a.id);
      setAartis(prev => prev.map(x => x.id === a.id ? { ...x, is_featured: x.is_featured ? 0 : 1 } : x));
      toast.success(a.is_featured ? '⭐ लोकप्रिय हटवली' : '⭐ लोकप्रिय केली!');
    } catch { toast.error('बदल करता आला नाही.'); }
  };

  // Priority — lower number shows first across ALL categories, overriding
  // the default order. Blank clears the override. Debounced-by-blur (not
  // on every keystroke) so typing "12" doesn't fire a request after the "1".
  const updatePriority = async (a, rawValue) => {
    const value = rawValue.trim();
    const priority = value === '' ? null : parseInt(value, 10);
    if (priority !== null && (!Number.isInteger(priority) || priority < 1)) {
      toast.error('प्राधान्यक्रम १ किंवा त्याहून मोठा आकडा असावा.');
      return;
    }
    if (priority === (a.priority ?? null)) return;   // unchanged, skip the call
    try {
      await aartiAPI.updatePriority(a.id, priority);
      setAartis(prev => prev.map(x => x.id === a.id ? { ...x, priority } : x));
      toast.success(priority === null ? 'प्राधान्यक्रम काढला.' : `प्राधान्यक्रम #${priority} सेट केला.`);
    } catch { toast.error('प्राधान्यक्रम सेट करता आला नाही.'); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" ही आरती कायमची काढायची आहे का?`)) return;
    setDeleting(id);
    try {
      await aartiAPI.remove(id);
      toast.success('आरती काढली.');
      setAartis(prev => prev.filter(a => a.id !== id));
    } catch { toast.error('आरती काढता आली नाही.'); }
    finally  { setDeleting(null); }
  };

  return (
    <AdminLayout>
      <div>
        <div className={adminStyles.pageHeader}>
          <h1 className={adminStyles.pageTitle}>🪔 आरती व्यवस्थापन</h1>
          {!showForm && (
            <button className="btn btn-primary" onClick={openCreate}>+ नवीन आरती</button>
          )}
        </div>

        {/* ── Form ─────────────────────────────────────────────── */}
        {showForm && (
          <form id="aartiForm" className={s.formCard} onSubmit={handleSubmit}>
            <div className={s.formHead}>
              <h2>{editing ? '✏️ आरती संपादन' : '➕ नवीन आरती'}</h2>
              <button type="button" className={s.closeBtn} onClick={closeForm}>✕</button>
            </div>

            {/* ── Intake box: photo (OCR) OR paste-any-text → auto-fill form ── */}
            <div className={s.ocrBox}>
              <div className={s.modeTabs}>
                <button
                  type="button"
                  className={intakeMode === 'photo' ? s.modeTabActive : s.modeTab}
                  onClick={() => setIntakeMode('photo')}
                >📷 फोटो</button>
                <button
                  type="button"
                  className={intakeMode === 'paste' ? s.modeTabActive : s.modeTab}
                  onClick={() => setIntakeMode('paste')}
                >📋 मजकूर पेस्ट करा</button>
              </div>

              {intakeMode === 'photo' ? (
                <>
                  <div className={s.ocrHead}>
                    📷 <strong>फोटोमधून आरती घ्या (OCR)</strong>
                    <span className={s.ocrHint}>पुस्तक/छापील आरतीचा स्पष्ट, सरळ फोटो — मजकूर आपोआप खाली भरला जाईल</span>
                  </div>
                  <div className={s.ocrRow}>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={e => pickOcrFile(e.target.files?.[0])}
                      className={s.ocrInput}
                    />
                    {ocrPreview && (
                      <div className={s.ocrPreviewWrap}>
                        <img src={ocrPreview} alt="आरती फोटो" className={s.ocrPreview} />
                        <button type="button" className={s.ocrClear} onClick={clearOcr}>✕</button>
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={runOcr}
                      disabled={!ocrFile || ocrBusy}
                    >
                      {ocrBusy ? '⏳ वाचत आहे...' : '🔍 मजकूर काढा'}
                    </button>
                  </div>
                  <p className={s.ocrWarn}>⚠️ OCR नंतर शब्द जरूर तपासा — देवाच्या आरतीत चुकीचा शब्द जाऊ नये हीच या पानाची जबाबदारी आहे.</p>
                </>
              ) : (
                <>
                  <div className={s.ocrHead}>
                    📋 <strong>कुठलाही मजकूर पेस्ट करा</strong>
                    <span className={s.ocrHint}>WhatsApp forward, PDF मधून copy-paste, रोमन लिपीत टाईप केलेला — कसाही असो, तो साफ करून खाली भरला जाईल</span>
                  </div>
                  <textarea
                    className={s.pasteArea}
                    rows={6}
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    placeholder={'इथे आरतीचा मजकूर पेस्ट करा (कुठल्याही स्वरूपात, कुठूनही घेतलेला)...'}
                  />
                  <div className={s.ocrRow}>
                    {rawText && (
                      <button type="button" className={s.ocrClear} onClick={clearRawText}>✕ साफ करा</button>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={runTextClean}
                      disabled={!rawText.trim() || ocrBusy}
                    >
                      {ocrBusy ? '⏳ साफ करत आहे...' : '✨ साफ करून भरा'}
                    </button>
                  </div>
                  <p className={s.ocrWarn}>⚠️ साफ केल्यानंतर शब्द जरूर तपासा — देवाच्या आरतीत चुकीचा शब्द जाऊ नये हीच या पानाची जबाबदारी आहे.</p>
                </>
              )}
            </div>

            <label className={s.field}>
              <span>देवतेची इमेज</span>
              <ImageUpload
                preview={imgPrev}
                existingUrl={existImg}
                onFile={handleImgFile}
                onClear={clearImg}
              />
            </label>

            <div className={s.grid2}>
              <label className={s.field}>
                <span>शीर्षक *</span>
                <input name="title" value={form.title} onChange={handleChange} placeholder="उदा. सुखकर्ता दुःखहर्ता — श्री गणेशाची आरती" required />
              </label>
              <label className={s.field}>
                <span>Slug * {editing && <small>(बदलू नये)</small>}</span>
                <input name="slug" value={form.slug} onChange={e => { setSlugLocked(true); handleChange(e); }} required />
              </label>
            </div>

            <div className={s.grid2}>
              <label className={s.field}>
                <span>देवता *</span>
                <select name="deity_category" value={form.deity_category} onChange={handleChange}>
                  {DEITIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className={s.field}>
                <span>रचनाकार</span>
                <input name="author_name" value={form.author_name} onChange={handleChange} placeholder="उदा. समर्थ रामदास स्वामी" />
              </label>
            </div>

            <label className={s.field}>
              <span>आरतीचे शब्द * <small>(कडव्यांमध्ये रिकामी ओळ ठेवा)</small></span>
              <textarea
                name="lyrics" value={form.lyrics} onChange={handleChange}
                rows={16} className={s.lyricsArea}
                placeholder={'सुखकर्ता दुःखहर्ता वार्ता विघ्नाची।\nनुरवी पुरवी प्रेम कृपा जयाची।\n...'}
                required
              />
            </label>

            <label className={s.field}>
              <span>अर्थ (संक्षिप्त)</span>
              <textarea name="meaning" value={form.meaning} onChange={handleChange} rows={4} />
            </label>

            <div className={s.grid2}>
              <label className={s.field}>
                <span>कधी म्हणावी (occasion)</span>
                <input name="occasion" value={form.occasion} onChange={handleChange} placeholder="उदा. गणेश चतुर्थी, बुधवार" />
              </label>
              <label className={s.field}>
                <span>स्रोत नोंद</span>
                <input name="source_note" value={form.source_note} onChange={handleChange} placeholder="कुठून पडताळले" />
              </label>
            </div>

            <label className={s.pubRow}>
              <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
              <span>प्रकाशित करा (website + WhatsApp bot वर दिसेल)</span>
            </label>

            <label className={s.pubRow}>
              <input type="checkbox" name="is_featured" checked={form.is_featured} onChange={handleChange} />
              <span>⭐ लोकप्रिय आरती म्हणून दाखवा (यादीत सर्वात आधी दिसेल)</span>
            </label>

            <div className={s.formActions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'जतन होत आहे...' : editing ? '💾 अद्यतनित करा' : '🪔 आरती जोडा'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>रद्द</button>
            </div>
            <p className={s.botNote}>ℹ️ नवीन/बदललेली आरती WhatsApp bot मध्ये पुढच्या bot-restart नंतर दिसते; website वर लगेच दिसते.</p>
          </form>
        )}

        {/* ── List ─────────────────────────────────────────────── */}
        {loading ? (
          <p style={{ padding: 24 }}>यादी लोड होत आहे...</p>
        ) : (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>इमेज</th>
                  <th>शीर्षक</th>
                  <th>देवता</th>
                  <th>पाहिले</th>
                  <th>लोकप्रिय</th>
                  <th title="कमी आकडा = आधी दिसेल, सर्व श्रेणींत">प्राधान्यक्रम</th>
                  <th>स्थिती</th>
                  <th>कृती</th>
                </tr>
              </thead>
              <tbody>
                {aartis.map(a => (
                  <tr key={a.id}>
                    <td>
                      <label className={s.thumbUpload} title="इमेज बदला / अपलोड करा">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          style={{ display: 'none' }}
                          onChange={e => handleQuickImg(a.id, e.target.files?.[0])}
                        />
                        {quickImgId === a.id ? (
                          <div className={s.thumbSpinner} />
                        ) : a.image_url ? (
                          <>
                            <img
                              src={`${BASE_URL}${a.image_url}`}
                              alt=""
                              className={s.thumb}
                              onError={e => { e.target.style.display = 'none'; }}
                            />
                            <span className={s.thumbOverlay}>📷</span>
                          </>
                        ) : (
                          <div className={s.thumbPlaceholderBtn}>
                            <span>📷</span>
                            <small>अपलोड</small>
                          </div>
                        )}
                      </label>
                    </td>
                    <td>{a.title}</td>
                    <td>{a.deity_category}</td>
                    <td>{a.views}</td>
                    <td>
                      <button
                        className={a.is_featured ? s.starOn : s.starOff}
                        onClick={() => toggleFeatured(a)}
                        title={a.is_featured ? 'लोकप्रिय काढा' : 'लोकप्रिय करा'}
                      >
                        {a.is_featured ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        placeholder="—"
                        defaultValue={a.priority ?? ''}
                        className={s.priorityInput}
                        title="कमी आकडा = आधी दिसेल (सर्व श्रेणींत). रिकामे ठेवल्यास नेहमीचा क्रम."
                        onBlur={e => updatePriority(a, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                      />
                    </td>
                    <td>
                      <button
                        className={a.is_published ? s.pubOn : s.pubOff}
                        onClick={() => togglePublish(a.id)}
                        title="स्थिती बदला"
                      >
                        {a.is_published ? '✅ प्रकाशित' : '⏸ अप्रकाशित'}
                      </button>
                    </td>
                    <td className={s.rowActions}>
                      <button className={s.editBtn} onClick={() => openEdit(a)}>✏️</button>
                      <button
                        className={s.delBtn}
                        onClick={() => handleDelete(a.id, a.title)}
                        disabled={deleting === a.id}
                      >🗑️</button>
                    </td>
                  </tr>
                ))}
                {aartis.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>अजून एकही आरती नाही.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
