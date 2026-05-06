// src/pages/Booking.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOHead from '../components/SEOHead';
import { poojaAPI, bookingAPI } from '../api/index.js';
import styles from './Booking.module.css';

const TIMES = [
  '०६:०० पूर्वाह्न','०७:०० पूर्वाह्न','०८:०० पूर्वाह्न',
  '०९:०० पूर्वाह्न','१०:०० पूर्वाह्न','११:०० पूर्वाह्न',
  '१२:०० दुपारी','०१:०० अपराह्न','०२:०० अपराह्न',
  '०३:०० अपराह्न','०४:०० अपराह्न','०५:०० अपराह्न',
];
const TIME_VALUES = [
  '06:00','07:00','08:00','09:00','10:00','11:00',
  '12:00','13:00','14:00','15:00','16:00','17:00',
];

const MAHARASHTRA_DISTRICTS = [
  'अहमदनगर','अकोला','अमरावती','औरंगाबाद','बीड','भंडारा','बुलढाणा',
  'चंद्रपूर','धुळे','गडचिरोली','गोंदिया','हिंगोली','जळगाव','जालना',
  'कोल्हापूर','लातूर','मुंबई शहर','मुंबई उपनगर','नागपूर','नांदेड',
  'नंदुरबार','नाशिक','उस्मानाबाद','पालघर','परभणी','पुणे','रायगड',
  'रत्नागिरी','सांगली','सातारा','सिंधुदुर्ग','सोलापूर','ठाणे',
  'वर्धा','वाशीम','यवतमाळ',
];

