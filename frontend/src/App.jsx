// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

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

const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const ManagePujaris   = lazy(() => import('./pages/admin/ManagePujaris'));
const ManageBookings  = lazy(() => import('./pages/admin/ManageBookings'));
const ManagePoojas    = lazy(() => import('./pages/admin/ManagePoojas'));
const KundaliMilan    = lazy(() => import('./pages/admin/KundaliMilan'));
const AdminHome       = lazy(() => import('./pages/admin/AdminHome'));
const AdminTheme      = lazy(() => import('./pages/admin/AdminTheme'));
const ManageHalls     = lazy(() => import('./pages/admin/ManageHalls'));
const ManageSamagri   = lazy(() => import('./pages/admin/ManageSamagri'));
const JanamPatrika    = lazy(() => import('./pages/admin/JanamPatrika'));

const HallBooking     = lazy(() => import('./pages/HallBooking'));
const TenantsPage     = lazy(() => import('./pages/superadmin/TenantsPage'));
const AdminLogin      = lazy(() => import('./pages/admin/AdminLogin'));

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

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: "'Noto Serif Devanagari', serif", fontSize: '15px' },
              success: { iconTheme: { primary: '#E07B2A', secondary: '#fff' } },
            }}
          />
          <Routes>
            {/* ── Public ────────────────────────────────────── */}
            <Route path="/"                element={<Home />} />
            <Route path="/pooja"           element={<PoojaList />} />
            <Route path="/pooja/:category" element={<PoojaList />} />
            <Route path="/vidhi/:slug"     element={<PoojaDetail />} />
            <Route path="/contact"         element={<Contact />} />
            <Route path="/about"           element={<About />} />
            <Route path="/panchang"        element={<Panchang />} />
            <Route path="/hall-booking"    element={<HallBooking />} />
            <Route path="/login"            element={<Login />} />
            <Route path="/admin/login"     element={<AdminLogin />} />
            <Route path="/register"        element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* ── User Protected ────────────────────────────── */}
            <Route path="/booking/:slug"   element={<PrivateRoute><Booking /></PrivateRoute>} />
            <Route path="/my-bookings"     element={<PrivateRoute><BookingHistory /></PrivateRoute>} />

            {/* ── Pujari ────────────────────────────────────── */}
            <Route path="/pujari-nondni"    element={<PrivateRoute><PujariRegister /></PrivateRoute>} />
            <Route path="/pujari-dashboard" element={<PujariRoute><PujariDashboard /></PujariRoute>} />

            {/* ── Admin (tenant admin + super_admin) ────────── */}
            <Route path="/admin"                element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/dashboard"      element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/pujaris/pending"element={<AdminRoute><ManagePujaris mode="pending" /></AdminRoute>} />
            <Route path="/admin/pujaris"        element={<AdminRoute><ManagePujaris mode="approved" /></AdminRoute>} />
            <Route path="/admin/bookings"       element={<AdminRoute><ManageBookings /></AdminRoute>} />
            <Route path="/admin/poojas"         element={<AdminRoute><ManagePoojas /></AdminRoute>} />
            <Route path="/admin/kundali-milan"  element={<AdminRoute><KundaliMilan /></AdminRoute>} />
            <Route path="/admin/home"           element={<AdminRoute><AdminHome /></AdminRoute>} />
            <Route path="/admin/theme"          element={<AdminRoute><AdminTheme /></AdminRoute>} />
            <Route path="/admin/halls"          element={<AdminRoute><ManageHalls /></AdminRoute>} />
            <Route path="/admin/samagri"        element={<AdminRoute><ManageSamagri /></AdminRoute>} />
            <Route path="/admin/janam-patrika"  element={<AdminRoute><JanamPatrika /></AdminRoute>} />

            {/* ── Super Admin only ──────────────────────────── */}
            <Route path="/superadmin/tenants"   element={<SuperAdminRoute><TenantsPage /></SuperAdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
