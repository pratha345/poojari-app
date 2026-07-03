// src/pages/admin/TenantSamagriConfig.jsx
// Tenant Franchise — Custom samagri per pooja (overrides global)
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { tenantConfigAPI, adminAPI } from '../../api/index.js';

const EMPTY_ITEM = { name_mr: '', name_en: '', quantity: '', unit: '', note: '' };
const UNITS = ['नग', 'ग्रॅम', 'किलो', 'मिली', 'लिटर', 'जुडी', 'मूठ', 'वाटी', 'चमचा', 'gm', 'kg', 'ml', 'ltr'];

export default function TenantSamagriConfig() {
  const [poojas,    setPoojas]    = useState([]);
  const [selPooja,  setSelPooja]  = useState(null);
  const [items,     setItems]     = useState([]);
  const [source,    setSource]    = useState('global');  // 'global' | 'tenant'
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  // Load poojas list
  useEffect(() => {
    adminAPI.getAllPoojas()
      .then(r => setPoojas(r.data.data || []))
      .catch(() => toast.error('पूजा यादी लोड करता आली नाही.'));
  }, []);

  // Load samagri when pooja selected
  const loadSamagri = useCallback((poojaId) => {
    if (!poojaId) return;
    setLoading(true);
    tenantConfigAPI.getSamagriConfig(poojaId)
      .then(r => {
        setItems((r.data.data?.items || []).map((it, i) => ({ ...it, _key: i })));
        setSource(r.data.data?.source || 'global');
      })
      .catch(() => toast.error('साहित्य लोड करता आली नाही.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePoojaChange = (id) => {
    const p = poojas.find(p => String(p.id) === String(id));
    setSelPooja(p || null);
    setItems([]);
    setSource('global');
    if (id) loadSamagri(id);
  };

  const addItem = () => {
    setItems(prev => [...prev, { ...EMPTY_ITEM, _key: Date.now() }]);
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(it => it._key !== key));
  };

  const updateItem = (key, field, value) => {
    setItems(prev => prev.map(it => it._key === key ? { ...it, [field]: value } : it));
  };

  const handleSave = async () => {
    if (!selPooja) return;
    const valid = items.filter(it => it.name_mr.trim());
    if (!valid.length) {
      toast.error('किमान एक item असणे आवश्यक आहे.');
      return;
    }
    setSaving(true);
    try {
      const payload = valid.map((it, i) => ({
        name_mr:    it.name_mr.trim(),
        name_en:    it.name_en?.trim() || null,
        quantity:   it.quantity || null,
        unit:       it.unit || null,
        note:       it.note || null,
        sort_order: i + 1,
      }));
      await tenantConfigAPI.saveSamagriConfig(selPooja.id, payload);
      setSource('tenant');
      toast.success(`${valid.length} साहित्य वस्तू जतन केल्या! ✅`);
    } catch {
      toast.error('जतन करता आली नाही.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!selPooja) return;
    if (!window.confirm('Franchise साहित्य रद्द करायचे? मूळ साहित्य वापरले जाईल.')) return;
    setSaving(true);
    try {
      await tenantConfigAPI.resetSamagriConfig(selPooja.id);
      loadSamagri(selPooja.id);
      toast.success('मूळ साहित्य पुनर्स्थापित केले.');
    } catch {
      toast.error('Reset करता आला नाही.');
    } finally {
      setSaving(false);
    }
  };

  const filteredPoojas = poojas.filter(p =>
    p.name_mr?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_en?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🛒 माझी साहित्य यादी</h1>
          <p className="text-gray-500 text-sm mt-1">
            पूजा निवडा → तुमची स्वतःची साहित्य यादी सेट करा.
            बदल नसेल तर मूळ साहित्य वापरले जाईल.
          </p>
        </div>

        {/* Pooja Select */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5">
          <p className="text-sm font-medium text-gray-700 mb-2">पूजा निवडा</p>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="नाव टाइप करा..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredPoojas.map(p => (
              <button
                key={p.id}
                onClick={() => handlePoojaChange(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selPooja?.id === p.id
                    ? 'bg-orange-500 text-white'
                    : 'hover:bg-orange-50 text-gray-700'
                }`}
              >
                {p.name_mr}
                <span className="ml-2 text-xs opacity-60">{p.category_name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Samagri Editor */}
        {selPooja && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {/* Pooja header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800">{selPooja.name_mr}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  source === 'tenant'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {source === 'tenant' ? '● माझी साहित्य यादी (बदललेली)' : '○ मूळ साहित्य (बदल नाही)'}
                </span>
              </div>
              {source === 'tenant' && (
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="text-xs text-red-400 hover:text-red-600 underline transition-colors"
                >
                  मूळ साहित्यावर परत जा
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="space-y-2 mb-4">
                  {items.length === 0 && (
                    <p className="text-center py-6 text-gray-400 text-sm">
                      {source === 'global'
                        ? 'मूळ साहित्य वापरली जाईल. स्वतःची साहित्य जोडायची असेल तर खाली "+ साहित्य जोडा" वर क्लिक करा.'
                        : 'कोणतेही साहित्य नाही.'
                      }
                    </p>
                  )}
                  {items.map((item, idx) => (
                    <div key={item._key} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                      <span className="text-xs text-gray-400 w-5 text-center">{idx + 1}</span>

                      <input
                        value={item.name_mr}
                        onChange={e => updateItem(item._key, 'name_mr', e.target.value)}
                        placeholder="नाव (मराठी) *"
                        className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />

                      <input
                        value={item.quantity}
                        onChange={e => updateItem(item._key, 'quantity', e.target.value)}
                        placeholder="प्रमाण"
                        className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />

                      <select
                        value={item.unit}
                        onChange={e => updateItem(item._key, 'unit', e.target.value)}
                        className="w-20 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-400"
                      >
                        <option value="">एकक</option>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>

                      <button
                        onClick={() => removeItem(item._key)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
                        title="काढा"
                      >×</button>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={addItem}
                    className="border border-orange-400 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    + साहित्य जोडा
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving || items.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saving ? 'जतन होतोय...' : '✅ जतन करा'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
