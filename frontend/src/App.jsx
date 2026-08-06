// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// ── Global WebSite + Organization Schema (appears on every page) ──
const GLOBAL_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://pujari.mydashboard.site/#website',
      'url': 'https://pujari.mydashboard.site/',
      'name': 'पूजारी',
      'alternateName': 'Pojjari',
      'description': 'महाराष्ट्रातील सर्वोत्तम ऑनलाइन पूजा बुकिंग सेवा. घरी पूजा, मनासारखी.',
      'inLanguage': ['mr', 'en'],
      'potentialAction': {
        '@type': 'SearchAction',
        'target': {
          '@type': 'EntryPoint',
          'urlTemplate': 'https://pujari.mydashboard.site/pooja?search={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': 'Organization',
      '@id': 'https://pujari.mydashboard.site/#organization',
      'name': 'पूजारी',
      'alternateName': 'Pojjari',
      'url': 'https://pujari.mydashboard.site/',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://pujari.mydashboard.site/logo.webp',
        'width': 200,
        'height': 200
      },
      'contactPoint': {
        '@type': 'ContactPoint',
        'telephone': '+91-9561903219',
        'contactType': 'customer service',
        'availableLanguage': ['Marathi', 'Hindi', 'English'],
        'areaServed': 'IN-MH'
      },
      'areaServed': {
        '@type': 'State',
        'name': 'Maharashtra',
        'containedInPlace': { '@type': 'Country', 'name': 'India' }
      },
      'serviceType': 'Puja Booking Service',
      'knowsAbout': ['Hindu Puja Rituals', 'Marathi Culture', 'Religious Services', 'Pandit Booking'],
      'sameAs': [
        'https://pujari.mydashboard.site/',
        'https://bot.mydashboard.site/'
      ]
    }
  ]
};

// ── Eager (above-fold critical) ───────────────────────────────
import Home            from './pages/Home';

// ── Lazy (code-split for bundle size) ────────────────────────
const PoojaList       = lazy(() => import('./pages/PoojaList'));
const PoojaDetail     = lazy(() => import('./pages/PoojaDetail'));
const Booking         = lazy(() => import('./pages/Booking'));
const BookingHistory  = lazy(() => import('./pages/BookingHistory'));
const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const PujariRegister  = lazy(() => import('./pages/PujariRegister'));
const PujariDashboard = lazy(() => import('./pages/PujariDashboard'));
const Contact         = lazy(() => import('./pages/Contact'));
const About           = lazy(() => import('./pages/About'));
const Panchang        = lazy(() => import('./pages/Panchang'));
const Muhurat         = lazy(() => import('./pages/Muhurat'));
const Rashifal        = lazy(() => import('./pages/Rashifal'));

const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminReport     = lazy(() => import('./pages/admin/AdminReport'));
const ManagePujaris   = lazy(() => import('./pages/admin/ManagePujaris'));
const ManageBookings      = lazy(() => import('./pages/admin/ManageBookings'));
const ManageConsultations = lazy(() => import('./pages/admin/ManageConsultations'));
const ManagePoojas    = lazy(() => import('./pages/admin/ManagePoojas'));
const KundaliMilan    = lazy(() => import('./pages/admin/KundaliMilan'));
const AdminHome       = lazy(() => import('./pages/admin/AdminHome'));
const AdminTheme      = lazy(() => import('./pages/admin/AdminTheme'));
const AdminGallery    = lazy(() => import('./pages/admin/AdminGallery'));
const ManageHalls     = lazy(() => import('./pages/admin/ManageHalls'));
const ManageSamagri      = lazy(() => import('./pages/admin/ManageSamagri'));
const JanamPatrika       = lazy(() => import('./pages/admin/JanamPatrika'));
const TenantPujaConfig   = lazy(() => import('./pages/admin/TenantPujaConfig'));
const TenantSamagriConfig= lazy(() => import('./pages/admin/TenantSamagriConfig'));
const TenantPujaris      = lazy(() => import('./pages/admin/TenantPujaris'));

