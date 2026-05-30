// src/pages/admin/AdminGallery.jsx — Festival Image Gallery
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { themeAPI } from '../../api/index.js';
import adminStyles from './Admin.module.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

function statusInfo(f) {
  const today     = new Date().toISOString().split('T')[0];
  const startDate = f.start_date?.split('T')[0];
  const endDate   = f.end_date?.split('T')[0];
  if (f.is_active && startDate <= today && endDate >= today)
    return { label: '● सक्रिय', color: '#2e7d32', bg: '#e8f5e9' };
  if (endDate < today)
    return { label: '✓ संपला',  color: '#888',    bg: '#f0f0f0' };
  if (f.is_active)
    return { label: '○ येणार',  color: '#e65100', bg: '#fff3e0' };
  return   { label: '✕ बंद',   color: '#c62828', bg: '#ffebee' };
}

export default function AdminGallery() {
  const [festivals,   setFestivals]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [preview,     setPreview]     = useState(null);

  const fileInputRef    = useRef(null);
  const uploadFestIdRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await themeAPI.getFestivals();
      setFestivals(res.data.data?.festivals || []);
    } catch { toast.error('डेटा मिळवताना त्रुटी.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleUploadClick = (id) => {
    uploadFestIdRef.current = id;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const festId = uploadFestIdRef.current;
    setUploadingId(festId);
    e.target.value = '';
    try {
      const res = await themeAPI.uploadImage(festId, file);
      const { image_url } = res.data.data;
      setFestivals(prev => prev.map(f =>
        f.id === festId ? { ...f, image_url, thumb_url: image_url } : f
      ));
      toast.success('✅ इमेज अपलोड झाली!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'अपलोड करताना त्रुटी.');
    } finally { setUploadingId(null); }
  };

  const filtered = festivals.filter(f =>
    !search || f.festival_name.toLowerCase().includes(search.toLowerCase())
  );

  const uploaded = festivals.filter(f => f.image_url).length;
  const pending  = festivals.length - uploaded;

  return (
    <AdminLayout>
      <div>
        <h1 className={adminStyles.pageTitle}>🖼️ सण इमेज गॅलरी</h1>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'एकूण सण',       value: festivals.length, color: '#8B4513', bg: '#fff8f0', icon: '📅' },
            { label: 'इमेज अपलोड',    value: uploaded,         color: '#2e7d32', bg: '#e8f5e9', icon: '✅' },
            { label: 'इमेज बाकी',     value: pending,          color: '#e65100', bg: '#fff3e0', icon: '⏳' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, border: `1.5px solid ${s.color}22` }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#6D4C41', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search ── */}
        <div style={{ marginBottom: 24 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 सण शोधा..."
            style={{ width: '100%', maxWidth: 380, padding: '9px 16px', borderRadius: 10, border: '1.5px solid #ffe0b2', fontSize: 14, outline: 'none', background: '#fff' }}
          />
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className={adminStyles.empty}>
            <span>🖼️</span><p>कोणतेही सण सापडले नाहीत.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {filtered.map(f => {
              const imgSrc      = f.image_url ? `${BASE_URL}${f.image_url}` : null;
              const isUploading = uploadingId === f.id;
              const status      = statusInfo(f);
              return (
                <div key={f.id} style={{
                  background: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                  border: imgSrc ? '2px solid #ffe0b2' : '2px dashed #ddd',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.14)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)'; }}
                >
                  {/* Image area */}
                  <div
                    style={{ width: '100%', aspectRatio: '16/9', background: imgSrc ? '#111' : '#fafafa', position: 'relative', cursor: imgSrc ? 'pointer' : 'default', overflow: 'hidden' }}
                    onClick={() => imgSrc && setPreview(f)}
                  >
                    {isUploading ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#e3f2fd' }}>
                        <span style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</span>
                        <span style={{ fontSize: 12, color: '#1565c0', fontWeight: 600 }}>अपलोड होत आहे...</span>
                      </div>
                    ) : imgSrc ? (
                      <>
                        <img
                          src={`${imgSrc}?t=${Date.now()}`}
                          alt={f.festival_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = 0; e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}>
                          <span style={{ color: '#fff', fontSize: 28 }}>🔍</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#ccc' }}>
                        <span style={{ fontSize: 40 }}>🖼️</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>इमेज नाही</span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ fontSize: 14, color: '#4a1500' }}>{f.festival_name}</strong>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginBottom: 12 }}>
                      {f.start_date?.split('T')[0]} — {f.end_date?.split('T')[0]}
                    </div>
                    <button
                      onClick={() => handleUploadClick(f.id)}
                      disabled={isUploading}
                      style={{
                        width: '100%', padding: '8px 0', borderRadius: 8, border: 'none',
                        background: imgSrc ? 'linear-gradient(135deg,#e8eaf6,#e3f2fd)' : 'linear-gradient(135deg,#E07B2A,#c85a00)',
                        color: imgSrc ? '#1565c0' : '#fff',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        opacity: isUploading ? 0.7 : 1,
                      }}>
                      {isUploading ? '⏳ अपलोड...' : imgSrc ? '🔄 बदला' : '📤 इमेज Upload'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {/* ── Preview Modal ── */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', maxWidth: 700, width: '100%', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff8f0' }}>
              <div>
                <strong style={{ color: '#8B2500', fontSize: 16 }}>{preview.festival_name}</strong>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{preview.start_date?.split('T')[0]} — {preview.end_date?.split('T')[0]}</div>
              </div>
              <button onClick={() => setPreview(null)} style={{ background: '#f5f5f5', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>
            <img
              src={`${BASE_URL}${preview.image_url}?t=${Date.now()}`}
              alt={preview.festival_name}
              style={{ width: '100%', display: 'block', maxHeight: '70vh', objectFit: 'contain', background: '#111' }}
            />
            <div style={{ padding: '14px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #eee' }}>
              <button
                onClick={() => { handleUploadClick(preview.id); setPreview(null); }}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#E07B2A', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                🔄 बदला
              </button>
              <a
                href={`${BASE_URL}${preview.image_url}`}
                download target="_blank" rel="noopener noreferrer"
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2e7d32', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', textDecoration: 'none' }}>
                ⬇️ Download
              </a>
              <button onClick={() => setPreview(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
                बंद करा
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
