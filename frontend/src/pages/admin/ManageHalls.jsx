import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { adminHallAPI } from '../../api/index.js';
import { MAHARASHTRA_DISTRICTS, searchDistricts, getTalukas, searchTalukas } from '../../data/maharashtraDistricts.js';
import SearchableSelect from '../../components/common/SearchableSelect.jsx';
import s from './ManageHalls.module.css';

// Fix Leaflet icon in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const EMPTY = { name: '', phone: '', whatsapp: '', district: '', taluka: '', city: '', address: '', capacity: '', price_per_day: '', latitude: '', longitude: '' };

// Maharashtra center for default map view
const MH_CENTER = [19.7515, 75.7139];

// Orange marker for existing registered halls
const hallIcon = L.divIcon({
  html: `<div style="background:#e46725;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;">🏛️</div>`,
  className: '',
  iconSize:    [30, 30],
  iconAnchor:  [15, 15],
  popupAnchor: [0, -18],
});

// Blue pin marker for the location being set now
const pinIcon = L.divIcon({
  html: `<div style="background:#1565c0;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);">📍</div>`,
  className: '',
  iconSize:    [30, 30],
  iconAnchor:  [15, 30],
  popupAnchor: [0, -32],
});

// ── Moves the map when target changes (skips first mount) ─────────
function MapController({ target }) {
  const map = useMap();
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 1.4 });
  }, [target, map]);
  return null;
}

// ── Click on map → set lat/lng ────────────────────────────────────
function MapPicker({ lat, lng, onChange }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6)); },
  });
  if (!lat || !lng) return null;
  return (
    <Marker
      position={[parseFloat(lat), parseFloat(lng)]}
      icon={pinIcon}
      eventHandlers={{
        mouseover: e => e.target.openPopup(),
        mouseout:  e => e.target.closePopup(),
      }}
    >
      <Popup closeButton={false}>
        <div style={{ fontSize: '12px', lineHeight: '1.7' }}>
          <strong>📍 निवडलेले Location</strong><br />
          Lat: {parseFloat(lat).toFixed(6)}<br />
          Lng: {parseFloat(lng).toFixed(6)}
        </div>
      </Popup>
    </Marker>
  );
}

