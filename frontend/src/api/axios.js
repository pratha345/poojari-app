// src/api/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pojjari_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally: the stored token is expired or invalid, so drop the session.
// Do not redirect here. Public pages (home, blog, panchang, ...) should keep working
// for a logged-out visitor; the route guards in App.jsx send users to the right login
// page when the page they are on actually requires login.
export const SESSION_EXPIRED_EVENT = 'pojjari:session-expired';

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('pojjari_token')) {
      localStorage.removeItem('pojjari_token');
      localStorage.removeItem('pojjari_user');
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(err);
  }
);

export default api;
