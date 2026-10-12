// src/pages/PujariDashboard.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { pujariAPI } from '../api/index.js';
import styles from './PujariDashboard.module.css';

const STATUS_LABELS = {
  pending:     { label: 'नवीन',      color: 'warning' },
  confirmed:   { label: 'मंजूर',     color: 'success' },
  completed:   { label: 'पूर्ण',     color: 'info'    },
  cancelled:   { label: 'रद्द',      color: 'danger'  },
  in_progress: { label: 'सुरू आहे',  color: 'warning' },
};

export default function PujariDashboard() {
  const [profile,      setProfile]      = useState(null);
  const [bookings,     setBookings]     = useState([]);
  const [waRequests,   setWaRequests]   = useState([]);
  const [tab,          setTab]          = useState('bookings');
  const [filter,       setFilter]       = useState('pending');
  const [loading,      setLoading]      = useState(true);
  const [waLoading,    setWaLoading]    = useState(false);
  const [accepting,    setAccepting]    = useState(null);

  useEffect(() => {
    pujariAPI.getMyProfile()
      .then(r => setProfile(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = filter !== 'all' ? { status: filter } : {};
    pujariAPI.getMyBookings(params)
      .then(r => setBookings(r.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const loadWaRequests = () => {
    setWaLoading(true);
    pujariAPI.getWhatsappRequests()
      .then(r => setWaRequests(r.data.data || []))
      .catch(() => setWaRequests([]))
      .finally(() => setWaLoading(false));
  };

  useEffect(() => {
    if (tab === 'whatsapp') loadWaRequests();
  }, [tab]);

  const handleRespond = async (id, action, reason = '') => {
    try {
      await pujariAPI.respondBooking(id, { action, reason });
      toast.success(action === 'confirm' ? 'बुकिंग स्वीकारली! 🙏' : 'बुकिंग नाकारली.');
      setBookings(bs => bs.filter(b => b.id !== id));
    } catch { toast.error('प्रतिसाद देताना त्रुटी झाली.'); }
  };

  const handleAcceptWA = async (id) => {
    setAccepting(id);
    try {
      await pujariAPI.acceptWhatsappBooking(id);
      toast.success('WhatsApp बुकिंग स्वीकारली! 🙏');
      setWaRequests(rs => rs.filter(r => r.id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'स्वीकारताना त्रुटी झाली.');
    } finally { setAccepting(null); }
  };

  const statusIcon = (status) => ({
    approved: '✅', pending: '⏳', rejected: '❌'
  })[status] || '🔄';

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          {/* Profile Header */}
          {profile && (
            <div className={styles.profileBanner}>
              <div className={styles.profileLeft}>
                <div className={styles.avatar}>
                  {profile.photo_url
                    ? <img src={profile.photo_url} alt={profile.full_name}/>
                    : <span>{profile.full_name?.[0]}</span>
                  }
                </div>
                <div>
                  <h1 className={styles.profileName}>{profile.full_name}</h1>
                  <p className={styles.profileMeta}>
                    📍 {profile.city}, {profile.district} &nbsp;•&nbsp;
                    ⭐ {profile.avg_rating || '0'} ({profile.total_reviews || 0} अभिप्राय) &nbsp;•&nbsp;
                    🪔 {profile.total_bookings || 0} बुकिंग्ज
                  </p>
                  <span className={`badge badge-${profile.status === 'approved' ? 'success' : profile.status === 'pending' ? 'warning' : 'danger'}`}>
                    {statusIcon(profile.status)}&nbsp;
                    {profile.status === 'approved' ? 'मंजूर' : profile.status === 'pending' ? 'मंजूरीसाठी प्रतीक्षा' : 'नाकारले'}
                  </span>
                </div>
              </div>
              <div className={styles.profileStats}>
                <div className={styles.stat}><span>{profile.experience_yrs || 0}</span><small>वर्षे अनुभव</small></div>
                <div className={styles.stat}><span>{profile.total_bookings || 0}</span><small>एकूण बुकिंग</small></div>
                <div className={styles.stat}><span>{profile.avg_rating || '—'}</span><small>सरासरी रेटिंग</small></div>
              </div>
            </div>
          )}

          {profile?.status !== 'approved' && (
            <div className={styles.pendingAlert}>
              ⏳ आपली नोंदणी मंजूरीसाठी प्रतीक्षेत आहे. मंजूरीनंतर बुकिंग मिळण्यास सुरुवात होईल.
            </div>
          )}

          {/* Tabs */}
          <div className={styles.tabs}>
            {[
              { key: 'bookings',     label: '📋 बुकिंग्ज'          },
              ...(profile?.whatsapp_enabled ? [{ key: 'whatsapp', label: '📱 WhatsApp विनंती' }] : []),
              { key: 'services',     label: '🪔 माझ्या पूजा'       },
              { key: 'availability', label: '🗓️ उपलब्धता'         },
              { key: 'profile',      label: '👤 प्रोफाईल'           },
            ].map(t => (
              <button
                key={t.key}
                className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* BOOKINGS TAB */}
          {tab === 'bookings' && (
            <div>
              <div className={styles.filters}>
                {[
                  { key: 'pending',   label: '⏳ नवीन'    },
                  { key: 'confirmed', label: '✅ मंजूर'   },
                  { key: 'completed', label: '🪔 पूर्ण'   },
                  { key: 'all',       label: 'सर्व'        },
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
                <div className="page-loader"><div className="spinner"/></div>
              ) : bookings.length === 0 ? (
                <div className={styles.empty}>
                  <span>📭</span>
                  <p>{filter === 'pending' ? 'कोणतीही नवीन बुकिंग नाही.' : 'कोणतीही बुकिंग सापडली नाही.'}</p>
                </div>
              ) : (
                <div className={styles.bookingList}>
                  {bookings.map(b => {
                    const st = STATUS_LABELS[b.status] || { label: b.status, color: 'info' };
                    return (
                      <div key={b.id} className={styles.bookingCard}>
                        <div className={styles.bookingHeader}>
                          <span className={`badge badge-${st.color}`}>{st.label}</span>
                          <span className={styles.bookingCode}>#{b.booking_code}</span>
                        </div>
                        <h3 className={styles.poojaName}>{b.pooja_name}</h3>
                        <div className={styles.bookingMeta}>
                          <span>👤 {b.user_name}</span>
                          <span>📞 {b.user_phone}</span>
                          <span>📅 {new Date(b.booking_date).toLocaleDateString('mr-IN')}</span>
                          <span>🕐 {b.booking_time?.slice(0,5)}</span>
                        </div>
                        <div className={styles.bookingAddress}>
                          📍 {b.address}
                        </div>
                        <div className={styles.bookingFooter}>
                          <span className={styles.bookingAmt}>
                            ₹{Number(b.total_amount).toLocaleString('mr-IN')}
                          </span>
                          {b.status === 'pending' && (
                            <div className={styles.respondBtns}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleRespond(b.id, 'confirm')}
                              >✅ स्वीकारा</button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleRespond(b.id, 'cancel', 'उपलब्ध नाही')}
                              >❌ नाकारा</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* WHATSAPP TAB */}
          {tab === 'whatsapp' && profile?.whatsapp_enabled && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontWeight: 700, fontSize: 18 }}>📱 WhatsApp बुकिंग विनंती</h2>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={loadWaRequests}
                  disabled={waLoading}
                >
                  {waLoading ? '⏳' : '🔄 रिफ्रेश'}
                </button>
              </div>
              {waLoading ? (
                <div className="page-loader"><div className="spinner"/></div>
              ) : waRequests.length === 0 ? (
                <div className={styles.empty}>
                  <span>📱</span>
                  <p>कोणतीही WhatsApp विनंती नाही.</p>
                </div>
              ) : (
                <div className={styles.bookingList}>
                  {waRequests.map(b => (
                    <div key={b.id} className={styles.bookingCard}>
                      <div className={styles.bookingHeader}>
                        <span className="badge badge-warning" style={{ background: '#25D366', color: '#fff' }}>📱 WhatsApp</span>
                        <span className={styles.bookingCode}>#{b.booking_code || b.id}</span>
                      </div>
                      <h3 className={styles.poojaName}>{b.pooja_name || 'पूजा'}</h3>
                      <div className={styles.bookingMeta}>
                        <span>👤 {b.user_name || b.customer_name || '—'}</span>
                        <span>📞 {b.user_phone || b.phone || '—'}</span>
                        {b.booking_date && <span>📅 {new Date(b.booking_date).toLocaleDateString('mr-IN')}</span>}
                        {b.booking_time && <span>🕐 {b.booking_time?.slice(0, 5)}</span>}
                      </div>
                      {b.address && <div className={styles.bookingAddress}>📍 {b.address}</div>}
                      <div className={styles.bookingFooter}>
                        {b.total_amount > 0 && (
                          <span className={styles.bookingAmt}>₹{Number(b.total_amount).toLocaleString('mr-IN')}</span>
                        )}
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAcceptWA(b.id)}
                          disabled={accepting === b.id}
                        >
                          {accepting === b.id ? '⏳...' : '✅ स्वीकारा'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SERVICES TAB */}
          {tab === 'services' && <PoojaServicesManager />}

          {/* AVAILABILITY TAB */}
          {tab === 'availability' && (
            <AvailabilityManager />
          )}

          {/* PROFILE TAB */}
          {tab === 'profile' && profile && (
            <div className={styles.profileDetails}>
              <div className={styles.detailCard}>
                <h3>माझी माहिती</h3>
                <div className={styles.detailRow}><span>नाव:</span><strong>{profile.full_name}</strong></div>
                <div className={styles.detailRow}><span>अनुभव:</span><strong>{profile.experience_yrs} वर्षे</strong></div>
                <div className={styles.detailRow}><span>शहर:</span><strong>{profile.city}, {profile.district}</strong></div>
                <div className={styles.detailRow}><span>भाषा:</span><strong>{JSON.parse(profile.languages || '[]').join(', ')}</strong></div>
                <div className={styles.detailRow}><span>विशेषज्ञता:</span><strong>{profile.specialization_names || '—'}</strong></div>
                {profile.bio && <div className={styles.detailRow}><span>परिचय:</span><p>{profile.bio}</p></div>}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

// PoojaServicesManager sub-component
function PoojaServicesManager() {
  const [poojas,  setPoojas]  = useState([]);
  const [selected,setSelected]= useState({}); // { pooja_id: custom_price|'' }
  const [saving,  setSaving]  = useState(false);
  const [notice,  setNotice]  = useState(''); // e.g. own prices not allowed on this site

  useEffect(() => {
    pujariAPI.getMyServices()
      .then(r => {
        const list = r.data.data || [];
        if (r.data.message && r.data.message !== 'यशस्वी') setNotice(r.data.message);
        setPoojas(list);
        const init = {};
        list.filter(p => p.is_offered).forEach(p => {
          init[p.id] = p.custom_price ?? '';
        });
        setSelected(init);
      })
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setSelected(s => {
      const next = { ...s };
      if (next[id] !== undefined) delete next[id];
      else next[id] = '';
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const services = Object.entries(selected).map(([pooja_id, custom_price]) => ({
        pooja_id: parseInt(pooja_id),
        custom_price: custom_price !== '' ? parseFloat(custom_price) : null,
      }));
      await pujariAPI.saveMyServices(services);
      toast.success('सेवा यादी जतन केली! 🙏');
    } catch (err) { toast.error(err.response?.data?.message || 'जतन करताना त्रुटी.'); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.availSection}>
      <div className={styles.availHeader}>
        <h2>🪔 माझ्या पूजा सेवा</h2>
        <p>तुम्ही कोणत्या पूजा करता ते निवडा. वेगळी किंमत असल्यास टाका — ग्राहकाने तुम्हाला निवडल्यावर हीच किंमत लागेल.</p>
        {notice && <p style={{ color: '#b71c1c', fontWeight: 600 }}>{notice}</p>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {poojas.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', borderRadius: 8,
            background: selected[p.id] !== undefined ? '#fdf6e3' : '#f9f9f9',
            border: `1px solid ${selected[p.id] !== undefined ? '#e0c97f' : '#eee'}`,
          }}>
            <input
              type="checkbox"
              checked={selected[p.id] !== undefined}
              onChange={() => toggle(p.id)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <span style={{ flex: 1, fontWeight: 500 }}>{p.name_mr}</span>
            <span style={{ color: '#999', fontSize: 13 }}>
              साइटची किंमत: ₹{p.default_price}
              {p.min_price != null && <> · मर्यादा ₹{p.min_price}–₹{p.max_price}</>}
            </span>
            {selected[p.id] !== undefined && !notice && (
              <input
                type="number"
                min={p.min_price ?? undefined}
                max={p.max_price ?? undefined}
                placeholder="माझी किंमत (optional)"
                value={selected[p.id]}
                onChange={e => setSelected(s => ({ ...s, [p.id]: e.target.value }))}
                style={{ width: 160, padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 13 }}
              />
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? '⏳ जतन होत आहे...' : '💾 सेवा जतन करा'}
      </button>
    </div>
  );
}

// AvailabilityManager sub-component
function AvailabilityManager() {
  const [dates,   setDates]   = useState({});
  const [saving,  setSaving]  = useState(false);

  const today = new Date();
  const next30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const toggle = (date) => {
    setDates(ds => ({ ...ds, [date]: !ds[date] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateArr = next30.map(d => ({
        date: d,
        is_available: dates[d] !== false,
      }));
      await pujariAPI.setAvailability(dateArr);
      toast.success('उपलब्धता जतन केली! 🗓️');
    } catch { toast.error('जतन करताना त्रुटी झाली.'); }
    finally { setSaving(false); }
  };

  const weekDays = ['रवि','सोम','मंगळ','बुध','गुरु','शुक्र','शनि'];

  return (
    <div className={styles.availSection}>
      <div className={styles.availHeader}>
        <h2>🗓️ उपलब्धता कॅलेंडर</h2>
        <p>हिरव्या तारखांवर आपण उपलब्ध आहात. लाल म्हणजे अनुपलब्ध.</p>
      </div>
      <div className={styles.calGrid}>
        {weekDays.map(d => <div key={d} className={styles.calHeader}>{d}</div>)}
        {/* Offset */}
        {Array.from({ length: new Date(next30[0]).getDay() }).map((_, i) => <div key={`off-${i}`}/>)}
        {next30.map(date => {
          const available = dates[date] !== false;
          const d = new Date(date);
          return (
            <button
              key={date}
              className={`${styles.calDay} ${available ? styles.calAvail : styles.calUnavail}`}
              onClick={() => toggle(date)}
              title={date}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <div className={styles.calLegend}>
        <span className={styles.legendAvail}/>उपलब्ध
        <span className={styles.legendUnavail}/>अनुपलब्ध
      </div>
      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{marginTop:'20px'}}>
        {saving ? '⏳ जतन होत आहे...' : '💾 उपलब्धता जतन करा'}
      </button>
    </div>
  );
}
