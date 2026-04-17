// src/pages/Contact.jsx
import { useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { contactAPI } from '../api/index.js';
import styles from './Contact.module.css';

export default function Contact() {
  const [form,    setForm]    = useState({ name:'', email:'', phone:'', subject:'', message:'' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.message) { toast.error('नाव आणि संदेश आवश्यक आहे.'); return; }
    setLoading(true);
    try {
      await contactAPI.send(form);
      toast.success('संदेश पाठवला! आम्ही लवकरच संपर्क करू. 🙏');
      setForm({ name:'', email:'', phone:'', subject:'', message:'' });
    } catch { toast.error('संदेश पाठवताना त्रुटी झाली.'); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className="container">
            <h1>संपर्क करा</h1>
            <p>प्रश्न, सूचना, किंवा बुकिंग सहाय्यासाठी आम्ही नेहमी उपलब्ध आहोत</p>
          </div>
        </div>
        <div className="container">
          <div className={styles.layout}>
            {/* Contact Info */}
            <div className={styles.infoSection}>
              <h2>आमची संपर्क माहिती</h2>
              {[
                { icon: '📧', label: 'ईमेल',   val: 'info@pojjari.com',  href: 'mailto:info@pojjari.com' },
                { icon: '📞', label: 'फोन',    val: '९३०७७२०४५९',       href: 'tel:9307720459' },
                { icon: '💬', label: 'WhatsApp',val: 'WhatsApp वर संपर्क',href: 'https://wa.me/9307720459' },
                { icon: '📍', label: 'पत्ता',   val: 'रत्नागिरी, महाराष्ट्र', href: null },
                { icon: '🕐', label: 'वेळ',     val: 'सोम - रवि: सकाळी ७ ते रात्री ९', href: null },
              ].map(item => (
                <div key={item.label} className={styles.infoItem}>
                  <span className={styles.infoIcon}>{item.icon}</span>
                  <div>
                    <span className={styles.infoLabel}>{item.label}</span>
                    {item.href
                      ? <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{item.val}</a>
                      : <span>{item.val}</span>
                    }
                  </div>
                </div>
              ))}

              <div className={styles.social}>
                <h3>आम्हाला फॉलो करा</h3>
                <div className={styles.socialLinks}>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className={styles.socialBtn}>🔵 Facebook</a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className={styles.socialBtn}>📸 Instagram</a>
                  <a href="https://youtube.com"   target="_blank" rel="noreferrer" className={styles.socialBtn}>🔴 YouTube</a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={styles.formSection}>
              <h2>संदेश पाठवा</h2>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className="grid-2">
                  <div className="form-group">
                    <label>आपले नाव *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange}
                      className="form-control" placeholder="संपूर्ण नाव"/>
                  </div>
                  <div className="form-group">
                    <label>फोन नंबर</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                      className="form-control" placeholder="१०-अंकी नंबर" maxLength={10}/>
                  </div>
                </div>
                <div className="form-group">
                  <label>ईमेल</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    className="form-control" placeholder="your@email.com"/>
                </div>
                <div className="form-group">
                  <label>विषय</label>
                  <select name="subject" value={form.subject} onChange={handleChange} className="form-control">
                    <option value="">विषय निवडा</option>
                    <option value="बुकिंग चौकशी">बुकिंग चौकशी</option>
                    <option value="पुजारी नोंदणी">पुजारी नोंदणी</option>
                    <option value="पेमेंट समस्या">पेमेंट समस्या</option>
                    <option value="तक्रार">तक्रार</option>
                    <option value="इतर">इतर</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>संदेश *</label>
                  <textarea name="message" value={form.message} onChange={handleChange}
                    className="form-control" rows={5}
                    placeholder="आपला संदेश येथे लिहा..."/>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{width:'100%'}} disabled={loading}>
                  {loading ? '⏳ पाठवत आहे...' : '📤 संदेश पाठवा'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