const HallBooking     = lazy(() => import('./pages/HallBooking'));
const BookPujari      = lazy(() => import('./pages/BookPujari'));
const OnlinePuja      = lazy(() => import('./pages/OnlinePuja'));
const Blog            = lazy(() => import('./pages/Blog'));
const BlogDetail      = lazy(() => import('./pages/BlogDetail'));
const Aarti           = lazy(() => import('./pages/Aarti'));
const AartiDetail     = lazy(() => import('./pages/AartiDetail'));
const ManageBlog      = lazy(() => import('./pages/admin/ManageBlog'));
const ManageAarti     = lazy(() => import('./pages/admin/ManageAarti'));
const ManageAbhyasak  = lazy(() => import('./pages/admin/ManageAbhyasak'));
const ManageReviews   = lazy(() => import('./pages/admin/ManageReviews'));
const CitiesIndex     = lazy(() => import('./pages/CitiesIndex'));
const CityPage        = lazy(() => import('./pages/CityPage'));
const TenantsPage     = lazy(() => import('./pages/superadmin/TenantsPage'));
const RevenuePage     = lazy(() => import('./pages/superadmin/RevenuePage'));
const PujariProfile   = lazy(() => import('./pages/PujariProfile'));
const AdminLogin      = lazy(() => import('./pages/admin/AdminLogin'));
const JoinPage        = lazy(() => import('./pages/JoinPage'));
const UpgradePlan     = lazy(() => import('./pages/admin/UpgradePlan'));
const MyTickets       = lazy(() => import('./pages/MyTickets'));
const AdminTickets       = lazy(() => import('./pages/admin/AdminTickets'));
const DharmasindhuSearch = lazy(() => import('./pages/admin/DharmasindhuSearch'));
const GranthLibrary      = lazy(() => import('./pages/admin/GranthLibrary'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="spinner" />
    </div>
  );
}

// ── Route Guards ──────────────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
};

const SuperAdminRoute = ({ children }) => {
  const { isSuperAdmin } = useAuth();
  return isSuperAdmin ? children : <Navigate to="/admin/dashboard" replace />;
};

const PujariRoute = ({ children }) => {
  const { isPujari, isAdmin } = useAuth();
  return (isPujari || isAdmin) ? children : <Navigate to="/" replace />;
};

