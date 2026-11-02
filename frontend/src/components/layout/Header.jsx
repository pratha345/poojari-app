// src/components/layout/Header.jsx — Single-row clean navbar
import { useState, useEffect, useRef } from 'react';
import Icon3D from '../common/Icon3D';
import { FaHandsPraying, FaFire, FaLaptop, FaBuilding, FaOm, FaWandMagicSparkles, FaCalendarDays, FaBook, FaLocationDot, FaMagnifyingGlass, FaBell, FaCompass } from 'react-icons/fa6';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import T from '../../i18n/translations';
import FestivalBanner from '../common/FestivalBanner';
import NearbyPujarisStrip from '../common/NearbyPujarisStrip';
import { ticketAPI } from '../../api/index.js';
import styles from './Header.module.css';

// Nav factory — rebuilt whenever lang changes
function buildNav(t) {
  return [
    { to: '/', label: t.nav.home },
    {
      label: t.nav.poojaService,
      children: [
        { img: '3d/nav-puja-all', to: '/pooja',            icon: FaHandsPraying, iconBg: 'linear-gradient(135deg,#FF8C00,#E07B2A)', label: t.nav.allPooja,    desc: t.nav.home === 'Home' ? 'Book all types of puja' : 'सर्व प्रकारच्या पूजा बुक करा' },
        { img: '3d/nav-havan', to: '/pooja/havan-jaap', icon: FaFire,         iconBg: 'linear-gradient(135deg,#ef4444,#b91c1c)', label: t.nav.havan,       desc: t.nav.home === 'Home' ? 'Navgraha, Maha Mrityunjay Havan' : 'नवग्रह, महा मृत्युंजय हवन' },
        { img: '3d/nav-online-puja', to: '/online-puja',      icon: FaLaptop,       iconBg: 'linear-gradient(135deg,#3b82f6,#1e40af)', label: t.nav.onlinePuja,  desc: t.nav.home === 'Home' ? 'Puja via video call from anywhere' : 'व्हिडिओ कॉलद्वारे घरबसल्या' },
        { img: '3d/nav-hall-booking', to: '/hall-booking',     icon: FaBuilding,     iconBg: 'linear-gradient(135deg,#10b981,#047857)', label: t.nav.hallBooking, desc: t.nav.home === 'Home' ? 'Halls for weddings & events' : 'लग्न व कार्यक्रमांसाठी हॉल' },
      ],
    },
    {
      label: t.nav.jyotish,
      children: [
        { img: 'tabs/panchang', to: '/panchang', icon: FaOm,                iconBg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', label: t.nav.panchang, desc: t.nav.home === 'Home' ? "Today's Tithi, Nakshatra, Yoga" : 'आजचे तिथी, नक्षत्र, योग' },
        { img: '3d/nav-rashifal', to: '/rashifal', icon: FaWandMagicSparkles, iconBg: 'linear-gradient(135deg,#ec4899,#be185d)', label: t.nav.rashifal,  desc: t.nav.home === 'Home' ? 'Daily horoscope for all signs' : 'मेष ते मीन आजचे भविष्य' },
        { img: '3d/nav-muhurat', to: '/muhurat',  icon: FaCalendarDays,      iconBg: 'linear-gradient(135deg,#D4AF37,#a07810)', label: t.nav.muhurat,   desc: t.nav.home === 'Home' ? 'Auspicious time & Muhurat calendar' : 'शुभ वेळ व मुहूर्त कॅलेंडर' },
        { img: 'tabs/disha', to: '/disha-yantra', icon: FaCompass,       iconBg: 'linear-gradient(135deg,#8a5f1d,#5c3d10)', label: t.nav.disha,     desc: t.nav.home === 'Home' ? 'Compass, today\'s Dishashool, puja direction' : 'कंपास, आजची दिशाशूल, पूजेची दिशा' },
      ],
    },
    { img: '3d/nav-blog', to: '/blog',          icon: FaBook,        iconColor: '#8b5cf6', label: t.nav.blog   },
    { img: '3d/nav-aarti', to: '/aarti',         icon: FaBell,        iconColor: '#E07B2A', label: t.nav.aarti  },
    { to: '/book-pujari',   label: t.nav.bookPujari || 'पुजारी बुक करा', highlight: true },
    { to: '/pujari-nondni', label: t.nav.becomePujari          },
    { img: '3d/nav-cities', to: '/cities',        icon: FaLocationDot, iconColor: '#ef4444', label: t.nav.cities },
    { to: '/contact',       label: t.nav.contact               },
  ];
}

// ── Desktop hover dropdown ────────────────────────────────────
function NavDropdown({ item, pathname, closeAll }) {
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);
  const closeTimer        = useRef(null);
  const isActive          = item.children.some(c => (pathname || '').startsWith(c.to));

  // Cancel any pending close timer
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Schedule close with a small delay so accidental mouse-outs don't flicker
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Clean up timer on unmount
  useEffect(() => () => cancelClose(), []);

  return (
    <div
      ref={ref}
      className={styles.dropGroup}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        className={`${styles.navLink} ${styles.dropTrigger} ${isActive ? styles.active : ''}`}
        onClick={() => { cancelClose(); setOpen(v => !v); }}
        aria-expanded={open}
      >
        {item.label}
        <span className={`${styles.dropArrow} ${open ? styles.dropArrowOpen : ''}`}>▾</span>
      </button>

      {open && (
        <div
          className={styles.megaMenu}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {item.children.map(child => (
            <Link
              key={child.to}
              to={child.to}
              className={`${styles.megaItem} ${pathname.startsWith(child.to) ? styles.megaItemActive : ''}`}
              onClick={() => { setOpen(false); closeAll(); }}
            >
              {child.img ? (
                <span className={`${styles.megaIcon} ${styles.megaIcon3d}`}>
                  <Icon3D name={child.img} size={46} />
                </span>
              ) : (
                <span
                  className={styles.megaIcon}
                  style={child.iconBg ? { background: child.iconBg } : { background: 'rgba(224,123,42,0.12)', color: 'var(--primary)' }}
                >
                  {child.icon && <child.icon />}
                </span>
              )}
              <span>
                <span className={styles.megaLabel}>{child.label}</span>
                {child.desc && <span className={styles.megaDesc}>{child.desc}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Mobile accordion group ────────────────────────────────────
function MobileNavGroup({ item, pathname, closeAll }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.mobileGroup}>
      <button
        className={`${styles.mobileGroupBtn} ${item.children.some(c => (pathname || '').startsWith(c.to)) ? styles.active : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        {item.label}
        <span className={`${styles.dropArrow} ${open ? styles.dropArrowOpen : ''}`}>▾</span>
      </button>
      {open && (
        <div className={styles.mobileSubMenu}>
          {item.children.map(child => (
            <Link
              key={child.to}
              to={child.to}
              className={`${styles.mobileSubLink} ${pathname.startsWith(child.to) ? styles.active : ''}`}
              onClick={() => { setOpen(false); closeAll(); }}
            >
              {child.img ? (
                <span className={`${styles.mobileSubIcon} ${styles.mobileSubIcon3d}`}>
                  <Icon3D name={child.img} size={34} />
                </span>
              ) : child.icon && (
                <span
                  className={styles.mobileSubIcon}
                  style={child.iconBg ? { background: child.iconBg, color: '#fff' } : { background: 'rgba(224,123,42,0.12)', color: 'var(--primary)' }}
                >
                  <child.icon />
                </span>
              )}
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Header ───────────────────────────────────────────────
export default function Header() {
  const { user, isAuthenticated, isAdmin, isPujari, logout } = useAuth();
  const { lang, setLang } = useLang();
  const { theme, festival_name } = useTheme();
  const t   = T[lang] || T['mr']; // 'hi' has no dict — fall back to mr (Google Translate handles it)
  const NAV = buildNav(t);

  // Festival emoji shown in accent strip
  const FESTIVAL_EMOJI = {
    ganpati: '🐘', diwali: '🪔', navratri: '🌸',
    'pitru-paksha': '🕯️', shravan: '🍃',
  };

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [ticketCount,  setTicketCount]  = useState(0);
  const navigate    = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    ticketAPI.getOpenCount()
      .then(r => setTicketCount(r.data.data?.unread || 0))
      .catch(() => {});
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const close = () => setDropdownOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [dropdownOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pooja?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
      setMenuOpen(false);
    }
  };

  const closeAll = () => { setMenuOpen(false); setDropdownOpen(false); };

  return (
    <header className={styles.header}>
      <FestivalBanner />

      {/* ── Single main nav row ─────────────────────────────── */}
      <div className={styles.mainNav}>
        <div className={`container ${styles.navInner}`}>

          {/* Logo — icon only here (not the full icon+wordmark lockup): this nav
              row is already tight with 9 links + search + language + 2 buttons,
              and the wide lockup was pushing लॉगिन off the right edge */}
          <Link to="/" className={styles.logo}>
            <picture>
              <source srcSet="/logo-icon.webp" type="image/webp" />
              <img
                src="/logo-icon.png"
                alt="Poojaris — For All Poojas"
                className={styles.logoImg}
              />
            </picture>
          </Link>

          {/* Desktop Nav Links — CENTER */}
          <nav className={styles.desktopNav} aria-label="मुख्य नेव्हिगेशन">
            {NAV.map(item =>
              item.children ? (
                <div key={item.label} className={styles.desktopOnly}>
                  <NavDropdown item={item} pathname={pathname} closeAll={closeAll} />
                </div>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`${styles.navLink} ${pathname === item.to ? styles.active : ''} ${item.highlight ? styles.navLinkHighlight : ''}`}
                  onClick={closeAll}
                >
                  {item.img ? <Icon3D name={item.img} size={22} className={styles.navIcon3d} /> : item.icon && <item.icon style={{marginRight:5,verticalAlign:'middle',fontSize:'13px',color:item.iconColor||'currentColor'}}/>}{item.label}
                </Link>
              )
            )}
          </nav>

          {/* Right section — search icon + lang + CTA + auth */}
          <div className={styles.rightSection}>

            {/* Search icon */}
            <button
              className={styles.searchIconBtn}
              onClick={() => { setSearchOpen(v => !v); setMenuOpen(false); }}
              aria-label={t.hero.search}
              title={t.hero.search}
            >
              {searchOpen ? '✕' : <FaMagnifyingGlass />}
            </button>

            {/* Festival theme chip — only when festival is active */}
            {FESTIVAL_EMOJI[theme] && (
              <span className={styles.festivalChip} title={festival_name || theme}>
                {FESTIVAL_EMOJI[theme]}
              </span>
            )}

            {/* Language selector dropdown */}
            <select
              className={styles.langDropdown}
              value={lang}
              onChange={e => setLang(e.target.value)}
              title="भाषा निवडा"
            >
              <option value="mr">मराठी</option>
              <option value="hi">हिंदी</option>
              <option value="en">English</option>
            </select>

            {/* Auth area */}
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userBtn}
                  onClick={e => { e.stopPropagation(); setDropdownOpen(v => !v); }}
                >
                  {user.photo_url ? (
                    <img src={user.photo_url} alt={user.name} className={styles.avatarImg} referrerPolicy="no-referrer" />
                  ) : (
                    <span className={styles.avatar}>{user.name?.[0] || '🙏'}</span>
                  )}
                  <span className={styles.userName}>{user.name?.split(' ')[0]}</span>
                  <span className={styles.chevron}>▾</span>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdown} onClick={e => e.stopPropagation()}>
                    {isAdmin  && <Link to="/admin"            onClick={closeAll}>⚙️ {t.nav.admin}</Link>}
                    {isPujari && <Link to="/pujari-dashboard" onClick={closeAll}>🗓️ {t.nav.dashboard}</Link>}
                    <Link to="/my-bookings" onClick={closeAll}>📋 {t.nav.myBookings}</Link>
                    <Link to="/my-tickets" onClick={closeAll} style={{ position: 'relative' }}>
                      🎫 माझे Tickets
                      {ticketCount > 0 && (
                        <span style={{ marginLeft: 6, background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>
                          {ticketCount}
                        </span>
                      )}
                    </Link>
                    <button onClick={() => { logout(); closeAll(); navigate('/'); }}>🚪 {t.nav.logout}</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* "Book Puja" orange CTA pill */}
                <Link to="/pooja" className={styles.bookCta}>
                  🪔 {lang === 'mr' ? 'पूजा बुक करा' : 'Book a Pujari'}
                </Link>
                {/* Login dark pill */}
                <Link to="/login" className={styles.loginPill}>
                  {t.nav.login}
                </Link>
              </>
            )}
          </div>

          {/* Mobile Controls */}
          <div className={styles.mobileControls}>
            <button
              className={styles.searchToggle}
              onClick={() => setSearchOpen(v => !v)}
              aria-label={t.hero.search}
            >
              {searchOpen ? '✕' : <FaMagnifyingGlass />}
            </button>
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'मेनू बंद करा' : 'मेनू उघडा'}
              aria-expanded={menuOpen}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className={`${styles.mobileSearchBar} ${searchOpen ? styles.mobileSearchOpen : ''}`}>
          <div className="container">
            <form className={styles.mobileSearchForm} onSubmit={handleSearch}>
              <input
                type="text"
                placeholder={t.hero.search + '...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label={t.hero.search}
              />
              <button type="submit">{lang === 'mr' ? 'शोध' : 'Search'}</button>
            </form>
          </div>
        </div>

        {/* Theme-aware accent strip */}
        <div className={styles.accentStrip} aria-hidden="true" />
      </div>

      {/* ── Nearby Pujaris Strip (auto GPS) ─────────────────── */}
      <NearbyPujarisStrip />

      {/* ── Mobile Slide-down Menu ───────────────────────────── */}
      <nav className={`${styles.navBar} ${menuOpen ? styles.navOpen : ''}`} aria-label="मोबाईल नेव्हिगेशन">
        <div className={styles.navLinks}>

          {/* Flat links */}
          {NAV.filter(i => !i.children).map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`${styles.mobileNavLink} ${pathname === item.to ? styles.active : ''}`}
              onClick={closeAll}
            >
              {item.label}
            </Link>
          ))}

          {/* Accordion groups */}
          {NAV.filter(i => i.children).map(item => (
            <MobileNavGroup key={item.label} item={item} pathname={pathname} closeAll={closeAll} />
          ))}

          <a href="tel:9561903219" className={styles.phoneLink}>📞 ९५६१९०३२१९</a>

          {/* Mobile language switcher — desktop's .rightSection (which holds the
              only other lang selector) is display:none on mobile, so this is the
              sole way to change language on a phone */}
          <div className={styles.mobileLangRow}>
            <span className={styles.mobileLangLabel}>🌐 भाषा</span>
            <div className={styles.mobileLangBtns}>
              {[['mr','मराठी'],['hi','हिंदी'],['en','English']].map(([code,label]) => (
                <button
                  key={code}
                  className={`${styles.mobileLangBtn} ${lang === code ? styles.mobileLangBtnActive : ''}`}
                  onClick={() => setLang(code)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile auth */}
          <div className={styles.mobileAuthSection}>
            {isAuthenticated ? (
              <>
                <div className={styles.mobileUserCard}>
                  <span className={styles.mobileUserAvatar}>{(user?.name || '?').trim().charAt(0).toUpperCase()}</span>
                  <div className={styles.mobileUserInfo}>
                    <div className={styles.mobileUserName}>{user?.name || 'वापरकर्ता'}</div>
                    <div className={styles.mobileUserRole}>
                      {isAdmin ? 'प्रशासक' : isPujari ? 'पुजारी' : user?.phone || ''}
                    </div>
                  </div>
                </div>
                {isAdmin  && <Link to="/admin"            className={styles.mobileAuthLink} onClick={closeAll}>⚙️ {t.nav.admin}</Link>}
                {isPujari && <Link to="/pujari-dashboard" className={styles.mobileAuthLink} onClick={closeAll}>🗓️ {t.nav.dashboard}</Link>}
                <Link to="/my-bookings" className={styles.mobileAuthLink} onClick={closeAll}>📋 {t.nav.myBookings}</Link>
                <Link to="/my-tickets" className={styles.mobileAuthLink} onClick={closeAll}>
                  🎫 माझे Tickets{ticketCount > 0 && <span style={{ marginLeft: 6, background: '#e53935', color: '#fff', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20 }}>{ticketCount}</span>}
                </Link>
                <button className={styles.mobileAuthLogout} onClick={() => { logout(); closeAll(); navigate('/'); }}>
                  🚪 {t.nav.logout}
                </button>
              </>
            ) : (
              <div className={styles.mobileAuthBtns}>
                <Link to="/login"    className={styles.mobileAuthLogin}    onClick={closeAll}>{t.nav.login}</Link>
                <Link to="/pooja" className={styles.mobileAuthRegister} onClick={closeAll}>{lang === 'mr' ? 'पूजा बुक करा' : 'Book Puja'}</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
