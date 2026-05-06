// src/pages/HallBooking.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header   from '../components/layout/Header';
import Footer   from '../components/layout/Footer';
import SEOHead  from '../components/SEOHead';
import HallCard from '../components/common/HallCard';
import HallMap  from '../components/common/HallMap';
import { hallAPI } from '../api/index.js';
import styles from './HallBooking.module.css';

// ── helpers ───────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className={styles.hallGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className="skeleton" style={{ height: '68px', borderRadius: '8px 8px 0 0' }} />
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '13px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '13px', borderRadius: '4px', width: '72%' }} />
            <div className="skeleton" style={{ height: '13px', borderRadius: '4px', width: '52%' }} />
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <div className="skeleton" style={{ flex: 1, height: '36px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ flex: 1, height: '36px', borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────
export default function HallBooking() {
  const [halls,        setHalls]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [viewMode,     setViewMode]     = useState('list');   // 'list' | 'map'
  const [searchMode,   setSearchMode]   = useState('detecting'); // 'detecting' | 'nearby' | 'city'
  const [userLocation, setUserLocation] = useState(null);    // { lat, lng }
  const [locError,     setLocError]     = useState('');
  const [inputValue,   setInputValue]   = useState('');
  const [cityFilter,   setCityFilter]   = useState('');

  // ── fetch by city ──────────────────────────────────────────────
  const fetchByCity = useCallback((city = '') => {
    setLoading(true);
    const params = {};
    if (city.trim()) params.city = city.trim();
    hallAPI.getHalls(params)
      .then(r => setHalls(r.data.data || []))
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  }, []);

  // ── fetch nearby — DB halls + Google Places merged ────────────
  const fetchNearby = useCallback((loc) => {
    setLoading(true);
    Promise.all([
      hallAPI.getNearbyHalls(loc.lat, loc.lng).catch(() => ({ data: { data: [] } })),
      hallAPI.getPlacesNearby(loc.lat, loc.lng).catch(() => ({ data: { data: [] } })),
    ]).then(([dbRes, gRes]) => {
      const dbHalls = dbRes.data.data || [];
      const gHalls  = gRes.data.data  || [];
      setHalls([...dbHalls, ...gHalls]);
    }).finally(() => setLoading(false));
  }, []);

  // ── geolocation ────────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setSearchMode('city');
      fetchByCity();
      return;
    }
    setLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setSearchMode('nearby');
        fetchNearby(loc);
      },
      () => {
        setLocError('स्थान परवानगी नाकारली. शहर शोधा वापरा.');
        setSearchMode('city');
        fetchByCity(cityFilter);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchByCity, fetchNearby, cityFilter]);

  // auto-detect on first load
  useEffect(() => {
    detectLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── city search ────────────────────────────────────────────────
  const handleCitySearch = (e) => {
    e.preventDefault();
    const city = inputValue.trim();
    setCityFilter(city);
    setSearchMode('city');
    setUserLocation(null);
    setLocError('');
    fetchByCity(city);
  };

  const handleClear = () => {
    setInputValue('');
    setCityFilter('');
    setLocError('');
    detectLocation();
  };

  // ── derived ────────────────────────────────────────────────────
  const isNearby   = searchMode === 'nearby';
  const isDetecting = searchMode === 'detecting';

  const statusLabel = isDetecting
    ? '📡 स्थान शोधत आहे...'
    : isNearby
      ? `📍 तुमच्या जवळील हॉल (40 किमी)`
      : cityFilter
        ? `🔍 "${cityFilter}" मधील हॉल`
        : '🏛️ सर्व हॉल';

  return (
    <div>
      <SEOHead
        title="हॉल बुकिंग - लग्न, साखरपुडा, समारंभ | पूजारी"
        description="महाराष्ट्रातील उत्तम हॉल बुक करा. लग्न, साखरपुडा, वाढदिवस, सत्यनारायण पूजा साठी हॉल थेट संपर्क करा."
        canonical="/hall-booking"
      />
      <Header />

      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <div className="container">
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <span>हॉल बुकिंग</span>
          </div>
        </div>

        <div className="container">
          {/* Page header */}
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>🏛️ हॉल बुकिंग</h1>
            <p className={styles.pageSubtitle}>
              लग्न, साखरपुडा, वाढदिवस, सत्यनारायण पूजा साठी हॉल थेट संपर्क करा
            </p>
          </div>

          {/* Location status bar */}
          <div className={styles.locBar}>
            {locError ? (
              <span className={styles.locError}>⚠️ {locError}</span>
            ) : (
              <span className={styles.locStatus}>{statusLabel}</span>
            )}
            {!isNearby && !isDetecting && (
              <button className={styles.nearbyBtn} onClick={detectLocation}>
                📍 जवळचे शोधा
              </button>
            )}
          </div>

          {/* City filter */}
          <form className={styles.filterBar} onSubmit={handleCitySearch}>
            <input
              type="text"
              placeholder="शहर / गाव शोधा... (उदा: पुणे, नागपूर, औरंगाबाद)"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className={styles.filterInput}
              aria-label="शहर शोधा"
            />
            <button type="submit" className={styles.searchBtn}>🔍 शोधा</button>
            {(cityFilter || isNearby) && (
              <button type="button" className={styles.clearBtn} onClick={handleClear}>
                ✕ रीसेट
              </button>
            )}
          </form>

          {/* View toggle */}
          {!loading && halls.length > 0 && (
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                ☰ यादी
              </button>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'map' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('map')}
              >
                🗺️ नकाशा
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <SkeletonGrid />
          ) : halls.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🏛️</span>
              <h3>कोणताही हॉल सापडला नाही</h3>
              <p>
                {isNearby
                  ? '20 किमी परिसरात कोणताही हॉल नोंदणीकृत नाही.'
                  : cityFilter
                    ? `"${cityFilter}" मध्ये सध्या कोणताही हॉल उपलब्ध नाही.`
                    : 'सध्या कोणताही हॉल उपलब्ध नाही. कृपया नंतर तपासा.'}
              </p>
              {(cityFilter || isNearby) && (
                <button className="btn btn-primary" onClick={handleClear}>
                  सर्व हॉल पहा
                </button>
              )}
            </div>
          ) : viewMode === 'map' ? (
            <HallMap halls={halls} userLocation={userLocation} />
          ) : (
            <>
              <p className={styles.resultCount}>
                {halls.length} हॉल उपलब्ध आहेत
              </p>
              <div className={styles.hallGrid}>
                {halls.map(hall => (
                  <HallCard key={hall.id} hall={hall} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
