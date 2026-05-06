// src/pages/superadmin/TenantsPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../admin/AdminLayout';
import { superadminAPI } from '../../api/index.js';
import s from './TenantsPage.module.css';

const EMPTY_FORM = {
  name: '', slug: '', domain: '', plan: 'trial',
  admin_name: '', admin_email: '', admin_phone: '', admin_password: '',
};

export default function TenantsPage() {
  const [tenants, setTenants]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShow]    = useState(false);
  const [saving, setSaving]     = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);

  const load = async () => {
    setLoading(true);
    try {
      const res = await superadminAPI.getTenants();
      setTenants(res.data.data || res.data);
    } catch { toast.error('Tenants मिळवताना त्रुटी.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShow(true); };
  const openEdit   = (t) => {
    setEditId(t.id);
    setForm({ name: t.name, slug: t.slug, domain: t.domain || '', plan: t.plan, admin_name:'', admin_email:'', admin_phone:'', admin_password:'' });
    setShow(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await superadminAPI.updateTenant(editId, { name: form.name, domain: form.domain, plan: form.plan });
        toast.success('Tenant अपडेट केला.');
      } else {
        await superadminAPI.createTenant(form);
        toast.success('Tenant तयार केला! 🎉');
      }
      setShow(false);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'त्रुटी झाली.');
    } finally { setSaving(false); }
  };

  const handleToggle = async (t) => {
    try {
      await superadminAPI.updateTenant(t.id, { is_active: !t.is_active });
      toast.success(t.is_active ? 'Tenant बंद केला.' : 'Tenant सुरू केला.');
      load();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`"${t.name}" कायमचे काढायचे का? सर्व डेटा नष्ट होईल!`)) return;
    try {
      await superadminAPI.deleteTenant(t.id);
      toast.success('Tenant काढला.');
      load();
    } catch (e) { toast.error(e?.response?.data?.message || 'त्रुटी झाली.'); }
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <AdminLayout>
      <div className={s.wrap}>
        <div className={s.header}>
          <h1 className={s.heading}>🏢 Tenant Management</h1>
          <button className="btn btn-primary" onClick={openCreate}>+ New Tenant</button>
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Slug</th><th>Domain</th>
                  <th>Plan</th><th>Users</th><th>Bookings</th>
                  <th>Admin Email</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td><strong>{t.name}</strong></td>
                    <td><code className={s.slug}>{t.slug}</code></td>
                    <td>{t.domain || '—'}</td>
                    <td>
                      <span className={`badge ${t.plan === 'premium' ? 'badge-success' : t.plan === 'basic' ? 'badge-warning' : 'badge-default'}`}>
                        {t.plan}
                      </span>
                    </td>
                    <td>{t.user_count}</td>
                    <td>{t.booking_count}</td>
                    <td>{t.admin_email || '—'}</td>
                    <td>
                      {t.is_active
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>✏️</button>
                        <button
                          className="btn btn-sm"
                          style={{ background: t.is_active ? '#f57f17' : '#2e7d32', color: '#fff' }}
                          onClick={() => handleToggle(t)}
                        >
                          {t.is_active ? '⏸' : '▶'}
                        </button>
                        {t.id !== 1 && (
                          <button className="btn btn-sm" style={{ background: '#c62828', color: '#fff' }} onClick={() => handleDelete(t)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tenants.length === 0 && (
              <div className={s.empty}>कोणतेही tenants नाहीत.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShow(false)}>
          <div className={s.modal}>
            <h2 className={s.modalTitle}>{editId ? '✏️ Edit Tenant' : '➕ New Tenant'}</h2>

            <div className={s.grid2}>
              <div className={s.field}>
                <label>Tenant Name *</label>
                <input className={s.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Krishna Puja Services" />
              </div>
              <div className={s.field}>
                <label>Slug * {editId && <small>(read-only)</small>}</label>
                <input className={s.input} value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g,'-'))} placeholder="e.g. krishna-puja" disabled={!!editId} />
              </div>
            </div>

            <div className={s.grid2}>
              <div className={s.field}>
                <label>Domain</label>
                <input className={s.input} value={form.domain} onChange={e => set('domain', e.target.value)} placeholder="e.g. krishnapuja.com" />
              </div>
              <div className={s.field}>
                <label>Plan</label>
                <select className={s.input} value={form.plan} onChange={e => set('plan', e.target.value)}>
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            {!editId && (
              <>
                <div className={s.divider}>Admin Account</div>
                <div className={s.grid2}>
                  <div className={s.field}>
                    <label>Admin Name</label>
                    <input className={s.input} value={form.admin_name} onChange={e => set('admin_name', e.target.value)} placeholder="Admin Name" />
                  </div>
                  <div className={s.field}>
                    <label>Admin Phone *</label>
                    <input className={s.input} value={form.admin_phone} onChange={e => set('admin_phone', e.target.value)} placeholder="9876543210" />
                  </div>
                </div>
                <div className={s.grid2}>
                  <div className={s.field}>
                    <label>Admin Email *</label>
                    <input className={s.input} type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} placeholder="admin@example.com" />
                  </div>
                  <div className={s.field}>
                    <label>Admin Password *</label>
                    <input className={s.input} type="password" value={form.admin_password} onChange={e => set('admin_password', e.target.value)} placeholder="••••••••" />
                  </div>
                </div>
              </>
            )}

            <div className={s.modalActions}>
              <button className="btn btn-secondary" onClick={() => setShow(false)}>रद्द करा</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? '⏳ Saving…' : editId ? '✅ Update' : '➕ Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
