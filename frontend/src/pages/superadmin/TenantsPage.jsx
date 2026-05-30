// src/pages/superadmin/TenantsPage.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../admin/AdminLayout';
import { superadminAPI, subscriptionAPI } from '../../api/index.js';
import s from './TenantsPage.module.css';

const EMPTY_FORM = {
  name: '', slug: '', domain: '', plan: 'trial',
  admin_name: '', admin_email: '', admin_phone: '', admin_password: '',
  city: '', phone: '', contact_name: '',
};

const PLAN_COLORS = {
  trial:   '#e65100',
  basic:   '#1565c0',
  premium: '#2e7d32',
};

function planBadge(plan) {
  return (
    <span style={{
      background: PLAN_COLORS[plan] || '#555', color: '#fff',
      padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700,
    }}>
      {plan?.toUpperCase()}
    </span>
  );
}

function expiryLabel(t) {
  const now = new Date();
  if (t.plan === 'trial' && t.trial_ends_at) {
    const d = new Date(t.trial_ends_at);
    const days = Math.ceil((d - now) / 86400000);
    if (days < 0) return <span style={{ color: '#c62828', fontSize: '0.78rem' }}>⛔ Trial संपला</span>;
    return <span style={{ color: days <= 5 ? '#e65100' : '#555', fontSize: '0.78rem' }}>⏳ {days} दिवस</span>;
  }
  if ((t.plan === 'basic' || t.plan === 'premium') && t.plan_expires_at) {
    const d = new Date(t.plan_expires_at);
    const days = Math.ceil((d - now) / 86400000);
    if (days < 0) return <span style={{ color: '#c62828', fontSize: '0.78rem' }}>⛔ Expired</span>;
    return <span style={{ color: days <= 7 ? '#e65100' : '#2e7d32', fontSize: '0.78rem' }}>✅ {days} दिवस</span>;
  }
  if (t.plan === 'premium' && !t.plan_expires_at) {
    return <span style={{ color: '#2e7d32', fontSize: '0.78rem' }}>♾ No expiry</span>;
  }
  return '—';
}

function nginxConfig(t) {
  const domain = t.domain || `${t.slug}.pojjari.com`;
  return `# Tenant: ${t.name}  (slug: ${t.slug})
# 1. DNS: A record  ${domain}  →  <SERVER_IP>
# 2. SSL: sudo certbot --nginx -d ${domain}

server {
    listen 80;
    server_name ${domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain};

    ssl_certificate     /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;

    # API
    location /api/ {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    }

    # Uploaded files
    location /uploads/ {
        alias /var/www/pojjari/uploads/;
    }

    # React SPA
    location / {
        root /var/www/pojjari/dist;
        try_files $uri $uri/ /index.html;
    }
}`;
}

