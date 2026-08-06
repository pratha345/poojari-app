// src/pages/Booking.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { poojaAPI, bookingAPI, authAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { FaShieldHalved } from 'react-icons/fa6';
import GoogleVerifyBox from '../components/auth/GoogleVerifyBox';
import ManualToggle from '../components/auth/ManualToggle';
import styles from './Booking.module.css';

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const TIMES = [
  '०६:०० पूर्वाह्न','०७:०० पूर्वाह्न','०८:०० पूर्वाह्न',
  '०९:०० पूर्वाह्न','१०:०० पूर्वाह्न','११:०० पूर्वाह्न',
  '१२:०० दुपारी','०१:०० अपराह्न','०२:०० अपराह्न',
  '०३:०० अपराह्न','०४:०० अपराह्न','०५:०० अपराह्न',
];
const TIME_VALUES = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
];

const MAHARASHTRA_DISTRICTS = [
  'अहमदनगर','अकोला','अमरावती','औरंगाबाद','बीड','भंडारा','बुलढाणा',
  'चंद्रपूर','धुळे','गडचिरोली','गोंदिया','हिंगोली','जळगाव','जालना',
  'कोल्हापूर','लातूर','मुंबई शहर','मुंबई उपनगर','नागपूर','नांदेड',
  'नंदुरबार','नाशिक','उस्मानाबाद','पालघर','परभणी','पुणे','रायगड',
  'रत्नागिरी','सांगली','सातारा','सिंधुदुर्ग','सोलापूर','ठाणे',
  'वर्धा','वाशीम','यवतमाळ',
];

