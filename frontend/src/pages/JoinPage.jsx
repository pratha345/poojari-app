// src/pages/JoinPage.jsx — Tenant Self-Registration
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import styles from '../styles/JoinPage.module.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const MAHARASHTRA_CITIES = [
  'पुणे','मुंबई','नाशिक','औरंगाबाद','नागपूर','कोल्हापूर','सोलापूर',
  'सातारा','सांगली','रत्नागिरी','अहमदनगर','जळगाव','लातूर','परभणी',
  'बीड','उस्मानाबाद','अमरावती','अकोला','वाशीम','यवतमाळ','बुलढाणा',
  'चंद्रपूर','गडचिरोली','गोंदिया','नंदुरबार','धुळे','ठाणे','रायगड',
  'रत्नागिरी','सिंधुदुर्ग','इतर'
];

export default function JoinPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    business_name: '', contact_name: '', phone: '',
    email: '', password: '', city: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res  = await fetch(`${API}/api/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'त्रुटी झाली.'); return; }
      setSuccess(data.data);
    } catch {
      setError('Server शी connection होत नाही. पुन्हा प्रयत्न करा.');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div className={styles.wrap}>
      <Header />
      <main className={styles.successBox}>
        <div className={styles.successIcon}>🎉</div>
        <h1>नोंदणी यशस्वी झाली!</h1>
        <p>तुमचा <strong>30 दिवसांचा Free Trial</strong> सुरू झाला.</p>
        <div className={styles.infoCard}>
          <div><span>🌐 तुमचा Subdomain</span><strong>{success.subdomain}</strong></div>
          <div><span>📧 Login Email</span><strong>{success.login_email}</strong></div>
          <div><span>📅 Trial संपते</span><strong>{success.trial_ends}</strong></div>
        </div>
        <p className={styles.note}>
          Admin panel वर login करा आणि तुमचे पुजारी, पूजा services setup करा.
        </p>
        <Link to="/admin" className={styles.btnPrimary}>Admin Panel उघडा →</Link>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className={styles.wrap}>
      <SEOHead
        title="पूजारी SaaS — तुमची Pooja Booking Service सुरू करा"
        description="पूजारी platform वर तुमचे pooja booking business सुरू करा. 30 दिवस मोफत trial. पुण्यापासून नागपूरपर्यंत — कोणत्याही शहरात."
        keywords="pooja booking business, pujari service start, pooja app, puja platform"
      />
      <Header />

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <h1>तुमची Pooja Booking Service सुरू करा</h1>
          <p>पूजारी platform वर नोंदणी करा — <strong>30 दिवस पूर्णतः मोफत</strong></p>
          <div className={styles.features}>
            <span>✅ स्वतःचे subdomain</span>
            <span>✅ Pujari management</span>
            <span>✅ Online bookings</span>
            <span>✅ Payment integration</span>
          </div>
        </section>

        {/* Plans */}
        <section className={styles.plans}>
          <div className={`${styles.plan} ${styles.trial}`}>
            <div className={styles.planBadge}>सध्या Free</div>
            <h3>Trial</h3>
            <div className={styles.price}>₹0 <span>/ 30 दिवस</span></div>
            <ul>
              <li>✅ 10 पुजारी</li>
              <li>✅ 50 bookings/month</li>
              <li>✅ Subdomain</li>
              <li>❌ Custom domain</li>
            </ul>
          </div>
          <div className={`${styles.plan} ${styles.basic}`}>
            <h3>Basic</h3>
            <div className={styles.price}>₹999 <span>/ month</span></div>
            <ul>
              <li>✅ 50 पुजारी</li>
              <li>✅ 200 bookings/month</li>
              <li>✅ Subdomain</li>
              <li>✅ Email support</li>
            </ul>
          </div>
          <div className={`${styles.plan} ${styles.premium}`}>
            <div className={styles.planBadge}>Popular</div>
            <h3>Premium</h3>
            <div className={styles.price}>₹2499 <span>/ month</span></div>
            <ul>
              <li>✅ Unlimited पुजारी</li>
              <li>✅ Unlimited bookings</li>
              <li>✅ Custom domain</li>
              <li>✅ Priority support</li>
            </ul>
          </div>
        </section>

        {/* Registration Form */}
        <section className={styles.formSection}>
          <h2>Free Trial सुरू करा</h2>
          <p>नोंदणी करा — Credit card लागत नाही</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label>Business चे नाव *</label>
                <input
                  name="business_name" value={form.business_name}
                  onChange={handleChange} required
                  placeholder="उदा. पूजारी सेवा नाशिक"
                />
              </div>
              <div className={styles.field}>
                <label>तुमचे नाव *</label>
                <input
                  name="contact_name" value={form.contact_name}
                  onChange={handleChange} required
                  placeholder="उदा. Rajesh Sharma"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Mobile नंबर *</label>
                <input
                  name="phone" value={form.phone}
                  onChange={handleChange} required
                  placeholder="9876543210" maxLength={10}
                />
              </div>
              <div className={styles.field}>
                <label>Email *</label>
                <input
                  name="email" value={form.email} type="email"
                  onChange={handleChange} required
                  placeholder="rajesh@example.com"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>शहर *</label>
                <select name="city" value={form.city} onChange={handleChange} required>
                  <option value="">शहर निवडा</option>
                  {MAHARASHTRA_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>Password * (किमान 8 अक्षरे)</label>
                <input
                  name="password" value={form.password} type="password"
                  onChange={handleChange} required minLength={8}
                  placeholder="Admin login साठी password"
                />
              </div>
            </div>

            {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'नोंदणी होत आहे...' : '🚀 Free Trial सुरू करा'}
            </button>

            <p className={styles.terms}>
              नोंदणी करून तुम्ही आमच्या <Link to="/terms">Terms of Service</Link> शी सहमत आहात.
              Trial नंतर upgrade आवश्यक आहे.
            </p>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
