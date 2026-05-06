// src/pages/Login.jsx
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { authAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const location     = useLocation();
  const from         = location.state?.from || '/';
  const [mode,  setMode]  = useState('password'); // 'password' | 'otp'
  const [step,  setStep]  = useState(1);          // OTP: 1=phone, 2=verify
  const [loading,setLoading] = useState(false);
  const [form, setForm] = useState({ phone: '', password: '', otp: '' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) { toast.error('सर्व माहिती भरा.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ phone: form.phone, password: form.password });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`स्वागत आहे, ${user.name}! 🙏`);
      // Redirect based on role
      if (user.role === 'super_admin' || user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'pujari') {
        navigate('/pujari-dashboard', { replace: true });
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'लॉगिन करताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!form.phone) { toast.error('फोन नंबर टाका.'); return; }
    setLoading(true);
    try {
      await authAPI.sendOtp(form.phone);
      toast.success('OTP पाठवला आहे!');
      setStep(2);
    } catch (err) {
      toast.error('OTP पाठवताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!form.otp) { toast.error('OTP टाका.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ phone: form.phone, otp: form.otp });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`स्वागत आहे! 🙏`);
      if (user.role === 'super_admin' || user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'pujari') {
        navigate('/pujari-dashboard', { replace: true });
      } else {
        navigate(from === '/login' ? '/' : from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP चुकीचा आहे.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.top}>
            <span className={styles.topIcon}>🪔</span>
            <h1>लॉगिन करा</h1>
            <p>आपल्या खात्यात प्रवेश करा</p>
          </div>

          {/* Mode Toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === 'password' ? styles.modeActive : ''}`}
              onClick={() => { setMode('password'); setStep(1); }}
            >पासवर्ड</button>
            <button
              className={`${styles.modeBtn} ${mode === 'otp' ? styles.modeActive : ''}`}
              onClick={() => { setMode('otp'); setStep(1); }}
            >OTP लॉगिन</button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin}>
              <div className="form-group">
                <label>फोन नंबर किंवा ईमेल *</label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange}
                  className="form-control" placeholder="उदा: 9307720459 किंवा email@example.com"/>
              </div>
              <div className="form-group">
                <label>पासवर्ड *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  className="form-control" placeholder="आपला पासवर्ड टाका"/>
              </div>
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? '⏳ लॉगिन होत आहे...' : '🙏 लॉगिन करा'}
              </button>
              <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
                  🔑 पासवर्ड विसरलात?
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={step === 1 ? handleSendOtp : handleVerifyOtp}>
              <div className="form-group">
                <label>फोन नंबर *</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                  className="form-control" placeholder="उदा: 9307720459"
                  maxLength={10} disabled={step === 2}/>
              </div>
              {step === 2 && (
                <div className="form-group">
                  <label>OTP *</label>
                  <input type="text" name="otp" value={form.otp} onChange={handleChange}
                    className={`form-control ${styles.otpInput}`}
                    placeholder="6 अंकी OTP टाका" maxLength={6} autoFocus/>
                  <p className={styles.hint}>
                    OTP {form.phone} वर पाठवला आहे.{' '}
                    <button type="button" className={styles.resend} onClick={() => { setStep(1); setForm(f => ({...f, otp: ''})); }}>
                      बदला
                    </button>
                  </p>
                </div>
              )}
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? '⏳...' : step === 1 ? '📲 OTP पाठवा' : '✅ OTP पडताळा'}
              </button>
            </form>
          )}

          <div className={styles.divider}><span>किंवा</span></div>
          <p className={styles.switchLink}>
            खाते नाही?{' '}
            <Link to="/register">येथे नोंदणी करा</Link>
          </p>
          <p className={styles.switchLink}>
            पुजारी म्हणून नोंदणी करायची आहे?{' '}
            <Link to="/pujari-nondni">पुजारी व्हा</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
