// src/components/common/NearbyPujarisStrip.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { pujariAPI } from '../../api/index.js';
import { getImageUrl } from '../../utils/index.js';
import { FaLocationDot } from 'react-icons/fa6';

const ALLOWED_PREFIXES = ['/pooja', '/vidhi/', '/book-pujari', '/booking/', '/pujari/'];

export default function NearbyPujarisStrip() {
  const { pathname } = useLocation();
  const isAllowed = ALLOWED_PREFIXES.some(p => pathname === p || pathname.startsWith(p));
  if (!isAllowed) return null;
  const [pujaris, setPujaris] = useState([]);
  const [city,    setCity]    = useState('');

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lng } = pos.coords;

          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { 'User-Agent': 'PojjariApp/1.0' } }
          ).then(r => r.json()).catch(() => ({}));

          const addr     = geoRes.address || {};
          const cityName = addr.city || addr.town || addr.village || '';
          const district = addr.county || addr.state_district || '';
          if (cityName) setCity(cityName);

          const res = await pujariAPI.getNearbyPujaris({ lat, lng, city: cityName, district, limit: 6 });
          const { data = [], fallback } = res.data || {};

          // Only show genuinely local pujaris — skip fallback results
          if (!fallback && data.length > 0) setPujaris(data);
        } catch {}
      },
      () => {}
    );
  }, []);

  if (!pujaris.length) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, #fff8f0, #fdf3e7)',
      borderBottom: '1px solid #f0e0c8',
      padding: '5px 0',
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        flexWrap: 'wrap', rowGap: 4,
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: '#b35c00', fontWeight: 700, fontSize: 12,
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          <FaLocationDot style={{ fontSize: 11 }} />
          {city || 'जवळचे'} पुजारी:
        </span>

        {pujaris.map(p => (
          <Link
            key={p.id}
            to={`/pujari/${p.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#fff', border: '1px solid #e8d5b7',
              borderRadius: 20, padding: '2px 10px 2px 3px',
              textDecoration: 'none', color: '#333',
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: 'linear-gradient(135deg,#FF8C00,#E07B2A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, flexShrink: 0, overflow: 'hidden',
            }}>
              {p.photo_url
                ? <img src={getImageUrl(p.photo_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : '🙏'}
            </div>
            <span>{p.full_name}</span>
            <span style={{ color: '#b35c00', fontSize: 11 }}>
              {p.distance_km != null ? `${p.distance_km} km` : p.city}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
