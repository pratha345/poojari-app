import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { adminSamagriAPI, adminAPI } from '../../api/index.js';
import { FaGripVertical } from 'react-icons/fa6';
import SearchableSelect from '../../components/common/SearchableSelect.jsx';
import { phoneticSearch } from '../../utils/transliterate.js';
import s from './ManageSamagri.module.css';

const EMPTY = { name_mr: '', name_en: '', quantity: '', unit: '', note: '', sort_order: '' };

const UNITS = [
  'नग', 'ग्रॅम', 'किलो', 'मिली', 'लिटर', 'जुडी', 'मूठ', 'वाटी', 'चमचा',
  'gm', 'kg', 'ml', 'ltr', 'rs', 'bunch', 'pcs',
];

const COUNTABLE = ['नारळ', 'सुपारी', 'केळी', 'केळे', 'लिंबू', 'आंबा', 'मोसंबी', 'पान', 'विड्याचे', 'नग', 'फळ', 'आवळा', 'चिंच'];
const autoUnit = (name) => COUNTABLE.some(k => name.includes(k)) ? 'नग' : '';

// ── Text import parser ─────────────────────────────────────────────
function parseImportText(text) {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .map((line, i) => {
      // Remove leading bullets / numbers: "1. " "1) " "• " "- "
      let clean = line.replace(/^[\d]+[.)]\s*/, '').replace(/^[•\-\*►→]\s*/, '').trim();

      let name_mr = clean, name_en = '', quantity = '', unit = '';

      // Extract English name in parentheses: "हळद (Turmeric) - 100 gm"
      const enMatch = clean.match(/^(.+?)\s*\(([A-Za-z][A-Za-z\s]*)\)\s*(.*)$/);
      if (enMatch) {
        name_mr = enMatch[1].trim();
        name_en = enMatch[2].trim();
        clean   = name_mr + (enMatch[3] ? ' ' + enMatch[3].trim() : '');
      }

      // "नाव - 100 gm" or "नाव – 100 ग्रॅम" (supports Devanagari + ASCII units)
      const dashMatch = clean.match(/^(.+?)\s*[-–]\s*(\d+\.?\d*)\s*([ऀ-ॿa-zA-Z]+)?$/);
      if (dashMatch) {
        name_mr  = name_en ? name_mr : dashMatch[1].trim();
        quantity = dashMatch[2];
        unit     = (dashMatch[3] || '');
        if (/^[a-zA-Z]+$/.test(unit)) unit = unit.toLowerCase();
      } else {
        // "नाव 100 gm" (space separated)
        const spaceMatch = clean.match(/^(.+?)\s+(\d+\.?\d*)\s*([ऀ-ॿa-zA-Z]+)$/);
        if (spaceMatch) {
          name_mr  = name_en ? name_mr : spaceMatch[1].trim();
          quantity = spaceMatch[2];
          unit     = /^[a-zA-Z]+$/.test(spaceMatch[3]) ? spaceMatch[3].toLowerCase() : spaceMatch[3];
        }
      }

      if (!unit) unit = autoUnit(name_mr);

      return { name_mr, name_en, quantity, unit, note: '', sort_order: i + 1, _key: i };
    });
}

