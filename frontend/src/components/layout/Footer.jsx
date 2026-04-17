// src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const categories = [
  { label: 'गृह पूजा',       slug: 'gruh-pooja'     },
  { label: 'हवन / जाप',      slug: 'havan-jaap'     },
  { label: 'कथा / नित्य',    slug: 'katha-nitya'    },
  { label: 'पित्रुश्राद्ध',  slug: 'pitru-shraddha' },
  { label: 'उत्सव पूजा',     slug: 'utsav-pooja'    },
  { label: 'वास्तू पूजा',    slug: 'vastu-pooja'    },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.pattern}/>
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span>🪔</span>
              <span className={styles.logoText}>पूजारी</span>
            </div>
            <p>महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. विश्वासू पुजारी, वेळेवर सेवा, आणि पारंपरिक विधी.</p>
            <div className={styles.social}>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">🔵</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">📸</a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">🔴</a>
              <a href="https://wa.me/9561903219" target="_blank" rel="noreferrer" aria-label="WhatsApp">💬</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={styles.colTitle}>त्वरित लिंक</h3>
            <ul>
              <li><Link to="/">मुख्यपृष्ठ</Link></li>
              <li><Link to="/pooja">पूजा बुक करा</Link></li>
              <li><Link to="/pujari-nondni">पुजारी व्हा</Link></li>
              <li><Link to="/about">आमच्याबद्दल</Link></li>
              <li><Link to="/contact">संपर्क करा</Link></li>
            </ul>
          </div>

          {/* Pooja Categories */}
          <div>
            <h3 className={styles.colTitle}>पूजा श्रेणी</h3>
            <ul>
              {categories.map(c => (
                <li key={c.slug}>
                  <Link to={`/pooja/${c.slug}`}>{c.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className={styles.colTitle}>संपर्क माहिती</h3>
            <ul className={styles.contactList}>
              <li><span>📧</span><a href="mailto:info@pojjari.com">info@pojjari.com</a></li>
              <li><span>📞</span><a href="tel:9561903219">९५६१९०३२१९</a></li>
              <li><span>📍</span><span>रत्नागिरी, महाराष्ट्र</span></li>
              <li><span>🕐</span><span>सोम - रवि: सकाळी ७ ते रात्री ९</span></li>
            </ul>
            <div className={styles.policies}>
              <a href="#">गोपनीयता धोरण</a>
              <a href="#">नियम व अटी</a>
              <a href="#">रद्दीकरण धोरण</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} पूजारी. सर्व हक्क राखीव. 🙏</p>
          <p>भक्तीने बनवले — महाराष्ट्रासाठी ❤️</p>
        </div>
      </div>

      {/* WhatsApp float */}
      <a
        href="https://wa.me/9561903219?text=नमस्कार! मला पूजा बुक करायची आहे."
        target="_blank"
        rel="noreferrer"
        className={styles.whatsapp}
        aria-label="WhatsApp वर संपर्क करा"
      >
        💬
      </a>
    </footer>
  );
}
