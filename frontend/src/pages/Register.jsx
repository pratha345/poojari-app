// src/pages/Register.jsx
import SEOHead from '../components/SEOHead';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { authAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.password) {
      toast.error('कृपया सर्व आवश्यक माहिती भरा.'); return;
    }
    if (form.password.length < 6) {
      toast.error('पासवर्ड किमान ६ अक्षरांचा असावा.'); return;
    }
    if (form.password !== form.confirm) {
      toast.error('पासवर्ड जुळत नाही.'); return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({
        name: form.name, phone: form.phone,
        email: form.email || undefined, password: form.password,
      });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success('नोंदणी यशस्वी! स्वागत आहे 🙏');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'नोंदणी करताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.top}>
            <span className={styles.topIcon}>🙏</span>
            <h1>नवीन नोंदणी</h1>
            <p>पूजारी वर आपले खाते तयार करा</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>पूर्ण नाव *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="form-control" placeholder="आपले संपूर्ण नाव"/>
            </div>
            <div className="form-group">
              <label>फोन नंबर *</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                className="form-control" placeholder="१०-अंकी फोन नंबर" maxLength={10}/>
            </div>
            <div className="form-group">
              <label>ईमेल (पर्यायी)</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="form-control" placeholder="your@email.com"/>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label>पासवर्ड *</label>
                <input type="password" name="password" value={form.password} onChange={handleChange}
                  className="form-control" placeholder="किमान ६ अक्षरे"/>
              </div>
              <div className="form-group">
                <label>पासवर्ड पुन्हा *</label>
                <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                  className="form-control" placeholder="पुन्हा टाका"/>
              </div>
            </div>
            <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
              {loading ? '⏳ नोंदणी होत आहे...' : '✅ नोंदणी करा'}
            </button>
          </form>
          <div className={styles.divider}><span>किंवा</span></div>
          <p className={styles.switchLink}>
            आधीच खाते आहे? <Link to="/login">लॉगिन करा</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
