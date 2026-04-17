// src/pages/admin/ManagePujaris.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { adminAPI } from '../../api/index.js';
import styles from './Admin.module.css';

export default function ManagePujaris() {
  const [pujaris, setPujaris] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminAPI.getPendingPujaris()
      .then(r => setPujaris(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action, reason = '') => {
    try {
      await adminAPI.respondPujari(id, { action, reason });
      toast.success(action === 'approve' ? 'पुजारी मंजूर केला! ✅' : 'पुजारी नाकारला.');
      load();
    } catch { toast.error('त्रुटी झाली.'); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <Link to="/admin" className={styles.backLink}>← प्रशासन</Link>
            <h1 className={styles.pageTitle}>🧑‍🦳 पुजारी व्यवस्थापन</h1>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner"/></div>
          ) : pujaris.length === 0 ? (
            <div className={styles.empty}>
              <span>✅</span>
              <p>कोणतीही प्रलंबित नोंदणी नाही.</p>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>नाव</th><th>फोन</th><th>शहर</th>
                    <th>अनुभव</th><th>नोंदणी तारीख</th><th>कृती</th>
                  </tr>
                </thead>
                <tbody>
                  {pujaris.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.full_name}</strong></td>
                      <td>{p.phone}</td>
                      <td>{p.city}, {p.district}</td>
                      <td>{p.experience_yrs} वर्षे</td>
                      <td>{new Date(p.created_at).toLocaleDateString('mr-IN')}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAction(p.id, 'approve')}>✅ मंजूर</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleAction(p.id, 'reject', 'पात्रता नाही')}>❌ नाकार</button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
