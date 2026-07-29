// src/pages/admin/ManageBlog.jsx — Admin blog management with image preview
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { blogAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext';
import {
  FaBold, FaItalic, FaUnderline,
  FaListUl, FaListOl,
  FaAlignLeft, FaAlignCenter, FaAlignRight,
  FaLink, FaLinkSlash,
  FaRotateLeft, FaRotateRight,
  FaQuoteLeft, FaMinus,
} from 'react-icons/fa6';
import adminStyles from './Admin.module.css';
import s from './ManageBlog.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const CATEGORIES = [
  'पूजा मार्गदर्शन',
  'सण-उत्सव',
  'धर्म-अध्यात्म',
  'संस्कार',
  'ज्योतिष',
  'तीर्थक्षेत्र',
];

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '',
  author_name: 'पूजारी टीम', category: 'पूजा मार्गदर्शन',
  tags: '', read_time: '5', is_published: true,
};

function slugify(t) {
  return t.toLowerCase()
    .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100);
}

// ── Professional WYSIWYG Editor ───────────────────────────────
function RichEditor({ value, onChange, editorKey }) {
  const divRef   = useRef(null);
  const skipSync = useRef(false);
  const [active, setActive] = useState({});
  const [wordCount, setWordCount] = useState(0);

  // Sync editor content on form open/reset
  useEffect(() => {
    if (divRef.current && !skipSync.current) {
      divRef.current.innerHTML = value || '';
      updateStats();
    }
    skipSync.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorKey]);

  const updateStats = useCallback(() => {
    const text = divRef.current?.innerText || '';
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    // detect active formatting
    setActive({
      bold:      document.queryCommandState('bold'),
      italic:    document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      ul:        document.queryCommandState('insertUnorderedList'),
      ol:        document.queryCommandState('insertOrderedList'),
      left:      document.queryCommandValue('justifyLeft') === 'true',
      center:    document.queryCommandValue('justifyCenter') === 'true',
      right:     document.queryCommandValue('justifyRight') === 'true',
    });
  }, []);

  const emit = useCallback(() => {
    skipSync.current = true;
    onChange({ target: { name: 'content', value: divRef.current?.innerHTML || '' } });
    updateStats();
  }, [onChange, updateStats]);

  const exec = useCallback((cmd, arg = null) => {
    divRef.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }, [emit]);

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    emit();
  };

  const tb = (title, action, icon, key, isActive) => (
    <button key={key} type="button"
      className={`${s.toolBtn} ${isActive ? s.toolBtnActive : ''}`}
      title={title}
      onMouseDown={e => { e.preventDefault(); action(); }}>
      {icon}
    </button>
  );

  const sep = (k) => <span key={k} className={s.toolSep} />;

  return (
    <div className={s.richEditor}>

      {/* ── Toolbar row 1: paragraph style ── */}
      <div className={s.toolbar}>
        <select className={s.blockSelect}
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { exec('formatBlock', e.target.value); e.target.value = ''; }}
          defaultValue="">
          <option value="" disabled>परिच्छेद शैली</option>
          <option value="P">साधा मजकूर</option>
          <option value="H2">शीर्षक 1 (H2)</option>
          <option value="H3">शीर्षक 2 (H3)</option>
          <option value="H4">शीर्षक 3 (H4)</option>
          <option value="BLOCKQUOTE">अवतरण</option>
        </select>

        {sep('s1')}

        {tb('ठळक (Bold) — Ctrl+B',   () => exec('bold'),      <FaBold />,      'bold',   active.bold)}
        {tb('तिरके (Italic) — Ctrl+I',() => exec('italic'),    <FaItalic />,    'italic', active.italic)}
        {tb('अधोरेखित (Underline)',   () => exec('underline'), <FaUnderline />, 'ul',     active.underline)}

        {sep('s2')}

        {tb('डावे (Left)',   () => exec('justifyLeft'),   <FaAlignLeft />,   'jl', active.left)}
        {tb('मध्यभागी',     () => exec('justifyCenter'), <FaAlignCenter />, 'jc', active.center)}
        {tb('उजवे (Right)', () => exec('justifyRight'),  <FaAlignRight />,  'jr', active.right)}

        {sep('s3')}

        {tb('• बुलेट यादी',    () => exec('insertUnorderedList'), <FaListUl />, 'bul', active.ul)}
        {tb('1. क्रमांक यादी', () => exec('insertOrderedList'),   <FaListOl />, 'nul', active.ol)}

        {sep('s4')}

        {tb('अवतरण (Quote)', () => exec('formatBlock', 'BLOCKQUOTE'), <FaQuoteLeft />, 'qt', false)}
        {tb('आडवी रेषा',     () => exec('insertHorizontalRule'),     <FaMinus />,     'hr', false)}
        {tb('दुवा (Link)', () => {
          const url = window.prompt('URL टाका:', 'https://');
          if (url) exec('createLink', url);
        }, <FaLink />, 'link', false)}
        {tb('Link काढा', () => exec('unlink'), <FaLinkSlash />, 'unlink', false)}

        {sep('s5')}

        {tb('मागे (Undo) — Ctrl+Z', () => exec('undo'), <FaRotateLeft />,  'undo', false)}
        {tb('पुढे (Redo) — Ctrl+Y', () => exec('redo'), <FaRotateRight />, 'redo', false)}

        <span className={s.toolSep} />
        <span className={s.wordCount}>{wordCount} शब्द</span>
      </div>

      {/* ── Document-style editing area ── */}
      <div className={s.docWrap}>
        <div
          ref={divRef}
          contentEditable
          suppressContentEditableWarning
          className={s.wysiwygArea}
          onInput={emit}
          onKeyUp={updateStats}
          onMouseUp={updateStats}
          onPaste={handlePaste}
          data-placeholder="येथे लिहायला सुरुवात करा..."
          spellCheck
        />
      </div>

      {/* ── Preview ── */}
      <details className={s.previewToggle}>
        <summary>👁 पूर्वावलोकन — website वर असे दिसेल</summary>
        <div className={s.previewPane}
          dangerouslySetInnerHTML={{ __html: value || '<p style="color:#bbb;font-style:italic">मजकूर नाही...</p>' }} />
      </details>
    </div>
  );
}

