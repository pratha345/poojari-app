// src/components/layout/Header.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FestivalBanner from '../common/FestivalBanner';
import styles from './Header.module.css';

export default function Header() {
  const { user, isAuthenticated, isAdmin, isPujari, logout } = useAuth();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate   = useNavigate();
  const { pathname } = useLocation();

  // Close everything when route changes
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
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

  const closeAll = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const navLinks = [
    { to: '/',              label: 'मुख्यपृष्ठ'   },
    { to: '/pooja',         label: 'पूजा बुक करा'  },
    { to: '/panchang',      label: '🕉️ पंचांग'     },
    { to: '/hall-booking',  label: 'हॉल बुकिंग'    },
    { to: '/pujari-nondni', label: 'पुजारी व्हा'   },
    { to: '/contact',       label: 'संपर्क'         },
    { to: '/about',         label: 'आमच्याबद्दल'   },
  ];

  return (
    <header className={styles.header}>
      <FestivalBanner />

      {/* ── Top Info Bar ─────────────────────────────────────── */}
      <div className={styles.topBar}>
        <div className="container">
          <span className={styles.topTagline}>🙏 पूजारी - घरी पूजा, मनासारखी</span>
          <a href="tel:9561903219" className={styles.topPhone}>📞 ९५६१९०३२१९</a>
        </div>
      </div>

      {/* ── Main Nav Row ─────────────────────────────────────── */}
      <div className={styles.mainNav}>
        <div className={`container ${styles.navInner}`}>

          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>🪔</span>
            <span className={styles.logoText}>
              <span className={styles.logoMain}>पूजारी</span>
              <span className={styles.logoSub}>घरी पूजा, मनासारखी</span>
            </span>
          </Link>

          {/* Desktop Search */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="पूजा शोधा... (उदा: सत्यनारायण, गृहप्रवेश)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="पूजा शोधा"
            />
            <button type="submit" aria-label="शोध">🔍</button>
          </form>

          {/* Desktop Auth */}
          <div className={styles.authArea}>
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userBtn}
                  onClick={e => { e.stopPropagation(); setDropdownOpen(v => !v); }}
                >
                  <span className={styles.avatar}>{user.name?.[0] || '🙏'}</span>
                  <span className={styles.userName}>{user.name?.split(' ')[0]}</span>
                  <span className={styles.chevron}>▾</span>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdown} onClick={e => e.stopPropagation()}>
                    {isAdmin  && <Link to="/admin"            onClick={closeAll}>⚙️ प्रशासन</Link>}
                    {isPujari && <Link to="/pujari-dashboard" onClick={closeAll}>🗓️ माझा डॅशबोर्ड</Link>}
                    <Link to="/my-bookings" onClick={closeAll}>📋 माझ्या बुकिंग्ज</Link>
                    <button onClick={() => { logout(); closeAll(); navigate('/'); }}>🚪 बाहेर पडा</button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login"    className="btn btn-secondary btn-sm">लॉगिन</Link>
                <Link to="/register" className="btn btn-primary   btn-sm">नोंदणी</Link>
              </div>
            )}
          </div>

          {/* Mobile Controls: search icon + animated hamburger */}
          <div className={styles.mobileControls}>
            <button
              className={styles.searchToggle}
              onClick={() => setSearchOpen(v => !v)}
              aria-label="शोध करा"
            >
              {searchOpen ? '✕' : '🔍'}
            </button>
            <button
              className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'मेनू बंद करा' : 'मेनू उघडा'}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar — slides in */}
        <div className={`${styles.mobileSearchBar} ${searchOpen ? styles.mobileSearchOpen : ''}`}>
          <div className="container">
            <form className={styles.mobileSearchForm} onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="पूजा शोधा..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="पूजा शोधा"
              />
              <button type="submit">शोध</button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Nav Links Bar ────────────────────────────────────── */}
      <nav className={`${styles.navBar} ${menuOpen ? styles.navOpen : ''}`}>
        <div className={`container ${styles.navLinks}`}>

          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${pathname === link.to ? styles.active : ''}`}
              onClick={closeAll}
            >
              {link.label}
            </Link>
          ))}

          <a href="tel:9561903219" className={styles.phoneLink}>📞 ९५६१९०३२१९</a>

          {/* Mobile-only auth links injected into open menu */}
          <div className={styles.mobileAuthSection}>
            {isAuthenticated ? (
              <>
                {isAdmin  && <Link to="/admin"            className={styles.mobileAuthLink} onClick={closeAll}>⚙️ प्रशासन</Link>}
                {isPujari && <Link to="/pujari-dashboard" className={styles.mobileAuthLink} onClick={closeAll}>🗓️ माझा डॅशबोर्ड</Link>}
                <Link to="/my-bookings" className={styles.mobileAuthLink} onClick={closeAll}>📋 माझ्या बुकिंग्ज</Link>
                <button
                  className={styles.mobileAuthLogout}
                  onClick={() => { logout(); closeAll(); navigate('/'); }}
                >
                  🚪 बाहेर पडा
                </button>
              </>
            ) : (
              <div className={styles.mobileAuthBtns}>
                <Link to="/login"    className={styles.mobileAuthLogin}    onClick={closeAll}>लॉगिन</Link>
                <Link to="/register" className={styles.mobileAuthRegister} onClick={closeAll}>नोंदणी</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
