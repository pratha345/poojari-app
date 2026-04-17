// src/api/auth.api.js
import api from './axios';
export const authAPI = {
  register:   (data) => api.post('/auth/register', data),
  login:      (data) => api.post('/auth/login', data),
  sendOtp:    (phone) => api.post('/auth/send-otp', { phone }),
  verifyOtp:  (data) => api.post('/auth/verify-otp', data),
  getMe:      () => api.get('/auth/me'),
};

// src/api/pooja.api.js
export const poojaAPI = {
  getCategories: () => api.get('/poojas/categories'),
  getPoojas:     (params) => api.get('/poojas', { params }),
  getPoojaBySlug:(slug) => api.get(`/poojas/${slug}`),
  createPooja:   (data) => api.post('/poojas', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePooja:   (id, data) => api.put(`/poojas/${id}`, data),
  uploadPoojaImage: (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.put(`/poojas/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePooja:   (id) => api.delete(`/poojas/${id}`),
};

// src/api/pujari.api.js
export const pujariAPI = {
  register:        (data) => api.post('/pujari/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyProfile:    () => api.get('/pujari/profile'),
  updateProfile:   (data) => api.put('/pujari/profile', data),
  setAvailability: (dates) => api.post('/pujari/availability', { dates }),
  getMyBookings:   (params) => api.get('/pujari/bookings', { params }),
  respondBooking:  (id, data) => api.put(`/pujari/bookings/${id}/respond`, data),
  getPublicProfile:(id) => api.get(`/pujari/${id}`),
};

// src/api/booking.api.js
export const bookingAPI = {
  create:        (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getByCode:     (code) => api.get(`/bookings/${code}`),
  cancel:        (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  submitReview:  (data) => api.post('/bookings/review', data),
  createPayment: (booking_id) => api.post('/bookings/payment/create', { booking_id }),
  verifyPayment: (data) => api.post('/bookings/payment/verify', data),
};

// src/api/admin.api.js
export const adminAPI = {
  getStats:       () => api.get('/admin/stats'),
  getPendingPujaris: () => api.get('/admin/pujaris/pending'),
  respondPujari:  (id, data) => api.put(`/admin/pujaris/${id}/respond`, data),
  getAllBookings:  (params) => api.get('/admin/bookings', { params }),
  assignPujari:   (id, pujari_id) => api.put(`/admin/bookings/${id}/assign-pujari`, { pujari_id }),
  approveReview:  (id) => api.put(`/admin/reviews/${id}/approve`),
  getAllUsers:     () => api.get('/admin/users'),
};

// src/api/contact.api.js
export const contactAPI = {
  send: (data) => api.post('/contact', data),
};
