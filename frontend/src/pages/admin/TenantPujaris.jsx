// src/pages/admin/TenantPujaris.jsx
// Tenant Franchise — Manage pujaris (create new OR assign existing)
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { tenantConfigAPI, adminAPI } from '../../api/index.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

const EMPTY_FORM = { name: '', phone: '', password: '', city: '', email: '' };

export default function TenantPujaris() {
  const [myPujaris,  setMyPujaris]  = useState([]);
  const [allPujaris, setAllPujaris] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [removing,   setRemoving]   = useState(null);
  const [assigning,  setAssigning]  = useState(null);

  // Panel state: null | 'create' | 'assign'
  const [panel,      setPanel]      = useState(null);

  // Create form
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [creating,   setCreating]   = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [created,    setCreated]    = useState(null); // success result to show credentials

  // Assign search
  const [search,     setSearch]     = useState('');

  // ── Load ────────────────────────────────────────────────────
  const loadMyPujaris = () => {
    setLoading(true);
    tenantConfigAPI.getPujaris()
      .then(r => setMyPujaris(r.data.data || []))
      .catch(() => toast.error('पुजारी यादी लोड करता आली नाही.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMyPujaris();
    adminAPI.getApprovedPujaris()
      .then(r => setAllPujaris(r.data.data || []))
      .catch(() => {});
  }, []);

  // ── Create new pujari ─────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone || !form.password)
      return toast.error('नाव, फोन आणि password आवश्यक आहेत.');
    if (!/^[6-9]\d{9}$/.test(form.phone))
      return toast.error('Valid 10-digit mobile number द्या.');
    if (form.password.length < 6)
      return toast.error('Password किमान 6 अक्षरांचा असावा.');

    setCreating(true);
    try {
      const res = await tenantConfigAPI.createPujari(form);
      setCreated({ name: form.name, phone: form.phone, password: form.password });
      setForm(EMPTY_FORM);
      loadMyPujaris();
      toast.success(`${form.name} — account तयार झाला! 🎉`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Account तयार करता आला नाही.');
    } finally {
      setCreating(false);
    }
  };

  // ── Assign existing pujari ────────────────────────────────
  const handleAssign = async (pujariId) => {
    setAssigning(pujariId);
    try {
      await tenantConfigAPI.assignPujari(pujariId);
      toast.success('पुजारी franchise मध्ये जोडला! ✅');
      loadMyPujaris();
      setPanel(null);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'जोडता आला नाही.');
    } finally {
      setAssigning(null);
    }
  };

  // ── Remove pujari ─────────────────────────────────────────
  const handleRemove = async (pujariId, name) => {
    if (!window.confirm(`"${name}" ला franchise मधून काढायचे?`)) return;
    setRemoving(pujariId);
    try {
      await tenantConfigAPI.removePujari(pujariId);
      toast.success('पुजारी काढला.');
      setMyPujaris(prev => prev.filter(p => p.id !== pujariId));
    } catch {
      toast.error('काढता आला नाही.');
    } finally {
      setRemoving(null);
    }
  };

  const myIds    = new Set(myPujaris.map(p => p.id));
  const available= allPujaris.filter(p =>
    !myIds.has(p.id) &&
    ((p.full_name || p.name)?.toLowerCase().includes(search.toLowerCase()) ||
     p.city?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👨‍⚕️ माझे पुजारी</h1>
            <p className="text-gray-500 text-sm mt-1">
              Franchise मधील पुजारी — त्यांना लॉगिन माहिती द्या.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setPanel(panel === 'create' ? null : 'create'); setCreated(null); }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {panel === 'create' ? '✕ बंद करा' : '+ नवीन पुजारी तयार करा'}
            </button>
            <button
              onClick={() => setPanel(panel === 'assign' ? null : 'assign')}
              className="border border-orange-400 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {panel === 'assign' ? '✕ बंद करा' : 'विद्यमान पुजारी जोडा'}
            </button>
          </div>
        </div>

        {/* ── CREATE NEW PUJARI PANEL ───────────────────────────── */}
        {panel === 'create' && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">नवीन पुजारी नोंदणी करा</h2>

            {/* Success credentials card */}
            {created && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4">
                <p className="text-green-700 font-semibold mb-2">✅ नोंदणी यशस्वी झाली!</p>
                <p className="text-sm text-gray-700">खालील माहिती पुजाऱ्याला द्या:</p>
                <div className="mt-2 bg-white rounded-lg p-3 text-sm font-mono space-y-1 border border-green-200">
                  <p>👤 नाव: <strong>{created.name}</strong></p>
                  <p>📱 Phone: <strong>{created.phone}</strong></p>
                  <p>🔑 संकेतशब्द: <strong>{created.password}</strong></p>
                  <p>🌐 लॉगिन: <strong>pujari.mydashboard.site/login</strong></p>
                </div>
                <button
                  onClick={() => setCreated(null)}
                  className="mt-3 text-xs text-gray-400 underline"
                >
                  बंद करा
                </button>
              </div>
            )}

            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">नाव *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="पं. रामशास्त्री"
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">मोबाईल नंबर * (लॉगिनसाठी)</label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="9876543210"
                  maxLength={10}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">संकेतशब्द * (किमान ६ अक्षरे)</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"
                  >
                    {showPass ? 'लपवा' : 'दाखवा'}
                  </button>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">शहर</label>
                <input
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  placeholder="पुणे"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Email (optional) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">ईमेल (ऐच्छिक)</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="pujari@gmail.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  {creating ? 'नोंदणी होतेय...' : '✅ नोंदणी करा'}
                </button>
                <p className="text-xs text-gray-400">
                  नोंदणी झाल्यावर लॉगिन माहिती स्क्रीनवर दिसेल — लिहून घ्या!
                </p>
              </div>
            </form>
          </div>
        )}

        {/* ── ASSIGN EXISTING PUJARI PANEL ─────────────────────── */}
        {panel === 'assign' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-700 mb-3">विद्यमान पुजारी जोडा</h2>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="नाव किंवा शहर शोधा..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {available.length === 0 ? (
                <p className="text-center py-4 text-gray-400 text-sm">
                  {allPujaris.filter(p => !myIds.has(p.id)).length === 0
                    ? 'सगळे पुजारी आधीच जोडले आहेत.'
                    : 'कोणी सापडला नाही.'}
                </p>
              ) : available.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{p.full_name || p.name}</p>
                    <p className="text-xs text-gray-400">{p.city} • ⭐ {p.avg_rating || p.rating || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => handleAssign(p.id)}
                    disabled={assigning === p.id}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    {assigning === p.id ? '...' : '+ जोडा'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MY PUJARIS LIST ───────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : myPujaris.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🙏</p>
            <p className="text-gray-500">अद्याप कोणताही पुजारी जोडला नाही.</p>
            <button onClick={() => setPanel('create')} className="mt-3 text-orange-500 underline text-sm">
              नवीन पुजारी तयार करा
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">{myPujaris.length} पुजारी Franchise मध्ये नोंदणीकृत आहेत</p>
            <div className="space-y-3">
              {myPujaris.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-xl font-bold text-orange-600 flex-shrink-0">
                    {p.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5 text-xs text-gray-500">
                      {p.city    && <span>📍 {p.city}</span>}
                      {p.email   && <span>✉️ {p.email}</span>}
                      {p.rating > 0 && <span>⭐ {Number(p.rating).toFixed(1)}</span>}
                      <span>📋 {p.total_bookings || 0} bookings</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {p.is_active ? 'सक्रिय' : 'निष्क्रिय'}
                    </span>
                    <button
                      onClick={() => handleRemove(p.id, p.name)}
                      disabled={removing === p.id}
                      className="text-red-400 hover:text-red-600 text-xs underline disabled:opacity-50"
                    >
                      {removing === p.id ? '...' : 'काढा'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