// Allows admin, super_admin, AND abhyasak (blog editors)
const BlogEditorRoute = ({ children }) => {
  const { isAdmin, isAbhyasak } = useAuth();
  return (isAdmin || isAbhyasak) ? children : <Navigate to="/admin/login" replace />;
};

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
    <LanguageProvider>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Global WebSite + Organization Schema — renders on every page */}
          <Helmet>
            <script type="application/ld+json">{JSON.stringify(GLOBAL_SCHEMA)}</script>
          </Helmet>
          <Suspense fallback={<PageLoader />}>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: "'Noto Serif Devanagari', serif", fontSize: '15px' },
              success: { iconTheme: { primary: '#E07B2A', secondary: '#fff' } },
            }}
          />
          <ScrollToTop />
          <Routes>
            {/* ── Public ────────────────────────────────────── */}
            <Route path="/"                element={<Home />} />
            <Route path="/pooja"           element={<PoojaList />} />
            <Route path="/pooja/:category" element={<PoojaList />} />
            <Route path="/vidhi/:slug"     element={<PoojaDetail />} />
            <Route path="/contact"         element={<Contact />} />
            <Route path="/about"           element={<About />} />
            <Route path="/panchang"        element={<Panchang />} />
            <Route path="/muhurat"         element={<Muhurat />} />
            <Route path="/rashifal"        element={<Rashifal />} />
            <Route path="/hall-booking"    element={<HallBooking />} />
            <Route path="/book-pujari"     element={<BookPujari />} />
            <Route path="/online-puja"    element={<OnlinePuja />} />
            <Route path="/blog"           element={<Blog />} />
            <Route path="/blog/:slug"     element={<BlogDetail />} />
            <Route path="/aarti"          element={<Aarti />} />
            <Route path="/aarti/:slug"    element={<AartiDetail />} />
            <Route path="/cities"         element={<CitiesIndex />} />
            <Route path="/cities/:slug"   element={<CityPage />} />
            <Route path="/join"           element={<JoinPage />} />
            <Route path="/pujari/:id"     element={<PujariProfile />} />
            <Route path="/login"            element={<Login />} />
            <Route path="/admin/login"     element={<AdminLogin />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ── User Protected ────────────────────────────── */}
            {/* NOT wrapped in PrivateRoute (like /book-pujari below) — Booking.jsx
                has its own guest "Step 0" Google/OTP verification for exactly
                this case; PrivateRoute here was bouncing every guest straight
                to /login before that step ever got a chance to render, making
                it permanently unreachable dead code. */}
            <Route path="/booking/:slug"   element={<Booking />} />
            <Route path="/my-bookings"     element={<PrivateRoute><BookingHistory /></PrivateRoute>} />
            <Route path="/my-tickets"      element={<PrivateRoute><MyTickets /></PrivateRoute>} />
            <Route path="/my-tickets/:id"  element={<PrivateRoute><MyTickets /></PrivateRoute>} />

            {/* ── Pujari ────────────────────────────────────── */}
            <Route path="/pujari-nondni"    element={<PujariRegister />} />
            <Route path="/pujari-dashboard" element={<PujariRoute><PujariDashboard /></PujariRoute>} />

            {/* ── Admin (tenant admin + super_admin) ────────── */}
            <Route path="/admin"                element={<Navigate to="/admin/report" replace />} />
            <Route path="/admin/dashboard"      element={<Navigate to="/admin/report" replace />} />
            <Route path="/admin/report"         element={<AdminRoute><AdminReport /></AdminRoute>} />
            <Route path="/admin/pujaris/pending"  element={<AdminRoute><ManagePujaris initialTab="pending"  /></AdminRoute>} />
            <Route path="/admin/pujaris"          element={<AdminRoute><ManagePujaris initialTab="approved" /></AdminRoute>} />
            <Route path="/admin/bookings"         element={<AdminRoute><ManageBookings /></AdminRoute>} />
            <Route path="/admin/consultations"   element={<AdminRoute><ManageConsultations /></AdminRoute>} />
            <Route path="/admin/poojas"         element={<AdminRoute><ManagePoojas /></AdminRoute>} />
            <Route path="/admin/kundali-milan"  element={<AdminRoute><KundaliMilan /></AdminRoute>} />
            <Route path="/admin/home"           element={<AdminRoute><AdminHome /></AdminRoute>} />
            <Route path="/admin/theme"          element={<AdminRoute><AdminTheme /></AdminRoute>} />
            <Route path="/admin/gallery"        element={<AdminRoute><AdminGallery /></AdminRoute>} />
            <Route path="/admin/halls"          element={<AdminRoute><ManageHalls /></AdminRoute>} />
            <Route path="/admin/samagri"        element={<AdminRoute><ManageSamagri /></AdminRoute>} />
            <Route path="/admin/blog"           element={<BlogEditorRoute><ManageBlog /></BlogEditorRoute>} />
            <Route path="/admin/aarti"          element={<BlogEditorRoute><ManageAarti /></BlogEditorRoute>} />
            <Route path="/admin/abhyasak"      element={<AdminRoute><ManageAbhyasak /></AdminRoute>} />
            <Route path="/admin/janam-patrika"  element={<AdminRoute><JanamPatrika /></AdminRoute>} />
            <Route path="/admin/reviews"        element={<AdminRoute><ManageReviews /></AdminRoute>} />
            <Route path="/admin/upgrade-plan"  element={<AdminRoute><UpgradePlan /></AdminRoute>} />
            <Route path="/admin/tickets"         element={<AdminRoute><AdminTickets /></AdminRoute>} />
            <Route path="/admin/tickets/:id"    element={<AdminRoute><AdminTickets /></AdminRoute>} />
            <Route path="/admin/dharmasindhu"   element={<AdminRoute><DharmasindhuSearch /></AdminRoute>} />
            <Route path="/admin/granth-library" element={<AdminRoute><GranthLibrary /></AdminRoute>} />

            {/* ── Tenant / Franchise Config ─────────────────── */}
            <Route path="/admin/tenant/puja-config"    element={<AdminRoute><TenantPujaConfig /></AdminRoute>} />
            <Route path="/admin/tenant/samagri-config" element={<AdminRoute><TenantSamagriConfig /></AdminRoute>} />
            <Route path="/admin/tenant/pujaris"        element={<AdminRoute><TenantPujaris /></AdminRoute>} />

            {/* ── Super Admin only ──────────────────────────── */}
            <Route path="/superadmin/tenants"   element={<SuperAdminRoute><TenantsPage /></SuperAdminRoute>} />
            <Route path="/superadmin/revenue"   element={<SuperAdminRoute><RevenuePage /></SuperAdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
    </GoogleOAuthProvider>
  );
}
