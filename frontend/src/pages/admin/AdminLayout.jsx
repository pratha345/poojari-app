// src/pages/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
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
  FaArrowUpRightFromSquare, FaOm, FaBars, FaXmark, FaBookOpen,
  FaStar,
} from 'react-icons/fa6';
import { FaHandsPraying as FaLogo } from 'react-icons/fa6';
import { tenantConfigAPI } from '../../api/index.js';

// Nav with optional `feature` key — items with feature key are shown/hidden
// based on tenant feature flags fetched from /api/tenant-config/features
const NAV_ADMIN = [
  { section: 'आढावा' },
  { to: '/admin/report',        icon: FaChartColumn,  label: 'अहवाल'            },

  { section: 'पुजारी' },
  { to: '/admin/pujaris',        icon: FaUserCheck,    label: 'पुजारी व्यवस्थापन', feature: 'pujariBookings' },
  { to: '/admin/bookings',       icon: FaCalendarCheck,label: 'बुकिंग्ज',           feature: 'pujariBookings' },
  { to: '/admin/consultations',  icon: FaStar,         label: '🔮 सल्लामसलत',      feature: 'consultations'  },

  { section: 'सेवा' },
  { to: '/admin/poojas',   icon: FaHandsPraying, label: 'पूजा व्यवस्थापन', feature: 'poojaManagement' },
  { to: '/admin/halls',    icon: FaBuilding,     label: 'हॉल व्यवस्थापन',  feature: 'halls'           },
  { to: '/admin/samagri',  icon: FaBoxOpen,      label: 'साहित्य यादी',    feature: 'poojaManagement' },

  { section: 'Franchise Config' },
  { to: '/admin/tenant/puja-config',    icon: FaHandsPraying, label: '🏷️ पूजा किंमत',   feature: 'franchiseConfig' },
  { to: '/admin/tenant/samagri-config', icon: FaBoxOpen,      label: '🛒 माझी साहित्य',  feature: 'franchiseConfig' },
  { to: '/admin/tenant/pujaris',        icon: FaUsers,        label: '👨‍⚕️ माझे पुजारी',   feature: 'franchiseConfig' },

  { section: 'वेबसाइट' },
  { to: '/admin/home',          icon: FaHouseChimney, label: 'मुखपृष्ठ',         feature: 'websiteHome' },
  { to: '/admin/theme',         icon: FaPalette,      label: 'थीम सेटिंग्ज',    feature: 'theme'       },
  { to: '/admin/kundali-milan', icon: FaInfinity,     label: 'कुंडली मिलान',    feature: 'kundali'     },
  { to: '/admin/janam-patrika', icon: FaScroll,       label: 'जन्म पत्रिका',    feature: 'kundali'     },
  { to: '/admin/blog',          icon: FaNewspaper,    label: 'ब्लॉग',            feature: 'blog'        },

  { section: 'धर्मग्रंथ' },
  { to: '/admin/dharmasindhu',   icon: FaOm,       label: 'धर्मसिंधु शंका', feature: 'dharmasindhu' },
  { to: '/admin/granth-library', icon: FaBookOpen, label: 'ग्रंथ संग्रह',   feature: 'granth'       },

  { section: 'टीम' },
  { to: '/admin/abhyasak', icon: FaGraduationCap, label: 'अभ्यासक',         feature: 'teamSection' },
  { to: '/admin/reviews',  icon: FaComments,      label: 'अभिप्राय',        feature: 'teamSection' },
  { to: '/admin/tickets',  icon: FaTicket,        label: 'Support Tickets', feature: 'teamSection' },

  { to: '/admin/upgrade-plan', icon: FaCrown, label: 'योजना सुधारणा', highlight: true },
];

const NAV_ABHYASAK = [
  { to: '/admin/blog', icon: FaNewspaper, label: 'ब्लॉग लिहा' },
];

