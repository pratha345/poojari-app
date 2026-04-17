// src/pages/BookingHistory.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { bookingAPI } from '../api/index.js';
import styles from './BookingHistory.module.css';

const STATUS_LABELS = {
  pending:     { label: 'प्रतीक्षेत',    color: 'warning' },
  confirmed:   { label: 'पुष्टी झाली',   color: 'success' },
  in_progress: { label: 'सुरू आहे',      color: 'info'    },
  completed:   { label: 'पूर्ण झाली',    color: 'success' },
  cancelled:   { label: 'रद्द झाली',     color: 'danger'  },
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [reviewModal, setReviewModal] = useState(null);
  const [review,  setReview]  = useState({ rating: 5, comment: '' });

  const loadBookings = () => {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    bookingAPI.getMyBookings(params)
      .then(r => setBookings(r.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadBookings(); }, [filter]);

  const handleCancel = async (id) => {
    if (!window.confirm('बुकिंग रद्द करायची का?')) return;
    try {
      await bookingAPI.cancel(id, 'वापरकर्त्याने रद्द केली');
      toast.success('बुकिंग रद्द केली.');
      loadBookings();
    } catch { toast.error('रद्द करताना त्रुटी झाली.'); }
  };

  const handleReview = async () => {
    try {
      await bookingAPI.submitReview({ booking_id: reviewModal.id, ...review });
      toast.success('अभिप्राय पाठवला. धन्यवाद! 🙏');
      setReviewModal(null);
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'अभिप्राय पाठवताना त्रुटी झाली.');
    }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>📋 माझ्या बुकिंग्ज</h1>
            <Link to="/pooja" className="btn btn-primary">+ नवीन बुकिंग</Link>
          </div>

          {/* Filter tabs */}
          <div className={styles.filters}>
            {[
              { key: 'all',       label: 'सर्व'          },
              { key: 'pending',   label: '⏳ प्रतीक्षेत' },
              { key: 'confirmed', label: '✅ पुष्टी'      },
              { key: 'completed', label: '🪔 पूर्ण'       },
              { key: 'cancelled', label: '❌ रद्द'        },
            ].map(f => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner"/><p>लोड होत आहे...</p></div>
          ) : bookings.length === 0 ? (
            <div className={styles.empty}>
              <span>📭</span>
              <h3>कोणतीही बुकिंग सापडली नाही</h3>
              <Link to="/pooja" className="btn btn-primary">पूजा बुक करा</Link>
            </div>
          ) : (
            <div className={styles.list}>
              {bookings.map(b => {
                const st = STATUS_LABELS[b.status] || { label: b.status, color: 'info' };
                return (
                  <div key={b.id} className={styles.card}>
                    <div className={styles.cardLeft}>
                      {b.pooja_image && (
                        <img src={b.pooja_image} alt={b.pooja_name} className={styles.poojaImg}/>
                      )}
                      <div className={styles.cardInfo}>
                        <div className={styles.cardCode}>#{b.booking_code}</div>
                        <h3 className={styles.poojaName}>{b.pooja_name}</h3>
                        <div className={styles.cardMeta}>
                          <span>📅 {new Date(b.booking_date).toLocaleDateString('mr-IN')}</span>
                          <span>🕐 {b.booking_time?.slice(0,5)}</span>
                          <span>📍 {b.city}</span>
                        </div>
                        {b.pujari_name && (
                          <div className={styles.pujariInfo}>
                            🧑‍🦳 पुजारी: <strong>{b.pujari_name}</strong>
                            {b.pujari_phone && <span> • {b.pujari_phone}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={styles.cardRight}>
                      <span className={`badge badge-${st.color}`}>{st.label}</span>
                      <div className={styles.amount}>
                        ₹{Number(b.total_amount).toLocaleString('mr-IN')}
                      </div>
                      <div className={styles.actions}>
                        {['pending','confirmed'].includes(b.status) && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(b.id)}>
                            रद्द करा
                          </button>
                        )}
                        {b.status === 'completed' && !b.has_review && (
                          <button className="btn btn-primary btn-sm" onClick={() => setReviewModal(b)}>
                            ⭐ अभिप्राय द्या
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {reviewModal && (
        <div className={styles.modalOverlay} onClick={() => setReviewModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2>⭐ अभिप्राय द्या</h2>
            <p className={styles.modalSubtitle}>{reviewModal.pooja_name}</p>
            <div className={styles.ratingRow}>
              {[1,2,3,4,5].map(n => (
                <button
                  key={n}
                  className={`${styles.starBtn} ${review.rating >= n ? styles.starActive : ''}`}
                  onClick={() => setReview(r => ({...r, rating: n}))}
                >⭐</button>
              ))}
            </div>
            <div className="form-group" style={{marginTop:'16px'}}>
              <label>आपला अभिप्राय</label>
              <textarea
                className="form-control" rows={4}
                placeholder="पूजा कशी झाली? पुजारी कसे होते?"
                value={review.comment}
                onChange={e => setReview(r => ({...r, comment: e.target.value}))}
              />
            </div>
            <div className={styles.modalActions}>
              <button className="btn btn-secondary" onClick={() => setReviewModal(null)}>रद्द करा</button>
              <button className="btn btn-primary" onClick={handleReview}>पाठवा 🙏</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
