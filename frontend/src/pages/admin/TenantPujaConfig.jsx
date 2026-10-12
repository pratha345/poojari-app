// src/pages/admin/TenantPujaConfig.jsx
// Tenant Franchise — Puja price & enable/disable override
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { tenantConfigAPI } from '../../api/index.js';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || '';

export default function TenantPujaConfig() {
  const [poojas,   setPoojas]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(null);   // poojaId being saved
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    tenantConfigAPI.getPujaConfig()
      .then(r => {
        setPoojas(r.data.data || []);
        // super admin may have switched franchise pricing off
        if (r.data.message && r.data.message !== 'यशस्वी') toast(r.data.message, { icon: '🔒', duration: 6000 });
      })
      .catch(() => toast.error('पूजा config लोड करता आली नाही.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (poojaId, field, value) => {
    setPoojas(prev => prev.map(p =>
      p.id === poojaId ? { ...p, [field]: value } : p
    ));
  };

  const handleSave = async (pooja) => {
    setSaving(pooja.id);
    try {
      await tenantConfigAPI.upsertPujaConfig(pooja.id, {
        custom_price:         pooja.custom_price         !== '' ? pooja.custom_price         : null,
        custom_samagri_price: pooja.custom_samagri_price !== '' ? pooja.custom_samagri_price : null,
        is_enabled:           pooja.is_enabled,
      });
      toast.success(`${pooja.name_mr} — config जतन केला! ✅`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'जतन करता आला नाही.');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (pooja) => {
    if (!window.confirm(`"${pooja.name_mr}" चा बदल रद्द करायचा? मूळ किंमत वापरली जाईल.`)) return;
    setSaving(pooja.id);
    try {
      await tenantConfigAPI.deletePujaConfig(pooja.id);
      // Reset local state to global
      setPoojas(prev => prev.map(p =>
        p.id === pooja.id
          ? { ...p, custom_price: null, custom_samagri_price: null, is_enabled: null, config_id: null }
          : p
      ));
      toast.success('बदल रद्द केला — मूळ किंमत वापरली जाईल.');
    } catch {
      toast.error('पूर्ववत करता आला नाही.');
    } finally {
      setSaving(null);
    }
  };

  const filtered = poojas.filter(p =>
    p.name_mr?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🪔 पूजा किंमत व उपलब्धता</h1>
          <p className="text-gray-500 text-sm mt-1">
            तुमच्या Franchise साठी पूजा किंमत व उपलब्धता सेट करा.
            बदल नसेल तर मूळ किंमत वापरली जाईल.
          </p>
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="पूजा शोधा..."
          className="w-full mb-5 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(pooja => {
              const hasOverride = pooja.config_id != null;
              const isSaving   = saving === pooja.id;

              return (
                <div
                  key={pooja.id}
                  className={`bg-white rounded-xl border p-4 flex flex-col md:flex-row md:items-center gap-4 transition-all ${
                    hasOverride ? 'border-orange-300 shadow-sm' : 'border-gray-100'
                  }`}
                >
                  {/* Pooja info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {pooja.image_url ? (
                      <img
                        src={`${BASE_URL}${pooja.image_url}`}
                        alt={pooja.name_mr}
                        loading="lazy"
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-orange-50"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-500 text-xs font-bold text-center leading-tight p-1">
                        {pooja.name_mr?.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{pooja.name_mr}</p>
                      <p className="text-xs text-gray-400">{pooja.category_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        मूळ किंमत: ₹{Number(pooja.global_price).toLocaleString('en-IN')}
                        {hasOverride && (
                          <span className="ml-2 text-orange-600 font-medium">● बदल केलेला</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Enable/Disable */}
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          pooja.is_enabled != null
                            ? Boolean(pooja.is_enabled)
                            : Boolean(pooja.global_is_active)
                        }
                        onChange={e => handleChange(pooja.id, 'is_enabled', e.target.checked ? 1 : 0)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-gray-600">उपलब्ध</span>
                    </label>

                    {/* Custom price */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={pooja.custom_price ?? ''}
                        onChange={e => handleChange(pooja.id, 'custom_price', e.target.value)}
                        placeholder={pooja.global_price}
                        className="w-28 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                        min={pooja.min_price ?? 0}
                        max={pooja.max_price ?? undefined}
                      />
                      <span className="text-xs text-gray-400">
                        किंमत{pooja.min_price != null && ` (₹${pooja.min_price}–₹${pooja.max_price})`}
                      </span>
                    </div>

                    {/* Save */}
                    <button
                      onClick={() => handleSave(pooja)}
                      disabled={isSaving}
                      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isSaving ? '...' : 'जतन'}
                    </button>

                    {/* Reset */}
                    {hasOverride && (
                      <button
                        onClick={() => handleReset(pooja)}
                        disabled={isSaving}
                        className="text-gray-400 hover:text-red-500 text-xs underline transition-colors"
                      >
                        पूर्ववत करा
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-center py-10 text-gray-400">कोणतीही पूजा सापडली नाही.</p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