export default function Booking() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { state: navState } = useLocation();
  const preferredPujariId   = navState?.pujariId   || null;
  const preferredPujariName = navState?.pujariName || null;
  const { isAuthenticated, login } = useAuth();
  const [pooja,     setPooja]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  // step 0=OTP (if not logged in), 1=details, 2=confirm, 3=success
  // step: 0=OTP, 1=details, 2=confirm, 3=payment, 4=success
  const [step,        setStep]        = useState(isAuthenticated ? 1 : 0);
  const [bookingCode, setBookingCode] = useState('');
  const [bookingId,   setBookingId]   = useState(null);
  const [payLoading,  setPayLoading]  = useState(false);

  // OTP state
  const [otpPhone,    setOtpPhone]    = useState('');
  const [otpName,     setOtpName]     = useState('');
  const [otpCode,     setOtpCode]     = useState('');
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [otpError,    setOtpError]    = useState('');
  // Phone/OTP fields start HIDDEN — Google leads with useOneTap. Hiding the
  // manual form removes the competing clickable UI that useOneTap's invisible
  // account-chooser overlay used to silently block clicks on (see Login.jsx
  // for the full root-cause note) — same fix pattern applied there.
  const [showOtpForm, setShowOtpForm] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [form, setForm] = useState({
    booking_date:  minDate,
    booking_time:  '09:00',
    name:          '',
    phone:         '',
    address:       '',
    city:          '',
    district:      'रत्नागिरी',
    special_notes: '',
  });

  useEffect(() => {
    poojaAPI.getPoojaBySlug(slug)
      .then(r => setPooja(r.data.data))
      .catch(() => navigate('/pooja'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── Razorpay handler ──────────────────────────────────────────
  const handleRazorpay = async () => {
    setPayLoading(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) { toast.error('Razorpay लोड होऊ शकले नाही.'); return; }

      const orderRes = await bookingAPI.createPayment(bookingId);
      const { order_id, amount, currency, key_id } = orderRes.data.data;

      const rzp = new window.Razorpay({
        key:         key_id,
        amount,
        currency,
        order_id,
        name:        'पूजारी Platform',
        description: pooja.name_mr,
        image:       '/logo.png',
        prefill: {
          contact: form.phone || '',
          name:    form.name  || '',
        },
        theme:   { color: '#b35c00' },
        handler: async (response) => {
          try {
            await bookingAPI.verifyPayment({
              booking_id:          bookingId,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });
            toast.success('पेमेंट यशस्वी! 🙏');
            setStep(4);
          } catch { toast.error('पेमेंट पडताळणी अयशस्वी.'); }
        },
        modal: { ondismiss: () => setPayLoading(false) },
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'पेमेंट सुरू करताना त्रुटी.');
    } finally { setPayLoading(false); }
  };

  // ── Google sign-in (primary — browser's logged-in account, no OTP needed) ──
  const handleGoogleAuth = async (credential) => {
    setOtpLoading(true);
    try {
      const res = await authAPI.googleAuth(credential);
      login(res.data.data.token, res.data.data.user);
      toast.success(`स्वागत आहे, ${res.data.data.user.name}! 🙏`);
      setStep(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google लॉगिन करताना त्रुटी झाली.');
    } finally { setOtpLoading(false); }
  };

  // ── OTP handlers ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    const cleanPhone = otpPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) { toast.error('वैध १० अंकी फोन नंबर टाका.'); return; }
    setOtpLoading(true);
    try {
      const res = await authAPI.sendOtp(cleanPhone);
      setOtpSent(true);
      const devOtp = res.data?.data?.dev_otp;
      if (devOtp) {
        toast.success(`देव OTP: ${devOtp} (चाचणीसाठी)`, { duration: 15000, icon: '📱' });
      } else {
        toast.success('OTP पाठवला! फोनवर तपासा. 📱');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP पाठवताना त्रुटी.');
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { toast.error('6 अंकी OTP टाका.'); return; }
    const cleanPhone = otpPhone.replace(/\D/g, '');
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await authAPI.verifyOtp({ phone: cleanPhone, otp: otpCode, name: otpName || undefined });
      login(res.data.data.token, res.data.data.user);
      toast.success('OTP पडताळणी यशस्वी! 🙏');
      setStep(1);
    } catch (err) {
      const msg = err.response?.data?.message || 'OTP चुकीचा आहे.';
      setOtpError(msg);
      toast.error(msg);
    } finally { setOtpLoading(false); }
  };

  // Auto-submit once all 6 digits are in — one less tap for the user.
  useEffect(() => {
    if (otpSent && otpCode.length === 6 && !otpLoading) handleVerifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCode, otpSent]);

  const handleSubmit = async () => {
    if (!form.booking_date || !form.booking_time || !form.address || !form.city) {
      toast.error('कृपया सर्व आवश्यक माहिती भरा.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        pooja_id:      pooja.id,
        booking_date:  form.booking_date,
        booking_time:  form.booking_time,
        address:       `${form.address}, ${form.city}, ${form.district}`,
        city:          form.city,
        district:      form.district,
        special_notes: form.special_notes,
      };
      if (preferredPujariId) payload.preferred_pujari_id = preferredPujariId;
      const res = await bookingAPI.create(payload);
      setBookingCode(res.data.data.booking_code);
      setBookingId(res.data.data.booking_id);
      setStep(3); // payment step
      toast.success('बुकिंग नोंदणी झाली! 🙏');
    } catch (err) {
      toast.error(err.response?.data?.message || 'बुकिंग करताना त्रुटी झाली.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div><Header/>
      <div className="page-loader"><div className="spinner"/><p>लोड होत आहे...</p></div>
    <Footer/></div>
  );

  if (!pooja) return null;

  return (
    <div>
      <SEOHead
        title={`${pooja.name_mr} बुक करा - ऑनलाइन बुकिंग`}
        description={`${pooja.name_mr} ऑनलाइन बुक करा. तारीख, वेळ व स्थान निश्चित करा. महाराष्ट्रातील अनुभवी पुजारी घरी येतात.`}
        canonical={`/booking/${pooja.slug}`}
        noindex={true}
      />
      <Header />
      <main className={styles.main}>
        <div className="container">
          {/* Progress */}
          <div className={styles.progress}>
            {(isAuthenticated
              ? ['माहिती भरा','पुष्टी करा','बुकिंग यशस्वी']
              : ['ओळख पटवा','माहिती भरा','पुष्टी करा','बुकिंग यशस्वी']
            ).map((label, i) => {
              const stepNum = isAuthenticated ? i + 1 : i;
              return (
                <div key={i} className={`${styles.progressStep} ${step > stepNum ? styles.done : ''} ${step === stepNum ? styles.current : ''}`}>
                  <div className={styles.progressDot}>{step > stepNum ? '✓' : stepNum + 1}</div>
                  <span>{label}</span>
                  {i < (isAuthenticated ? 2 : 3) && <div className={styles.progressLine}/>}
                </div>
              );
            })}
          </div>

          <div className={styles.layout}>
            {/* LEFT: Form */}
            <div className={styles.formSection}>
              {/* ── Step 0: Phone OTP (not logged in) ── */}
              {step === 0 && (
                <div className={styles.card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#fff3e0,#ffe0b2)',
                      border: '1.5px solid #b35c0030',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}><FaShieldHalved style={{ color: '#b35c00' }} /></div>
                    <div>
                      <h2 className={styles.cardTitle} style={{ margin: 0 }}>पडताळणी</h2>
                      <p style={{ color: 'var(--text-muted)', margin: '2px 0 0', fontSize: 13.5 }}>
                        सुरक्षित व जलद — फक्त काही सेकंदात पुढे चला
                      </p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'var(--border, #f5ece0)', margin: '16px 0 18px' }} />

                  {/* Google — one click, no OTP. useOneTap enabled: the OTP
                      form below stays hidden until explicitly requested (or
                      Google fails), so there's no other dense clickable UI
                      for the account-chooser's invisible overlay to block. */}
                  <GoogleVerifyBox
                    onSuccess={({ credential }) => handleGoogleAuth(credential)}
                    onError={() => { toast.error('Google लॉगिन रद्द झाले.'); setShowOtpForm(true); }}
                  />

                  <ManualToggle
                    show={showOtpForm}
                    onShow={() => setShowOtpForm(true)}
                    label="फोन नंबर / OTP ने पुढे चला"
                  >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border, #e5dcd0)' }} />
                    <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>किंवा फोन OTP ने</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border, #e5dcd0)' }} />
                  </div>

                  <div className="form-group">
                    <label>नाव (पर्यायी)</label>
                    <input
                      type="text" className="form-control"
                      placeholder="तुमचे नाव"
                      value={otpName} onChange={e => setOtpName(e.target.value)}
                      disabled={otpSent}
                    />
                  </div>

                  <div className="form-group">
                    <label>फोन नंबर *</label>
                    <input
                      type="tel" inputMode="numeric" pattern="[0-9]*" className="form-control"
                      placeholder="10 अंकी फोन नंबर"
                      maxLength={10}
                      value={otpPhone} onChange={e => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                      disabled={otpSent}
                    />
                  </div>

                  {!otpSent ? (
                    <button
                      className="btn btn-primary btn-lg" style={{ width: '100%' }}
                      onClick={handleSendOtp} disabled={otpLoading}
                    >
                      {otpLoading ? '⏳ पाठवत आहे...' : '📲 OTP पाठवा'}
                    </button>
                  ) : (
                    <>
                      <div className="form-group" style={{ marginTop: 16 }}>
                        <label>6 अंकी OTP *</label>
                        <input
                          type="text" inputMode="numeric" pattern="[0-9]*" className="form-control"
                          placeholder="OTP टाका"
                          maxLength={6}
                          value={otpCode} onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                          style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center', borderColor: otpError ? '#e53935' : undefined }}
                        />
                        {otpError && <p style={{ color: '#e53935', fontSize: 12.5, fontWeight: 600, margin: '6px 0 0' }}>⚠️ {otpError}</p>}
                        <small style={{ color: 'var(--text-muted)' }}>
                          {otpPhone} वर OTP पाठवला. &nbsp;
                          <span
                            style={{ color: 'var(--primary)', cursor: 'pointer' }}
                            onClick={() => { setOtpSent(false); setOtpCode(''); setOtpError(''); }}
                          >बदला</span>
                        </small>
                      </div>
                      <button
                        className="btn btn-primary btn-lg" style={{ width: '100%' }}
                        onClick={handleVerifyOtp} disabled={otpLoading}
                      >
                        {otpLoading ? '⏳ तपासत आहे...' : '✅ OTP पडताळा व पुढे जा'}
                      </button>
                    </>
                  )}
                  </ManualToggle>

                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                    आधीच खाते आहे?{' '}
                    <span
                      style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => navigate('/login')}
                    >लॉगिन करा</span>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>📅 बुकिंग तपशील</h2>

                  {preferredPujariName && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#fdf6ee', border: '1px solid #f0e0c8',
                      borderRadius: 10, padding: '10px 16px', marginBottom: 20,
                    }}>
                      <span style={{ fontSize: 20 }}>🙏</span>
                      <div>
                        <div style={{ fontSize: 12, color: '#888' }}>पसंतीचे पुजारी</div>
                        <div style={{ fontWeight: 700, color: '#7c2d00' }}>{preferredPujariName}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid-2">
                    <div className="form-group">
                      <label>पूजेची तारीख *</label>
                      <input
                        type="date" name="booking_date"
                        min={minDate} value={form.booking_date}
                        onChange={handleChange} className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>वेळ *</label>
                      <select name="booking_time" value={form.booking_time} onChange={handleChange} className="form-control">
                        {TIMES.map((t, i) => (
                          <option key={i} value={TIME_VALUES[i]}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>संपूर्ण पत्ता *</label>
                    <textarea
                      name="address" value={form.address} onChange={handleChange}
                      className="form-control" rows={3}
                      placeholder="घर क्र., गल्ली, वाडी, मोहल्ला..."
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label>शहर / गाव *</label>
                      <input
                        type="text" name="city" value={form.city}
                        onChange={handleChange} className="form-control"
                        placeholder="उदा: रत्नागिरी"
                      />
                    </div>
                    <div className="form-group">
                      <label>जिल्हा *</label>
                      <select name="district" value={form.district} onChange={handleChange} className="form-control">
                        {MAHARASHTRA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>विशेष सूचना (पर्यायी)</label>
                    <textarea
                      name="special_notes" value={form.special_notes} onChange={handleChange}
                      className="form-control" rows={2}
                      placeholder="उदा: घरात ३ लोक आहेत, विशेष विधी..."
                    />
                  </div>

                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep(2)}>
                    पुढे जा →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>✅ बुकिंग पुष्टी करा</h2>
                  <div className={styles.confirmList}>
                    <div className={styles.confirmItem}>
                      <span>पूजा</span><strong>{pooja.name_mr}</strong>
                    </div>
                    {preferredPujariName && (
                      <div className={styles.confirmItem}>
                        <span>पसंतीचे पुजारी</span><strong>🙏 {preferredPujariName}</strong>
                      </div>
                    )}
                    <div className={styles.confirmItem}>
                      <span>तारीख</span>
                      <strong>{new Date(form.booking_date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                    <div className={styles.confirmItem}>
                      <span>वेळ</span>
                      <strong>{TIMES[TIME_VALUES.indexOf(form.booking_time)]}</strong>
                    </div>
                    <div className={styles.confirmItem}>
                      <span>पत्ता</span>
                      <strong>{form.address}, {form.city}, {form.district}</strong>
                    </div>
                    {form.special_notes && (
                      <div className={styles.confirmItem}>
                        <span>सूचना</span><strong>{form.special_notes}</strong>
                      </div>
                    )}
                    <div className={`${styles.confirmItem} ${styles.totalRow}`}>
                      <span>एकूण रक्कम</span>
                      <strong className={styles.totalAmt}>₹{Number(pooja.price).toLocaleString('mr-IN')}</strong>
                    </div>
                  </div>
                  <div className={styles.actionRow}>
                    <button className="btn btn-secondary" onClick={() => setStep(1)}>← मागे जा</button>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? '⏳ प्रक्रिया सुरू...' : '🪔 बुकिंग पक्की करा'}
                    </button>
                  </div>
                  <p className={styles.payNote}>* पेमेंट पुजारी आल्यानंतर रोख / UPI द्वारे करता येईल</p>
                </div>
              )}

              {/* ── Step 3: Payment Choice ── */}
              {step === 3 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>💳 पेमेंट करा</h2>
                  <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 14 }}>
                    बुकिंग कोड: <strong>{bookingCode}</strong>
                  </p>
                  <div className={`${styles.confirmItem} ${styles.totalRow}`} style={{ marginBottom: 24 }}>
                    <span>एकूण रक्कम</span>
                    <strong className={styles.totalAmt}>₹{Number(pooja.price).toLocaleString('mr-IN')}</strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleRazorpay}
                      disabled={payLoading}
                      style={{ width: '100%' }}
                    >
                      {payLoading ? '⏳ उघडत आहे...' : '💳 ऑनलाइन पेमेंट करा (UPI / Card)'}
                    </button>

                    <button
                      className="btn btn-secondary btn-lg"
                      onClick={async () => {
                        try {
                          await bookingAPI.chooseCash(bookingId);
                        } catch {}
                        setStep(4);
                      }}
                      style={{ width: '100%' }}
                    >
                      🏠 नंतर पेमेंट करा (पुजारी आल्यावर रोख/UPI)
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                    ऑनलाइन पेमेंट केल्यास बुकिंग लगेच confirmed होते.
                  </p>
                </div>
              )}

              {/* ── Step 4: Success ── */}
              {step === 4 && (
                <div className={`${styles.card} ${styles.successCard}`}>
                  <div className={styles.successIcon}>🎉</div>
                  <h2>बुकिंग यशस्वी झाली!</h2>
                  <p>तुमचा बुकिंग कोड:</p>
                  <div className={styles.bookingCode}>{bookingCode}</div>
                  <p className={styles.successNote}>
                    आम्ही लवकरच तुमच्या नंबरवर संपर्क करून पुजारी नियुक्त करू.
                    WhatsApp वर माहिती मिळेल.
                  </p>
                  <div className={styles.successActions}>
                    <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
                      माझ्या बुकिंग्ज पहा
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                      मुख्यपृष्ठावर जा
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Pooja Summary */}
            {step < 3 && (
              <div className={styles.summary}>
                <div className={styles.summaryCard}>
                  <img
                    src={pooja.image_url || 'https://images.unsplash.com/photo-1609690996760-27439d5cfe5c?w=400'}
                    alt={pooja.name_mr}
                    className={styles.summaryImg}
                  />
                  <div className={styles.summaryBody}>
                    <span className={styles.summaryCat}>{pooja.category_name}</span>
                    <h3 className={styles.summaryTitle}>{pooja.name_mr}</h3>
                    <div className={styles.summaryMeta}>
                      <span>⏱ {pooja.duration_hrs} तास</span>
                    </div>
                    <div className={styles.summaryPrice}>
                      ₹{Number(pooja.price).toLocaleString('mr-IN')}
                    </div>
                  </div>
                  <div className={styles.summaryGuarantee}>
                    <strong>🛡️ आमची हमी</strong>
                    <span>पूजा न झाल्यास पूर्ण परतावा</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
