// src/pages/BookPujari.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { authAPI, poojaAPI, pujariAPI, bookingAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import GoogleVerifyBox from '../components/auth/GoogleVerifyBox';
import ManualToggle from '../components/auth/ManualToggle';
import { getImageUrl } from '../utils/index.js';
import { FaStar, FaLocationDot, FaWhatsapp, FaCircleCheck, FaShieldHalved, FaCalendarCheck, FaHandsPraying } from 'react-icons/fa6';

const TIME_GROUPS = [
  {
    group: '🌅 सकाळ',
    times: [
      { label: '०६:०० सकाळी', value: '06:00' },
      { label: '०७:०० सकाळी', value: '07:00' },
      { label: '०८:०० सकाळी', value: '08:00' },
      { label: '०९:०० सकाळी', value: '09:00' },
      { label: '१०:०० सकाळी', value: '10:00' },
      { label: '११:०० सकाळी', value: '11:00' },
    ],
  },
  {
    group: '☀️ दुपार',
    times: [
      { label: '१२:०० दुपारी', value: '12:00' },
      { label: '०१:०० दुपारी', value: '13:00' },
      { label: '०२:०० दुपारी', value: '14:00' },
      { label: '०३:०० दुपारी', value: '15:00' },
    ],
  },
  {
    group: '🌆 संध्याकाळ',
    times: [
      { label: '०४:०० संध्याकाळी', value: '16:00' },
      { label: '०५:०० संध्याकाळी', value: '17:00' },
      { label: '०६:०० संध्याकाळी', value: '18:00' },
    ],
  },
];
const TIMES = TIME_GROUPS.flatMap(g => g.times);

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const MIN_DATE = tomorrow.toISOString().split('T')[0];

const STEPS_AUTH  = ['बुकिंग माहिती', 'पुजारी निवडा', 'बुकिंग यशस्वी'];
const STEPS_GUEST = ['OTP सत्यापन', 'बुकिंग माहिती', 'पुजारी निवडा', 'बुकिंग यशस्वी'];

