// src/pages/admin/ManageAbhyasak.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { adminAPI } from '../../api/index.js';
import adminStyles from './Admin.module.css';
import s from './ManageAbhyasak.module.css';

const EMPTY_FORM = { name: '', phone: '', email: '', password: '' };

export default function ManageAbhyasak() {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const fetchList = async () => {
    try {
      const res = await adminAPI.getAbhyasakUsers();
      setList(res.data.data || []);
    } catch {
      toast.error('अभ्यासक यादी मिळवता आली नाही.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) {
      toast.error('नाव, फोन आणि पासवर्ड आवश्यक आहे.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('पासवर्ड किमान 6 अक्षरांचा असावा.');
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.createAbhyasak(form);
      toast.success('अभ्यासक यशस्वीरित्या जोडला! 🎓');
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'अभ्यासक जोडताना त्रुटी झाली.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" यांना काढायचे आहे का?`)) return;
    try {
      await adminAPI.deleteAbhyasak(id);
      toast.success('अभ्यासक काढला.');
      setList(l => l.filter(u => u.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'काढताना त्रुटी झाली.');
    }
  };

  return (
    <AdminLayout>
      <div className={s.wrap}>
        {/* Header */}
        <div className={s.header}>
          <div>
            <h1 className={s.title}>🎓 अभ्यासक व्यवस्थापन</h1>
            <p className={s.subtitle}>अभ्यासक/संशोधक जोडा — ते ब्लॉग लिहू शकतात</p>
          </div>
          <button className={s.addBtn} onClick={() => setShowForm(f => !f)}>
            {showForm ? '✕ बंद करा' : '+ नवीन अभ्यासक जोडा'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className={s.formCard}>
            <h2 className={s.formTitle}>नवीन अभ्यासक</h2>
            <form onSubmit={handleCreate} className={s.form}>
              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>नाव *</label>
                  <input
                    className={s.input}
                    type="text"
                    name="name"
                    placeholder="उदा: डॉ. रामचंद्र देशपांडे"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className={s.field}>
                  <label className={s.label}>📱 फोन नंबर *</label>
                  <input
                    className={s.input}
                    type="tel"
                    name="phone"
                    placeholder="उदा: 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className={s.row}>
                <div className={s.field}>
                  <label className={s.label}>✉️ ईमेल (ऐच्छिक)</label>
                  <input
                    className={s.input}
                    type="email"
                    name="email"
                    placeholder="उदा: name@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
                <div className={s.field}>
                  <label className={s.label}>🔒 पासवर्ड *</label>
                  <div className={s.passWrap}>
                    <input
                      className={s.input}
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      placeholder="किमान 6 अक्षरे"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className={s.eyeBtn}
                      onClick={() => setShowPass(p => !p)}
                    >
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
              <div className={s.infoBox}>
                ℹ️ अभ्यासक <strong>/admin/login</strong> वरून लॉगिन करून फक्त ब्लॉग लिहू शकतात.
              </div>
              <div className={s.formActions}>
                <button type="button" className={s.cancelBtn} onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>
                  रद्द करा
                </button>
                <button type="submit" className={s.saveBtn} disabled={submitting}>
                  {submitting ? '⏳ जोडत आहे...' : '✅ अभ्यासक जोडा'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <p className={s.loading}>⏳ यादी लोड होत आहे...</p>
        ) : list.length === 0 ? (
          <div className={s.empty}>
            <span className={s.emptyIcon}>🎓</span>
            <p>अजून कोणताही अभ्यासक जोडला नाही.</p>
            <p className={s.emptyHint}>वर "+ नवीन अभ्यासक जोडा" बटण वापरा.</p>
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>नाव</th>
                  <th>📱 फोन</th>
                  <th>✉️ ईमेल</th>
                  <th>स्थिती</th>
                  <th>नोंदणी तारीख</th>
                  <th>क्रिया</th>
                </tr>
              </thead>
              <tbody>
                {list.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className={s.nameCell}>
                        <span className={s.avatar}>{u.name[0]}</span>
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.phone}</td>
                    <td>{u.email || '—'}</td>
                    <td>
                      <span className={u.is_active ? s.badgeActive : s.badgeInactive}>
                        {u.is_active ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString('mr-IN')}</td>
                    <td>
                      <button
                        className={s.deleteBtn}
                        onClick={() => handleDelete(u.id, u.name)}
                        title="काढा"
                      >
                        🗑️ काढा
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
