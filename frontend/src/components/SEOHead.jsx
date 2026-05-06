// SEO meta tag component — wraps react-helmet-async
import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'पूजारी';

// Build-time env var (set in .env.development or .env.production).
// Falls back to browser origin at runtime so canonical URLs are always absolute.
const SITE_URL = import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export default function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  ogType   = 'website',
  canonical,
  schema,
  noindex  = false,
}) {
  const fullTitle    = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} - घरी पूजा, मनासारखी | ऑनलाईन पूजा बुकिंग महाराष्ट्र`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : null;
  const ogImg        = ogImage
    ? (ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`)
    : `${SITE_URL}/og-image.jpg`;

  return (
    <Helmet>
      {/* ── Basic ─────────────────────────────────────── */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {keywords    && <meta name="keywords"    content={keywords}    />}
      <meta name="author"  content="पूजारी - Pojjari" />
      <meta name="robots"  content={noindex ? 'noindex,nofollow' : 'index,follow'} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* ── Open Graph ────────────────────────────────── */}
      <meta property="og:title"       content={fullTitle}    />
      <meta property="og:type"        content={ogType}       />
      <meta property="og:image"       content={ogImg}        />
      <meta property="og:site_name"   content={SITE_NAME}    />
      <meta property="og:locale"      content="mr_IN"        />
      {description   && <meta property="og:description" content={description}  />}
      {canonicalUrl  && <meta property="og:url"         content={canonicalUrl} />}

      {/* ── Twitter Card ──────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle}           />
      <meta name="twitter:image"       content={ogImg}               />
      {description && <meta name="twitter:description" content={description} />}

      {/* ── Structured Data ───────────────────────────── */}
      {schema && (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      )}
    </Helmet>
  );
}
