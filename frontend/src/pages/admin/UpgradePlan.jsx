// src/pages/admin/UpgradePlan.jsx — Tenant Plan Upgrade with Razorpay + Request Form
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import { subscriptionAPI } from '../../api/index.js';
import s from '../../styles/UpgradePlan.module.css';

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const MONTHS_OPTIONS = [
  { m: 1,  label: '1 महिना',   discount: null },
  { m: 3,  label: '3 महिने',  discount: '5% सवलत' },
  { m: 6,  label: '6 महिने',  discount: '10% सवलत' },
  { m: 12, label: '12 महिने', discount: '15% सवलत' },
];

function calcAmount(priceMonthly, months) {
  const discounts = { 1: 0, 3: 0.05, 6: 0.10, 12: 0.15 };
  const disc = discounts[months] || 0;
  return Math.round(priceMonthly * months * (1 - disc));
}

const PLAN_OPTIONS = ['basic', 'premium'];
const EMPTY_REQ = { contact_name: '', contact_phone: '', contact_email: '', requested_plan: 'basic', months: 1, message: '' };

export default function UpgradePlan() {
  const { user } = useAuth();
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [selectedPlan, setSP]   = useState('basic');
  const [selectedMonths, setSM] = useState(1);
  const [paying, setPaying]     = useState(false);
  const [tab, setTab]           = useState('pay'); // 'pay' | 'request'
  const [reqForm, setReqForm]   = useState({ ...EMPTY_REQ, contact_name: user?.name || '', contact_phone: user?.phone || '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    subscriptionAPI.getPlans()
      .then(r => { setData(r.data.data || r.data); })
      .catch(() => toast.error('Plan माहिती मिळवता आली नाही.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    setPaying(true);
    try {
      // Step 1: Create Razorpay order
      const orderRes = await subscriptionAPI.createOrder({ plan: selectedPlan, months: selectedMonths });
      const order    = orderRes.data.data || orderRes.data;

      if (order.mock_mode) {
        // ── Mock mode — directly activate (for testing) ──────
        toast('⚠️ Mock mode: Razorpay keys configure करा. Plan simulate activate होत आहे...', { icon: '🔧' });
        await subscriptionAPI.verifyPayment({
          order_id:   order.order_id,
          payment_id: 'pay_mock_' + Date.now(),
          signature:  'mock',
          plan:       selectedPlan,
          months:     selectedMonths,
          mock_mode:  true,
        });
        toast.success('Mock payment यशस्वी! Plan activate झाला (test).');
        const r = await subscriptionAPI.getPlans();
        setData(r.data.data || r.data);
        return;
      }

      // Step 2: Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) return toast.error('Razorpay load होत नाही. Internet check करा.');

      const planName  = data.plans.find(p => p.id === selectedPlan)?.name || selectedPlan;
      const amount    = calcAmount(data.plans.find(p => p.id === selectedPlan)?.price_monthly || 999, selectedMonths);

      // Step 3: Open Razorpay checkout
      const options = {
        key:         order.key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'पूजारी Platform',
        description: `${planName} — ${selectedMonths} ${selectedMonths === 1 ? 'महिना' : 'महिने'}`,
        order_id:    order.order_id,
        image:       '/poojari-logo.png',
        prefill: {
          name:  order.tenant_name,
          email: '',
          contact: '',
        },
        theme:  { color: '#FF6B35' },
        handler: async function (response) {
          // Step 4: Verify payment on backend
          try {
            const verifyRes = await subscriptionAPI.verifyPayment({
              order_id:   order.order_id,
              payment_id: response.razorpay_payment_id,
              signature:  response.razorpay_signature,
              plan:       selectedPlan,
              months:     selectedMonths,
              mock_mode:  false,
            });
            const msg = verifyRes.data?.message || 'Plan activate झाला!';
            toast.success(msg);
            // Refresh plan data
            const r = await subscriptionAPI.getPlans();
            setData(r.data.data || r.data);
          } catch (e) {
            toast.error(e?.response?.data?.message || 'Payment verify करता आले नाही.');
          }
        },
        modal: {
          ondismiss: () => toast('Payment रद्द केली.', { icon: '⚠️' }),
        },
      };
      new window.Razorpay(options).open();

    } catch (e) {
      toast.error(e?.response?.data?.message || 'Payment सुरू करता आले नाही.');
    } finally {
      setPaying(false);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!reqForm.contact_name || !reqForm.contact_phone) {
      toast.error('नाव आणि फोन आवश्यक आहे.'); return;
    }
    setSubmitting(true);
    try {
      await subscriptionAPI.submitRequest(reqForm);
      toast.success('विनंती पाठवली! Super Admin लवकरच संपर्क करेल. 🙏');
      setReqForm({ ...EMPTY_REQ, contact_name: user?.name || '', contact_phone: user?.phone || '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'विनंती पाठवताना त्रुटी झाली.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <AdminLayout><div className="page-loader"><div className="spinner" /></div></AdminLayout>;

  const current  = data?.current;
  const plans    = data?.plans || [];
  const selPlan  = plans.find(p => p.id === selectedPlan);
  const amount   = selPlan ? calcAmount(selPlan.price_monthly, selectedMonths) : 0;

  function statusChip() {
    if (!current) return null;
    const colors = { active: '#2e7d32', expired: '#c62828', trial: '#e65100' };
    const labels = { active: '✅ Active', expired: '⛔ Expired', trial: '⏳ Trial' };
    const s2 = current.plan === 'trial' ? 'trial' : current.status;
    return <span style={{ background: (colors[s2]||'#555')+'18', color: colors[s2]||'#555', padding: '3px 12px', borderRadius: 12, fontWeight: 700, fontSize: '0.82rem' }}>{labels[s2] || current.plan}</span>;
  }

  return (
    <AdminLayout>
      <div className={s.wrap}>

        {/* ── Current Plan bar ─────────────────────────────── */}
        <div className={s.currentCard}>
          <div className={s.currentLeft}>
            <span className={s.currentIcon}>🪔</span>
            <div>
              <div className={s.currentLabel}>सध्याचा Plan</div>
              <div className={s.currentPlanName}>{current?.plan?.toUpperCase()}</div>
              {current?.days_left != null && (
                <div className={s.daysLeft}>
                  {current.days_left > 0 ? `⏳ ${current.days_left} दिवस शिल्लक` : '⛔ Expired'}
                </div>
              )}
            </div>
          </div>
          <div className={s.currentRight}>
            {statusChip()}
            <span style={{ fontSize:13, opacity:0.85 }}>Plan upgrade करा →</span>
          </div>
        </div>

        {!data?.razorpay_configured && (
          <div className={s.mockBanner}>
            🔧 <strong>Mock Mode:</strong> Razorpay keys configure केलेले नाहीत. Payment simulate होईल.
          </div>
        )}

        {/* ── Tabs ─────────────────────────────────────────── */}
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab==='pay'?s.tabActive:''}`} onClick={()=>setTab('pay')}>
            💳 Online Payment
          </button>
          <button className={`${s.tab} ${tab==='request'?s.tabActive:''}`} onClick={()=>setTab('request')}>
            📋 Request पाठवा
          </button>
        </div>

        {/* ── Request Tab — 2-column ─────────────────────── */}
        {tab === 'request' && (
          <div className={s.reqLayout}>
            {/* Left: form */}
            <div className={s.requestCard}>
              <div className={s.requestInfo}>
                <span className={s.requestIcon}>📞</span>
                <div>
                  <h3>Offline / Manual Payment Request</h3>
                  <p>UPI, Bank Transfer किंवा Phone वर payment करायची असेल तर ही विनंती पाठवा. Super Admin तुमच्याशी संपर्क करेल आणि plan manually activate करेल.</p>
                </div>
              </div>
              <form onSubmit={handleRequest} className={s.reqForm}>
                <div className={s.reqGrid}>
                  <div className={s.reqField}>
                    <label>संपर्क नाव *</label>
                    <input className={s.reqInput} required placeholder="तुमचे नाव"
                      value={reqForm.contact_name} onChange={e=>setReqForm(f=>({...f,contact_name:e.target.value}))}/>
                  </div>
                  <div className={s.reqField}>
                    <label>📱 फोन *</label>
                    <input className={s.reqInput} required placeholder="9876543210"
                      value={reqForm.contact_phone} onChange={e=>setReqForm(f=>({...f,contact_phone:e.target.value}))}/>
                  </div>
                  <div className={s.reqField}>
                    <label>✉️ ईमेल</label>
                    <input className={s.reqInput} type="email" placeholder="email@example.com"
                      value={reqForm.contact_email} onChange={e=>setReqForm(f=>({...f,contact_email:e.target.value}))}/>
                  </div>
                  <div className={s.reqField}>
                    <label>Plan</label>
                    <select className={s.reqInput} value={reqForm.requested_plan}
                      onChange={e=>setReqForm(f=>({...f,requested_plan:e.target.value}))}>
                      {plans.map(p=><option key={p.id} value={p.id}>{p.name} — ₹{p.price_monthly}/mo</option>)}
                    </select>
                  </div>
                  <div className={s.reqField}>
                    <label>कालावधी</label>
                    <select className={s.reqInput} value={reqForm.months}
                      onChange={e=>setReqForm(f=>({...f,months:parseInt(e.target.value)}))}>
                      <option value={1}>1 महिना</option>
                      <option value={3}>3 महिने (5% सवलत)</option>
                      <option value={6}>6 महिने (10% सवलत)</option>
                      <option value={12}>12 महिने (15% सवलत)</option>
                    </select>
                  </div>
                </div>
                <div className={s.reqField}>
                  <label>संदेश (ऐच्छिक)</label>
                  <textarea className={s.reqInput} rows={3} placeholder="विशेष सूचना..."
                    value={reqForm.message} onChange={e=>setReqForm(f=>({...f,message:e.target.value}))}/>
                </div>
                <button type="submit" className={s.reqBtn} disabled={submitting}>
                  {submitting ? '⏳ पाठवत आहे...' : '📋 विनंती पाठवा'}
                </button>
              </form>
            </div>

            {/* Right: sticky summary + contact */}
            <div className={s.reqSideCard}>
              <div className={s.reqSideTitle}>📋 विनंती सारांश</div>
              <div className={s.reqSummary}>
                <div className={s.reqSummaryRow}>
                  <span>Plan</span>
                  <strong>{plans.find(p=>p.id===reqForm.requested_plan)?.name}</strong>
                </div>
                <div className={s.reqSummaryRow}>
                  <span>कालावधी</span>
                  <strong>{reqForm.months} महिने</strong>
                </div>
                <div className={s.reqSummaryRow}>
                  <span>अंदाजे रक्कम</span>
                  <strong style={{color:'var(--primary)'}}>
                    ₹{calcAmount(plans.find(p=>p.id===reqForm.requested_plan)?.price_monthly||999, reqForm.months).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
              <div className={s.trustRow}>
                <div className={s.trustItem}>🔒 <span>Secure Manual Process</span></div>
                <div className={s.trustItem}>⚡ <span>२४ तासांत <strong>activate</strong></span></div>
                <div className={s.trustItem}>💬 <span>WhatsApp support</span></div>
              </div>
              <div className={s.contactBox}>
                <p>थेट संपर्क करा:</p>
                <a href="https://wa.me/9561903219?text=मला plan upgrade करायचे आहे"
                  target="_blank" rel="noreferrer" className={s.waContact}>
                  💬 WhatsApp: 9561903219
                </a>
              </div>
            </div>
          </div>
        )}

        {tab === 'pay' && (
        <div className={s.payLayout}>
          {/* ── LEFT: plan + months ───────────────────────── */}
          <div className={s.leftCol}>

            {/* Plan selection */}
            <div className={s.section}>
              <h2 className={s.sectionTitle}>🪔 Plan निवडा</h2>
              <div className={s.planCards}>
                {plans.map(p => (
                  <div key={p.id}
                    className={`${s.planCard} ${selectedPlan===p.id?s.planCardActive:''}`}
                    onClick={() => setSP(p.id)}>
                    {p.popular && <div className={s.popularBadge}>⭐ Popular</div>}
                    <div className={s.planName}>{p.name}</div>
                    <div className={s.planPrice}>₹{p.price_monthly}<span>/month</span></div>
                    <ul className={s.featureList}>
                      {p.features.map(f => <li key={f}>✅ {f}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Months selection */}
            <div className={s.section}>
              <h2 className={s.sectionTitle}>📅 कालावधी निवडा</h2>
              <div className={s.monthCards}>
                {MONTHS_OPTIONS.map(({ m, label, discount }) => (
                  <div key={m}
                    className={`${s.monthCard} ${selectedMonths===m?s.monthCardActive:''}`}
                    onClick={() => setSM(m)}>
                    <div className={s.monthLabel}>{label}</div>
                    {discount && <div className={s.discountBadge}>{discount}</div>}
                    {selPlan && <div className={s.monthPrice}>₹{calcAmount(selPlan.price_monthly,m).toLocaleString('en-IN')}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT: sticky order summary ──────────────── */}
          <div className={s.rightCol}>
            <div className={s.summary}>
              <div className={s.summaryTitle}>🛒 Order Summary</div>
              <div className={s.summaryRow}>
                <span>Plan</span>
                <strong>{selPlan?.name}</strong>
              </div>
              <div className={s.summaryRow}>
                <span>कालावधी</span>
                <strong>{selectedMonths} {selectedMonths===1?'महिना':'महिने'}</strong>
              </div>
              <div className={s.summaryRow}>
                <span>Price/month</span>
                <strong>₹{selPlan?.price_monthly?.toLocaleString('en-IN')}</strong>
              </div>
              {selectedMonths > 1 && (
                <div className={s.summaryRow}>
                  <span>सवलत</span>
                  <span className={s.savingBadge}>-₹{Math.round(selPlan?.price_monthly*selectedMonths-amount).toLocaleString('en-IN')} save</span>
                </div>
              )}
              <div className={`${s.summaryRow} ${s.totalRow}`}>
                <span>एकूण</span>
                <strong>₹{amount.toLocaleString('en-IN')}</strong>
              </div>

              <button className={s.payBtn} onClick={handlePay} disabled={paying}>
                {paying ? '⏳ Processing...' : `💳 ₹${amount.toLocaleString('en-IN')} Pay करा`}
              </button>

              <p className={s.payNote}>
                🔒 Secure payment powered by Razorpay<br/>
                UPI · Card · Net Banking · Wallet सर्व स्वीकारले जातात
              </p>
              <div className={s.payIcons}>
                <span>📱 UPI</span><span>💳 Card</span><span>🏦 Net Banking</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className={s.trustRow}>
              <div className={s.trustItem}>🔒 <span>100% Secure Payment</span></div>
              <div className={s.trustItem}>⚡ <span>Instant <strong>Activation</strong></span></div>
              <div className={s.trustItem}>🔄 <span>Auto-renew नाही</span></div>
            </div>
          </div>
        </div>
        )}
      </div>
    </AdminLayout>
  );
}
