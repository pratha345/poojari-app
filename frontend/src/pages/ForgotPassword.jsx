// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { authAPI } from '../api/index.js';
import styles from './Auth.module.css';
import fp from './ForgotPassword.module.css';

// Step 1: Enter phone (verify it exists)
// Step 2: Enter new password

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step,     setStep]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);

  // ── STEP 1: Verify phone exists ──────────────────────────────
  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) { toast.error('वैध फोन नंबर टाका.'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(phone);
      toast.success('फोन नंबर सापडला! नवीन पासवर्ड सेट करा.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'फोन नंबर नोंदणीकृत नाही.');
    } finally { setLoading(false); }
  };

  // ── STEP 2: Set new password ─────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) { toast.error('पासवर्ड किमान 6 अक्षरांचा असावा.'); return; }
    if (password !== confirm) { toast.error('पासवर्ड जुळत नाही.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ phone, new_password: password });
      toast.success('पासवर्ड यशस्वीरित्या बदलला! 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'पासवर्ड रीसेट करताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>

          <div className={styles.top}>
            <span className={styles.topIcon}>🔑</span>
            <h1>पासवर्ड विसरलात?</h1>
            <p>नवीन पासवर्ड सेट करा</p>
          </div>

          {/* Step indicators */}
          <div className={fp.steps}>
            <div className={`${fp.step} ${step >= 1 ? fp.active : ''} ${step > 1 ? fp.done : ''}`}>
              <div className={fp.stepCircle}>{step > 1 ? '✓' : '1'}</div>
              <span className={fp.stepLabel}>फोन</span>
            </div>
            <div className={`${fp.stepLine} ${step > 1 ? fp.stepLineDone : ''}`} />
            <div className={`${fp.step} ${step === 2 ? fp.active : ''}`}>
              <div className={fp.stepCircle}>2</div>
              <span className={fp.stepLabel}>नवीन पासवर्ड</span>
            </div>
          </div>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleVerifyPhone}>
              <div className="form-group">
                <label>📱 नोंदणीकृत फोन नंबर *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="उदा: 9561903219"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  maxLength={10}
                  autoFocus
                />
                <p className={fp.hint}>तुमचा नोंदणीकृत फोन नंबर टाका.</p>
              </div>
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? '⏳ तपासत आहे...' : 'पुढे →'}
              </button>
            </form>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleReset}>
              <div className="form-group">
                <label>🔒 नवीन पासवर्ड *</label>
                <div className={fp.passWrap}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-control"
                    placeholder="किमान 6 अक्षरे"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoFocus
                  />
                  <button type="button" className={fp.eyeBtn} onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {password && (
                  <div className={fp.strength}>
                    <div className={fp.strengthBar}>
                      <div className={fp.strengthFill} style={{
                        width: `${Math.min(password.length * 10, 100)}%`,
                        background: password.length < 6 ? '#c62828' : password.length < 10 ? '#f57f17' : '#2e7d32',
                      }} />
                    </div>
                    <span className={fp.strengthLabel}>
                      {password.length < 6 ? 'कमकुवत' : password.length < 10 ? 'मध्यम' : 'मजबूत'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>🔒 पासवर्ड पुष्टी *</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="पुन्हा पासवर्ड टाका"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
                {confirm && password !== confirm && <p className={fp.error}>❌ पासवर्ड जुळत नाही</p>}
                {confirm && password === confirm && confirm.length >= 6 && <p className={fp.success}>✅ पासवर्ड जुळतो</p>}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setStep(1); setPassword(''); setConfirm(''); }}>
                  ← मागे
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                  style={{ flex: 1 }}
                  disabled={loading || password.length < 6 || password !== confirm}
                >
                  {loading ? '⏳ बदलत आहे...' : '🔑 पासवर्ड बदला'}
                </button>
              </div>
            </form>
          )}

          <div className={styles.divider}><span>किंवा</span></div>
          <p className={styles.switchLink}>
            पासवर्ड आठवला? <Link to="/login">लॉगिन करा</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