// Super admin sees everything — includes tenant management + all franchise features
const NAV_SUPER = [
  { section: 'Super Admin' },
  { to: '/admin/report',       icon: FaChartColumn, label: 'अहवाल'          },
  { to: '/superadmin/tenants', icon: FaBuilding,  label: 'टेनंट्स'         },
  { to: '/superadmin/users',   icon: FaUsers,     label: 'सर्व वापरकर्ते'  },
  { to: '/superadmin/revenue', icon: FaChartPie,  label: 'महसूल'           },

  { section: 'पुजारी' },
  { to: '/admin/pujaris',        icon: FaUserCheck,    label: 'पुजारी व्यवस्थापन' },
  { to: '/admin/bookings',       icon: FaCalendarCheck,label: 'बुकिंग्ज'          },
  { to: '/admin/consultations',  icon: FaStar,         label: '🔮 सल्लामसलत'     },

  { section: 'सेवा' },
  { to: '/admin/poojas',              icon: FaHandsPraying, label: 'पूजा व्यवस्थापन'    },
  { to: '/admin/halls',               icon: FaBuilding,     label: 'हॉल व्यवस्थापन'     },
  { to: '/admin/samagri',             icon: FaBoxOpen,      label: 'साहित्य यादी'       },

  { section: 'Franchise Config' },
  { to: '/admin/tenant/puja-config',    icon: FaHandsPraying, label: '🏷️ पूजा किंमत'   },
  { to: '/admin/tenant/samagri-config', icon: FaBoxOpen,      label: '🛒 माझी साहित्य' },
  { to: '/admin/tenant/pujaris',        icon: FaUsers,        label: '👨‍⚕️ माझे पुजारी'  },

  { section: 'वेबसाइट' },
  { to: '/admin/home',          icon: FaHouseChimney, label: 'मुखपृष्ठ'      },
  { to: '/admin/theme',         icon: FaPalette,      label: 'थीम सेटिंग्ज' },
  { to: '/admin/kundali-milan', icon: FaInfinity,     label: 'कुंडली मिलान' },
  { to: '/admin/janam-patrika', icon: FaScroll,       label: 'जन्म पत्रिका' },
  { to: '/admin/blog',          icon: FaNewspaper,    label: 'ब्लॉग'         },

  { section: 'धर्मग्रंथ' },
  { to: '/admin/dharmasindhu',   icon: FaOm,       label: 'धर्मसिंधु शंका' },
  { to: '/admin/granth-library', icon: FaBookOpen, label: 'ग्रंथ संग्रह'   },

  { section: 'टीम' },
  { to: '/admin/abhyasak',      icon: FaGraduationCap, label: 'अभ्यासक'         },
  { to: '/admin/reviews',       icon: FaComments,      label: 'अभिप्राय'        },
  { to: '/admin/tickets',       icon: FaTicket,        label: 'Support Tickets' },
];

export default function AdminLayout({ children }) {
  const { user, isSuperAdmin, isAbhyasak, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [features, setFeatures] = useState(null); // null = loading

  useEffect(() => {
    if (user && (user.role === 'admin' || isSuperAdmin)) {
      tenantConfigAPI.getFeatures()
        .then(r => setFeatures(r.data.data || {}))
        .catch(() => setFeatures({}));
    }
  }, [user]);

  const isVisible = (item) => {
    if (!item.feature) return true;
    if (isSuperAdmin) return true;
    if (features === null) return false; // hide while loading
    return features[item.feature] === true;
  };

  const rawNav = isSuperAdmin ? NAV_SUPER : isAbhyasak ? NAV_ABHYASAK : NAV_ADMIN;

  // Filter nav: remove feature-hidden items, then strip orphan section headers
  const nav = (() => {
    const filtered = rawNav.filter(item => item.section || isVisible(item));
    return filtered.filter((item, i) => {
      if (!item.section) return true;
      const next = filtered[i + 1];
      return next && !next.section;
    });
  })();

  const roleLabel = isSuperAdmin ? 'Super Admin' : isAbhyasak ? 'अभ्यासक' : 'Admin';
  const currentLabel = nav.filter(n => n.to).find(n => location.pathname.startsWith(n.to))?.label || 'Admin';

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
                <span className={s.profileName}>{user?.name || 'Admin'}</span>
                <span className={s.profileRole}>{roleLabel}</span>
              </div>
              <div className={s.onlineDot} title="ऑनलाइन" />
            </>
          )}
        </div>

        {/* Super admin badge */}
        {isSuperAdmin && !collapsed && (
          <div className={s.roleBadge}>
            <FaShieldHalved /> Super Admin मोड
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
