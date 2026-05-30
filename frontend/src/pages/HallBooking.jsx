// src/pages/HallBooking.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header   from '../components/layout/Header';
import Footer   from '../components/layout/Footer';
import SEOHead  from '../components/SEOHead';
import HallCard from '../components/common/HallCard';
import HallMap  from '../components/common/HallMap';
import { hallAPI } from '../api/index.js';
import { MAHARASHTRA_DISTRICTS, searchDistricts, getTalukas, searchTalukas } from '../data/maharashtraDistricts.js';
import SearchableSelect from '../components/common/SearchableSelect.jsx';
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
  const [halls,           setHalls]           = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [viewMode,        setViewMode]        = useState('list');
  const [userLocation,    setUserLocation]    = useState(null);
  const [locError,        setLocError]        = useState('');
  const [isNearby,        setIsNearby]        = useState(false);

  // district/taluka search
  const [selDistrict, setSelDistrict] = useState('');
  const [selTaluka,   setSelTaluka]   = useState('');
  const [talukaList,  setTalukaList]  = useState([]);
  const [activeLabel, setActiveLabel] = useState('');

  // ── fetch all halls on first load ──────────────────────────────
  const fetchAll = useCallback(() => {
    setLoading(true);
    hallAPI.getHalls({})
      .then(r => setHalls(r.data.data || []))
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActiveLabel('🏛️ सर्व हॉल');
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── search by district + taluka ────────────────────────────────
  const handleDistrictSearch = (e) => {
    e.preventDefault();
    if (!selDistrict) return;
    setIsNearby(false);
    setLocError('');
    setLoading(true);
    const params = { district: selDistrict };
    if (selTaluka) params.taluka = selTaluka;
    hallAPI.getHalls(params)
      .then(r => {
        setHalls(r.data.data || []);
        setActiveLabel(
          selTaluka
            ? `🔍 ${selDistrict} › ${selTaluka}`
            : `🔍 ${selDistrict} जिल्हा`
        );
      })
      .catch(() => setHalls([]))
      .finally(() => setLoading(false));
  };

  // ── clear / show all ──────────────────────────────────────────
  const handleClear = () => {
    setSelDistrict('');
    setSelTaluka('');
    setTalukaList([]);
    setIsNearby(false);
    setLocError('');
    setActiveLabel('🏛️ सर्व हॉल');
    fetchAll();
  };

  // ── fetch nearby — DB halls + OSM merged ─────────────────────
  const fetchNearby = useCallback((loc) => {
    setLoading(true);
    Promise.all([
      hallAPI.getNearbyHalls(loc.lat, loc.lng).catch(() => ({ data: { data: [] } })),
      hallAPI.getPlacesNearby(loc.lat, loc.lng).catch(() => ({ data: { data: [] } })),
    ]).then(([dbRes, gRes]) => {
      const dbHalls = dbRes.data.data || [];
      const gHalls  = gRes.data.data  || [];
      setHalls([...dbHalls, ...gHalls]);
      setActiveLabel('📍 तुमच्या जवळील हॉल (40 किमी)');
    }).finally(() => setLoading(false));
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('या browser मध्ये GPS उपलब्ध नाही.');
      return;
    }
    setLoading(true);
    setLocError('');
    setActiveLabel('📡 स्थान शोधत आहे...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setIsNearby(true);
        setSelDistrict('');
        setSelTaluka('');
        fetchNearby(loc);
      },
      () => {
        setLocError('स्थान परवानगी नाकारली.');
        setActiveLabel('🏛️ सर्व हॉल');
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchNearby]);

  const hasFilter = selDistrict || isNearby;

  return (
    <div>
      <SEOHead
        title="हॉल बुकिंग महाराष्ट्र — लग्न, पूजा, समारंभ हॉल शोधा | पूजारी"
        description="महाराष्ट्रातील सर्वोत्तम हॉल बुकिंग सेवा. GPS वापरून जवळचे हॉल शोधा. लग्न, साखरपुडा, वाढदिवस, सत्यनारायण पूजासाठी ३६ जिल्ह्यांत हॉल उपलब्ध. पूजारी बुकिंगसह हॉल बुक करा."
        keywords="हॉल बुकिंग महाराष्ट्र, लग्न हॉल, marriage hall booking, hall near me, पूजा हॉल, वाढदिवस हॉल, mangal karyalay, hall booking pune, hall booking mumbai, सभागृह बुकिंग"
        canonical="/hall-booking"
        schema={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Service',
              'name': 'हॉल बुकिंग सेवा — पूजारी',
              'description': 'महाराष्ट्रातील सर्व ३६ जिल्ह्यांत लग्न, पूजा व समारंभासाठी हॉल बुकिंग. GPS शोध सुविधा.',
              'url': 'https://pojjari.com/hall-booking',
              'areaServed': { '@type': 'State', 'name': 'Maharashtra' },
              'provider': { '@type': 'Organization', 'name': 'पूजारी', 'url': 'https://pojjari.com' },
            },
            {
              '@type': 'FAQPage',
              'mainEntity': [
                { '@type': 'Question', 'name': 'महाराष्ट्रात हॉल कसे बुक करावे?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी ॲपवर जाऊन जिल्हा निवडा किंवा GPS वापरा. जवळचे उपलब्ध हॉल दिसतील. थेट संपर्क करून बुकिंग करा.' } },
                { '@type': 'Question', 'name': 'लग्नासाठी हॉल बुकिंग कुठे करावे?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'पूजारी हॉल बुकिंगवर महाराष्ट्रातील सर्व जिल्ह्यांतील मंगल कार्यालये, सभागृहे आणि हॉल उपलब्ध आहेत. पूजा + हॉल एकत्र बुक करता येते.' } },
                { '@type': 'Question', 'name': 'हॉल बुकिंगसोबत पुजारीही मिळतात का?', 'acceptedAnswer': { '@type': 'Answer', 'text': 'होय! पूजारी ॲपची खासियत — हॉल बुकिंग + पुजारी बुकिंग एकाच ठिकाणी. PanditsNearMe सारख्या इतर प्लॅटफॉर्मवर ही सुविधा नाही.' } },
              ],
            },
          ],
        }}
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
          {/* ── Marketing Hero ─────────────────────────────── */}
          <div className={styles.marketingHero}>
            <div className={styles.mhLeft}>
              <span className={styles.mhUniqueBadge}>✨ फक्त पूजारीवर उपलब्ध</span>
              <h1 className={styles.mhTitle}>🏛️ महाराष्ट्रातील सर्वोत्तम<br/>हॉल बुकिंग सेवा</h1>
              <p className={`${styles.mhSub} ${styles.pageSubtitle}`}>
                लग्न · साखरपुडा · वाढदिवस · सत्यनारायण पूजा · समारंभ<br/>
                हॉल बुकिंग <strong>+</strong> पुजारी बुकिंग — एकाच ठिकाणी!
              </p>
              <div className={styles.mhStats}>
                <div className={styles.mhStat}><span>३६</span><small>जिल्हे</small></div>
                <div className={styles.mhStatDiv}/>
                <div className={styles.mhStat}><span>📍 GPS</span><small>जवळचे शोधा</small></div>
                <div className={styles.mhStatDiv}/>
                <div className={styles.mhStat}><span>🗺️</span><small>Map दृश्य</small></div>
                <div className={styles.mhStatDiv}/>
                <div className={styles.mhStat}><span>निःशुल्क</span><small>बुकिंग</small></div>
              </div>
            </div>
            <div className={styles.mhRight}>
              <div className={styles.mhUspCard}>
                <div className={styles.mhUspItem}><span>✅</span><span>GPS वापरून जवळचे हॉल</span></div>
                <div className={styles.mhUspItem}><span>✅</span><span>OpenStreetMap + DB एकत्र</span></div>
                <div className={styles.mhUspItem}><span>✅</span><span>पुजारी + हॉल एकत्र बुक करा</span></div>
                <div className={styles.mhUspItem}><span>✅</span><span>महाराष्ट्रातील सर्व ३६ जिल्हे</span></div>
                <div className={styles.mhCompare}>
                  <span className={styles.mhCompareIcon}>🔴</span>
                  <span>PanditsNearMe — हॉल बुकिंग <strong>नाही</strong></span>
                </div>
                <div className={styles.mhCompare} style={{marginTop:6}}>
                  <span className={styles.mhCompareIcon}>🟢</span>
                  <span>पूजारी — हॉल + पुजारी <strong>दोन्ही</strong>!</span>
                </div>
              </div>
            </div>
          </div>

          {/* District / Taluka search */}
          <form className={styles.districtBar} onSubmit={handleDistrictSearch}>
            <div className={styles.selectWrap}>
              <SearchableSelect
                options={MAHARASHTRA_DISTRICTS.map(d => ({ label: d.name, value: d.name, sublabel: d.en }))}
                value={selDistrict}
                onChange={(v) => { setSelDistrict(v); setSelTaluka(''); setTalukaList(v ? getTalukas(v) : []); }}
                placeholder="🏙️ जिल्हा निवडा..."
                searchPlaceholder="जिल्हा शोधा... (e.g. rtn, pune)"
                searchFn={(q) => searchDistricts(q).map(d => ({ label: d.name, value: d.name, sublabel: d.en }))}
              />
            </div>

            <div className={styles.selectWrap}>
              <SearchableSelect
                options={talukaList.map(t => ({ label: t, value: t }))}
                value={selTaluka}
                onChange={setSelTaluka}
                placeholder="🏘️ तालुका निवडा (ऐच्छिक)"
                searchPlaceholder="तालुका शोधा..."
                disabled={!selDistrict}
                searchFn={(q) => searchTalukas(selDistrict, q).map(t => ({ label: t, value: t }))}
              />
            </div>

            <button
              type="submit"
              className={styles.searchBtn}
              disabled={!selDistrict}
            >
              🔍 शोधा
            </button>

            {hasFilter && (
              <button type="button" className={styles.clearBtn} onClick={handleClear}>
                ✕ रीसेट
              </button>
            )}

            <button
              type="button"
              className={styles.nearbyBtn}
              onClick={detectLocation}
              title="GPS वापरून जवळचे हॉल शोधा"
            >
              📍 जवळचे
            </button>
          </form>

          {/* Status bar */}
          <div className={styles.locBar}>
            {locError ? (
              <span className={styles.locError}>⚠️ {locError}</span>
            ) : (
              <span className={styles.locStatus}>{activeLabel}</span>
            )}
          </div>

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
                  ? '40 किमी परिसरात कोणताही हॉल नोंदणीकृत नाही.'
                  : selDistrict
                    ? `"${selDistrict}${selTaluka ? ' › ' + selTaluka : ''}" मध्ये सध्या कोणताही हॉल उपलब्ध नाही.`
                    : 'सध्या कोणताही हॉल उपलब्ध नाही.'}
              </p>
              {hasFilter && (
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
