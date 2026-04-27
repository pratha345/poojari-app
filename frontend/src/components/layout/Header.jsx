// src/components/layout/Header.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const { user, isAuthenticated, isAdmin, isPujari, logout } = useAuth();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pooja?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/',               label: 'मुख्यपृष्ठ'   },
    { to: '/pooja',          label: 'पूजा बुक करा'  },
    { to: '/panchang',       label: '🕉️ पंचांग'     },
    { to: '/pujari-nondni',  label: 'पुजारी व्हा'   },
    { to: '/contact',        label: 'संपर्क'         },
    { to: '/about',          label: 'आमच्याबद्दल'   },
  ];

  return (
    <header className={styles.header}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className="container">
          <span>🙏 पूजारी - घरी पूजा, मनासारखी</span>
          <a href="tel:9561903219">📞 ९५६१९०३२१९</a>
        </div>
      </div>

      {/* Main nav */}
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

          {/* Search */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="पूजा शोधा... (उदा: सत्यनारायण, गृहप्रवेश)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit">🔍</button>
          </form>

          {/* Desktop Auth */}
          <div className={styles.authArea}>
            {isAuthenticated ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userBtn}
                  onClick={() => setDropdownOpen(v => !v)}
                >
                  <span className={styles.avatar}>{user.name?.[0] || '🙏'}</span>
                  <span>{user.name?.split(' ')[0]}</span>
                  <span>▾</span>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdown}>
                    {isAdmin && <Link to="/admin" onClick={() => setDropdownOpen(false)}>⚙️ प्रशासन</Link>}
                    {isPujari && <Link to="/pujari-dashboard" onClick={() => setDropdownOpen(false)}>🗓️ माझा डॅशबोर्ड</Link>}
                    <Link to="/my-bookings" onClick={() => setDropdownOpen(false)}>📋 माझ्या बुकिंग्ज</Link>
                    <button onClick={() => { logout(); setDropdownOpen(false); navigate('/'); }}>🚪 बाहेर पडा</button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login"    className="btn btn-secondary btn-sm">लॉगिन</Link>
                <Link to="/register" className="btn btn-primary btn-sm">नोंदणी</Link>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button className={styles.hamburger} onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Nav links bar */}
      <nav className={`${styles.navBar} ${menuOpen ? styles.navOpen : ''}`}>
        <div className={`container ${styles.navLinks}`}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${pathname === link.to ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a href="tel:9561903219" className={styles.phoneLink}>📞 ९५६१९०३२१९</a>
        </div>
      </nav>
    </header>
  );
}
