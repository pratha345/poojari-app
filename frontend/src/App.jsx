// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Home            from './pages/Home';
import PoojaList       from './pages/PoojaList';
import PoojaDetail     from './pages/PoojaDetail';
import Booking         from './pages/Booking';
import BookingHistory  from './pages/BookingHistory';
import Login           from './pages/Login';
import Register        from './pages/Register';
import PujariRegister  from './pages/PujariRegister';
import PujariDashboard from './pages/PujariDashboard';
import Contact         from './pages/Contact';
import About           from './pages/About';
import AdminDashboard  from './pages/admin/AdminDashboard';
import ManagePujaris   from './pages/admin/ManagePujaris';
import ManageBookings  from './pages/admin/ManageBookings';
import ManagePoojas    from './pages/admin/ManagePoojas';

// Route guards
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/" replace />;
};
const PujariRoute = ({ children }) => {
  const { isPujari, isAdmin } = useAuth();
  return (isPujari || isAdmin) ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: "'Noto Serif Devanagari', serif", fontSize: '15px' },
            success: { iconTheme: { primary: '#E07B2A', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/"                  element={<Home />} />
          <Route path="/pooja"             element={<PoojaList />} />
          <Route path="/pooja/:category"   element={<PoojaList />} />
          <Route path="/vidhi/:slug"       element={<PoojaDetail />} />
          <Route path="/contact"           element={<Contact />} />
          <Route path="/about"             element={<About />} />
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />

          {/* User Protected */}
          <Route path="/booking/:slug"     element={<PrivateRoute><Booking /></PrivateRoute>} />
          <Route path="/my-bookings"       element={<PrivateRoute><BookingHistory /></PrivateRoute>} />

          {/* Pujari */}
          <Route path="/pujari-nondni"     element={<PrivateRoute><PujariRegister /></PrivateRoute>} />
          <Route path="/pujari-dashboard"  element={<PujariRoute><PujariDashboard /></PujariRoute>} />

          {/* Admin */}
          <Route path="/admin"             element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/pujaris"     element={<AdminRoute><ManagePujaris /></AdminRoute>} />
          <Route path="/admin/bookings"    element={<AdminRoute><ManageBookings /></AdminRoute>} />
          <Route path="/admin/poojas"      element={<AdminRoute><ManagePoojas /></AdminRoute>} />

          <Route path="*"                  element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