// ── Image Upload Zone ─────────────────────────────────────────
function ImageUpload({ preview, existingUrl, onFile, onClear }) {
  const inputRef = useRef(null);
  const [drag, setDrag]   = useState(false);

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
            >
              🔄 इमेज बदला
            </button>
            <button
              type="button"
              className={s.removeImgBtn}
              onClick={e => { e.stopPropagation(); onClear(); }}
            >
              🗑️ काढा
            </button>
          </div>
          {preview && <span className={s.newBadge}>नवीन</span>}
          {!preview && existingUrl && <span className={s.existingBadge}>सध्याची इमेज</span>}
        </div>
      ) : (
        <div className={s.uploadPlaceholder}>
          <span className={s.uploadIcon}>🖼️</span>
          <p className={s.uploadText}>इमेज येथे drag करा किंवा क्लिक करा</p>
          <p className={s.uploadHint}>JPG, PNG, WEBP — जास्तीत जास्त 5MB</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function ManageBlog() {
  const { user, isAbhyasak } = useAuth();

  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);   // post id being edited
  const [form,       setForm]       = useState({ ...EMPTY, author_name: '' });
  const [slugLocked, setSlugLocked] = useState(false);  // true = user manually set slug
  const [imgFile,      setImgFile]      = useState(null);
  const [imgPrev,      setImgPrev]      = useState(null);
  const [existImg,     setExistImg]     = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(null);
  const [quickImgId,   setQuickImgId]   = useState(null); // inline img upload
  const [filterCat,    setFilterCat]    = useState('');   // category filter for table
  const quickInputRef  = useRef(null);

  // Quick image upload directly from table row
  const handleQuickImg = async (postId, file) => {
    if (!file) return;
    setQuickImgId(postId);
    try {
      await blogAPI.uploadImage(postId, file);
      toast.success('इमेज अपलोड झाली! ✅');
      load();
    } catch {
      toast.error('इमेज अपलोड करताना त्रुटी झाली.');
    } finally { setQuickImgId(null); }
  };

  const load = () => {
    setLoading(true);
    blogAPI.adminList()
      .then(r => setPosts(r.data.data || []))
      .catch(() => toast.error('लेख यादी लोड झाली नाही.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFile = (file) => {
    setImgFile(file);
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgPrev(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImgFile(null);
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgPrev(null);
    setExistImg(null);
  };

  const openCreate = () => {
    setEditing(null);
    setSlugLocked(false);
    setForm({ ...EMPTY, author_name: user?.name || 'पूजारी टीम' });
    setImgFile(null); setImgPrev(null); setExistImg(null);
    setShowForm(true);
    setTimeout(() => document.getElementById('blogForm')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openEdit = (post) => {
    setEditing(post.id);
    setSlugLocked(true);   // editing = slug is already set, don't auto-overwrite
    setForm({
      title:        post.title,
      slug:         post.slug,
      excerpt:      post.excerpt     || '',
      content:      post.content     || '',
      author_name:  post.author_name || 'पूजारी टीम',
      category:     post.category    || 'पूजा मार्गदर्शन',
      tags:         Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      read_time:    String(post.read_time || 5),
      is_published: !!post.is_published,
    });
    setImgFile(null); setImgPrev(null);
    setExistImg(post.image_url || null);
    setShowForm(true);
    setTimeout(() => document.getElementById('blogForm')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const closeForm = () => {
    setShowForm(false); setEditing(null);
    setImgFile(null);
    if (imgPrev) URL.revokeObjectURL(imgPrev);
    setImgPrev(null); setExistImg(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.content)
      return toast.error('शीर्षक, slug आणि मजकूर आवश्यक आहे.');

    const fd = new FormData();
    const tagsArr = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'tags') fd.append('tags', JSON.stringify(tagsArr));
      else fd.append(k, v);
    });
    if (imgFile) fd.append('image', imgFile);

    setSaving(true);
    try {
      if (editing) {
        await blogAPI.update(editing, fd);
        toast.success('लेख अद्यतनित केला! ✅');
      } else {
        await blogAPI.create(fd);
        toast.success('नवीन लेख जोडला! 🎉');
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
      const r = await blogAPI.togglePublish(id);
      toast.success(r.data.message);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, is_published: r.data.data.is_published } : p));
    } catch { toast.error('स्थिती बदलता आली नाही.'); }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`"${title}" हा लेख कायमचा काढायचा आहे का?`)) return;
    setDeleting(id);
    try {
      await blogAPI.remove(id);
      toast.success('लेख काढला.');
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('लेख काढता आला नाही.'); }
    finally  { setDeleting(null); }
  };

  return (
    <AdminLayout>
      <div>
        {/* ── Header ─────────────────────────────────────────── */}
        <div className={adminStyles.pageHeader}>
          <h1 className={adminStyles.pageTitle}>📖 ब्लॉग व्यवस्थापन</h1>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            + नवीन लेख जोडा
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════
            FORM
        ══════════════════════════════════════════════════════ */}
        {showForm && (
          <div id="blogForm" className={s.formWrap}>

            {/* Form header */}
            <div className={s.formHeader}>
              <h2 className={s.formTitle}>
                {editing ? '✏️ लेख संपादित करा' : '➕ नवीन लेख जोडा'}
              </h2>
              <button className={s.closeBtn} onClick={closeForm} type="button">✕</button>
            </div>

            <form onSubmit={handleSubmit}>

              {/* ─── STEP 1: मूलभूत माहिती ─────────────────── */}
              <div className={s.step}>
                <div className={s.stepHeader}>
                  <span className={s.stepNum}>१</span>
                  <span className={s.stepLabel}>मूलभूत माहिती</span>
                </div>
                <div className={s.stepBody}>
                  <div className={s.row2}>
                    <div className="form-group">
                      <label>शीर्षक *</label>
                      <input
                        name="title"
                        value={form.title}
                        onChange={e => {
                          handleChange(e);
                          // Auto-fill slug only when not locked (user hasn't manually set it)
                          if (!slugLocked) setForm(f => ({ ...f, slug: slugify(e.target.value) }));
                        }}
                        className="form-control"
                        placeholder="उदा: सत्यनारायण पूजेची संपूर्ण माहिती"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Slug (URL) *
                        <span
                          title={slugLocked ? 'Slug manual mode — title बदलल्यावर slug बदलणार नाही. Auto साठी 🔓 क्लिक करा.' : 'Auto mode — title वरून slug तयार होतो. Lock साठी 🔒 क्लिक करा.'}
                          onClick={() => setSlugLocked(v => !v)}
                          style={{ cursor: 'pointer', fontSize: 15, userSelect: 'none' }}
                        >
                          {slugLocked ? '🔒' : '🔓'}
                        </span>
                      </label>
                      <input
                        name="slug"
                        value={form.slug}
                        onChange={e => {
                          // Clean: lowercase, only a-z 0-9 hyphens
                          const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
                          setForm(f => ({ ...f, slug: clean }));
                          setSlugLocked(true);   // user started typing = lock
                        }}
                        className="form-control"
                        placeholder="satyanarayan-puja-guide"
                        required
                      />
                      <small style={{ color: '#888' }}>
                        pojjari.com/blog/<strong>{form.slug || '...'}</strong>
                        {!slugLocked && <span style={{ color: '#2e7d32', marginLeft: 8 }}>✦ Title वरून auto</span>}
                      </small>
                    </div>
                  </div>

                  <div className={s.row3}>
                    <div className="form-group">
                      <label>श्रेणी</label>
                      <select name="category" value={form.category} onChange={handleChange} className="form-control">
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>लेखकाचे नाव</label>
                      <input name="author_name" value={form.author_name} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label>वाचन वेळ (मिनिटे)</label>
                      <input name="read_time" type="number" min="1" max="60"
                        value={form.read_time} onChange={handleChange} className="form-control" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── STEP 2: मजकूर ─────────────────────────── */}
              <div className={s.step}>
                <div className={s.stepHeader}>
                  <span className={s.stepNum}>२</span>
                  <span className={s.stepLabel}>मजकूर लिहा</span>
                </div>
                <div className={s.stepBody}>
                  <div className="form-group">
                    <label>थोडक्यात सारांश (Excerpt)
                      <span className={s.hint}> — Google मध्ये दिसतो, 1-2 वाक्ये</span>
                    </label>
                    <textarea name="excerpt" value={form.excerpt} onChange={handleChange}
                      className="form-control" rows={2}
                      placeholder="लेखाचे थोडक्यात वर्णन येथे लिहा..." />
                  </div>

                  <div className="form-group">
                    <label>
                      संपूर्ण मजकूर *
                      <span className={s.hint}> — Toolbar वापरून format करा. पूर्वावलोकन खाली पहा.</span>
                    </label>
                    <RichEditor
                      value={form.content}
                      onChange={handleChange}
                      editorKey={editing ?? 'new'}
                    />
                  </div>
                </div>
              </div>

              {/* ─── STEP 3: इमेज व सेटिंग्ज ──────────────── */}
              <div className={s.step}>
                <div className={s.stepHeader}>
                  <span className={s.stepNum}>३</span>
                  <span className={s.stepLabel}>Featured Image व सेटिंग्ज</span>
                </div>
                <div className={s.stepBody}>
                  <div className={s.step3Grid}>

                    {/* Left: Image upload */}
                    <div>
                      <label className={s.fieldLabel}>Featured Image</label>
                      <ImageUpload
                        preview={imgPrev}
                        existingUrl={existImg}
                        onFile={handleFile}
                        onClear={clearImage}
                      />
                    </div>

                    {/* Right: Tags + Publish */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="form-group">
                        <label>Tags <span className={s.hint}>(स्वल्पविरामाने विभाजित)</span></label>
                        <input name="tags" value={form.tags} onChange={handleChange}
                          className="form-control" placeholder="सत्यनारायण, पूजा, विधी, गृहप्रवेश" />
                        {form.tags && (
                          <div className={s.tagPreview}>
                            {form.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                              <span key={t} className={s.tagChip}>{t}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={s.publishToggle}>
                        <label className={s.toggleLabel}>
                          <input
                            type="checkbox"
                            name="is_published"
                            checked={form.is_published}
                            onChange={handleChange}
                            className={s.toggleCheck}
                          />
                          <div className={s.toggleInfo}>
                            <span className={s.toggleTitle}>
                              {form.is_published ? '✅ तत्काळ प्रकाशित करा' : '📝 मसुदा म्हणून जतन करा'}
                            </span>
                            <span className={s.toggleSub}>
                              {form.is_published
                                ? 'लेख website वर लगेच दिसेल'
                                : 'नंतर publish करता येईल'}
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Submit ────────────────────────────────── */}
              <div className={s.formActions}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? '⏳ जतन होत आहे...'
                    : editing
                      ? '✅ बदल जतन करा'
                      : '🚀 लेख प्रकाशित करा'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={closeForm}>
                  रद्द करा
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            POSTS TABLE
        ══════════════════════════════════════════════════════ */}
        <div className={s.tableSection}>
          {/* Category filter pills */}
          <div className={s.catFilterRow}>
            <button
              className={`${s.catPill} ${filterCat === '' ? s.catPillActive : ''}`}
              onClick={() => setFilterCat('')}
            >सर्व</button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`${s.catPill} ${filterCat === c ? s.catPillActive : ''}`}
                onClick={() => setFilterCat(filterCat === c ? '' : c)}
              >{c}</button>
            ))}
          </div>

          <div className={s.tableMeta}>
            <span className={s.tableCount}>
              {filterCat
                ? `${posts.filter(p => p.category === filterCat).length} लेख — ${filterCat}`
                : `एकूण ${posts.length} लेख`}
            </span>
            <span className={s.tablePub}>
              ✅ {posts.filter(p => p.is_published).length} प्रकाशित &nbsp;
              📝 {posts.filter(p => !p.is_published).length} मसुदा
            </span>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : posts.length === 0 ? (
            <div className={s.empty}>
              <span>📝</span>
              <p>अजून कोणताही लेख नाही.</p>
              <button className="btn btn-primary btn-sm" onClick={openCreate}>+ पहिला लेख जोडा</button>
            </div>
          ) : (
            <div className={adminStyles.tableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th style={{ width: 64 }}>इमेज</th>
                    <th>शीर्षक / Slug</th>
                    <th>श्रेणी</th>
                    <th>स्थिती</th>
                    <th>👁 Views</th>
                    <th>तारीख</th>
                    <th>कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {(filterCat ? posts.filter(p => p.category === filterCat) : posts).map(post => {
                    const imgSrc = post.image_url
                      ? (post.image_url.startsWith('http') ? post.image_url : `${BASE_URL}${post.image_url}`)
                      : null;
                    return (
                      <tr key={post.id}>
                        {/* Thumbnail — click to upload */}
                        <td>
                          <label className={s.thumbUpload} title="इमेज बदला / अपलोड करा">
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: 'none' }}
                              onChange={e => handleQuickImg(post.id, e.target.files?.[0])}
                            />
                            {quickImgId === post.id ? (
                              <div className={s.thumbSpinner} />
                            ) : imgSrc ? (
                              <>
                                <img src={imgSrc} alt={post.title} className={s.thumb}
                                  onError={e => { e.target.style.display = 'none'; }} />
                                <span className={s.thumbOverlay}>📷</span>
                              </>
                            ) : (
                              <div className={s.thumbPlaceholder}>
                                <span>📷</span>
                                <small>अपलोड</small>
                              </div>
                            )}
                          </label>
                        </td>

                        {/* Title + slug */}
                        <td>
                          <strong style={{ display: 'block', maxWidth: 260, lineHeight: 1.4 }}>{post.title}</strong>
                          <small style={{ color: '#888', fontFamily: 'monospace', fontSize: 11 }}>/{post.slug}</small>
                          {post.excerpt && (
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#aaa', maxWidth: 260,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {post.excerpt}
                            </p>
                          )}
                        </td>

                        <td><span className={s.catTag}>{post.category}</span></td>

                        <td>
                          <span className={post.is_published ? s.published : s.draft}>
                            {post.is_published ? '✅ प्रकाशित' : '📝 मसुदा'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>{post.views || 0}</td>

                        <td style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                          {new Date(post.created_at).toLocaleDateString('mr-IN')}
                        </td>

                        <td>
                          <div className={s.actions}>
                            <button className={s.btnEdit} onClick={() => openEdit(post)} title="संपादित करा">
                              ✏️ Edit
                            </button>
                            <button
                              className={post.is_published ? s.btnDraft : s.btnPub}
                              onClick={() => togglePublish(post.id)}
                              title={post.is_published ? 'मसुदा करा' : 'प्रकाशित करा'}
                            >
                              {post.is_published ? '📝 मसुदा' : '✅ प्रकाशित'}
                            </button>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
                              className={s.btnView} title="Website वर पहा">
                              👁 पहा
                            </a>
                            {!isAbhyasak && (
                              <button
                                className={s.btnDel}
                                onClick={() => handleDelete(post.id, post.title)}
                                disabled={deleting === post.id}
                                title="काढा"
                              >
                                {deleting === post.id ? '...' : '🗑️'}
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
      </div>
    </AdminLayout>
  );
}
