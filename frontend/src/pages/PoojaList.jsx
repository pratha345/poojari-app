// src/pages/PoojaList.jsx
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PoojaCard from '../components/common/PoojaCard';
import SEOHead from '../components/SEOHead';
import { poojaAPI } from '../api/index.js';
import { useTenantSlug } from '../hooks/useTenantSlug';
import styles from './PoojaList.module.css';

const OCCASIONS = [
  { icon: '🏠', label: 'गृहप्रवेश',   type: 'category', value: 'vastu-pooja'   },
  { icon: '🪔', label: 'सत्यनारायण',  type: 'search',   value: 'सत्यनारायण'   },
  { icon: '💍', label: 'लग्न',        type: 'search',   value: 'लग्न'          },
  { icon: '👶', label: 'नामकरण',      type: 'search',   value: 'नामकरण'        },
  { icon: '🔥', label: 'हवन',         type: 'category', value: 'havan-jaap'    },
  { icon: '🕯️', label: 'दशक्रिया',    type: 'category', value: 'pitru-shraddha'},
  { icon: '🐘', label: 'गणपती',       type: 'search',   value: 'गणपती'         },
  { icon: '🌟', label: 'नवग्रह',      type: 'search',   value: 'नवग्रह'        },
  { icon: '🎓', label: 'मुंज',        type: 'search',   value: 'मुंज'          },
  { icon: '💡', label: 'दिवाळी पूजा', type: 'search',   value: 'दिवाळी'        },
];

function buildSchema(poojas, category, activeCategory) {
  const base = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': activeCategory ? `${activeCategory.name_mr} | पूजारी` : 'सर्व पूजा सेवा | पूजारी',
    'description': 'महाराष्ट्रातील सर्व पूजा सेवा ऑनलाइन बुक करा.',
    'url': category ? `https://pojjari.com/pooja/${category}` : 'https://pojjari.com/pooja',
    'breadcrumb': {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'मुख्यपृष्ठ', 'item': 'https://pojjari.com/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'पूजा',        'item': 'https://pojjari.com/pooja' },
        ...(activeCategory ? [{ '@type': 'ListItem', 'position': 3, 'name': activeCategory.name_mr, 'item': `https://pojjari.com/pooja/${category}` }] : []),
      ],
    },
  };
  if (poojas.length > 0) {
    base['mainEntity'] = {
      '@type': 'ItemList',
      'itemListElement': poojas.slice(0, 10).map((p, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'name': p.name_mr,
        'url': `https://pojjari.com/vidhi/${p.slug}`,
      })),
    };
  }
  return base;
}