export default function TenantsPage() {
  const [tenants, setTenants]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShow]      = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editId, setEditId]       = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [nginxTenant, setNginxTenant] = useState(null);
  const [copied, setCopied]       = useState(false);

  // Upgrade requests
  const [requests, setRequests]   = useState([]);
  const [reqFilter, setReqFilter] = useState('pending');
  const [reqTab, setReqTab]       = useState(false); // show requests tab

  // Plan modal
  const [planModal, setPlanModal] = useState(false);
  const [planTenant, setPlanTenant] = useState(null);
  const [planForm, setPlanForm]   = useState({ plan: 'basic', months: 1 });
  const [planSaving, setPlanSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await superadminAPI.getTenants();
      setTenants(res.data.data || res.data);
    } catch { toast.error('Tenants मिळवताना त्रुटी.'); }
    finally { setLoading(false); }
  };

  const loadRequests = () => {
    subscriptionAPI.getPlanRequests({ status: reqFilter })
      .then(r => setRequests(r.data.data || []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (reqTab) loadRequests(); }, [reqTab, reqFilter]);

  const openCreate = () => { setEditId(null); setForm(EMPTY_FORM); setShow(true); };
  const openEdit   = (t) => {
    setEditId(t.id);
    setForm({
      name: t.name, slug: t.slug, domain: t.domain || '', plan: t.plan,
      admin_name: '', admin_email: '', admin_phone: '', admin_password: '',
      city: t.city || '', phone: t.phone || '', contact_name: t.contact_name || '',
    });
    setShow(true);
  };

  const openPlanModal = (t) => {
    setPlanTenant(t);
    setPlanForm({ plan: t.plan === 'trial' ? 'basic' : t.plan, months: 1 });
    setPlanModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await superadminAPI.updateTenant(editId, {
          name: form.name, domain: form.domain, plan: form.plan,
          city: form.city, phone: form.phone, contact_name: form.contact_name,
        });
        toast.success('Tenant अपडेट केला.');
      } else {
        await superadminAPI.createTenant(form);
        toast.success('Tenant तयार केला! 🎉');
      }
      setShow(false); load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'त्रुटी झाली.');
    } finally { setSaving(false); }
  };

  const handlePlanUpdate = async () => {
    setPlanSaving(true);
    try {
      const res = await superadminAPI.updatePlan(planTenant.id, planForm);
      const d   = res.data?.data || {};
      toast.success(`Plan "${planForm.plan}" update झाला!`);
      setPlanModal(false); load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Plan update त्रुटी.');
    } finally { setPlanSaving(false); }
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

  const handleRequestAction = async (id, action, name) => {
    if (action === 'approve' && !window.confirm(`"${name}" ची विनंती approve करायची? Plan activate होईल.`)) return;
    try {
      const r = await subscriptionAPI.approveRequest(id, action);
      toast.success(r.data.message);
      loadRequests();
      load(); // refresh tenant list too
    } catch (e) { toast.error(e?.response?.data?.message || 'त्रुटी झाली.'); }
  };

  const set     = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setPlan = (k, v) => setPlanForm(p => ({ ...p, [k]: v }));

  const copyNginx = (t) => {
    navigator.clipboard.writeText(nginxConfig(t)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <AdminLayout>
      <div className={s.wrap}>
        <div className={s.header}>
          <div>
            <h1 className={s.heading}>🏢 Tenant Management</h1>
            <p className={s.sub}>एकूण {tenants.length} tenants — सर्व platform वर</p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button
              className={reqTab ? 'btn btn-secondary' : 'btn btn-primary'}
              style={{ position:'relative' }}
              onClick={() => setReqTab(t => !t)}
            >
              📋 Upgrade Requests
              {requests.filter(r=>r.status==='pending').length > 0 && !reqTab && (
                <span style={{ position:'absolute',top:-6,right:-6,background:'#c62828',color:'#fff',borderRadius:'50%',width:18,height:18,fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700 }}>
                  {requests.filter(r=>r.status==='pending').length}
                </span>
              )}
            </button>
            <button className="btn btn-primary" onClick={openCreate}>+ New Tenant</button>
          </div>
        </div>

        {/* Stats strip */}
        <div className={s.statsStrip}>
          {['trial','basic','premium'].map(p => (
            <div key={p} className={s.statBox}>
              <span className={s.statNum}>{tenants.filter(t => t.plan === p).length}</span>
              <span className={s.statLabel}>{p.toUpperCase()}</span>
            </div>
          ))}
          <div className={s.statBox}>
            <span className={s.statNum}>{tenants.filter(t => !t.is_active).length}</span>
            <span className={s.statLabel}>INACTIVE</span>
          </div>
        </div>

        {/* ── Upgrade Requests Panel ──────────────────────── */}
        {reqTab && (
          <div className={s.reqPanel}>
            <div className={s.reqPanelHead}>
              <h3>📋 Plan Upgrade विनंत्या</h3>
              <div style={{ display:'flex', gap:8 }}>
                {['pending','approved','rejected','all'].map(st => (
                  <button key={st}
                    className={`${s.reqFilterBtn} ${reqFilter===st?s.reqFilterActive:''}`}
                    onClick={() => setReqFilter(st)}>
                    {st === 'pending' ? '⏳ Pending' : st === 'approved' ? '✅ Approved' : st === 'rejected' ? '❌ Rejected' : 'सर्व'}
                  </button>
                ))}
              </div>
            </div>

            {requests.length === 0 ? (
              <p className={s.reqEmpty}>कोणत्याही {reqFilter === 'all' ? '' : reqFilter} विनंत्या नाहीत.</p>
            ) : (
              <div className={s.reqTable}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'var(--cream)' }}>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1.5px solid var(--border)' }}>Tenant</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1.5px solid var(--border)' }}>संपर्क</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1.5px solid var(--border)' }}>Plan विनंती</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1.5px solid var(--border)' }}>संदेश</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1.5px solid var(--border)' }}>तारीख</th>
                      <th style={{ padding:'10px 12px', textAlign:'left', borderBottom:'1.5px solid var(--border)' }}>कृती</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(r => (
                      <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'12px' }}>
                          <strong>{r.tenant_name}</strong>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                            Current: {r.current_plan?.toUpperCase()}
                          </div>
                        </td>
                        <td style={{ padding:'12px' }}>
                          <div style={{ fontWeight:600 }}>{r.contact_name}</div>
                          <a href={`https://wa.me/91${r.contact_phone?.replace(/\D/g,'')}`}
                            target="_blank" rel="noreferrer"
                            style={{ color:'#25D366', fontSize:12, textDecoration:'none' }}>
                            💬 {r.contact_phone}
                          </a>
                          {r.contact_email && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.contact_email}</div>}
                        </td>
                        <td style={{ padding:'12px' }}>
                          <span style={{ background:'var(--primary)', color:'#fff', padding:'2px 10px', borderRadius:12, fontWeight:700, fontSize:12 }}>
                            {r.requested_plan?.toUpperCase()}
                          </span>
                          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>{r.months} महिने</div>
                        </td>
                        <td style={{ padding:'12px', maxWidth:180, fontSize:12, color:'var(--text-muted)' }}>
                          {r.message || '—'}
                        </td>
                        <td style={{ padding:'12px', fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                          {new Date(r.created_at).toLocaleDateString('mr-IN')}
                        </td>
                        <td style={{ padding:'12px' }}>
                          {r.status === 'pending' ? (
                            <div style={{ display:'flex', gap:6 }}>
                              <button className="btn btn-primary btn-sm"
                                onClick={() => handleRequestAction(r.id, 'approve', r.tenant_name)}>
                                ✅ Approve
                              </button>
                              <button className="btn btn-secondary btn-sm"
                                style={{ color:'#c62828', borderColor:'#c62828' }}
                                onClick={() => handleRequestAction(r.id, 'reject', r.tenant_name)}>
                                ❌ Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize:12, fontWeight:700, color: r.status==='approved'?'#2e7d32':'#c62828' }}>
                              {r.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Business</th>
                  <th>Slug</th>
                  <th>शहर</th>
                  <th>Contact</th>
                  <th>Plan</th>
                  <th>Expiry</th>
                  <th>Users</th>
                  <th>Bookings</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className={!t.is_active ? s.inactiveRow : ''}>
                    <td>{t.id}</td>
                    <td>
                      <strong>{t.name}</strong>
                      {t.admin_email && <div className={s.subText}>{t.admin_email}</div>}
                    </td>
                    <td><code className={s.slug}>{t.slug}</code></td>
                    <td>{t.city || '—'}</td>
                    <td>
                      {t.contact_name && <div>{t.contact_name}</div>}
                      {t.phone && <div className={s.subText}>{t.phone}</div>}
                    </td>
                    <td>{planBadge(t.plan)}</td>
                    <td>{expiryLabel(t)}</td>
                    <td>{t.user_count}</td>
                    <td>{t.booking_count}</td>
                    <td>
                      {t.is_active
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button
                          className={s.btnPlan}
                          title="Plan Update"
                          onClick={() => openPlanModal(t)}
                        >💳 Plan</button>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Nginx Config"
                          onClick={() => { setNginxTenant(t); setCopied(false); }}
                          style={{ background: '#1a1a2e', color: '#fff', borderColor: '#1a1a2e' }}
                        >⚙️ Nginx</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)} title="Edit">✏️</button>
                        <button
                          className="btn btn-sm"
                          style={{ background: t.is_active ? '#f57f17' : '#2e7d32', color: '#fff' }}
                          onClick={() => handleToggle(t)}
                          title={t.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {t.is_active ? '⏸' : '▶'}
                        </button>
                        {t.id !== 1 && (
                          <button className="btn btn-sm" style={{ background: '#c62828', color: '#fff' }} onClick={() => handleDelete(t)} title="Delete">🗑️</button>
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

      {/* ── Create / Edit Tenant Modal ── */}
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
                <label>शहर</label>
                <input className={s.input} value={form.city} onChange={e => set('city', e.target.value)} placeholder="नाशिक" />
              </div>
              <div className={s.field}>
                <label>Phone</label>
                <input className={s.input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="9876543210" />
              </div>
            </div>

            <div className={s.grid2}>
              <div className={s.field}>
                <label>Contact Name</label>
                <input className={s.input} value={form.contact_name} onChange={e => set('contact_name', e.target.value)} placeholder="Rajesh Sharma" />
              </div>
              <div className={s.field}>
                <label>Domain</label>
                <input className={s.input} value={form.domain} onChange={e => set('domain', e.target.value)} placeholder="krishnapuja.com" />
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
                <div className={s.field} style={{ marginTop: 8 }}>
                  <label>Initial Plan</label>
                  <select className={s.input} value={form.plan} onChange={e => set('plan', e.target.value)}>
                    <option value="trial">Trial (30 दिवस)</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
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

      {/* ── Plan Update Modal ── */}
      {planModal && planTenant && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setPlanModal(false)}>
          <div className={s.modal} style={{ maxWidth: 440 }}>
            <h2 className={s.modalTitle}>💳 Plan Update</h2>
            <div className={s.planInfo}>
              <strong>{planTenant.name}</strong>
              <span>{planTenant.city || ''}</span>
            </div>
            <div className={s.currentPlan}>
              सध्याचा plan: {planBadge(planTenant.plan)}
              <span style={{ marginLeft: 8 }}>{expiryLabel(planTenant)}</span>
            </div>

            <div className={s.field} style={{ marginBottom: 16 }}>
              <label>नवीन Plan *</label>
              <div className={s.planOptions}>
                {[
                  { val: 'trial',   label: 'Trial',   sub: '30 दिवस मोफत',       color: '#e65100' },
                  { val: 'basic',   label: 'Basic',   sub: '₹999/month',          color: '#1565c0' },
                  { val: 'premium', label: 'Premium', sub: '₹2499/month',         color: '#2e7d32' },
                ].map(p => (
                  <div
                    key={p.val}
                    className={`${s.planOpt} ${planForm.plan === p.val ? s.planOptActive : ''}`}
                    style={planForm.plan === p.val ? { borderColor: p.color, background: p.color + '10' } : {}}
                    onClick={() => setPlan('plan', p.val)}
                  >
                    <div style={{ fontWeight: 700, color: p.color }}>{p.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {planForm.plan !== 'trial' && (
              <div className={s.field} style={{ marginBottom: 16 }}>
                <label>कालावधी (महिने)</label>
                <div className={s.monthBtns}>
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      className={`${s.monthBtn} ${planForm.months === m ? s.monthBtnActive : ''}`}
                      onClick={() => setPlan('months', m)}
                    >
                      {m} {m === 1 ? 'महिना' : 'महिने'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {planForm.plan === 'trial' && (
              <div className={s.field} style={{ marginBottom: 16 }}>
                <label>Trial दिवस</label>
                <div className={s.monthBtns}>
                  {[15, 30, 45, 60].map(d => (
                    <button
                      key={d}
                      className={`${s.monthBtn} ${planForm.months === Math.round(d/30) ? s.monthBtnActive : ''}`}
                      onClick={() => setPlan('months', Math.round(d/30) || 1)}
                    >
                      {d} दिवस
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={s.planSummary}>
              {planForm.plan === 'trial'
                ? `Trial: ${(planForm.months || 1) * 30} दिवस`
                : `${planForm.plan.toUpperCase()} — ${planForm.months} ${planForm.months === 1 ? 'महिना' : 'महिने'}`
              }
              {' → '}
              {(() => {
                const d = new Date();
                if (planForm.plan === 'trial') d.setDate(d.getDate() + (planForm.months||1)*30);
                else d.setMonth(d.getMonth() + (planForm.months||1));
                return d.toLocaleDateString('mr-IN');
              })()}
              {' पर्यंत'}
            </div>

            <div className={s.modalActions}>
              <button className="btn btn-secondary" onClick={() => setPlanModal(false)}>रद्द करा</button>
              <button className="btn btn-primary" onClick={handlePlanUpdate} disabled={planSaving}>
                {planSaving ? '⏳ Updating…' : '✅ Plan Update करा'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Nginx Config Modal ── */}
      {nginxTenant && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setNginxTenant(null)}>
          <div className={s.modal} style={{ maxWidth: 680 }}>
            <h2 className={s.modalTitle}>⚙️ Nginx Config — {nginxTenant.name}</h2>

            <div style={{ background: '#0d1117', borderRadius: 10, padding: '14px 16px', marginBottom: 16, position: 'relative' }}>
              <pre style={{ color: '#e6edf3', fontSize: 12, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                {nginxConfig(nginxTenant)}
              </pre>
            </div>

            <div style={{ background: '#fff8f0', border: '1px solid #f0e0c8', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>📋 Steps:</div>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>DNS: <code>{nginxTenant.domain || `${nginxTenant.slug}.pojjari.com`}</code> → A record → Server IP</li>
                <li>File save: <code>/etc/nginx/sites-available/{nginxTenant.slug}</code></li>
                <li>Enable: <code>sudo ln -s /etc/nginx/sites-available/{nginxTenant.slug} /etc/nginx/sites-enabled/</code></li>
                <li>SSL: <code>sudo certbot --nginx -d {nginxTenant.domain || `${nginxTenant.slug}.pojjari.com`}</code></li>
                <li>Reload: <code>sudo systemctl reload nginx</code></li>
              </ol>
            </div>

            <div className={s.modalActions}>
              <button className="btn btn-secondary" onClick={() => setNginxTenant(null)}>बंद करा</button>
              <button className="btn btn-primary" onClick={() => copyNginx(nginxTenant)}>
                {copied ? '✅ Copied!' : '📋 Config Copy करा'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