export default function ManageSamagri() {
  const [poojas,   setPoojas]   = useState([]);
  const [selPooja, setSelPooja] = useState(null);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(false);

  // Single item form
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);

  // Import modal
  const [showImport,    setShowImport]    = useState(false);
  const [importTab,     setImportTab]     = useState('text');  // 'text' | 'image'
  const [importText,    setImportText]    = useState('');
  const [parsed,        setParsed]        = useState(null);
  const [importSaving,  setImportSaving]  = useState(false);

  // OCR state
  const [ocrFile,       setOcrFile]       = useState(null);
  const [ocrPreview,    setOcrPreview]    = useState('');
  const [ocrLoading,    setOcrLoading]    = useState(false);

  // Search
  const [search, setSearch] = useState('');

  // Drag-and-drop
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDragStart = (e, idx) => {
    dragIdx.current = idx;
    setDragActive(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIdx.current;
    const to   = idx;
    if (from === null || from === to) { setDragActive(false); return; }

    const newItems = [...items];
    const [moved]  = newItems.splice(from, 1);
    newItems.splice(to, 0, moved);
    const updated  = newItems.map((item, i) => ({ ...item, sort_order: i + 1 }));
    setItems(updated);
    setDragActive(false);
    dragIdx.current     = null;
    dragOverIdx.current = null;

    adminSamagriAPI.reorder(updated.map(it => ({ id: it.id, sort_order: it.sort_order })))
      .then(() => toast.success('क्रम जतन केला! ✅'))
      .catch(() => toast.error('क्रम जतन करता आला नाही.'));
  };

  const handleDragEnd = () => {
    setDragActive(false);
    dragIdx.current     = null;
    dragOverIdx.current = null;
  };

  useEffect(() => {
    adminAPI.getAllPoojas().then(r => setPoojas(r.data.data || [])).catch(() => {});
  }, []);

  const loadItems = useCallback((poojaId) => {
    if (!poojaId) return;
    setLoading(true);
    adminSamagriAPI.getByPooja(poojaId)
      .then(r => setItems(r.data.data || []))
      .catch(() => toast.error('साहित्य लोड करता आले नाही.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePoojaChange = (id) => {
    const pooja = poojas.find(p => String(p.id) === String(id));
    setSelPooja(pooja || null);
    setItems([]);
    setSearch('');
    setShowForm(false);
    setShowImport(false);
    if (id) loadItems(id);
  };

  // ── Single item CRUD ─────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: items.length + 1 });
    setShowForm(true);
    setShowImport(false);
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({
      name_mr:    item.name_mr    || '',
      name_en:    item.name_en    || '',
      quantity:   item.quantity   || '',
      unit:       item.unit       || '',
      note:       item.note       || '',
      sort_order: item.sort_order || '',
    });
    setShowForm(true);
    setShowImport(false);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name_mr.trim()) { toast.error('साहित्याचे नाव आवश्यक आहे.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminSamagriAPI.update(editing, form);
        toast.success('साहित्य अपडेट केले!');
      } else {
        await adminSamagriAPI.create({ ...form, pooja_id: selPooja.id });
        toast.success('साहित्य जोडले!');
      }
      closeForm();
      loadItems(selPooja.id);
    } catch {
      toast.error('काहीतरी चूक झाली.');
    } finally {
      setSaving(false);
    }
  };

  // ── Single delete ────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" हटवायचे आहे का?`)) return;
    try {
      await adminSamagriAPI.remove(id);
      toast.success('साहित्य हटवले!');
      loadItems(selPooja.id);
    } catch {
      toast.error('हटवता आले नाही.');
    }
  };

  // ── Bulk delete all ──────────────────────────────────────────
  const handleDeleteAll = async () => {
    if (!window.confirm(`"${selPooja.name_mr}" ची सर्व ${items.length} साहित्य हटवायची आहेत का?\nहे पूर्ववत होणार नाही.`)) return;
    try {
      await adminSamagriAPI.deleteAllByPooja(selPooja.id);
      toast.success(`सर्व ${items.length} साहित्य हटवली!`);
      setItems([]);
    } catch {
      toast.error('सर्व हटवता आले नाही.');
    }
  };

  // ── Import: parse text ───────────────────────────────────────
  const handleParse = () => {
    if (!importText.trim()) { toast.error('यादी paste करा.'); return; }
    const result = parseImportText(importText);
    if (result.length === 0) { toast.error('कोणतेही साहित्य सापडले नाही.'); return; }
    setParsed(result);
    toast.success(`${result.length} साहित्य सापडले — तपासा आणि जोडा.`);
  };

  const updateParsedRow = (idx, field, val) => {
    setParsed(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const removeParsedRow = (idx) => {
    setParsed(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Import: save all ─────────────────────────────────────────
  const handleImportSave = async () => {
    const valid = parsed.filter(r => r.name_mr.trim());
    if (valid.length === 0) { toast.error('किमान एक साहित्य असणे आवश्यक आहे.'); return; }
    setImportSaving(true);
    try {
      await adminSamagriAPI.bulkCreate(selPooja.id, valid);
      toast.success(`✅ ${valid.length} साहित्य यशस्वीपणे जोडली!`);
      setShowImport(false);
      setImportText('');
      setParsed(null);
      loadItems(selPooja.id);
    } catch {
      toast.error('Import करता आले नाही.');
    } finally {
      setImportSaving(false);
    }
  };

  // ── OCR: image → parse ───────────────────────────────────────
  const handleOcrFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setOcrPreview(prev => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(file); });
    setOcrFile(file);
    setParsed(null);
  };

  const handleOcrScan = async () => {
    if (!ocrFile) { toast.error('फोटो निवडा.'); return; }
    setOcrLoading(true);
    try {
      const res  = await adminSamagriAPI.ocr(ocrFile);
      const raw  = res.data.items || [];
      const mapped = raw.map((it, i) => ({
        name_mr:    it.name_mr    || '',
        name_en:    it.name_en   || '',
        quantity:   String(it.quantity || ''),
        unit:       it.unit       || '',
        note:       '',
        sort_order: i + 1,
        _key:       i,
      }));
      mapped.forEach(m => { if (!m.unit) m.unit = autoUnit(m.name_mr); });
      setParsed(mapped);
      toast.success(`✅ ${mapped.length} साहित्य फोटोमधून काढली!`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'OCR करता आले नाही.';
      toast.error(msg);
    } finally {
      setOcrLoading(false);
    }
  };

  const closeImport = () => {
    setShowImport(false);
    setImportText('');
    setParsed(null);
    setOcrFile(null);
    setOcrPreview(prev => { if (prev) URL.revokeObjectURL(prev); return ''; });
    setImportTab('text');
  };

  const filtered = search.trim()
    ? items.filter(i =>
        phoneticSearch(search, i.name_mr) ||
        (i.name_en && phoneticSearch(search, i.name_en))
      )
    : items;

  return (
    <AdminLayout>
      <div className={s.page}>
        {/* Header */}
        <div className={s.header}>
          <h2 className={s.title}>🛒 साहित्य व्यवस्थापन</h2>
        </div>

        {/* Pooja Selector */}
        <div className={s.selectorBar}>
          <div className={s.poojaSelectWrap}>
            <SearchableSelect
              options={poojas.map(p => ({
                label: p.is_active === false || p.is_active === 0
                  ? `${p.name_mr} (inactive)`
                  : p.name_mr,
                value: String(p.id),
              }))}
              value={selPooja ? String(selPooja.id) : ''}
              onChange={handlePoojaChange}
              placeholder="📿 पूजा निवडा..."
              searchPlaceholder="नाव टाइप करा... (मराठी / इंग्रजी)"
              searchFn={q => poojas
                .filter(p => phoneticSearch(q, p.name_mr))
                .map(p => ({
                  label: p.is_active === false || p.is_active === 0
                    ? `${p.name_mr} (inactive)`
                    : p.name_mr,
                  value: String(p.id),
                }))
              }
            />
          </div>
          {selPooja && (
            <span className={s.poojaTag}>
              📿 {selPooja.name_mr} — {items.length} साहित्य
            </span>
          )}
        </div>

        {selPooja && (
          <>
            {/* Toolbar */}
            <div className={s.toolbar}>
              <input
                className={s.searchInput}
                placeholder="🔍 शोधा... (हळद / halad / sakar)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className={s.importBtn} onClick={() => { setShowImport(true); setShowForm(false); }}>
                📋 Import करा
              </button>
              <button className={s.addBtn} onClick={openAdd}>+ नवीन साहित्य</button>
              {items.length > 0 && (
                <button className={s.deleteAllBtn} onClick={handleDeleteAll}>
                  🗑️ सर्व हटवा ({items.length})
                </button>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className={s.loading}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className={s.empty}>
                <p>{search ? `"${search}" सापडले नाही.` : 'साहित्य नाही. वर + बटण दाबा किंवा Import करा.'}</p>
              </div>
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {!search && <th className={s.dragHead} title="Drag करून क्रम बदला"></th>}
                      <th>#</th>
                      <th>साहित्य (मराठी)</th>
                      <th>English</th>
                      <th>प्रमाण</th>
                      <th>एकक</th>
                      <th>नोंद</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, i) => (
                      <tr
                        key={item.id}
                        draggable={!search}
                        onDragStart={!search ? (e) => handleDragStart(e, i) : undefined}
                        onDragOver={!search  ? (e) => handleDragOver(e, i)  : undefined}
                        onDrop={!search      ? (e) => handleDrop(e, i)      : undefined}
                        onDragEnd={!search   ? handleDragEnd                : undefined}
                        className={dragActive && dragOverIdx.current === i ? s.dragOver : ''}
                      >
                        {!search && (
                          <td className={s.dragHandle} title="Drag करून क्रम बदला">
                            <FaGripVertical />
                          </td>
                        )}
                        <td className={s.orderCell}>{item.sort_order || i + 1}</td>
                        <td><strong>{item.name_mr}</strong></td>
                        <td className={s.enCell}>{item.name_en || '—'}</td>
                        <td>{item.quantity || '—'}</td>
                        <td>{item.unit ? <span className={s.unitBadge}>{item.unit}</span> : '—'}</td>
                        <td className={s.noteCell}>{item.note || '—'}</td>
                        <td>
                          <div className={s.actions}>
                            <button className={s.editBtn} onClick={() => openEdit(item)}>✏️</button>
                            <button className={s.delBtn} onClick={() => handleDelete(item.id, item.name_mr)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {!selPooja && (
          <div className={s.placeholder}>
            <span>🛒</span>
            <p>वरून एक पूजा निवडा — त्या पूजेची संपूर्ण साहित्य यादी दिसेल.</p>
          </div>
        )}

        {/* ── Single Item Modal ── */}
        {showForm && (
          <div className={s.overlay} onClick={closeForm}>
            <div className={s.modal} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h3>{editing ? '✏️ साहित्य Edit करा' : '+ नवीन साहित्य जोडा'}</h3>
                <button className={s.closeBtn} onClick={closeForm}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className={s.form}>
                <div className={s.row}>
                  <label className={s.label}>नाव (मराठी) *
                    <input name="name_mr" value={form.name_mr} onChange={handleChange}
                      className={s.input} placeholder="उदा: हळद" required />
                  </label>
                  <label className={s.label}>Name (English)
                    <input name="name_en" value={form.name_en} onChange={handleChange}
                      className={s.input} placeholder="e.g. Turmeric" />
                  </label>
                </div>
                <div className={s.row}>
                  <label className={s.label}>प्रमाण (Quantity)
                    <input name="quantity" value={form.quantity} onChange={handleChange}
                      className={s.input} placeholder="उदा: 100" />
                  </label>
                  <label className={s.label}>एकक (Unit)
                    <select name="unit" value={form.unit} onChange={handleChange} className={s.input}>
                      <option value="">-- निवडा --</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </label>
                </div>
                <div className={s.row}>
                  <label className={s.label}>नोंद (Note)
                    <input name="note" value={form.note} onChange={handleChange}
                      className={s.input} placeholder="ऐच्छिक नोंद" />
                  </label>
                  <label className={s.label}>
                    कोणत्या नंतर टाका?
                    <select
                      className={s.input}
                      value={form.sort_order}
                      onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))}
                    >
                      <option value={1}>⬆️ सर्वात आधी टाका</option>
                      {items.map(it => (
                        <option key={it.id} value={(it.sort_order || 0) + 1}>
                          {it.sort_order || '—'}. {it.name_mr} नंतर
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className={s.formFooter}>
                  <button type="button" className={s.cancelBtn} onClick={closeForm}>रद्द करा</button>
                  <button type="submit" className={s.saveBtn} disabled={saving}>
                    {saving ? 'जतन...' : editing ? '✅ अपडेट करा' : '✅ जोडा'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Import Modal ── */}
        {showImport && (
          <div className={s.overlay} onClick={closeImport}>
            <div className={s.importModal} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h3>📋 साहित्य यादी Import करा</h3>
                <button className={s.closeBtn} onClick={closeImport}>✕</button>
              </div>

              <div className={s.importBody}>
                {!parsed ? (
                  <>
                    {/* Tabs */}
                    <div className={s.importTabs}>
                      <button type="button" className={`${s.importTab} ${importTab==='text' ? s.importTabActive : ''}`} onClick={() => setImportTab('text')}>📝 Text Paste</button>
                      <button type="button" className={`${s.importTab} ${importTab==='image' ? s.importTabActive : ''}`} onClick={() => setImportTab('image')}>📷 फोटो (AI)</button>
                    </div>

                    {/* TEXT TAB */}
                    {importTab === 'text' && (<>
                      <div className={s.importHint}>
                        <strong>📝 Format उदाहरण:</strong>
                        <pre className={s.formatExample}>{`हळद - 100 ग्रॅम\nसाखर - 250 ग्रॅम\nनारळ - 2 नग\nसुपारी - 10 नग\nतूप - 100 ग्रॅम`}</pre>
                        <p className={s.hintNote}>
                          • एक ओळ = एक साहित्य&nbsp;&nbsp;• <code>नाव - प्रमाण एकक</code> किंवा फक्त <code>नाव</code><br />
                          • नारळ, सुपारी, केळी → unit आपोआप <strong>नग</strong> येते
                        </p>
                      </div>
                      <textarea className={s.importTextarea} placeholder="इथे यादी paste करा किंवा टाइप करा..." value={importText} onChange={e => setImportText(e.target.value)} rows={9} autoFocus />
                      <div className={s.importFooter}>
                        <button className={s.cancelBtn} onClick={closeImport}>रद्द करा</button>
                        <button className={s.parseBtn} onClick={handleParse} disabled={!importText.trim()}>🔍 विश्लेषण करा</button>
                      </div>
                    </>)}

                    {/* IMAGE / OCR TAB */}
                    {importTab === 'image' && (<>
                      <div className={s.importHint}>
                        <strong>📷 हस्तलिखित यादीचा फोटो Upload करा</strong>
                        <p className={s.hintNote}>
                          • कागदावर स्पष्ट मराठीत लिहिलेली यादी — चांगल्या प्रकाशात फोटो काढा<br />
                          • Claude AI फोटो वाचून यादी आपोआप तयार करेल (नारळ/सुपारी → नग auto)
                        </p>
                      </div>
                      <label className={s.uploadArea}>
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleOcrFileChange} style={{ display:'none' }} />
                        {ocrPreview
                          ? <img src={ocrPreview} alt="preview" className={s.ocrPreviewImg} />
                          : <div className={s.uploadPlaceholder}><span>📷</span><p>इथे click करा किंवा फोटो drag करा</p><small>JPG / PNG / WebP • max 10MB</small></div>
                        }
                      </label>
                      {ocrFile && <p className={s.ocrFileName}>📎 {ocrFile.name}</p>}
                      <div className={s.importFooter}>
                        <button className={s.cancelBtn} onClick={closeImport}>रद्द करा</button>
                        <button className={s.parseBtn} onClick={handleOcrScan} disabled={!ocrFile || ocrLoading}>
                          {ocrLoading ? '⏳ AI वाचत आहे...' : '🤖 AI ने वाचा'}
                        </button>
                      </div>
                    </>)}
                  </>
                ) : (
                  <>
                    <p className={s.previewTitle}>
                      ✅ <strong>{parsed.length} साहित्य</strong> सापडली — तपासा, edit करा, मग जोडा
                    </p>

                    <div className={s.previewTableWrap}>
                      <table className={s.previewTable}>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>नाव (मराठी) *</th>
                            <th>English</th>
                            <th>प्रमाण</th>
                            <th>एकक</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsed.map((row, idx) => (
                            <tr key={row._key}>
                              <td className={s.orderCell}>{idx + 1}</td>
                              <td>
                                <input
                                  className={s.previewInput}
                                  value={row.name_mr}
                                  onChange={e => updateParsedRow(idx, 'name_mr', e.target.value)}
                                  placeholder="नाव"
                                />
                              </td>
                              <td>
                                <input
                                  className={s.previewInput}
                                  value={row.name_en}
                                  onChange={e => updateParsedRow(idx, 'name_en', e.target.value)}
                                  placeholder="English"
                                />
                              </td>
                              <td>
                                <input
                                  className={s.previewInputSm}
                                  value={row.quantity}
                                  onChange={e => updateParsedRow(idx, 'quantity', e.target.value)}
                                  placeholder="प्रमाण"
                                />
                              </td>
                              <td>
                                <select
                                  className={s.previewInputSm}
                                  value={row.unit}
                                  onChange={e => updateParsedRow(idx, 'unit', e.target.value)}
                                >
                                  <option value="">—</option>
                                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                              </td>
                              <td>
                                <button className={s.rowDelBtn} onClick={() => removeParsedRow(idx)} title="हटवा">✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className={s.importFooter}>
                      <button className={s.cancelBtn} onClick={() => { setParsed(null); }}>← मागे</button>
                      <button
                        className={s.saveBtn}
                        onClick={handleImportSave}
                        disabled={importSaving || parsed.every(r => !r.name_mr.trim())}
                      >
                        {importSaving ? 'जोडत आहे...' : `✅ ${parsed.filter(r => r.name_mr.trim()).length} साहित्य जोडा`}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
