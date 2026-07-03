// src/pages/admin/AdminLogin.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext';
import s from './AdminLogin.module.css';

export default function AdminLogin() {
  const { login, isAdmin, isSuperAdmin, isAbhyasak } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Already logged in → redirect to appropriate page
  if (isAdmin || isSuperAdmin) {
    navigate('/admin/report', { replace: true });
    return null;
  }
  if (isAbhyasak) {
    navigate('/admin/blog', { replace: true });
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) { toast.error('सर्व माहिती भरा.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ phone: form.phone, password: form.password });
      const { token, user } = res.data.data;

      // Allow admin, super_admin, and abhyasak
      const allowedRoles = ['admin', 'super_admin', 'abhyasak'];
      if (!allowedRoles.includes(user.role)) {
        toast.error('हे पोर्टल फक्त प्रशासक/अभ्यासकांसाठी आहे.');
        return;
      }

      login(token, user);
      toast.success(`स्वागत आहे, ${user.name}! 🙏`);

      if (user.role === 'abhyasak') {
        navigate('/admin/blog', { replace: true });
      } else {
        navigate('/admin/report', { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'लॉगिन करताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        {/* Brand */}
        <div className={s.brand}>
          <span className={s.brandIcon}>🙏</span>
          <h1 className={s.brandName}>पूजारी</h1>
          <p className={s.brandSub}>Admin Portal</p>
        </div>

        <h2 className={s.title}>प्रशासक लॉगिन</h2>
        <p className={s.subtitle}>Admin / Abhyasak साठी</p>

        <form onSubmit={handleLogin} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>📱 फोन नंबर किंवा ईमेल</label>
            <input
              className={s.input}
              type="text"
              placeholder="उदा: 9999999999"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              autoFocus
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>🔒 पासवर्ड</label>
            <div className={s.passWrap}>
              <input
                className={s.input}
                type={showPass ? 'text' : 'password'}
                placeholder="आपला पासवर्ड टाका"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" className={s.eyeBtn} onClick={() => setShowPass(p => !p)}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className={s.forgotRow}>
            <Link to="/forgot-password" className={s.forgotLink}>पासवर्ड विसरलात?</Link>
          </div>

          <button type="submit" className={s.submitBtn} disabled={loading}>
            {loading ? '⏳ लॉगिन होत आहे...' : '🔐 लॉगिन करा'}
          </button>
        </form>

        <div className={s.footer}>
          <Link to="/" className={s.backLink}>← मुख्य वेबसाईटवर जा</Link>
        </div>
      </div>
    </div>
  );
}
