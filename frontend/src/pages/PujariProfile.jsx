// src/pages/PujariProfile.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { pujariAPI } from '../api/index.js';
import styles from './PujariProfile.module.css';

function StarRating({ rating, size = 16 }) {
  return (
    <span className={styles.stars} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = rating >= i;
        const half   = !filled && rating >= i - 0.5;
        return (
          <span key={i} className={filled ? styles.starFull : half ? styles.starHalf : styles.starEmpty}>
            {filled || half ? '★' : '☆'}
          </span>
        );
      })}
    </span>
  );
}

export default function PujariProfile() {
  const { id } = useParams();
  const { state: navState } = useLocation();
  const navigate = useNavigate();
  const [profile,  setProfile]  = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      pujariAPI.getPublicProfile(id),
      pujariAPI.getPublicReviews(id),
    ])
      .then(([pr, rr]) => {
        setProfile(pr.data.data);
        setReviews(rr.data.data || []);
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div><Header /><div className="page-loader"><div className="spinner"/></div><Footer /></div>
  );

  if (notFound || !profile) return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.notFound}>
          <span>🙏</span>
          <h2>पुजारी सापडला नाही</h2>
          <p>हा पुजारी अस्तित्वात नाही किंवा अद्याप मंजूर नाही.</p>
          <Link to="/pooja" className="btn btn-primary">पूजा पहा</Link>
        </div>
      </main>
      <Footer />
    </div>
  );

  const languages     = (() => { try { return JSON.parse(profile.languages || '[]'); } catch { return []; } })();
  const specializations = (profile.specializations || '').split(',').map(s => s.trim()).filter(Boolean);
  const pastPujas     = profile.past_pujas || [];

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">

          {/* ── Hero ─────────────────────────────────────── */}
          <div className={styles.hero}>
            <div className={styles.heroLeft}>
              <div className={styles.avatarWrap}>
                {profile.photo_url
                  ? <img src={profile.photo_url} alt={profile.full_name} className={styles.avatar}/>
                  : <div className={styles.avatarFallback}>{profile.full_name?.[0]}</div>
                }
                <span className={`${styles.availBadge} ${profile.is_available ? styles.availOn : styles.availOff}`}>
                  {profile.is_available ? '● उपलब्ध' : '● अनुपलब्ध'}
                </span>
              </div>

              <div className={styles.heroInfo}>
                <div className={styles.nameLine}>
                  <h1 className={styles.name}>{profile.full_name}</h1>
                  <span className={styles.verifiedBadge}>
                    <span className={styles.verifiedCheck}>✓</span>
                    सत्यापित
                  </span>
                </div>
                <p className={styles.location}>📍 {profile.city}, {profile.district}</p>

                <div className={styles.ratingRow}>
                  <StarRating rating={Number(profile.avg_rating) || 0} size={20}/>
                  <span className={styles.ratingNum}>{Number(profile.avg_rating || 0).toFixed(1)}</span>
                  <span className={styles.ratingCount}>({profile.total_reviews || 0} अभिप्राय)</span>
                </div>

                {specializations.length > 0 && (
                  <div className={styles.tagRow}>
                    {specializations.map(s => (
                      <span key={s} className={styles.specTag}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.heroRight}>
              <div className={styles.statsGrid}>
                <div className={styles.statBox}>
                  <span>{profile.experience_yrs || 0}</span>
                  <small>वर्षे अनुभव</small>
                </div>
                <div className={styles.statBox}>
                  <span>{profile.total_bookings || 0}</span>
                  <small>पूर्ण पूजा</small>
                </div>
                <div className={styles.statBox}>
                  <span>{Number(profile.avg_rating || 0).toFixed(1)}</span>
                  <small>रेटिंग</small>
                </div>
              </div>

              {/* Verified trust card */}
              <div className={styles.verifiedCard}>
                <span className={styles.verifiedShield}>🛡️</span>
                <div>
                  <p className={styles.verifiedCardTitle}>ओळख सत्यापित</p>
                  <p className={styles.verifiedCardSub}>पूजारी प्लॅटफॉर्मद्वारे तपासलेले</p>
                </div>
              </div>

              <button
                className={`btn btn-primary ${styles.bookBtn}`}
                onClick={() => {
                  if (navState?.poojaSlug) {
                    navigate(`/booking/${navState.poojaSlug}`, {
                      state: { pujariId: id, pujariName: profile?.full_name },
                    });
                  } else {
                    navigate('/pooja');
                  }
                }}
              >
                🪔 {navState?.poojaName ? `${navState.poojaName} बुक करा` : 'बुकिंग करा'}
              </button>
            </div>
          </div>

          <div className={styles.body}>
            <div className={styles.leftCol}>

              {/* ── Bio ──────────────────────────────────── */}
              {profile.bio && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>परिचय</h2>
                  <p className={styles.bioText}>{profile.bio}</p>
                </section>
              )}

              {/* ── Languages ────────────────────────────── */}
              {languages.length > 0 && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>🗣️ भाषा</h2>
                  <div className={styles.tagRow}>
                    {languages.map(l => (
                      <span key={l} className={styles.langTag}>{l}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Specializations ──────────────────────── */}
              {specializations.length > 0 && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>🪔 विशेषज्ञता</h2>
                  <div className={styles.tagRow}>
                    {specializations.map(s => (
                      <span key={s} className={styles.specTag}>{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Past Pujas ───────────────────────────── */}
              {pastPujas.length > 0 && (
                <section className={styles.card}>
                  <h2 className={styles.cardTitle}>📋 पूर्ण केलेल्या पूजा</h2>
                  <div className={styles.pastList}>
                    {pastPujas.map((p, i) => (
                      <div key={i} className={styles.pastItem}>
                        <span className={styles.pastIcon}>🪔</span>
                        <span className={styles.pastName}>{p.pooja_name}</span>
                        <span className={styles.pastDate}>
                          {new Date(p.booking_date).toLocaleDateString('mr-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className={styles.rightCol}>
              {/* ── Reviews ──────────────────────────────── */}
              <section className={styles.card}>
                <h2 className={styles.cardTitle}>
                  ⭐ अभिप्राय
                  {reviews.length > 0 && <span className={styles.reviewCount}>{reviews.length}</span>}
                </h2>

                {reviews.length === 0 ? (
                  <p className={styles.noReviews}>अद्याप कोणताही अभिप्राय नाही.</p>
                ) : (
                  <div className={styles.reviewList}>
                    {reviews.map(r => (
                      <div key={r.id} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewerAvatar}>{r.user_name?.[0] || 'U'}</div>
                          <div>
                            <div className={styles.reviewerName}>{r.user_name}</div>
                            <div className={styles.reviewMeta}>
                              <StarRating rating={r.rating} size={13}/>
                              <span className={styles.reviewDate}>
                                {new Date(r.created_at).toLocaleDateString('mr-IN')}
                              </span>
                            </div>
                          </div>
                          <span className={styles.reviewPooja}>{r.pooja_name}</span>
                        </div>
                        {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
