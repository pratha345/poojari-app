// src/pages/Contact.jsx
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { contactAPI } from '../api/index.js';
import styles from './Contact.module.css';

const PUJA_IMAGES = [
  'satyanarayan-pooja.png',
  'ganpati-sthapna.png',
  'gruhpravesh-gruhshanti.png',
  'lagn-vidhi.png',
  'lakshmi-poojan-diwali.png',
  'rudra-abhishek.png',
  'navgraha-shanti-havan.png',
  'vastu-shanti-udak.png',
  'bhoomi-pujan.png',
  'engagement-pooja.png',
].map(f => `/uploads/poojas/${f}`);

const SUBJECTS = ['बुकिंग चौकशी', 'पुजारी नोंदणी', 'पेमेंट समस्या', 'तक्रार', 'इतर'];

const CONTACT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'संपर्क करा | Pojjari',
  url: 'https://pojjari.com/contact',
};

export default function Contact() {
  const [current, setCurrent] = useState(0);
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  // auto-slide every 3.5 s
  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % PUJA_IMAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const pickSubject  = s => setForm(f => ({ ...f, subject: f.subject === s ? '' : s }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) { toast.error('नाव आणि संदेश आवश्यक आहे.'); return; }
    setLoading(true);
    try {
      await contactAPI.send(form);
      toast.success('संदेश पाठवला! आम्ही लवकरच संपर्क करू. 🙏');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch { toast.error('संदेश पाठवताना त्रुटी झाली.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SEOHead
        title="संपर्क करा - पूजारी पूजा बुकिंग"
        description="पूजारी सेवेशी संपर्क करा. पूजा बुकिंग, पुजारी नोंदणी किंवा कोणत्याही प्रश्नासाठी आम्हाला संदेश पाठवा."
        keywords="contact pojjari, पूजारी संपर्क, पूजा बुकिंग"
        canonical="/contact"
        schema={CONTACT_SCHEMA}
      />
      <Header />

      <main className={styles.split}>

        {/* ── Left: image slider ── */}
        <div className={styles.slider}>
          {PUJA_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`पूजा ${i + 1}`}
              className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
            />
          ))}

          {/* overlay gradient for readability */}
          <div className={styles.sliderOverlay} />

          {/* dot indicators */}
          <div className={styles.dots}>
            {PUJA_IMAGES.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`स्लाइड ${i + 1}`}
              />
            ))}
          </div>

          {/* text over image */}
          <div className={styles.sliderText}>
            <p className={styles.sliderBadge}>पूजारी सेवा</p>
            <h2 className={styles.sliderHeading}>श्रद्धा, विधी आणि भक्तीने</h2>
            <p className={styles.sliderSub}>महाराष्ट्रभर अनुभवी पुजारी उपलब्ध</p>
          </div>
        </div>

        {/* ── Right: form ── */}
        <div className={styles.formWrap}>
          <div className={styles.formBox}>
            <h1 className={styles.formTitle}>संपर्क करा</h1>
            <p className={styles.formSub}>
              पूजा बुकिंग, पुजारी नोंदणी किंवा इतर कोणत्याही प्रश्नासाठी आम्हाला संदेश पाठवा.
              आम्ही २४ तासांच्या आत उत्तर देऊ.
            </p>

            <form onSubmit={handleSubmit} noValidate>

              <div className={styles.field}>
                <label className={styles.label}>आपले नाव <span className={styles.req}>*</span></label>
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  className={styles.input} placeholder="संपूर्ण नाव" />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>ईमेल <span className={styles.req}>*</span></label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    className={styles.input} placeholder="your@email.com" />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>फोन नंबर</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    className={styles.input} placeholder="१०-अंकी नंबर" maxLength={10} />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>विषय</label>
                <div className={styles.chips}>
                  {SUBJECTS.map(s => (
                    <button key={s} type="button"
                      className={`${styles.chip} ${form.subject === s ? styles.chipOn : ''}`}
                      onClick={() => pickSubject(s)}>{s}</button>
                  ))}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>संदेश <span className={styles.req}>*</span></label>
                <textarea name="message" value={form.message} onChange={handleChange}
                  className={styles.textarea} rows={3}
                  placeholder="आपला संदेश येथे लिहा..." />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading
                  ? <><span className={styles.spinner} /> पाठवत आहे...</>
                  : 'संदेश पाठवा'}
              </button>

            </form>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
