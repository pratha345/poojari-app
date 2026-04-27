// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { adminAPI } from '../../api/index.js';
import styles from './Admin.module.css';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: '👤', label: 'एकूण वापरकर्ते',     val: stats.users,            color: '#1565C0' },
    { icon: '🧑‍🦳', label: 'मंजूर पुजारी',    val: stats.pujaris,          color: '#2E7D32' },
    { icon: '⏳', label: 'प्रलंबित नोंदणी',     val: stats.pending_pujaris,  color: '#F57F17' },
    { icon: '📋', label: 'एकूण बुकिंग्ज',       val: stats.bookings,         color: '#6A1B9A' },
    { icon: '💰', label: 'एकूण महसूल (₹)',      val: Number(stats.revenue||0).toLocaleString('mr-IN'), color: '#E07B2A' },
  ] : [];

  const quickLinks = [
    { to: '/admin/pujaris',        label: '🧑‍🦳 पुजारी व्यवस्थापन', desc: 'नोंदणी मंजुरी, प्रोफाईल पहा' },
    { to: '/admin/bookings',       label: '📋 बुकिंग व्यवस्थापन',   desc: 'सर्व बुकिंग्ज, पुजारी नियुक्त करा' },
    { to: '/admin/poojas',         label: '🪔 पूजा व्यवस्थापन',     desc: 'पूजा जोडा, संपादित करा' },
    { to: '/admin/kundali-milan',  label: '🔯 कुंडली मिलान',         desc: 'अष्ट कूट गुण मिलान, कुंडली जुळणी' },
    { to: '/admin/home',           label: '🏠 होमपेज संपादक',         desc: 'हिरो, स्लाइडर, मजकूर बदला' },
  ];

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>⚙️ प्रशासन पॅनेल</h1>
            <span className={styles.adminBadge}>Admin</span>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner"/></div>
          ) : (
            <>
              {/* Stats */}
              <div className={styles.statsGrid}>
                {statCards.map(s => (
                  <div key={s.label} className={styles.statCard} style={{ borderTopColor: s.color }}>
                    <span className={styles.statIcon}>{s.icon}</span>
                    <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Quick Links */}
              <div className={styles.quickLinks}>
                <h2 className={styles.sectionTitle}>द्रुत लिंक</h2>
                <div className="grid-3">
                  {quickLinks.map(l => (
                    <Link key={l.to} to={l.to} className={styles.quickCard}>
                      <span className={styles.quickLabel}>{l.label}</span>
                      <span className={styles.quickDesc}>{l.desc}</span>
                      <span className={styles.quickArrow}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
