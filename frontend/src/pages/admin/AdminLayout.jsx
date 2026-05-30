// src/pages/admin/AdminLayout.jsx
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import s from './AdminLayout.module.css';
import {
  FaGauge, FaChartColumn,
  FaUserCheck, FaCalendarCheck,
  FaHandsPraying, FaBuilding, FaBoxOpen,
  FaHouseChimney, FaPalette, FaInfinity,
  FaScroll, FaNewspaper, FaGraduationCap,
  FaComments, FaCrown, FaTicket,
  FaUsers, FaChartPie,
  FaRightFromBracket, FaUser,
  FaShieldHalved, FaAngleLeft, FaAngleRight,
  FaArrowUpRightFromSquare, FaOm, FaBars, FaXmark,
} from 'react-icons/fa6';
import { FaHandsPraying as FaLogo } from 'react-icons/fa6';

const NAV_ADMIN = [
  { section: 'आढावा' },
  { to: '/admin/dashboard',     icon: FaGauge,        label: 'डॅशबोर्ड'        },
  { to: '/admin/report',        icon: FaChartColumn,  label: 'अहवाल'            },

  { section: 'पुजारी' },
  { to: '/admin/pujaris',       icon: FaUserCheck,    label: 'पुजारी व्यवस्थापन' },
  { to: '/admin/bookings',      icon: FaCalendarCheck,label: 'बुकिंग्ज'          },

  { section: 'सेवा' },
  { to: '/admin/poojas',        icon: FaHandsPraying, label: 'पूजा व्यवस्थापन'  },
  { to: '/admin/halls',         icon: FaBuilding,     label: 'हॉल व्यवस्थापन'   },
  { to: '/admin/samagri',       icon: FaBoxOpen,      label: 'साहित्य यादी'     },

  { section: 'वेबसाइट' },
  { to: '/admin/home',          icon: FaHouseChimney, label: 'मुखपृष्ठ'         },
  { to: '/admin/theme',         icon: FaPalette,      label: 'थीम सेटिंग्ज'    },
  { to: '/admin/kundali-milan', icon: FaInfinity,     label: 'कुंडली मिलान'    },
  { to: '/admin/janam-patrika', icon: FaScroll,       label: 'जन्म पत्रिका'    },
  { to: '/admin/blog',          icon: FaNewspaper,    label: 'ब्लॉग'             },

  { section: 'धर्मग्रंथ' },
  { to: '/admin/dharmasindhu',  icon: FaOm,            label: 'धर्मसिंधु शंका' },

  { section: 'टीम' },
  { to: '/admin/abhyasak',      icon: FaGraduationCap, label: 'अभ्यासक'         },
  { to: '/admin/reviews',       icon: FaComments,      label: 'अभिप्राय'        },
  { to: '/admin/tickets',       icon: FaTicket,        label: 'Support Tickets' },

  { to: '/admin/upgrade-plan',  icon: FaCrown,         label: 'योजना सुधारणा', highlight: true },
];

const NAV_ABHYASAK = [
  { to: '/admin/blog', icon: FaNewspaper, label: 'ब्लॉग लिहा' },
];

const NAV_SUPER = [
  { section: 'सुपर अॅडमिन' },
  { to: '/admin/dashboard',    icon: FaGauge,     label: 'डॅशबोर्ड'        },
  { to: '/superadmin/tenants', icon: FaBuilding,  label: 'टेनंट्स'         },
  { to: '/superadmin/users',   icon: FaUsers,     label: 'सर्व वापरकर्ते'  },
  { to: '/superadmin/revenue', icon: FaChartPie,  label: 'महसूल'           },
];

export default function AdminLayout({ children }) {
  const { user, isSuperAdmin, isAbhyasak, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = isSuperAdmin ? NAV_SUPER : isAbhyasak ? NAV_ABHYASAK : NAV_ADMIN;
  const roleLabel = isSuperAdmin ? 'सुपर अॅडमिन' : isAbhyasak ? 'अभ्यासक' : 'अॅडमिन';
  const currentLabel = nav.filter(n => n.to).find(n => location.pathname.startsWith(n.to))?.label || 'अॅडमिन';

  const handleLogout = () => { logout(); navigate('/login'); };
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`${s.shell} ${collapsed ? s.collapsed : ''} ${mobileOpen ? s.mobileOpen : ''}`}>

      {/* Mobile backdrop */}
      {mobileOpen && <div className={s.backdrop} onClick={closeMobile} />}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={s.sidebar}>

        {/* Brand row */}
        <div className={s.brand}>
          <div className={s.brandIcon}><FaLogo /></div>
          {!collapsed && (
            <div className={s.brandText}>
              <span className={s.brandName}>पूजारी</span>
              <span className={s.brandRole}>{roleLabel} पॅनेल</span>
            </div>
          )}
          <button
            className={s.collapseBtn}
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'उघडा' : 'बंद करा'}
          >
            {collapsed ? <FaAngleRight /> : <FaAngleLeft />}
          </button>
          <button className={s.mobileCloseBtn} onClick={closeMobile} aria-label="बंद करा">
            <FaXmark />
          </button>
        </div>

        {/* User profile card */}
        <div className={s.profileCard}>
          <div className={s.profileAvatar}>{user?.name?.[0]?.toUpperCase() || 'A'}</div>
          {!collapsed && (
            <>
              <div className={s.profileMeta}>
                <span className={s.profileName}>{user?.name || 'अॅडमिन'}</span>
                <span className={s.profileRole}>{roleLabel}</span>
              </div>
              <div className={s.onlineDot} title="ऑनलाइन" />
            </>
          )}
        </div>

        {/* Super admin badge */}
        {isSuperAdmin && !collapsed && (
          <div className={s.roleBadge}>
            <FaShieldHalved /> सुपर अॅडमिन मोड
          </div>
        )}

        {/* Navigation */}
        <nav className={s.nav}>
          {nav.map((item, i) => {
            if (item.section) {
              return collapsed
                ? <div key={i} className={s.sectionDivider} />
                : <div key={i} className={s.sectionLabel}>{item.section}</div>;
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${s.navItem} ${isActive ? s.active : ''} ${item.highlight ? s.navHighlight : ''}`
                }
                title={item.label}
                onClick={closeMobile}
              >
                <span className={s.navIcon}><item.icon /></span>
                {!collapsed && <span className={s.navLabel}>{item.label}</span>}
                {!collapsed && item.highlight && <span className={s.crownBadge}>✦</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer — website link + logout */}
        <div className={s.sidebarFooter}>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className={s.viewSiteBtn}
            title="वेबसाइट पहा"
          >
            <FaArrowUpRightFromSquare />
            {!collapsed && <span>वेबसाइट पहा</span>}
          </a>
          <button className={s.logoutBtn} onClick={handleLogout} title="बाहेर पडा">
            <FaRightFromBracket />
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className={s.main}>
        <div className={s.topbar}>
          <button className={s.hamburger} onClick={() => setMobileOpen(o => !o)} aria-label="मेनू">
            <FaBars />
          </button>
          <h2 className={s.pageTitle}>{currentLabel}</h2>
          <div className={s.topbarRight}>
            <span className={s.topbarUser}>
              <FaUser />{user?.name}
            </span>
          </div>
        </div>
        <div className={s.content}>{children}</div>
      </main>
    </div>
  );
}
