// src/pages/admin/ManageBookings.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { adminAPI } from '../../api/index.js';
import styles from './Admin.module.css';

const STATUS_LABELS = {
  pending:   { label: 'प्रतीक्षेत', color: 'warning' },
  confirmed: { label: 'पुष्टी',     color: 'success' },
  completed: { label: 'पूर्ण',      color: 'info'    },
  cancelled: { label: 'रद्द',       color: 'danger'  },
};

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    adminAPI.getAllBookings(params)
      .then(r => setBookings(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <Link to="/admin" className={styles.backLink}>← प्रशासन</Link>
            <h1 className={styles.pageTitle}>📋 बुकिंग व्यवस्थापन</h1>
          </div>

          <div className={styles.filters}>
            {[
              { key: 'pending',   label: '⏳ प्रतीक्षेत' },
              { key: 'confirmed', label: '✅ पुष्टी'      },
              { key: 'completed', label: '🪔 पूर्ण'       },
              { key: 'all',       label: 'सर्व'            },
            ].map(f => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
                onClick={() => setFilter(f.key)}
              >{f.label}</button>
            ))}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner"/></div>
          ) : bookings.length === 0 ? (
            <div className={styles.empty}><span>📭</span><p>कोणतीही बुकिंग नाही.</p></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>कोड</th><th>पूजा</th><th>वापरकर्ता</th>
                    <th>तारीख</th><th>रक्कम</th><th>स्थिती</th><th>पुजारी</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const st = STATUS_LABELS[b.status] || { label: b.status, color: 'info' };
                    return (
                      <tr key={b.id}>
                        <td><code>#{b.booking_code}</code></td>
                        <td>{b.pooja_name}</td>
                        <td>{b.user_name}<br/><small>{b.user_phone}</small></td>
                        <td>{new Date(b.booking_date).toLocaleDateString('mr-IN')}</td>
                        <td>₹{Number(b.total_amount).toLocaleString('mr-IN')}</td>
                        <td><span className={`badge badge-${st.color}`}>{st.label}</span></td>
                        <td>{b.pujari_name || <em className={styles.noPujari}>नियुक्त नाही</em>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
