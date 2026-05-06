import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { adminHallAPI } from '../../api/index.js';
import s from './ManageHalls.module.css';

// Fix Leaflet icon in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const EMPTY = { name: '', phone: '', whatsapp: '', city: '', address: '', capacity: '', price_per_day: '', latitude: '', longitude: '' };

function MapPicker({ lat, lng, onChange }) {
  useMapEvents({
    click(e) { onChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6)); },
  });
  return (lat && lng)
    ? <Marker position={[parseFloat(lat), parseFloat(lng)]} />
    : null;
}

export default function ManageHalls() {
  const [halls,   setHalls]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminHallAPI.getAll()
      .then(r => setHalls(r.data.data || []))
      .catch(() => toast.error('हॉल लोड करता आले नाहीत.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };

  const openEdit = (hall) => {
    setEditing(hall.id);
    setForm({
      name:          hall.name        || '',
      phone:         hall.phone       || '',
      whatsapp:      hall.whatsapp    || '',
      city:          hall.city        || '',
      address:       hall.address     || '',
      capacity:      hall.capacity    || '',
      price_per_day: hall.price_per_day || '',
      latitude:      hall.latitude    || '',
      longitude:     hall.longitude   || '',
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); setForm(EMPTY); };

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleMapClick = (lat, lng) => setForm(f => ({ ...f, latitude: lat, longitude: lng }));

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

  const mapCenter = (form.latitude && form.longitude)
    ? [parseFloat(form.latitude), parseFloat(form.longitude)]
    : [19.0760, 72.8777];

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
                  <th>शहर</th>
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
                    <td>{h.city || '—'}</td>
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
                  <label className={s.label}>शहर
                    <input name="city" value={form.city} onChange={handleChange} className={s.input} placeholder="उदा: पुणे" />
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

                {/* Location */}
                <div className={s.locationSection}>
                  <p className={s.locationHint}>📍 खाली नकाशावर click करा — location आपोआप सेट होईल</p>
                  <div className={s.latLngRow}>
                    <label className={s.label}>Latitude
                      <input name="latitude" value={form.latitude} onChange={handleChange} className={s.input} placeholder="19.076090" />
                    </label>
                    <label className={s.label}>Longitude
                      <input name="longitude" value={form.longitude} onChange={handleChange} className={s.input} placeholder="72.877426" />
                    </label>
                  </div>
                  <div className={s.mapPicker}>
                    <MapContainer center={mapCenter} zoom={form.latitude ? 14 : 6} style={{ height: '280px', width: '100%' }}>
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                      />
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