export default function Booking() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const [pooja,     setPooja]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [submitting,setSubmitting]= useState(false);
  const [step,      setStep]      = useState(1); // 1=details, 2=confirm, 3=success
  const [bookingCode, setBookingCode] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [form, setForm] = useState({
    booking_date:  minDate,
    booking_time:  '09:00',
    name:          '',
    phone:         '',
    address:       '',
    city:          '',
    district:      'रत्नागिरी',
    special_notes: '',
  });

  useEffect(() => {
    poojaAPI.getPoojaBySlug(slug)
      .then(r => setPooja(r.data.data))
      .catch(() => navigate('/pooja'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.booking_date || !form.booking_time || !form.address || !form.city) {
      toast.error('कृपया सर्व आवश्यक माहिती भरा.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bookingAPI.create({
        pooja_id:      pooja.id,
        booking_date:  form.booking_date,
        booking_time:  form.booking_time,
        address:       `${form.address}, ${form.city}, ${form.district}`,
        city:          form.city,
        district:      form.district,
        special_notes: form.special_notes,
      });
      setBookingCode(res.data.data.booking_code);
      setStep(3);
      toast.success('बुकिंग यशस्वी झाली! 🙏');
    } catch (err) {
      toast.error(err.response?.data?.message || 'बुकिंग करताना त्रुटी झाली.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div><Header/>
      <div className="page-loader"><div className="spinner"/><p>लोड होत आहे...</p></div>
    <Footer/></div>
  );

  if (!pooja) return null;

  return (
    <div>
      <SEOHead
        title={`${pooja.name_mr} बुक करा - ऑनलाईन बुकिंग`}
        description={`${pooja.name_mr} ऑनलाईन बुक करा. तारीख, वेळ व स्थान निश्चित करा. महाराष्ट्रातील अनुभवी पुजारी घरी येतात.`}
        canonical={`/booking/${pooja.slug}`}
        noindex={true}
      />
      <Header />
      <main className={styles.main}>
        <div className="container">
          {/* Progress */}
          <div className={styles.progress}>
            {['माहिती भरा','पुष्टी करा','बुकिंग यशस्वी'].map((label, i) => (
              <div key={i} className={`${styles.progressStep} ${step > i ? styles.done : ''} ${step === i + 1 ? styles.current : ''}`}>
                <div className={styles.progressDot}>{step > i + 1 ? '✓' : i + 1}</div>
                <span>{label}</span>
                {i < 2 && <div className={styles.progressLine}/>}
              </div>
            ))}
          </div>

          <div className={styles.layout}>
            {/* LEFT: Form */}
            <div className={styles.formSection}>
              {step === 1 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>📅 बुकिंग तपशील</h2>

                  <div className="grid-2">
                    <div className="form-group">
                      <label>पूजेची तारीख *</label>
                      <input
                        type="date" name="booking_date"
                        min={minDate} value={form.booking_date}
                        onChange={handleChange} className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label>वेळ *</label>
                      <select name="booking_time" value={form.booking_time} onChange={handleChange} className="form-control">
                        {TIMES.map((t, i) => (
                          <option key={i} value={TIME_VALUES[i]}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>संपूर्ण पत्ता *</label>
                    <textarea
                      name="address" value={form.address} onChange={handleChange}
                      className="form-control" rows={3}
                      placeholder="घर क्र., गल्ली, वाडी, मोहल्ला..."
                    />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label>शहर / गाव *</label>
                      <input
                        type="text" name="city" value={form.city}
                        onChange={handleChange} className="form-control"
                        placeholder="उदा: रत्नागिरी"
                      />
                    </div>
                    <div className="form-group">
                      <label>जिल्हा *</label>
                      <select name="district" value={form.district} onChange={handleChange} className="form-control">
                        {MAHARASHTRA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>विशेष सूचना (पर्यायी)</label>
                    <textarea
                      name="special_notes" value={form.special_notes} onChange={handleChange}
                      className="form-control" rows={2}
                      placeholder="उदा: घरात ३ लोक आहेत, विशेष विधी..."
                    />
                  </div>

                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setStep(2)}>
                    पुढे जा →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>✅ बुकिंग पुष्टी करा</h2>
                  <div className={styles.confirmList}>
                    <div className={styles.confirmItem}>
                      <span>पूजा</span><strong>{pooja.name_mr}</strong>
                    </div>
                    <div className={styles.confirmItem}>
                      <span>तारीख</span>
                      <strong>{new Date(form.booking_date).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                    <div className={styles.confirmItem}>
                      <span>वेळ</span>
                      <strong>{TIMES[TIME_VALUES.indexOf(form.booking_time)]}</strong>
                    </div>
                    <div className={styles.confirmItem}>
                      <span>पत्ता</span>
                      <strong>{form.address}, {form.city}, {form.district}</strong>
                    </div>
                    {form.special_notes && (
                      <div className={styles.confirmItem}>
                        <span>सूचना</span><strong>{form.special_notes}</strong>
                      </div>
                    )}
                    <div className={`${styles.confirmItem} ${styles.totalRow}`}>
                      <span>एकूण रक्कम</span>
                      <strong className={styles.totalAmt}>₹{Number(pooja.price).toLocaleString('mr-IN')}</strong>
                    </div>
                  </div>
                  <div className={styles.actionRow}>
                    <button className="btn btn-secondary" onClick={() => setStep(1)}>← मागे जा</button>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? '⏳ प्रक्रिया सुरू...' : '🪔 बुकिंग पक्की करा'}
                    </button>
                  </div>
                  <p className={styles.payNote}>* पेमेंट पुजारी आल्यानंतर रोख / UPI द्वारे करता येईल</p>
                </div>
              )}

              {step === 3 && (
                <div className={`${styles.card} ${styles.successCard}`}>
                  <div className={styles.successIcon}>🎉</div>
                  <h2>बुकिंग यशस्वी झाली!</h2>
                  <p>तुमचा बुकिंग कोड:</p>
                  <div className={styles.bookingCode}>{bookingCode}</div>
                  <p className={styles.successNote}>
                    आम्ही लवकरच तुमच्या नंबरवर संपर्क करून पुजारी नियुक्त करू.
                    WhatsApp वर माहिती मिळेल.
                  </p>
                  <div className={styles.successActions}>
                    <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
                      माझ्या बुकिंग्ज पहा
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>
                      मुख्यपृष्ठावर जा
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Pooja Summary */}
            {step < 3 && (
              <div className={styles.summary}>
                <div className={styles.summaryCard}>
                  <img
                    src={pooja.image_url || 'https://images.unsplash.com/photo-1609690996760-27439d5cfe5c?w=400'}
                    alt={pooja.name_mr}
                    className={styles.summaryImg}
                  />
                  <div className={styles.summaryBody}>
                    <span className={styles.summaryCat}>{pooja.category_name}</span>
                    <h3 className={styles.summaryTitle}>{pooja.name_mr}</h3>
                    <div className={styles.summaryMeta}>
                      <span>⏱ {pooja.duration_hrs} तास</span>
                    </div>
                    <div className={styles.summaryPrice}>
                      ₹{Number(pooja.price).toLocaleString('mr-IN')}
                    </div>
                  </div>
                  <div className={styles.summaryGuarantee}>
                    <strong>🛡️ आमची हमी</strong>
                    <span>पूजा न झाल्यास पूर्ण परतावा</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
