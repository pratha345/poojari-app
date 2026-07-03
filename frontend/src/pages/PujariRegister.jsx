// src/pages/PujariRegister.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { pujariAPI, poojaAPI, authAPI } from '../api/index.js';
import styles from './PujariRegister.module.css';

const LANGUAGES = ['मराठी','हिंदी','संस्कृत','इंग्रजी','कोकणी','वऱ्हाडी'];

const BRAHMIN_TRADITIONS = [
  'कोकणस्थ (चित्पावन)',
  'देशस्थ ऋग्वेदी',
  'देशस्थ यजुर्वेदी',
  'कऱ्हाडे',
  'सारस्वत (गौड सारस्वत)',
  'पालशे',
  'गुजराती ब्राह्मण',
  'इतर ब्राह्मण',
  'ब्राह्मणेतर',
];

const COUNTRY_CODES = [
  { code: '+91',  flag: '🇮🇳', name: 'India (+91)'       },
  { code: '+1',   flag: '🇺🇸', name: 'USA/Canada (+1)'   },
  { code: '+44',  flag: '🇬🇧', name: 'UK (+44)'           },
  { code: '+971', flag: '🇦🇪', name: 'UAE (+971)'         },
  { code: '+61',  flag: '🇦🇺', name: 'Australia (+61)'    },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore (+65)'    },
  { code: '+64',  flag: '🇳🇿', name: 'New Zealand (+64)'  },
  { code: '+49',  flag: '🇩🇪', name: 'Germany (+49)'      },
];

const STEPS = [
  { n: 1, label: 'वैयक्तिक' },
  { n: 2, label: 'स्थान'     },
  { n: 3, label: 'भाषा'      },
  { n: 4, label: 'विशेषज्ञता'},
  { n: 5, label: 'दस्तऐवज'  },
];