export default function PoojaList() {
  const { category }            = useParams();
  const [searchParams]          = useSearchParams();
  const tenantSlug              = useTenantSlug();
  const navigate                = useNavigate();
  const [poojas,      setPoojas]      = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [pagination,  setPagination]  = useState({});
  const [page,        setPage]        = useState(1);

  const searchQuery = searchParams.get('search') || '';

  const handleOccasion = (occ) => {
    if (occ.type === 'category') navigate(`/pooja/${occ.value}`);
    else navigate(`/pooja?search=${encodeURIComponent(occ.value)}`);
  };

  const isOccasionActive = (occ) => {
    if (occ.type === 'category') return category === occ.value;
    return searchQuery === occ.value;
  };

  useEffect(() => {
    poojaAPI.getCategories()
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (category)    params.category    = category;
    if (searchQuery) params.search      = searchQuery;
    if (tenantSlug)  params.tenant_slug = tenantSlug;

    poojaAPI.getPoojas(params)
      .then(r => {
        setPoojas(r.data.data.poojas || []);
        setPagination(r.data.data.pagination || {});
      })
      .catch(() => setPoojas([]))
      .finally(() => setLoading(false));
  }, [category, searchQuery, page]);

  const activeCategory = categories.find(c => c.slug === category);

  const seoTitle = searchQuery
    ? `"${searchQuery}" पूजा शोध निकाल`
    : activeCategory
      ? `${activeCategory.name_mr} - ऑनलाइन बुकिंग`
      : 'सर्व पूजा सेवा - ऑनलाइन बुकिंग';

  const seoDesc = activeCategory
    ? `${activeCategory.name_mr} ऑनलाइन बुक करा. महाराष्ट्रातील अनुभवी पुजारी घरी येतात. पूजारी सेवा बुक करा.`
    : 'सत्यनारायण, गृहप्रवेश, दशक्रिया, रुद्राभिषेक, हवन, लक्ष्मी पूजन सर्व पूजा ऑनलाइन बुक करा. महाराष्ट्रातील अनुभवी पुजारी.';

  return (
    <div>
      <SEOHead
        title={seoTitle}
        description={seoDesc}
        keywords="पूजा बुकिंग, book puja online, पुजारी सेवा, satyanarayan puja booking, गृहप्रवेश पूजा, दशक्रिया विधी, हवन बुकिंग, महाराष्ट्र पूजा सेवा"
        canonical={category ? `/pooja/${category}` : '/pooja'}
        schema={buildSchema(poojas, category, activeCategory)}
      />
      <Header />
      <main className={styles.main}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <div className="container">
            <Link to="/">मुख्यपृष्ठ</Link>
            <span>›</span>
            <Link to="/pooja">पूजा</Link>
            {activeCategory && <><span>›</span><span>{activeCategory.name_mr}</span></>}
            {searchQuery && <><span>›</span><span>"{searchQuery}" साठी शोध</span></>}
          </div>
        </div>

        <div className="container">
          <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <h3 className={styles.sideTitle}>पूजा श्रेणी</h3>
              <ul className={styles.catList}>
                <li>
                  <Link
                    to="/pooja"
                    className={`${styles.catItem} ${!category ? styles.catActive : ''}`}
                  >
                    🙏 सर्व पूजा
                  </Link>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <Link
                      to={`/pooja/${cat.slug}`}
                      className={`${styles.catItem} ${category === cat.slug ? styles.catActive : ''}`}
                    >
                      {cat.name_mr}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Content */}
            <section className={styles.content}>
              <div className={styles.contentHeader}>
                <h1 className={styles.pageTitle}>
                  {searchQuery
                    ? `"${searchQuery}" साठी निकाल`
                    : activeCategory?.name_mr || 'सर्व पूजा'}
                </h1>
                {pagination.total !== undefined && (
                  <span className={styles.count}>{pagination.total} पूजा उपलब्ध</span>
                )}
              </div>

              {/* Quick Occasion Strip */}
              <div className={styles.occasionStrip}>
                <span className={styles.occasionStripLabel}>प्रसंग:</span>
                <div className={styles.occasionScrollRow}>
                  {OCCASIONS.map(occ => (
                    <button
                      key={occ.label}
                      className={`${styles.occasionBtn} ${isOccasionActive(occ) ? styles.occasionBtnActive : ''}`}
                      onClick={() => handleOccasion(occ)}
                    >
                      <span>{occ.icon}</span>{occ.label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className={styles.loadGrid}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className={styles.skeletonCard}>
                      <div className={`skeleton ${styles.skeletonImg}`}/>
                      <div style={{ padding: '16px' }}>
                        <div className="skeleton" style={{ height: '16px', borderRadius: '4px', marginBottom: '10px' }}/>
                        <div className="skeleton" style={{ height: '12px', borderRadius: '4px', width: '70%' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              ) : poojas.length === 0 ? (
                <div className={styles.empty}>
                  <span>🔍</span>
                  <h3>कोणतीही पूजा सापडली नाही</h3>
                  <p>वेगळ्या शब्दांनी शोधण्याचा प्रयत्न करा</p>
                  <Link to="/pooja" className="btn btn-primary">सर्व पूजा पहा</Link>
                </div>
              ) : (
                <>
                  {/* ── Featured / Regular split ─────────────── */}
                  {(() => {
                    const featured = poojas.filter(p => p.is_featured);
                    const regular  = poojas.filter(p => !p.is_featured);
                    // सर्व पूजा एकाच 3-column grid मध्ये — featured आधी, regular नंतर
                    return (
                      <>
                        {featured.length > 0 && (
                          <div className={styles.sectionLabel}>
                            <span className={styles.sectionLabelIcon}>⭐</span>
                            लोकप्रिय पूजा
                          </div>
                        )}
                        <div className={styles.poojaGrid}>
                          {featured.map(p => <PoojaCard key={p.id} pooja={p}/>)}
                          {regular.map(p => <PoojaCard key={p.id} pooja={p}/>)}
                        </div>
                      </>
                    );
                  })()}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className={styles.pagination}>
                      {page > 1 && (
                        <button className={styles.pageBtn} onClick={() => setPage(page - 1)}>← मागे</button>
                      )}
                      {[...Array(pagination.pages)].map((_, i) => (
                        <button
                          key={i}
                          className={`${styles.pageBtn} ${page === i + 1 ? styles.pageActive : ''}`}
                          onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                          {i + 1}
                        </button>
                      ))}
                      {page < pagination.pages && (
                        <button className={styles.pageBtn} onClick={() => setPage(page + 1)}>पुढे →</button>
                      )}
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
