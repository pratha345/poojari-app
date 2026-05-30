// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, superadminAPI } from '../../api/index.js';
import { usePushNotification } from '../../hooks/usePushNotification';
import { useAdminSocket }    from '../../hooks/useAdminSocket';
import AdminLayout from './AdminLayout';
import s from './AdminDashboard.module.css';

function StatCard({ icon, label, value, color }) {
  return (
    <div className={s.statCard} style={{ borderTopColor: color }}>
      <span className={s.statIcon}>{icon}</span>
      <div className={s.statInfo}>
        <span className={s.statValue}>{value ?? '—'}</span>
        <span className={s.statLabel}>{label}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isSuperAdmin } = useAuth();
  usePushNotification();
  useAdminSocket(user);
  const [stats, setStats]     = useState(null);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (isSuperAdmin) {
          const [sRes, tRes] = await Promise.all([
            superadminAPI.getStats(),
            superadminAPI.getTenants(),
          ]);
          setStats(sRes.data.data || sRes.data);
          setTenants((tRes.data.data || tRes.data).slice(0, 5));
        } else {
          const res = await adminAPI.getStats();
          setStats(res.data.data || res.data);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, [isSuperAdmin]);

  if (loading) return <AdminLayout><div className="page-loader"><div className="spinner" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={s.wrap}>
        <h1 className={s.heading}>
          {isSuperAdmin ? '🌐 Platform Dashboard' : '📊 Dashboard'}
        </h1>

        <div className={s.statsGrid}>
          {isSuperAdmin ? (
            <>
              <StatCard icon="🏢" label="Tenants"  value={stats?.tenants}  color="#E07B2A" />
              <StatCard icon="👥" label="Users"    value={stats?.users}    color="#1565C0" />
              <StatCard icon="👨‍⚕️" label="Pujaris" value={stats?.pujaris}  color="#2E7D32" />
              <StatCard icon="📅" label="Bookings" value={stats?.bookings} color="#7B2D8B" />
              <StatCard icon="💰" label="Revenue"  value={`₹${Number(stats?.revenue || 0).toLocaleString('en-IN')}`} color="#D4AF37" />
            </>
          ) : (
            <>
              <StatCard icon="👥" label="Users"             value={stats?.users}           color="#1565C0" />
              <StatCard icon="👨‍⚕️" label="Pujaris"         value={stats?.pujaris}         color="#2E7D32" />
              <StatCard icon="⏳" label="Pending Pujaris"   value={stats?.pending_pujaris} color="#F57F17" />
              <StatCard icon="📅" label="Bookings"          value={stats?.bookings}        color="#7B2D8B" />
              <StatCard icon="💰" label="Revenue"           value={`₹${Number(stats?.revenue || 0).toLocaleString('en-IN')}`} color="#D4AF37" />
            </>
          )}
        </div>

        {isSuperAdmin && tenants.length > 0 && (
          <div className={s.section}>
            <div className={s.sectionHeader}>
              <h2 className={s.sectionTitle}>🏢 Recent Tenants</h2>
              <Link to="/superadmin/tenants" className={s.seeAll}>View All →</Link>
            </div>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Name</th><th>Slug</th><th>Plan</th>
                    <th>Users</th><th>Bookings</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong></td>
                      <td><code>{t.slug}</code></td>
                      <td>
                        <span className={`badge badge-${t.plan === 'premium' ? 'success' : t.plan === 'basic' ? 'warning' : 'default'}`}>
                          {t.plan}
                        </span>
                      </td>
                      <td>{t.user_count}</td>
                      <td>{t.booking_count}</td>
                      <td>
                        {t.is_active
                          ? <span className="badge badge-success">Active</span>
                          : <span className="badge badge-danger">Inactive</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isSuperAdmin && (
          <div className={s.quickLinks}>
            <Link to="/admin/pujaris/pending" className={s.quickCard}>
              <span>⏳</span><span>Pujari Requests</span>
              {stats?.pending_pujaris > 0 && <span className={s.badge}>{stats.pending_pujaris}</span>}
            </Link>
            <Link to="/admin/bookings"      className={s.quickCard}><span>📅</span><span>Manage Bookings</span></Link>
            <Link to="/admin/poojas"        className={s.quickCard}><span>🪔</span><span>Manage Poojas</span></Link>
            <Link to="/admin/theme"         className={s.quickCard}><span>🎨</span><span>Theme Settings</span></Link>
            <Link to="/admin/home"          className={s.quickCard}><span>🏠</span><span>Homepage Content</span></Link>
            <Link to="/admin/kundali-milan" className={s.quickCard}><span>🔯</span><span>Kundali Milan</span></Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
