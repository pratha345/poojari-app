// src/pages/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import s from './AdminLayout.module.css';

const NAV_ADMIN = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/pujaris/pending', icon: '⏳', label: 'Pujari Requests' },
  { to: '/admin/pujaris', icon: '✅', label: 'Approved Pujaris' },
  { to: '/admin/bookings', icon: '📅', label: 'Bookings' },
  { to: '/admin/poojas', icon: '🪔', label: 'Manage Poojas' },
  { to: '/admin/home', icon: '🏠', label: 'Homepage' },
  { to: '/admin/theme', icon: '🎨', label: 'Theme Settings' },
  { to: '/admin/kundali-milan', icon: '🔯', label: 'Kundali Milan' },
  { to: '/admin/halls',         icon: '🏛️', label: 'Manage Halls' },
  { to: '/admin/samagri',       icon: '🛒', label: 'Samagri यादी' },
  { to: '/admin/janam-patrika', icon: '📜', label: 'जन्म पत्रिका' },
];

const NAV_SUPER = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/superadmin/tenants', icon: '🏢', label: 'Tenants' },
  { to: '/superadmin/users', icon: '👥', label: 'All Users' },
];

export default function AdminLayout({ children }) {
  const { user, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const nav = isSuperAdmin ? NAV_SUPER : NAV_ADMIN;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`${s.shell} ${collapsed ? s.collapsed : ''}`}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={s.sidebar}>
        <div className={s.brand}>
          <span className={s.brandIcon}>🙏</span>
          {!collapsed && (
            <div className={s.brandText}>
              <span className={s.brandName}>पूजारी</span>
              <span className={s.brandRole}>
                {isSuperAdmin ? 'Super Admin' : 'Admin Panel'}
              </span>
            </div>
          )}
          <button className={s.collapseBtn} onClick={() => setCollapsed(c => !c)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {isSuperAdmin && !collapsed && (
          <div className={s.roleBadge}>🔴 Super Admin Mode</div>
        )}

        <nav className={s.nav}>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${s.navItem} ${isActive ? s.active : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={s.navIcon}>{item.icon}</span>
              {!collapsed && <span className={s.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={s.sidebarFooter}>
          {!collapsed && (
            <div className={s.userInfo}>
              <span className={s.userName}>{user?.name}</span>
              <span className={s.userRole}>{user?.role}</span>
            </div>
          )}
          <button className={s.logoutBtn} onClick={handleLogout} title="Logout">
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className={s.main}>
        <div className={s.topbar}>
          <h2 className={s.pageTitle}>
            {nav.find(n => location.pathname.startsWith(n.to))?.label || 'Admin'}
          </h2>
          <div className={s.topbarRight}>
            <span className={s.topbarUser}>👤 {user?.name}</span>
          </div>
        </div>
        <div className={s.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
