// src/pages/PujariRegister.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { pujariAPI, poojaAPI } from '../api/index.js';
import styles from './PujariRegister.module.css';

const LANGUAGES = ['मराठी','हिंदी','संस्कृत','इंग्रजी','कोकणी','वऱ्हाडी'];

export default function PujariRegister() {
  const navigate = useNavigate();
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [form, setForm] = useState({
    full_name:      '',
    experience_yrs: '',
    city:           '',
    district:       '',
    address:        '',
    bio:            '',
    languages:      ['मराठी'],
    specializations: [],
    photo:          null,
    certificate:    null,
  });

  useEffect(() => {
    poojaAPI.getCategories()
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleLang = lang => {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang],
    }));
  };

  const toggleSpec = id => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(id)
        ? f.specializations.filter(s => s !== id)
        : [...f.specializations, id],
    }));
  };

  const handlePhoto = e => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, photo: file }));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.city || !form.address) {
      toast.error('कृपया सर्व आवश्यक माहिती भरा.'); return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (key === 'photo' && val) { fd.append('photo', val); return; }
        if (key === 'certificate' && val) { fd.append('certificate', val); return; }
        if (Array.isArray(val)) { val.forEach(v => fd.append(`${key}[]`, v)); return; }
        if (val !== null && val !== '') fd.append(key, val);
      });
      await pujariAPI.register(fd);
      toast.success('नोंदणी यशस्वी! मंजुरीसाठी प्रतीक्षा करा. 🙏');
      navigate('/pujari-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'नोंदणी करताना त्रुटी झाली.');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.hero}>
            <h1>🧑‍🦳 पुजारी म्हणून नोंदणी करा</h1>
            <p>आपले ज्ञान, अनुभव शेअर करा आणि जास्त कमाई करा</p>
          </div>

          <div className={styles.layout}>
            {/* Form */}
            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Section 1: Personal */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>👤 वैयक्तिक माहिती</h2>
                <div className={styles.photoSection}>
                  <div className={styles.photoPreview}>
                    {photoPreview
                      ? <img src={photoPreview} alt="फोटो"/>
                      : <span>📷</span>
                    }
                  </div>
                  <div>
                    <label className={`btn btn-secondary btn-sm ${styles.photoBtn}`}>
                      फोटो अपलोड करा
                      <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
                    </label>
                    <p className={styles.photoNote}>JPG/PNG, जास्तीत जास्त ५MB</p>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label>पूर्ण नाव *</label>
                    <input type="text" name="full_name" value={form.full_name} onChange={handleChange}
                      className="form-control" placeholder="आपले संपूर्ण नाव"/>
                  </div>
                  <div className="form-group">
                    <label>अनुभव (वर्षांमध्ये)</label>
                    <input type="number" name="experience_yrs" value={form.experience_yrs} onChange={handleChange}
                      className="form-control" placeholder="उदा: १०" min={0} max={70}/>
                  </div>
                </div>
                <div className="form-group">
                  <label>स्वतःबद्दल सांगा</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange}
                    className="form-control" rows={3}
                    placeholder="आपला अनुभव, विशेषज्ञता, कुळाचार याबद्दल सांगा..."/>
                </div>
              </div>

              {/* Section 2: Location */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📍 स्थान माहिती</h2>
                <div className="grid-2">
                  <div className="form-group">
                    <label>शहर / गाव *</label>
                    <input type="text" name="city" value={form.city} onChange={handleChange}
                      className="form-control" placeholder="उदा: रत्नागिरी"/>
                  </div>
                  <div className="form-group">
                    <label>जिल्हा</label>
                    <input type="text" name="district" value={form.district} onChange={handleChange}
                      className="form-control" placeholder="उदा: रत्नागिरी"/>
                  </div>
                </div>
                <div className="form-group">
                  <label>संपूर्ण पत्ता *</label>
                  <textarea name="address" value={form.address} onChange={handleChange}
                    className="form-control" rows={2}
                    placeholder="घर क्र., गल्ली, वाडी..."/>
                </div>
              </div>

              {/* Section 3: Languages */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>🗣️ भाषा ज्ञान</h2>
                <div className={styles.chipGrid}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang} type="button"
                      className={`${styles.chip} ${form.languages.includes(lang) ? styles.chipActive : ''}`}
                      onClick={() => toggleLang(lang)}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Specializations */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>🛕 विशेषज्ञता</h2>
                <p className={styles.hint}>आपण कोणत्या पूजा करतो ते निवडा:</p>
                <div className={styles.chipGrid}>
                  {categories.map(cat => (
                    <button
                      key={cat.id} type="button"
                      className={`${styles.chip} ${form.specializations.includes(cat.id) ? styles.chipActive : ''}`}
                      onClick={() => toggleSpec(cat.id)}
                    >
                      {cat.name_mr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 5: Documents */}
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>📄 दस्तऐवज (पर्यायी)</h2>
                <div className="form-group">
                  <label>प्रमाणपत्र / सनद अपलोड करा</label>
                  <input
                    type="file" accept=".pdf,image/*"
                    onChange={e => setForm(f => ({...f, certificate: e.target.files[0]}))}
                    className="form-control"
                  />
                  <p className={styles.hint}>PDF किंवा image, जास्तीत जास्त ५MB</p>
                </div>
              </div>

              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? '⏳ नोंदणी होत आहे...' : '✅ नोंदणी अर्ज सादर करा'}
              </button>
            </form>

            {/* Benefits sidebar */}
            <div className={styles.benefits}>
              <div className={styles.benefitCard}>
                <h3>पुजारी म्हणून फायदे</h3>
                {[
                  { icon: '💰', title: 'अधिक कमाई', desc: 'प्रत्येक बुकिंगवर चांगली कमाई मिळवा.' },
                  { icon: '📱', title: 'सोपी बुकिंग', desc: 'बुकिंग स्वीकार/नाकार करण्याचा अधिकार.' },
                  { icon: '⭐', title: 'रेटिंग व प्रसिद्धी', desc: 'चांगल्या रेटिंगमुळे अधिक ग्राहक.' },
                  { icon: '🗓️', title: 'वेळ स्वातंत्र्य', desc: 'स्वतःची उपलब्धता स्वतः ठरवा.' },
                  { icon: '🛡️', title: 'सुरक्षित पेमेंट', desc: 'वेळेवर आणि सुरक्षित पेमेंट.' },
                ].map(b => (
                  <div key={b.title} className={styles.benefit}>
                    <span className={styles.benefitIcon}>{b.icon}</span>
                    <div>
                      <strong>{b.title}</strong>
                      <p>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.processCard}>
                <h3>नोंदणी प्रक्रिया</h3>
                <ol>
                  <li>अर्ज सादर करा</li>
                  <li>आमची टीम तपासणी करेल</li>
                  <li>मंजुरी मिळाल्यावर SMS येईल</li>
                  <li>बुकिंग मिळवणे सुरू करा!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