export default function ManageHalls() {
  const [halls,     setHalls]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(null);
  const [mapTarget, setMapTarget] = useState(null);   // {lat, lng} → triggers MapController
  const [geocoding, setGeocoding] = useState(false);  // shows loading in hint
  const [mapKey,    setMapKey]    = useState(0);       // remounts MapContainer on form open

  const load = useCallback(() => {
    setLoading(true);
    adminHallAPI.getAll()
      .then(r => setHalls(r.data.data || []))
      .catch(() => toast.error('हॉल लोड करता आले नाहीत.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Nominatim geocoding ───────────────────────────────────────
  const geocodeLocation = useCallback(async (taluka, district) => {
    if (!district) return;
    setGeocoding(true);
    try {
      const q = taluka
        ? `${taluka}, ${district}, Maharashtra, India`
        : `${district}, Maharashtra, India`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setMapTarget({ lat: parseFloat(lat), lng: parseFloat(lng) });
        setForm(f => ({ ...f, latitude: lat, longitude: lng }));
      }
    } catch {
      // silent — user can still click map manually
    } finally {
      setGeocoding(false);
    }
  }, []);

  // ── Form open/close ───────────────────────────────────────────
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setMapTarget(null);
    setMapKey(k => k + 1);
    setShowForm(true);
  };

  const openEdit = (hall) => {
    setEditing(hall.id);
    setForm({
      name:          hall.name          || '',
      phone:         hall.phone         || '',
      whatsapp:      hall.whatsapp      || '',
      district:      hall.district      || '',
      taluka:        hall.taluka        || '',
      city:          hall.city          || '',
      address:       hall.address       || '',
      capacity:      hall.capacity      || '',
      price_per_day: hall.price_per_day || '',
      latitude:      hall.latitude      || '',
      longitude:     hall.longitude     || '',
    });
    setMapTarget(null);
    setMapKey(k => k + 1);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY); setMapTarget(null); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleMapClick = (lat, lng) => {
    setForm(f => ({ ...f, latitude: lat, longitude: lng }));
    toast.success(`📍 Location set: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`, { duration: 2000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { toast.error('नाव आणि फोन आवश्यक आहे.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await adminHallAPI.update(editing, form);
        toast.success('हॉल अपडेट केला!');
      } else {
        await adminHallAPI.create(form);
        toast.success('हॉल जोडला!');
      }
      closeForm();
      load();
    } catch {
      toast.error('काहीतरी चूक झाली.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('हा हॉल हटवायचा आहे का?')) return;
    setDeleting(id);
    try {
      await adminHallAPI.remove(id);
      toast.success('हॉल हटवला!');
      load();
    } catch {
      toast.error('हॉल हटवता आला नाही.');
    } finally {
      setDeleting(null);
    }
  };

  // Initial map center: use existing lat/lng (edit) or MH center (add)
  const initialCenter = (form.latitude && form.longitude)
    ? [parseFloat(form.latitude), parseFloat(form.longitude)]
    : MH_CENTER;
  const initialZoom = (form.latitude && form.longitude) ? 16 : 7;

  return (
    <AdminLayout>
      <div className={s.page}>
        <div className={s.header}>
          <h2 className={s.title}>🏛️ Hall Management</h2>
          <button className={s.addBtn} onClick={openAdd}>+ नवीन हॉल जोडा</button>
        </div>

        {/* ── Hall Table ── */}
        {loading ? (
          <div className={s.loading}><div className="spinner" /></div>
        ) : halls.length === 0 ? (
          <div className={s.empty}>
            <p>अद्याप कोणताही हॉल जोडलेला नाही.</p>
            <button className={s.addBtn} onClick={openAdd}>पहिला हॉल जोडा</button>
          </div>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>नाव</th>
                  <th>जिल्हा / तालुका</th>
                  <th>फोन</th>
                  <th>क्षमता</th>
                  <th>भाडे/दिवस</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {halls.map((h, i) => (
                  <tr key={h.id}>
                    <td>{i + 1}</td>
                    <td><strong>{h.name}</strong></td>
                    <td>
                      {h.district
                        ? <>{h.district}{h.taluka ? <> › <em>{h.taluka}</em></> : ''}</>
                        : (h.city || '—')}
                    </td>
                    <td>{h.phone}</td>
                    <td>{h.capacity ? `${h.capacity} व्यक्ती` : '—'}</td>
                    <td>{h.price_per_day ? `₹${Number(h.price_per_day).toLocaleString('en-IN')}` : '—'}</td>
                    <td>
                      {h.latitude && h.longitude
                        ? <span className={s.locSet}>📍 Set</span>
                        : <span className={s.locMissing}>⚠️ नाही</span>}
                    </td>
                    <td>
                      <div className={s.actions}>
                        <button className={s.editBtn} onClick={() => openEdit(h)}>✏️ Edit</button>
                        <button className={s.delBtn} onClick={() => handleDelete(h.id)} disabled={deleting === h.id}>
                          {deleting === h.id ? '...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Modal Form ── */}
        {showForm && (
          <div className={s.overlay} onClick={closeForm}>
            <div className={s.modal} onClick={e => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h3>{editing ? '✏️ हॉल Edit करा' : '+ नवीन हॉल जोडा'}</h3>
                <button className={s.closeBtn} onClick={closeForm}>✕</button>
              </div>

              <form onSubmit={handleSubmit} className={s.form}>
                <div className={s.row}>
                  <label className={s.label}>हॉलचे नाव *
                    <input name="name" value={form.name} onChange={handleChange} className={s.input} placeholder="उदा: श्री गणेश मंगल कार्यालय" required />
                  </label>
                  <label className={s.label}>फोन नंबर *
                    <input name="phone" value={form.phone} onChange={handleChange} className={s.input} placeholder="9876543210" required />
                  </label>
                </div>

                <div className={s.row}>
                  <label className={s.label}>WhatsApp नंबर
                    <input name="whatsapp" value={form.whatsapp} onChange={handleChange} className={s.input} placeholder="9876543210" />
                  </label>
                  <label className={s.label}>जिल्हा
                    <SearchableSelect
                      options={MAHARASHTRA_DISTRICTS.map(d => ({ label: d.name, value: d.name, sublabel: d.en }))}
                      value={form.district}
                      onChange={v => {
                        setForm(f => ({ ...f, district: v, taluka: '' }));
                        if (v) geocodeLocation('', v);
                      }}
                      placeholder="जिल्हा निवडा..."
                      searchPlaceholder="शोधा... (e.g. rtn, pune)"
                      searchFn={q => searchDistricts(q).map(d => ({ label: d.name, value: d.name, sublabel: d.en }))}
                    />
                  </label>
                </div>

                <div className={s.row}>
                  <label className={s.label}>तालुका
                    <SearchableSelect
                      options={getTalukas(form.district).map(t => ({ label: t, value: t }))}
                      value={form.taluka}
                      onChange={v => {
                        setForm(f => ({ ...f, taluka: v }));
                        if (v) geocodeLocation(v, form.district);
                      }}
                      placeholder="तालुका निवडा..."
                      searchPlaceholder="तालुका शोधा..."
                      disabled={!form.district}
                      searchFn={q => searchTalukas(form.district, q).map(t => ({ label: t, value: t }))}
                    />
                  </label>
                  <label className={s.label}>शहर / गाव
                    <input name="city" value={form.city} onChange={handleChange} className={s.input} placeholder="उदा: खेड गाव" />
                  </label>
                </div>

                <label className={s.label}>पत्ता
                  <input name="address" value={form.address} onChange={handleChange} className={s.input} placeholder="पूर्ण पत्ता लिहा" />
                </label>

                <div className={s.row}>
                  <label className={s.label}>क्षमता (व्यक्ती)
                    <input name="capacity" type="number" value={form.capacity} onChange={handleChange} className={s.input} placeholder="500" />
                  </label>
                  <label className={s.label}>भाडे (₹/दिवस)
                    <input name="price_per_day" type="number" value={form.price_per_day} onChange={handleChange} className={s.input} placeholder="25000" />
                  </label>
                </div>

                {/* ── Location / Map ── */}
                <div className={s.locationSection}>
                  <p className={s.locationHint}>
                    {geocoding
                      ? '⏳ नकाशा त्या तालुक्यावर येत आहे...'
                      : form.district
                        ? '✅ जिल्हा/तालुका निवडल्यावर नकाशा आपोआप त्या ठिकाणी येतो — अचूक location साठी नकाशावर click करा'
                        : '📍 आधी जिल्हा निवडा — नकाशा तेथे येईल, मग click करून location सेट करा'}
                  </p>

                  <div className={s.latLngRow}>
                    <label className={s.label}>Latitude
                      <input name="latitude" value={form.latitude} onChange={handleChange} className={s.input} placeholder="19.076090" />
                    </label>
                    <label className={s.label}>Longitude
                      <input name="longitude" value={form.longitude} onChange={handleChange} className={s.input} placeholder="72.877426" />
                    </label>
                  </div>

                  {/* Map legend */}
                  <div className={s.mapLegend}>
                    <span><span className={s.dotOrange}>🏛️</span> नोंदणीकृत हॉल</span>
                    <span><span className={s.dotBlue}>📍</span> निवडलेले location</span>
                    <span className={s.legendHint}>नकाशावर click करा → location set होईल</span>
                  </div>

                  <div className={s.mapPicker}>
                    <MapContainer
                      key={mapKey}
                      center={initialCenter}
                      zoom={initialZoom}
                      minZoom={5}
                      maxZoom={19}
                      style={{ height: '420px', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        maxZoom={19}
                        maxNativeZoom={19}
                      />
                      <MapController target={mapTarget} />

                      {/* Existing halls markers */}
                      {halls
                        .filter(h => h.latitude && h.longitude && h.id !== editing)
                        .map(h => (
                          <Marker
                            key={h.id}
                            position={[parseFloat(h.latitude), parseFloat(h.longitude)]}
                            icon={hallIcon}
                            eventHandlers={{
                              mouseover: e => e.target.openPopup(),
                              mouseout:  e => e.target.closePopup(),
                            }}
                          >
                            <Popup closeButton={false}>
                              <div style={{ fontSize: '12.5px', lineHeight: '1.8', minWidth: '165px' }}>
                                <strong style={{ fontSize: '13px' }}>🏛️ {h.name}</strong><br />
                                {h.district && <span>📍 {h.district}{h.taluka ? ` › ${h.taluka}` : ''}<br /></span>}
                                {h.address && <span>🗺️ {h.address}<br /></span>}
                                {h.capacity && <span>👥 {h.capacity} व्यक्ती<br /></span>}
                                {h.price_per_day && <span>💰 ₹{Number(h.price_per_day).toLocaleString('en-IN')}/दिवस<br /></span>}
                                {h.phone && <a href={`tel:${h.phone}`} style={{ color: '#e46725', fontWeight: 600 }}>📞 {h.phone}</a>}
                              </div>
                            </Popup>
                          </Marker>
                        ))}

                      {/* New/current location pin */}
                      <MapPicker lat={form.latitude} lng={form.longitude} onChange={handleMapClick} />
                    </MapContainer>
                  </div>
                </div>

                <div className={s.formFooter}>
                  <button type="button" className={s.cancelBtn} onClick={closeForm}>रद्द करा</button>
                  <button type="submit" className={s.saveBtn} disabled={saving}>
                    {saving ? 'जतन होत आहे...' : editing ? '✅ अपडेट करा' : '✅ जोडा'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
