import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './HallMap.module.css';

// Fix Leaflet default marker icons broken by Vite bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;background:#4285F4;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize:   [16, 16],
  iconAnchor: [8, 8],
});

function FlyToUser({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) map.flyTo([userLocation.lat, userLocation.lng], 13);
  }, [userLocation, map]);
  return null;
}

export default function HallMap({ halls, userLocation }) {
  const center     = userLocation || { lat: 19.0760, lng: 72.8777 };
  const mappable   = halls.filter(h => h.latitude && h.longitude);

  return (
    <div className={styles.wrapper}>
      {mappable.length === 0 && (
        <div className={styles.noCoords}>
          ℹ️ या हॉलसाठी नकाशा माहिती उपलब्ध नाही. यादी दृश्य वापरा.
        </div>
      )}

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ width: '100%', height: '480px' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
          maxZoom={19}
        />

        <FlyToUser userLocation={userLocation} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>📍 तुमचे स्थान</Popup>
          </Marker>
        )}

        {mappable.map(hall => (
          <Marker
            key={hall.id}
            position={[parseFloat(hall.latitude), parseFloat(hall.longitude)]}
          >
            <Popup>
              <div style={{ minWidth: '160px', fontFamily: 'sans-serif' }}>
                <strong style={{ fontSize: '13px' }}>{hall.name}</strong>
                {hall.address  && <p style={{ margin: '4px 0', fontSize: '12px' }}>📍 {hall.address}</p>}
                {hall.distance != null && <p style={{ margin: '4px 0', fontSize: '12px' }}>📏 {hall.distance} किमी</p>}
                {hall.rating   && <p style={{ margin: '4px 0', fontSize: '12px' }}>⭐ {hall.rating}</p>}
                {hall.capacity && <p style={{ margin: '4px 0', fontSize: '12px' }}>👥 {hall.capacity} व्यक्ती</p>}
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {hall.phone ? (
                    <a href={`tel:${hall.phone}`}
                      style={{ fontSize: '12px', background: '#d4622a', color: '#fff', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                      📞 कॉल करा
                    </a>
                  ) : hall.maps_url ? (
                    <a href={hall.maps_url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: '12px', background: '#388e3c', color: '#fff', padding: '4px 8px', borderRadius: '4px', textDecoration: 'none' }}>
                      🗺️ Maps वर पहा
                    </a>
                  ) : null}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
