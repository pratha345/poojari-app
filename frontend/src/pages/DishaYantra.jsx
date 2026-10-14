// src/pages/DishaYantra.jsx — दिशा यंत्र (standalone page; same component as the panchang tab)
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import DishaYantra3D from '../components/panchang/DishaYantra3D';
import styles from './DishaYantra.module.css';

const SCHEMA = {
  '@context': 'https://schema.org', '@type': 'WebApplication',
  name: 'दिशा यंत्र — ऑनलाइन कंपास', applicationCategory: 'UtilitiesApplication', inLanguage: 'mr',
  description: 'मोबाईलवर पूर्व, पश्चिम, उत्तर, दक्षिण आणि ईशान्य-आग्नेय-नैऋत्य-वायव्य दिशा, आजची दिशाशूल आणि पूजेसाठी योग्य दिशा.',
  url: 'https://pujari.mydashboard.site/disha-yantra',
};

export default function DishaYantra() {
  return (
    <div className={styles.page}>
      <SEOHead
        title="दिशा यंत्र — ऑनलाइन कंपास, आजची दिशाशूल | पूजारी"
        description="मोबाईलवर अचूक दिशा: पूर्व, पश्चिम, उत्तर, दक्षिण, ईशान्य, आग्नेय, नैऋत्य, वायव्य. आजची दिशाशूल, देवघर व पूजेसाठी योग्य दिशा आणि सूर्याची दिशा."
        keywords="दिशा यंत्र, कंपास, दिशाशूल, ईशान्य दिशा, देवघर दिशा, vastu compass marathi, disha"
        canonical="/disha-yantra"
        schema={SCHEMA}
      />
      <Header />
      <div className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>🧭 दिशा यंत्र</h1>
          <p className={styles.sub}>आजची दिशाशूल · पूजेसाठी योग्य दिशा · दिक्पाल</p>
        </div>
      </div>
      <div className="container" style={{ padding: '24px 16px 48px' }}>
        <DishaYantra3D />
        <p className={styles.more}>
          <Link to="/panchang">🕉️ आजचे पंचांग</Link> · <Link to="/muhurat">⏰ शुभ मुहूर्त</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
