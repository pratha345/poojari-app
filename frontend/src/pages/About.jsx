// src/pages/About.jsx
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import styles from './About.module.css';

const ABOUT_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  'name': 'पूजारी बद्दल | About Pojjari',
  'description': 'पूजारी — महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा. आमची टीम, मूल्ये आणि मिशन.',
  'url': 'https://pojjari.com/about',
  'breadcrumb': {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'मुख्यपृष्ठ', 'item': 'https://pojjari.com/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'आमच्याबद्दल', 'item': 'https://pojjari.com/about' },
    ],
  },
};

const TEAM = [
  { name: 'राहुल जोशी',    role: 'संस्थापक & CEO',       emoji: '👨‍💼' },
  { name: 'प्रिया देशमुख', role: 'पूजा समन्वयक',           emoji: '👩‍💼' },
  { name: 'अमित पाटील',    role: 'तंत्रज्ञान प्रमुख',     emoji: '👨‍💻' },
];
const VALUES = [
  { icon: '🙏', title: 'भक्तिभाव',     desc: 'प्रत्येक पूजा मनापासून आणि श्रद्धेने केली जाते.' },
  { icon: '✅', title: 'विश्वासार्हता', desc: 'सर्व पुजारी तपासलेले आणि अनुभवी आहेत.' },
  { icon: '⏱', title: 'वेळेचा सन्मान', desc: 'आम्ही नेहमी वेळेवर येतो, कोणतीही तडजोड नाही.' },
  { icon: '💰', title: 'पारदर्शकता',   desc: 'निश्चित किंमत, कोणतेही छुपे शुल्क नाही.' },
];

export default function About() {
  return (
    <div>
      <SEOHead
        title="आमच्याबद्दल - पूजारी पूजा बुकिंग सेवा"
        description="पूजारी — महाराष्ट्रातील सर्वोत्तम ऑनलाईन पूजा बुकिंग सेवा. अनुभवी पुजारी, विश्वासार्ह सेवा, परवडणाऱ्या किंमती. आमच्या मिशन व टीमबद्दल जाणून घ्या."
        keywords="पूजारी बद्दल, about pojjari, पूजा बुकिंग सेवा महाराष्ट्र, अनुभवी पुजारी"
        canonical="/about"
        schema={ABOUT_SCHEMA}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroContent}>
              <h1>आमच्याबद्दल</h1>
              <p className={styles.heroDesc}>
                पूजारी — महाराष्ट्रातील सर्वोत्तम पूजा बुकिंग सेवा.
                आम्ही भक्ती आणि तंत्रज्ञान एकत्र आणले आहे.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="section">
          <div className="container">
            <div className={styles.missionGrid}>
              <div className={styles.missionText}>
                <h2>आमची सुरुवात</h2>
                <p>
                  आम्ही पाहिले की लोकांना नवीन शहरात, व्यस्त वेळापत्रकात किंवा
                  तातडीच्या विधींसाठी योग्य पुजारी मिळवणे कठीण होते.
                  तेव्हा आम्हाला विचार आला — भक्ती आणि तंत्रज्ञान एकत्र का नाही आणायचे?
                </p>
                <p>
                  आणि अशाप्रकारे <strong>पूजारी</strong> जन्माला आले — एक विश्वासू व्यासपीठ
                  जे प्रत्येक घरापर्यंत योग्य पुजारी पोहोचवते.
                </p>
                <h2 style={{marginTop:'28px'}}>आमचे ध्येय</h2>
                <p>
                  महाराष्ट्रातील प्रत्येक घराला योग्य वेळी, योग्य पुजारी मिळवून देणे —
                  सोपे, विश्वासू आणि परवडणाऱ्या किंमतीत.
                </p>
              </div>
              <div className={styles.missionStats}>
                {[
                  { val: '५००+',    label: 'विश्वासू पुजारी'  },
                  { val: '१०,०००+', label: 'यशस्वी बुकिंग्ज'  },
                  { val: '५०+',     label: 'शहरे व तालुके'    },
                  { val: '४.८ ⭐',  label: 'सरासरी रेटिंग'    },
                  { val: '२०+',     label: 'पूजा प्रकार'       },
                  { val: '३',       label: 'वर्षांचा अनुभव'    },
                ].map(s => (
                  <div key={s.label} className={styles.statBox}>
                    <span className={styles.statVal}>{s.val}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section section-alt">
          <div className="container">
            <div className="section-heading">
              <h2>आमची मूल्ये</h2>
              <p>या तत्त्वांवर आमची सेवा उभी आहे</p>
            </div>
            <div className="grid-4">
              {VALUES.map(v => (
                <div key={v.title} className={styles.valueCard}>
                  <span className={styles.valueIcon}>{v.icon}</span>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className="container">
            <h2>आजच पूजा बुक करा</h2>
            <p>महाराष्ट्रातील विश्वासू पुजारी सेवेचा अनुभव घ्या</p>
            <div className={styles.ctaBtns}>
              <Link to="/pooja"         className="btn btn-gold btn-lg btn-block-sm">🪔 पूजा बुक करा</Link>
              <Link to="/pujari-nondni" className="btn btn-secondary btn-lg btn-block-sm">🧑‍🦳 पुजारी व्हा</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