function PriceBreakdown({ pooja, withSamagri }) {
  const poojaPrice   = Number(pooja.price)         || 0;
  const samagriPrice = Number(pooja.samagri_price) || 0;
  const totalPrice   = withSamagri ? poojaPrice + samagriPrice : poojaPrice;

  if (!poojaPrice) return null;

  return (
    <div style={{
      marginTop: 14,
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(179,92,0,0.13)',
      border: '1.5px solid #e8d5b7',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c2d00 0%, #b35c00 100%)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>💰</span>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: 0.5 }}>किंमत तपशील</span>
        {withSamagri && (
          <span style={{
            marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 11, fontWeight: 600,
            padding: '2px 10px', borderRadius: 20,
          }}>सामग्रीसह</span>
        )}
      </div>

      {/* Rows */}
      <div style={{ background: '#fff', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Pooja price row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 0', borderBottom: '1px dashed #f0e0c8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 28, height: 28, borderRadius: '50%',
              background: '#fff8f0', border: '1px solid #e8d5b7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>🙏</span>
            <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>पूजा शुल्क</span>
          </div>
          <span style={{ fontWeight: 700, color: '#333', fontSize: 14 }}>
            ₹{poojaPrice.toLocaleString('mr-IN')}
          </span>
        </div>

        {/* Samagri row */}
        {withSamagri && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 0', borderBottom: '1px dashed #f0e0c8',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>📦</span>
              <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>सामग्री शुल्क</span>
            </div>
            {samagriPrice > 0 ? (
              <span style={{ fontWeight: 700, color: '#333', fontSize: 14 }}>
                ₹{samagriPrice.toLocaleString('mr-IN')}
              </span>
            ) : (
              <span style={{
                fontSize: 11, color: '#b35c00', fontWeight: 600,
                background: '#fff8f0', padding: '2px 10px', borderRadius: 20,
                border: '1px solid #e8d5b7',
              }}>पुजारीशी ठरवा</span>
            )}
          </div>
        )}

        {/* Total row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '11px 14px', marginTop: 6, borderRadius: 10,
          background: 'linear-gradient(135deg, #fff8f0, #fdf3e7)',
          border: '1px solid #e8d5b7',
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#999', fontWeight: 500, marginBottom: 1 }}>एकूण देय</div>
            <div style={{ fontWeight: 800, color: '#7c2d00', fontSize: 15 }}>एकूण</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 900, color: '#b35c00', fontSize: 22, lineHeight: 1, fontFamily: 'Noto Serif Devanagari, serif' }}>
              ₹{totalPrice.toLocaleString('mr-IN')}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>पासून</div>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginTop: 8, fontSize: 11, color: '#999', textAlign: 'center' }}>
          * अंतिम किंमत पुजारीशी बोलून निश्चित होईल
        </div>
      </div>
    </div>
  );
}

export default function BookPujari() {
  const navigate = useNavigate();
  const { isAuthenticated, login, user } = useAuth();

  const [step, setStep] = useState(isAuthenticated ? 1 : 0);

  // OTP state
  const [otpPhone,   setOtpPhone]   = useState('');
  const [otpName,    setOtpName]    = useState('');
  const [otpCode,    setOtpCode]    = useState('');
  const [otpSent,    setOtpSent]    = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  // Phone/OTP fields start HIDDEN — Google leads with useOneTap (see
  // Login.jsx / Booking.jsx for the full root-cause note on why hiding the
  // manual form is what makes useOneTap safe here).
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otpError,    setOtpError]    = useState('');
  const [whatsapp,   setWhatsapp]   = useState(true);

  // Pooja search dropdown
  const [poojaSearch,   setPoojaSearch]   = useState('');
  const [poojaDropOpen, setPoojaDropOpen] = useState(false);
  const poojaDropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (poojaDropRef.current && !poojaDropRef.current.contains(e.target))
        setPoojaDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Booking form state
  const [poojas, setPoojas] = useState([]);
  const [form, setForm] = useState({
    pooja_id:      '',
    booking_date:  MIN_DATE,
    booking_time:  '09:00',
    mode:          'offline',
    samagri:       true,
    address:       '',
    city:          '',
    district:      '',
    special_notes: '',
  });

  // Nearby pujari state
  const [nearbyPujaris,  setNearbyPujaris]  = useState([]);
  const [loadingPujaris, setLoadingPujaris] = useState(false);
  const [selectedPujari, setSelectedPujari] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [gpsCoords,      setGpsCoords]      = useState(null);
  const [pujariFallback, setPujariFallback] = useState(false);
  const [bookingCode,    setBookingCode]    = useState('');
  const [submitting,     setSubmitting]     = useState(false);

  useEffect(() => {
    poojaAPI.getPoojas({ limit: 100 })
      .then(r => {
        const d = r.data.data;
        setPoojas(d?.poojas || d?.rows || (Array.isArray(d) ? d : []));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.phone) setOtpPhone(user.phone);
  }, [isAuthenticated, user]);

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

  const handleSendOtp = async () => {
    const phone = otpPhone.trim().replace(/\D/g, '');
    if (phone.length < 10) { toast.error('वैध १० अंकी फोन नंबर टाका.'); return; }
    setOtpLoading(true);
    try {
      const res = await authAPI.sendOtp(phone);
      setOtpSent(true);
      const devOtp = res.data?.data?.dev_otp;
      if (devOtp) {
        toast.success(`देव OTP: ${devOtp} (चाचणीसाठी)`, { duration: 15000, icon: '📱' });
      } else {
        toast.success('OTP पाठवला! 📱');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP पाठवताना त्रुटी.');
    } finally { setOtpLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { toast.error('6 अंकी OTP टाका.'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await authAPI.verifyOtp({ phone: otpPhone, otp: otpCode, name: otpName || undefined });
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

  const detectLocation = () => {
    if (!navigator.geolocation) { toast.error('जिओलोकेशन उपलब्ध नाही.'); return; }
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          setGpsCoords({ lat, lng: lon });
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=mr`,
            { headers: { 'User-Agent': 'PojjariApp/1.0' } }
          );
          const geo = await r.json();
          const addr     = geo.address || {};
          const city     = addr.city || addr.town || addr.village || '';
          const district = addr.county || addr.state_district || '';
          setForm(f => ({ ...f, city: city || addr.county || '', district }));
          setLocationStatus('done');
          toast.success(`स्थान सापडले: ${city}`);
        } catch {
          setLocationStatus('error');
          toast.error('शहर शोधताना त्रुटी.');
        }
      },
      () => { setLocationStatus('error'); toast.error('स्थान परवानगी नाकारली.'); }
    );
  };

  const goToNearby = async () => {
    if (!form.pooja_id)               { toast.error('पूजा निवडा.');           return; }
    if (!form.booking_date)           { toast.error('तारीख निवडा.');          return; }
    if (!form.booking_time)           { toast.error('वेळ निवडा.');            return; }
    if (!form.city?.trim())           { toast.error('शहर टाका.');             return; }
    if (!form.address?.trim())        { toast.error('पत्ता टाका.');           return; }
    setStep(2);
    setLoadingPujaris(true);
    try {
      const params = { city: form.city, district: form.district, limit: 8 };
      if (gpsCoords) { params.lat = gpsCoords.lat; params.lng = gpsCoords.lng; }
      const res = await pujariAPI.getNearbyPujaris(params);
      const { data = [], fallback = false } = res.data || {};
      setPujariFallback(fallback);
      setNearbyPujaris(data);
    } catch {
      toast.error('जवळचे पुजारी मिळवताना त्रुटी.');
    } finally { setLoadingPujaris(false); }
  };

  const handleBook = async () => {
    if (!selectedPujari && nearbyPujaris.length > 0) { toast.error('पुजारी निवडा.'); return; }
    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        pooja_id:      parseInt(form.pooja_id),
        booking_date:  form.booking_date,
        booking_time:  form.booking_time,
        address:       form.address.trim(),
        city:          form.city,
        district:      form.district,
        special_notes: form.special_notes,
        with_samagri:  form.samagri,
        mode:          form.mode,
      });
      setBookingCode(res.data.data?.booking_code || '');
      toast.success('बुकिंग यशस्वी! 🎉');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'बुकिंग करताना त्रुटी.');
    } finally { setSubmitting(false); }
  };

  const selectedPooja   = poojas.find(p => String(p.id) === String(form.pooja_id));
  const filteredPoojas  = poojas.filter(p => {
    if (!poojaSearch.trim()) return true;
    const q = poojaSearch.trim().toLowerCase();
    return (
      (p.name_mr || '').toLowerCase().includes(q) ||
      (p.name_en || '').toLowerCase().includes(q)
    );
  });
  const steps           = isAuthenticated ? STEPS_AUTH : STEPS_GUEST;
  const stepIndex       = isAuthenticated ? step - 1 : step;

  return (
    <div>
      <SEOHead
        title="पुजारी बुक करा — घरी अनुभवी पुजारी | पूजारी"
        description="महाराष्ट्रातील अनुभवी पुजारी घरी बुक करा. OTP द्वारे सुरक्षित नोंदणी, जवळचे पुजारी पाहा, सामग्रीसह बुकिंग करा."
        canonical="/book-pujari"
      />
      <Header />

      {/* ── Hero + Step Progress ────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #7c2d00 0%, #b35c00 60%, #e07b2a 100%)',
        padding: '14px 0 0',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)' }} />
        <div className="container" style={{ position: 'relative', textAlign: 'center', paddingBottom: 0 }}>
          <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: 'Noto Serif Devanagari, serif', margin: '0 0 2px' }}>
            पुजारी बुक करा
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, margin: '0 0 12px' }}>
            अनुभवी व सत्यापित पुजारी घरी बुक करा
          </p>
        </div>
      </div>

      {/* ── Step Progress ──────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0e0c8', padding: '0' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {steps.map((label, i) => {
              const done    = i < stepIndex;
              const current = i === stepIndex;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="step-item" style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '14px 8px', position: 'relative',
                    borderBottom: current ? '3px solid #b35c00' : '3px solid transparent',
                    minWidth: 90,
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: done ? '#2e7d32' : current ? '#b35c00' : '#e8e8e8',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, marginBottom: 4,
                      transition: 'all 0.2s',
                    }}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className="step-label" style={{
                      fontSize: 11, fontWeight: current ? 700 : 400,
                      color: current ? '#b35c00' : done ? '#2e7d32' : '#aaa',
                      whiteSpace: 'nowrap',
                    }}>
                      {label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="step-connector" style={{ width: 40, height: 2, background: done ? '#2e7d32' : '#e8e8e8', flexShrink: 0, marginBottom: 16 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main style={{ background: '#f7f1ea', minHeight: '60vh', padding: '16px 0 40px' }}>
        <div className="container" style={{ maxWidth: 1200 }}>
          <div className={step < 3 ? 'book-pujari-grid' : ''} style={step >= 3 ? {} : undefined}>

            {/* ── LEFT: Form Steps ──────────────────────────────── */}
            <div>

              {/* STEP 0: OTP */}
              {step === 0 && (
                <div style={card}>
                  <div style={sectionHeader}>
                    <div style={iconCircle('linear-gradient(135deg,#fff3e0,#ffe0b2)', '#b35c00')}>
                      <FaShieldHalved style={{ color: '#b35c00', fontSize: 18 }} />
                    </div>
                    <div>
                      <h2 style={cardH2}>पडताळणी</h2>
                      <p style={cardSub}>सुरक्षित व जलद — फक्त काही सेकंदात पुढे चला</p>
                    </div>
                  </div>
                  <div style={divider} />

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
                    <div style={{ flex: 1, height: 1, background: '#e8e0d5' }} />
                    <span style={{ fontSize: 12.5, color: '#888' }}>किंवा फोन OTP ने</span>
                    <div style={{ flex: 1, height: 1, background: '#e8e0d5' }} />
                  </div>

                  <div style={field}>
                    <label style={labelStyle}>पूर्ण नाव</label>
                    <input className="form-control" type="text" placeholder="आपले नाव"
                      value={otpName} onChange={e => setOtpName(e.target.value)} style={inputStyle} />
                  </div>

                  <div style={field}>
                    <label style={labelStyle}>मोबाईल नंबर <span style={{ color: '#e53935' }}>*</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', background: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: 10, fontSize: 14, gap: 6, flexShrink: 0 }}>
                        🇮🇳 <span style={{ fontWeight: 600 }}>+91</span>
                      </div>
                      <input className="form-control" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10}
                        placeholder="१० अंकी नंबर" value={otpPhone}
                        onChange={e => setOtpPhone(e.target.value.replace(/\D/g, ''))}
                        style={{ ...inputStyle, flex: 1 }} />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 24, padding: '10px 14px', background: '#f0fff4', borderRadius: 10, border: '1px solid #c8e6c9' }}>
                    <input type="checkbox" checked={whatsapp} onChange={e => setWhatsapp(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#25d366' }} />
                    <FaWhatsapp style={{ color: '#25d366', fontSize: 18 }} />
                    <span style={{ fontSize: 14 }}>WhatsApp वर बुकिंग अपडेट मिळवा</span>
                  </label>

                  {!otpSent ? (
                    <button className="btn btn-primary" style={primaryBtn} onClick={handleSendOtp} disabled={otpLoading}>
                      {otpLoading ? '⏳ पाठवत आहे...' : '📲 OTP पाठवा'}
                    </button>
                  ) : (
                    <>
                      <div style={field}>
                        <label style={labelStyle}>6 अंकी OTP <span style={{ color: '#e53935' }}>*</span></label>
                        <input className="form-control" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="• • • • • •"
                          value={otpCode} onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                          style={{ ...inputStyle, textAlign: 'center', letterSpacing: 12, fontSize: 22, fontWeight: 700, borderColor: otpError ? '#e53935' : undefined }} />
                        {otpError && <p style={{ color: '#e53935', fontSize: 12.5, fontWeight: 600, margin: '6px 0 0' }}>⚠️ {otpError}</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                          <small style={{ color: '#888' }}>{otpPhone} वर OTP पाठवला</small>
                          <small style={{ color: '#b35c00', cursor: 'pointer', fontWeight: 600 }} onClick={() => { setOtpSent(false); setOtpError(''); }}>नंबर बदला</small>
                        </div>
                      </div>
                      <button className="btn btn-primary" style={primaryBtn} onClick={handleVerifyOtp} disabled={otpLoading}>
                        {otpLoading ? '⏳ तपासत आहे...' : '✅ OTP सत्यापित करा व पुढे जा'}
                      </button>
                      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#888' }}>
                        OTP आला नाही?{' '}
                        <span style={{ color: '#b35c00', cursor: 'pointer', fontWeight: 600 }} onClick={handleSendOtp}>पुन्हा पाठवा</span>
                      </p>
                    </>
                  )}
                  </ManualToggle>

                  <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#888' }}>
                    आधीच खाते आहे?{' '}
                    <span style={{ color: '#b35c00', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/login')}>लॉगिन करा</span>
                  </p>
                </div>
              )}

              {/* STEP 1: Booking Form */}
              {step === 1 && (
                <div style={card}>
                  <div style={sectionHeader}>
                    <div style={iconCircle('#fff8f0', '#b35c00')}>📋</div>
                    <div>
                      <h2 style={cardH2}>बुकिंग माहिती</h2>
                      <p style={cardSub}>पूजेचे तपशील भरा</p>
                    </div>
                  </div>
                  <div style={divider} />

                  {/* Pooja searchable dropdown */}
                  <div style={{ ...field, position: 'relative' }} ref={poojaDropRef}>
                    <label style={labelStyle}>पूजेचे नाव <span style={{ color: '#e53935' }}>*</span></label>
                    <div
                      style={{
                        ...inputStyle, display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', cursor: 'pointer',
                        background: poojaDropOpen ? '#fff8f0' : '#fff',
                        borderColor: poojaDropOpen ? '#b35c00' : '#e0e0e0',
                      }}
                      onClick={() => {
                        setPoojaDropOpen(o => !o);
                        if (!poojaDropOpen) setPoojaSearch('');
                      }}
                    >
                      <span style={{ color: selectedPooja ? '#333' : '#aaa', fontSize: 14 }}>
                        {selectedPooja ? selectedPooja.name_mr : '— पूजा निवडा —'}
                      </span>
                      <span style={{ color: '#b35c00', fontSize: 11, marginLeft: 8 }}>
                        {poojaDropOpen ? '▲' : '▼'}
                      </span>
                    </div>

                    {poojaDropOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        background: '#fff', border: '1.5px solid #e8d5b7',
                        borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 100, overflow: 'hidden',
                      }}>
                        {/* Search input */}
                        <div style={{ padding: '8px 10px', borderBottom: '1px solid #f5ece0', background: '#fdf8f3' }}>
                          <input
                            autoFocus
                            type="text"
                            placeholder="🔍 पूजा शोधा... (मराठी / इंग्रजी)"
                            value={poojaSearch}
                            onChange={e => setPoojaSearch(e.target.value)}
                            style={{
                              width: '100%', border: '1px solid #e0e0e0', borderRadius: 8,
                              padding: '7px 12px', fontSize: 13, outline: 'none',
                              background: '#fff',
                            }}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>

                        {/* Options list */}
                        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                          {filteredPoojas.length === 0 ? (
                            <div style={{ padding: '14px 16px', color: '#aaa', fontSize: 13, textAlign: 'center' }}>
                              कोणतीही पूजा सापडली नाही
                            </div>
                          ) : filteredPoojas.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setForm(f => ({ ...f, pooja_id: p.id }));
                                setPoojaDropOpen(false);
                                setPoojaSearch('');
                              }}
                              style={{
                                padding: '10px 16px', cursor: 'pointer', fontSize: 14,
                                background: String(form.pooja_id) === String(p.id) ? '#fff8f0' : '#fff',
                                borderLeft: String(form.pooja_id) === String(p.id) ? '3px solid #b35c00' : '3px solid transparent',
                                transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#fdf3e7'}
                              onMouseLeave={e => e.currentTarget.style.background = String(form.pooja_id) === String(p.id) ? '#fff8f0' : '#fff'}
                            >
                              <span style={{ fontWeight: 600 }}>{p.name_mr}</span>
                              {p.name_en && (
                                <span style={{ color: '#aaa', fontSize: 12, marginLeft: 8 }}>{p.name_en}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Date + Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={field}>
                      <label style={labelStyle}>📅 पूजेची तारीख <span style={{ color: '#e53935' }}>*</span></label>
                      <input type="date" className="form-control" value={form.booking_date} min={MIN_DATE}
                        onChange={e => setForm(f => ({ ...f, booking_date: e.target.value }))} style={inputStyle} />
                    </div>
                    <div style={field}>
                      <label style={labelStyle}>⏰ पूजेची वेळ <span style={{ color: '#e53935' }}>*</span></label>
                      <select className="form-control" value={form.booking_time}
                        onChange={e => setForm(f => ({ ...f, booking_time: e.target.value }))} style={inputStyle}>
                        <option value="">-- वेळ निवडा --</option>
                        {TIME_GROUPS.map(g => (
                          <optgroup key={g.group} label={g.group}>
                            {g.times.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Mode */}
                  <div style={field}>
                    <label style={labelStyle}>🏠 पूजा पद्धत <span style={{ color: '#e53935' }}>*</span></label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { val: 'offline', label: '🏠 घरी (Offline)', desc: 'पुजारी घरी येतात' },
                        { val: 'online',  label: '💻 ऑनलाइन',        desc: 'व्हिडिओ कॉलवर' },
                      ].map(opt => (
                        <label key={opt.val} style={{
                          flex: 1, cursor: 'pointer', borderRadius: 12,
                          border: form.mode === opt.val ? '2px solid #b35c00' : '1px solid #e0e0e0',
                          background: form.mode === opt.val ? '#fff8f0' : '#fff',
                          padding: '12px 14px', transition: 'all 0.15s',
                        }}>
                          <input type="radio" value={opt.val} checked={form.mode === opt.val}
                            onChange={() => setForm(f => ({ ...f, mode: opt.val }))} style={{ display: 'none' }} />
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{opt.desc}</div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Samagri */}
                  <div style={field}>
                    <label style={labelStyle}>
                      📦 सामग्रीसह बुकिंग?
                      <span title="पुजारी सर्व पूजा साहित्य घेऊन येतील" style={{ marginLeft: 6, cursor: 'help', color: '#b35c00', fontSize: 12 }}>ℹ️ माहिती</span>
                    </label>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[
                        { val: true,  label: '✅ हो, सामग्रीसह', desc: 'सर्व साहित्य समाविष्ट' },
                        { val: false, label: '❌ नाही',           desc: 'स्वतः साहित्य आणा' },
                      ].map(opt => (
                        <label key={String(opt.val)} style={{
                          flex: 1, cursor: 'pointer', borderRadius: 12,
                          border: form.samagri === opt.val ? '2px solid #b35c00' : '1px solid #e0e0e0',
                          background: form.samagri === opt.val ? '#fff8f0' : '#fff',
                          padding: '12px 14px', transition: 'all 0.15s',
                        }}>
                          <input type="radio" checked={form.samagri === opt.val}
                            onChange={() => setForm(f => ({ ...f, samagri: opt.val }))} style={{ display: 'none' }} />
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{opt.label}</div>
                          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{opt.desc}</div>
                        </label>
                      ))}
                    </div>

                    {/* Price breakdown — only show when puja is selected */}
                    {selectedPooja && (
                      <PriceBreakdown pooja={selectedPooja} withSamagri={form.samagri} />
                    )}
                  </div>

                  {/* Location */}
                  <div style={field}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ ...labelStyle, margin: 0 }}>📍 स्थान <span style={{ color: '#e53935' }}>*</span></label>
                      <button type="button" onClick={detectLocation} disabled={locationStatus === 'detecting'}
                        style={{
                          background: locationStatus === 'done' ? '#e8f5e9' : '#fff8f0',
                          border: `1px solid ${locationStatus === 'done' ? '#a5d6a7' : '#e8d5b7'}`,
                          color: locationStatus === 'done' ? '#2e7d32' : '#b35c00',
                          borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: 13,
                          display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600,
                        }}>
                        <FaLocationDot />
                        {locationStatus === 'detecting' ? 'शोधत आहे...' : locationStatus === 'done' ? '✓ स्थान मिळाले' : 'GPS वापरा'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <input className="form-control" placeholder="शहर / गाव *" value={form.city}
                        onChange={e => setForm(f => ({ ...f, city: e.target.value }))} style={inputStyle} />
                      <input className="form-control" placeholder="जिल्हा" value={form.district}
                        onChange={e => setForm(f => ({ ...f, district: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>

                  <div style={field}>
                    <label style={labelStyle}>🏠 संपूर्ण पत्ता</label>
                    <input className="form-control" placeholder="घर क्र., गल्ली, वाडी..." value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))} style={inputStyle} />
                  </div>

                  <div style={field}>
                    <label style={labelStyle}>💬 विशेष सूचना</label>
                    <textarea className="form-control" rows={2} value={form.special_notes}
                      placeholder="काही विशेष विनंती असल्यास लिहा..."
                      onChange={e => setForm(f => ({ ...f, special_notes: e.target.value }))}
                      style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#777', marginBottom: 24 }}>
                    <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: '#b35c00', flexShrink: 0 }} />
                    <span>
                      माहिती देऊन आपण आमच्या{' '}
                      <span style={{ color: '#b35c00', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/contact')}>गोपनीयता धोरण</span>
                      {' '}व अटींशी सहमत आहात.
                    </span>
                  </label>

                  <button className="btn btn-primary" style={primaryBtn} onClick={goToNearby}>
                    पुढे — जवळचे पुजारी पाहा →
                  </button>
                </div>
              )}

              {/* STEP 2: Nearby Pujaris */}
              {step === 2 && (
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b35c00', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      ← मागे
                    </button>
                  </div>

                  <div style={sectionHeader}>
                    <div style={iconCircle('#fff8f0', '#b35c00')}>📍</div>
                    <div>
                      <h2 style={cardH2}>{pujariFallback ? 'उपलब्ध पुजारी' : `${form.city} मधील पुजारी`}</h2>
                      <p style={cardSub}>{selectedPooja?.name_mr} साठी</p>
                    </div>
                  </div>
                  <div style={divider} />

                  {pujariFallback && (
                    <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7c5c00', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>ℹ️</span>
                      <span>{form.city} परिसरात अद्याप पुजारी नोंदणीकृत नाहीत. बुकिंग केल्यावर आम्ही जवळचे पुजारी नेमू.</span>
                    </div>
                  )}

                  {loadingPujaris ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                      <div className="spinner" />
                      <p style={{ color: '#888', marginTop: 12 }}>पुजारी शोधत आहे...</p>
                    </div>
                  ) : nearbyPujaris.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: '#888' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>🙏</div>
                      <p style={{ fontWeight: 600, color: '#555' }}>{form.city} परिसरात अद्याप पुजारी उपलब्ध नाहीत.</p>
                      <p style={{ fontSize: 13 }}>तरीही बुकिंग करा — आम्ही मॅन्युअली जवळचे पुजारी नियुक्त करू.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      {nearbyPujaris.map(p => (
                        <div key={p.id} onClick={() => setSelectedPujari(p.id === selectedPujari ? null : p.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            padding: '14px 16px', borderRadius: 14,
                            border: selectedPujari === p.id ? '2px solid #b35c00' : '1px solid #e8d5b7',
                            background: selectedPujari === p.id ? '#fff8f0' : '#fff',
                            cursor: 'pointer', transition: 'all 0.15s',
                            boxShadow: selectedPujari === p.id ? '0 4px 16px rgba(179,92,0,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                          }}>
                          <div style={{
                            width: 58, height: 58, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg,#FF8C00,#E07B2A)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          }}>
                            {p.photo_url
                              ? <img src={getImageUrl(p.photo_url)} alt={p.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : '🙏'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 800, fontSize: 15 }}>{p.full_name}</span>
                              {p.is_verified && <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20 }}>✓ सत्यापित</span>}
                            </div>
                            <div style={{ fontSize: 13, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <FaLocationDot style={{ fontSize: 11 }} />{p.city}
                              {p.distance_km != null && <span style={{ color: '#b35c00', fontWeight: 700 }}>• {p.distance_km} km</span>}
                              {p.experience_yrs > 0 && <span>• {p.experience_yrs} वर्षे अनुभव</span>}
                            </div>
                            {p.specializations && (
                              <div style={{ fontSize: 12, color: '#b35c00', marginTop: 4, fontWeight: 600 }}>{p.specializations}</div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f7c948', fontWeight: 800, fontSize: 15, justifyContent: 'flex-end' }}>
                              <FaStar style={{ fontSize: 13 }} />{p.avg_rating || '—'}
                            </div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>{p.total_reviews || 0} अभिप्राय</div>
                            {selectedPujari === p.id && (
                              <div style={{ marginTop: 6 }}>
                                <FaCircleCheck style={{ color: '#b35c00', fontSize: 22 }} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Booking Summary */}
                  <div style={{ background: 'linear-gradient(135deg, #fff8f0, #fdf3e7)', border: '1px solid #e8d5b7', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                    <div style={{ fontWeight: 800, color: '#7c2d00', marginBottom: 12, fontSize: 15, fontFamily: 'Noto Serif Devanagari, serif' }}>📋 बुकिंग सारांश</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                      {[
                        ['📿 पूजा',     selectedPooja?.name_mr || '—'],
                        ['📅 तारीख',    form.booking_date],
                        ['⏰ वेळ',      TIMES.find(t => t.value === form.booking_time)?.label || form.booking_time],
                        ['📦 सामग्री',  form.samagri ? '✅ हो' : '❌ नाही'],
                        ['🏠 पद्धत',   form.mode === 'online' ? 'ऑनलाइन' : 'घरी'],
                        ...(selectedPooja?.price ? [['💰 एकूण किंमत', `₹${(
                          form.samagri
                            ? Number(selectedPooja.price) + Number(selectedPooja.samagri_price || 0)
                            : Number(selectedPooja.price)
                        ).toLocaleString('mr-IN')}`]] : []),
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: 'contents' }}>
                          <span style={{ color: '#888' }}>{k}</span>
                          <span style={{ fontWeight: 700, color: '#333' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary" style={primaryBtn} onClick={handleBook} disabled={submitting}>
                    {submitting ? '⏳ बुकिंग होत आहे...' : '🙏 बुकिंग निश्चित करा'}
                  </button>
                </div>
              )}

              {/* STEP 3: Success */}
              {step === 3 && (
                <div style={{ ...card, textAlign: 'center', padding: '52px 32px' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
                    border: '3px solid #a5d6a7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, margin: '0 auto 20px',
                  }}>🎉</div>
                  <h2 style={{ color: '#2e7d32', fontSize: 26, fontFamily: 'Noto Serif Devanagari, serif', margin: '0 0 8px' }}>
                    बुकिंग यशस्वी झाली!
                  </h2>
                  <p style={{ color: '#777', marginBottom: 20, fontSize: 14 }}>
                    तुमची बुकिंग नोंदणी झाली आहे. आम्ही लवकरच पुजारी नियुक्त करू.
                  </p>
                  {bookingCode && (
                    <div style={{
                      display: 'inline-block',
                      background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                      border: '2px solid #a5d6a7', borderRadius: 14,
                      padding: '14px 32px', marginBottom: 24,
                    }}>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>बुकिंग कोड</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#1b5e20', letterSpacing: 3 }}>#{bookingCode}</div>
                    </div>
                  )}
                  <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>
                    WhatsApp / SMS वर बुकिंग पुष्टी मिळेल.
                  </p>
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }} onClick={() => navigate('/my-bookings')}>
                      📋 माझ्या बुकिंग पाहा
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: 15 }} onClick={() => navigate('/')}>
                      🏠 मुख्यपृष्ठ
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Trust Panel ────────────────────────────── */}
            {step < 3 && (
              <div className="book-pujari-sidebar" style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>

                {/* Selected pooja preview */}
                {selectedPooja && (
                  <div style={{ ...card, padding: '14px 16px' }}>
                    <div style={{ fontSize: 10, color: '#b35c00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>निवडलेली पूजा</div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#7c2d00', marginBottom: 2, fontFamily: 'Noto Serif Devanagari, serif' }}>
                      {selectedPooja.name_mr}
                    </div>
                    {selectedPooja.price && (
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#b35c00' }}>
                          ₹{(form.samagri
                              ? Number(selectedPooja.price) + Number(selectedPooja.samagri_price || 0)
                              : Number(selectedPooja.price)
                            ).toLocaleString('mr-IN')}
                          <span style={{ fontSize: 11, color: '#888', fontWeight: 400 }}> पासून</span>
                        </div>
                        {form.samagri && Number(selectedPooja.samagri_price) > 0 && (
                          <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                            पूजा ₹{Number(selectedPooja.price).toLocaleString('mr-IN')} + सामग्री ₹{Number(selectedPooja.samagri_price).toLocaleString('mr-IN')}
                          </div>
                        )}
                      </div>
                    )}
                    {selectedPooja.duration_hrs && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>⏱ {selectedPooja.duration_hrs} तास</div>
                    )}
                  </div>
                )}

                {/* Combined card: आमची हमी + बुकिंग कसे करावे */}
                <div style={{ ...card, padding: '16px 18px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 13, color: '#7c2d00', fontWeight: 800 }}>
                    <FaShieldHalved style={{ marginRight: 6, color: '#b35c00', fontSize: 12 }} />आमची हमी
                  </h3>
                  {[
                    'सत्यापित अनुभवी पुजारी',
                    'वेळेवर सेवा हमी',
                    'पूजा न झाल्यास पूर्ण परतावा',
                    'पारंपरिक शास्त्रोक्त विधी',
                    '२४x७ ग्राहक सेवा',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 12, color: '#444' }}>
                      <FaCircleCheck style={{ color: '#22c55e', flexShrink: 0, fontSize: 11 }} />
                      {text}
                    </div>
                  ))}

                  <div style={{ height: 1, background: '#f0e0c8', margin: '12px 0' }} />

                  <h3 style={{ margin: '0 0 10px', fontSize: 13, color: '#7c2d00', fontWeight: 800 }}>
                    <FaCalendarCheck style={{ marginRight: 6, color: '#b35c00', fontSize: 12 }} />बुकिंग कसे करावे?
                  </h3>
                  {[
                    'पूजेचा प्रकार व तारीख निवडा',
                    'शहर/पत्ता द्या व GPS वापरा',
                    'जवळचे पुजारी पाहा व निवडा',
                    'बुकिंग निश्चित करा',
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 12, color: '#555' }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff8f0', border: '1px solid #e8d5b7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#b35c00', flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      {s}
                    </div>
                  ))}
                </div>

                {/* WhatsApp help */}
                <a href="https://wa.me/9561903219?text=मला पुजारी बुक करायचा आहे." target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#25d366', borderRadius: 12, padding: '12px 16px',
                    textDecoration: 'none', color: '#fff',
                  }}>
                  <FaWhatsapp style={{ fontSize: 20, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>WhatsApp वर चौकशी करा</div>
                    <div style={{ fontSize: 11, opacity: 0.9 }}>तत्काळ मदत मिळेल</div>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Shared style constants ────────────────────────────────────
const card = {
  background: '#fff',
  borderRadius: 12,
  padding: '16px 18px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  border: '1px solid #f0e0c8',
};

const sectionHeader = {
  display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16,
};

const iconCircle = (bg, color) => ({
  width: 44, height: 44, borderRadius: '50%',
  background: bg, border: `1.5px solid ${color}30`,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 20, flexShrink: 0,
});

const divider = {
  height: 1, background: '#f5ece0', margin: '0 0 20px',
};

const cardH2 = {
  margin: 0, fontSize: 18, color: '#7c2d00',
  fontFamily: 'Noto Serif Devanagari, serif', fontWeight: 800, lineHeight: 1.3,
};

const cardSub = {
  margin: 0, fontSize: 14, color: '#999', marginTop: 2,
};

const field = { marginBottom: 16 };

const labelStyle = {
  display: 'block', marginBottom: 7, fontSize: 14, fontWeight: 700, color: '#444',
};

const inputStyle = {
  borderRadius: 10, border: '1px solid #e0e0e0',
  padding: '11px 16px', fontSize: 15, width: '100%',
  transition: 'border-color 0.15s',
};

const primaryBtn = {
  width: '100%', padding: '13px 0', fontSize: 16, fontWeight: 700,
  borderRadius: 10, letterSpacing: 0.5,
};
