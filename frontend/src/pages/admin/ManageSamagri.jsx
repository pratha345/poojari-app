import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { adminSamagriAPI, poojaAPI } from '../../api/index.js';
import s from './ManageSamagri.module.css';

const EMPTY = { name_mr: '', name_en: '', quantity: '', unit: '', note: '', sort_order: '' };
const UNITS = ['gm', 'kg', 'pcs', 'ml', 'ltr', 'rs', 'bunch', 'types'];

export default function ManageSamagri() {
  const [poojas,    setPoojas]    = useState([]);
  const [selPooja,  setSelPooja]  = useState(null);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  // Load all poojas for dropdown
  useEffect(() => {
    poojaAPI.getPoojas().then(r => setPoojas(r.data.data?.poojas || [])).catch(() => {});
  }, []);

  // Load samagri for selected pooja
  const loadItems = useCallback((poojaId) => {
    if (!poojaId) return;
    setLoading(true);
    adminSamagriAPI.getByPooja(poojaId)
      .then(r => setItems(r.data.data || []))
      .catch(() => toast.error('साहित्य लोड करता आले नाही.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePoojaChange = (e) => {
    const id = e.target.value;
    const pooja = poojas.find(p => String(p.id) === id);
    setSelPooja(pooja || null);
    setItems([]);
    setSearch('');
    setShowForm(false);
    if (id) loadItems(id);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, sort_order: items.length + 1 });
    setShowForm(true);
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

  const filtered = items.filter(i =>
    i.name_mr.toLowerCase().includes(search.toLowerCase()) ||
    (i.name_en || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className={s.page}>
        {/* Header */}
        <div className={s.header}>
          <h2 className={s.title}>🛒 साहित्य व्यवस्थापन</h2>
        </div>

        {/* Pooja Selector */}
        <div className={s.selectorBar}>
          <select className={s.poojaSelect} onChange={handlePoojaChange} defaultValue="">
            <option value="">-- पूजा निवडा --</option>
            {poojas.map(p => (
              <option key={p.id} value={p.id}>{p.name_mr}</option>
            ))}
          </select>
          {selPooja && (
            <span className={s.poojaTag}>
              📿 {selPooja.name_mr} — {items.length} साहित्य
            </span>
          )}
        </div>

        {/* Content */}
        {selPooja && (
          <>
            {/* Toolbar */}
            <div className={s.toolbar}>
              <input
                className={s.searchInput}
                placeholder="🔍 साहित्य शोधा..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button className={s.addBtn} onClick={openAdd}>+ नवीन साहित्य</button>
            </div>

            {/* Table */}
            {loading ? (
              <div className={s.loading}><div className="spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className={s.empty}>
                <p>{search ? `"${search}" सापडले नाही.` : 'साहित्य नाही. वर + बटण दाबा.'}</p>
              </div>
            ) : (
              <div className={s.tableWrap}>
                <table className={s.table}>
                  <thead>
                    <tr>
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
                      <tr key={item.id}>
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

        {/* Modal Form */}
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
                  <label className={s.label}>क्रम (Order)
                    <input name="sort_order" type="number" value={form.sort_order}
                      onChange={handleChange} className={s.input} placeholder="1" />
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
      </div>
    </AdminLayout>
  );
}