export default function PujariRegister() {
  const navigate = useNavigate();
  const [categories,   setCategories]   = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // OTP verification state
  const [otpSent,     setOtpSent]     = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode,     setOtpCode]     = useState('');
  const [otpLoading,  setOtpLoading]  = useState(false);
  const [form, setForm] = useState({
    full_name:         '',
    experience_yrs:    '',
    city:              '',
    district:          '',
    country:           'India',
    country_code:      '+91',
    phone:             '',
    address:           '',
    bio:               '',
    brahmin_tradition: '',
    languages:         ['मराठी'],
    specializations:   [],
    photo:             null,
    certificate:       null,
  });

  useEffect(() => {
    poojaAPI.getCategories()
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));
  const handleChange = e => {
    set(e.target.name, e.target.value);
    // Reset OTP if phone number changes
    if (e.target.name === 'phone') {
      setOtpSent(false); setOtpVerified(false); setOtpCode('');
    }
  };

  const isIndianPhone = form.country_code === '+91' && form.phone.replace(/\D/g, '').length === 10;

  const handleSendOtp = async () => {
    const phone = form.phone.replace(/\D/g, '');
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
    try {
      await authAPI.verifyOtp({ phone: form.phone.replace(/\D/g, ''), otp: otpCode });
      setOtpVerified(true);
      toast.success('फोन सत्यापित! ✅');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP चुकीचा आहे.');
    } finally { setOtpLoading(false); }
  };

  const toggleLang = lang =>
    set('languages', form.languages.includes(lang)
      ? form.languages.filter(l => l !== lang)
      : [...form.languages, lang]);

  const toggleSpec = id =>
    set('specializations', form.specializations.includes(id)
      ? form.specializations.filter(s => s !== id)
      : [...form.specializations, id]);

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    set('photo', file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.city || !form.address) {
      toast.error('कृपया नाव, शहर आणि पत्ता भरा.'); return;
    }
    if (isIndianPhone && !otpVerified) {
      toast.error('आधी मोबाईल OTP सत्यापन करा.'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'photo'        && val) { fd.append('photo',       val); return; }
        if (key === 'certificate'  && val) { fd.append('certificate', val); return; }
        if (key === 'country_code')        { return; }
        if (key === 'phone') {
          const full = form.country_code !== '+91'
            ? `${form.country_code}${val.replace(/^0+/, '')}` : val;
          if (full) fd.append('phone', full);
          return;
        }
        if (Array.isArray(val)) { val.forEach(v => fd.append(`${key}[]`, v)); return; }
        if (val !== null && val !== '') fd.append(key, val);
      });
      await pujariAPI.register(fd);
      toast.success('नोंदणी अर्ज पाठवला! आमची टीम तपासणी करेल, मंजूरीनंतर SMS येईल. 🙏');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'नोंदणी करताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>

        {/* ── Hero ───────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>

            {/* LEFT — text + steps */}
            <div className={styles.heroLeft}>
              <h1 className={styles.heroTitle}>पुजारी म्हणून नोंदणी करा</h1>
              <p className={styles.heroSub}>
                आपले वैदिक ज्ञान व अनुभव हजारो भक्तांपर्यंत पोहोचवा —<br/>
                घरबसल्या बुकिंग मिळवा आणि चांगली कमाई करा
              </p>

              {/* Step indicator */}
              <div className={styles.steps}>
                {STEPS.map((s, i) => (
                  <React.Fragment key={s.n}>
                    <div className={styles.step}>
                      <div className={styles.stepDot}>{s.n}</div>
                      <span className={styles.stepLabel}>{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && <div className={styles.stepLine} />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* RIGHT — pujari image */}
            <div className={styles.heroRight}>
              <picture>
                <source srcSet="/pujari-hero.webp" type="image/webp" />
                <img
                  src="/pujari-hero.png"
                  alt="पुजारी सेवा"
                  className={styles.heroImg}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </picture>
            </div>

          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.layout}>

            {/* ── Form ─────────────────────────────────────── */}
            <form className={styles.form} onSubmit={handleSubmit} noValidate>

              {/* Section 1 — Personal */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>👤 वैयक्तिक माहिती</h2>

                {/* Photo upload */}
                <div className={styles.photoSection}>
                  <label className={styles.photoWrap} htmlFor="photoInput">
                    <div className={styles.photoPreview}>
                      {photoPreview
                        ? <img src={photoPreview} alt="फोटो"/>
                        : <span>📷</span>
                      }
                    </div>
                    <div className={styles.photoOverlay}>📸</div>
                    <input
                      id="photoInput" type="file" accept="image/*"
                      onChange={handlePhoto} style={{ display: 'none' }}
                    />
                  </label>
                  <div className={styles.photoInfo}>
                    <strong>प्रोफाईल फोटो</strong>
                    <p>स्पष्ट, व्यावसायिक फोटो असल्यास अधिक बुकिंग मिळतात.<br/>JPG / PNG — जास्तीत जास्त ५ MB</p>
                    <label className={styles.photoBtn} htmlFor="photoInput">
                      📷 फोटो {photoPreview ? 'बदला' : 'जोडा'}
                    </label>
                  </div>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      पूर्ण नाव <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="text" name="full_name" value={form.full_name}
                      onChange={handleChange} className={styles.input}
                      placeholder="पं. राम शास्त्री / आपले संपूर्ण नाव"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>अनुभव (वर्षे)</label>
                    <input
                      type="number" name="experience_yrs" value={form.experience_yrs}
                      onChange={handleChange} className={styles.input}
                      placeholder="उदा: १०" min={0} max={70}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>ब्राह्मण परंपरा / जात</label>
                  <select
                    name="brahmin_tradition" value={form.brahmin_tradition}
                    onChange={handleChange} className={styles.select}
                  >
                    <option value="">— परंपरा निवडा —</option>
                    {BRAHMIN_TRADITIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>स्वतःबद्दल सांगा</label>
                  <textarea
                    name="bio" value={form.bio} onChange={handleChange}
                    className={styles.textarea} rows={3}
                    placeholder="आपला अनुभव, विशेषज्ञता, कुळाचार याबद्दल थोडक्यात सांगा..."
                  />
                </div>
              </div>

              {/* Section 2 — Location */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📍 स्थान माहिती</h2>

                <div className={styles.field}>
                  <label className={styles.label}>देश</label>
                  <select name="country" value={form.country} onChange={handleChange} className={styles.select}>
                    <option value="India">🇮🇳 India (भारत)</option>
                    <option value="USA">🇺🇸 USA (अमेरिका)</option>
                    <option value="UK">🇬🇧 United Kingdom (ब्रिटन)</option>
                    <option value="UAE">🇦🇪 UAE (दुबई)</option>
                    <option value="Canada">🇨🇦 Canada (कॅनडा)</option>
                    <option value="Australia">🇦🇺 Australia (ऑस्ट्रेलिया)</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                    <option value="New Zealand">🇳🇿 New Zealand</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="Other">🌍 Other (इतर)</option>
                  </select>
                </div>

                <div className={styles.grid2}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      शहर / City <span className={styles.req}>*</span>
                    </label>
                    <input
                      type="text" name="city" value={form.city}
                      onChange={handleChange} className={styles.input}
                      placeholder="पुणे / Pune / Dubai"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>जिल्हा / State</label>
                    <input
                      type="text" name="district" value={form.district}
                      onChange={handleChange} className={styles.input}
                      placeholder="पुणे / Maharashtra"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    मोबाईल नंबर <span className={styles.req}>*</span>
                  </label>
                  <div className={styles.phoneRow}>
                    <select
                      name="country_code" value={form.country_code}
                      onChange={handleChange}
                      className={`${styles.select} ${styles.phoneCode}`}
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                    <input
                      type="tel" name="phone" value={form.phone}
                      onChange={handleChange} className={styles.input}
                      placeholder="नंबर (country code शिवाय)"
                    />
                  </div>
                </div>

                {/* OTP Verification — only for Indian numbers */}
                {isIndianPhone && (
                  <div className={styles.field}>
                    {otpVerified ? (
                      <div className={styles.otpVerifiedBadge}>
                        ✅ मोबाईल नंबर सत्यापित झाला
                      </div>
                    ) : !otpSent ? (
                      <button
                        type="button"
                        className={styles.otpSendBtn}
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                      >
                        {otpLoading ? '⏳ पाठवत आहे...' : '📱 OTP पाठवा — फोन सत्यापन करा'}
                      </button>
                    ) : (
                      <div className={styles.otpInputRow}>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="6 अंकी OTP टाका"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className={styles.input}
                        />
                        <button
                          type="button"
                          className={styles.otpVerifyBtn}
                          onClick={handleVerifyOtp}
                          disabled={otpLoading}
                        >
                          {otpLoading ? '⏳' : '✅ पडताळा'}
                        </button>
                        <button
                          type="button"
                          className={styles.otpResendBtn}
                          onClick={handleSendOtp}
                          disabled={otpLoading}
                        >
                          🔄 पुन्हा पाठवा
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className={styles.field} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>
                    संपूर्ण पत्ता <span className={styles.req}>*</span>
                  </label>
                  <textarea
                    name="address" value={form.address} onChange={handleChange}
                    className={styles.textarea} rows={2}
                    placeholder="मकान नं., रस्ता, भाग, शहर..."
                  />
                </div>
              </div>

              {/* Section 3 — Languages */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>🗣️ भाषा ज्ञान</h2>
                <p className={styles.hint}>आपण कोणत्या भाषांत पूजा करू शकता ते निवडा:</p>
                <div className={styles.chipGrid}>
                  {LANGUAGES.map(lang => {
                    const active = form.languages.includes(lang);
                    return (
                      <button
                        key={lang} type="button"
                        className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                        onClick={() => toggleLang(lang)}
                      >
                        {active && <span className={styles.chipCheck}>✓</span>}
                        {lang}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4 — Specializations */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>🛕 विशेषज्ञता (पूजा प्रकार)</h2>
                <p className={styles.hint}>आपण कोणत्या पूजा करतो ते निवडा (एक किंवा अधिक):</p>
                <div className={styles.chipGrid}>
                  {categories.map(cat => {
                    const active = form.specializations.includes(cat.id);
                    return (
                      <button
                        key={cat.id} type="button"
                        className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                        onClick={() => toggleSpec(cat.id)}
                      >
                        {active && <span className={styles.chipCheck}>✓</span>}
                        {cat.name_mr}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 5 — Documents */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📄 दस्तऐवज (पर्यायी)</h2>
                <div className={styles.field} style={{ marginBottom: 0 }}>
                  <label className={styles.label}>प्रमाणपत्र / सनद अपलोड करा</label>
                  <input
                    type="file" accept=".pdf,image/*"
                    onChange={e => set('certificate', e.target.files[0])}
                    className={styles.input}
                    style={{ padding: '8px 14px', cursor: 'pointer' }}
                  />
                  <p className={styles.hint} style={{ marginTop: 6, marginBottom: 0 }}>
                    PDF किंवा image — जास्तीत जास्त ५ MB. पंडित/शास्त्री पदवी, कुळाचार प्रमाणपत्र इ.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <div className={styles.submitWrap}>
                {isIndianPhone && !otpVerified && (
                  <p className={styles.otpWarning}>
                    ⚠️ नोंदणी करण्यापूर्वी मोबाईल OTP सत्यापन आवश्यक आहे
                  </p>
                )}
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || (isIndianPhone && !otpVerified)}
                >
                  {loading
                    ? <><span>⏳</span> नोंदणी होत आहे...</>
                    : <><span>✅</span> नोंदणी अर्ज सादर करा</>
                  }
                </button>
                <p className={styles.submitNote}>
                  🔒 आपली माहिती सुरक्षित आहे • मंजूरीनंतर SMS येईल
                </p>
              </div>
            </form>

            {/* ── Sidebar ──────────────────────────────────── */}
            <aside className={styles.sidebar}>

              <div className={styles.benefitCard}>
                <h3>💰 पुजारी म्हणून फायदे</h3>
                {[
                  { icon: '💵', title: 'अधिक कमाई',      desc: 'प्रत्येक बुकिंगवर थेट खात्यात पेमेंट.' },
                  { icon: '📱', title: 'सोपी बुकिंग',     desc: 'बुकिंग स्वीकार व नाकारण्याचा अधिकार.' },
                  { icon: '⭐', title: 'प्रसिद्धी',        desc: 'चांगल्या rating मुळे अधिक ग्राहक.' },
                  { icon: '🗓️', title: 'वेळ स्वातंत्र्य', desc: 'स्वतःची उपलब्धता स्वतः ठरवा.' },
                  { icon: '🛡️', title: 'सुरक्षित',        desc: 'वेळेवर आणि सुरक्षित पेमेंट.' },
                ].map(b => (
                  <div key={b.title} className={styles.benefit}>
                    <div className={styles.benefitIconWrap}>{b.icon}</div>
                    <div>
                      <strong>{b.title}</strong>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.processCard}>
                <h3>📋 नोंदणी प्रक्रिया</h3>
                <ol className={styles.processSteps}>
                  {[
                    'अर्ज सादर करा',
                    'आमची टीम तपासणी करेल',
                    'मंजूरी मिळाल्यावर SMS येईल',
                    'Dashboard वर login करा',
                    'बुकिंग मिळवणे सुरू करा!',
                  ].map((step, i) => (
                    <li key={i} className={styles.processStep}>
                      <span className={styles.processNum}>{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
