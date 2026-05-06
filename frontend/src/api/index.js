// src/api/auth.api.js
import api from './axios';
export const authAPI = {
  register:        (data)  => api.post('/auth/register', data),
  login:           (data)  => api.post('/auth/login', data),
  sendOtp:         (phone) => api.post('/auth/send-otp', { phone }),
  verifyOtp:       (data)  => api.post('/auth/verify-otp', data),
  forgotPassword:  (phone) => api.post('/auth/forgot-password', { phone }),
  resetPassword:   (data)  => api.post('/auth/reset-password', data),
  getMe:           ()      => api.get('/auth/me'),
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
  getStats:          () => api.get('/admin/stats'),
  getPendingPujaris: () => api.get('/admin/pujaris/pending'),
  getApprovedPujaris:() => api.get('/admin/pujaris'),
  respondPujari:     (id, data) => api.put(`/admin/pujaris/${id}/respond`, data),
  getAllBookings:  (params) => api.get('/admin/bookings', { params }),
  assignPujari:   (id, pujari_id) => api.put(`/admin/bookings/${id}/assign-pujari`, { pujari_id }),
  approveReview:  (id) => api.put(`/admin/reviews/${id}/approve`),
  getAllUsers:     () => api.get('/admin/users'),
};

// src/api/contact.api.js
export const contactAPI = {
  send: (data) => api.post('/contact', data),
};

// src/api/panchang.api.js
export const panchangAPI = {
  get: (params) => api.get('/panchang', { params }),
};

// src/api/kundali.api.js  (Admin only — JWT must have role=admin)
export const kundaliAPI = {
  match:  (data)   => api.post('/kundali/match', data),
  save:   (data)   => api.post('/kundali/save',  data),
  list:   (params) => api.get('/kundali',         { params }),
  get:    (id)     => api.get(`/kundali/${id}`),
  delete: (id)     => api.delete(`/kundali/${id}`),
};

// src/api/theme.api.js
export const themeAPI = {
  get:            ()       => api.get('/theme'),
  update:         (data)   => api.post('/theme/admin', data),
  getFestivals:   ()       => api.get('/theme/admin/festivals'),
  addFestival:    (data)   => api.post('/theme/admin/festivals', data),
  updateFestival: (id, d)  => api.put(`/theme/admin/festivals/${id}`, d),
  deleteFestival: (id)     => api.delete(`/theme/admin/festivals/${id}`),
};

// src/api/home.api.js
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };
export const homeAPI = {
  get:           ()       => api.get('/home'),
  upsert:        (data)   => api.post('/home', data, MULTIPART),
  addSlider:     (data)   => api.post('/home/slider', data, MULTIPART),
  deleteSlider:  (id)     => api.delete(`/home/slider/${id}`),
  toggleSlider:  (id)     => api.patch(`/home/slider/${id}/toggle`),
};

// src/api/janamPatrika.api.js
export const janamPatrikaAPI = {
  generate: (data)  => api.post('/admin/janam-patrika/generate', data),
  save:     (data)  => api.post('/admin/janam-patrika/save',     data),
  getAll:   ()      => api.get('/admin/janam-patrika'),
  getById:  (id)    => api.get(`/admin/janam-patrika/${id}`),
  remove:   (id)    => api.delete(`/admin/janam-patrika/${id}`),
};

// src/api/adminSamagri.api.js
export const adminSamagriAPI = {
  getByPooja: (poojaId)      => api.get(`/admin/samagri/${poojaId}`),
  create:     (data)         => api.post('/admin/samagri', data),
  update:     (id, data)     => api.put(`/admin/samagri/${id}`, data),
  remove:     (id)           => api.delete(`/admin/samagri/${id}`),
};

// src/api/adminHall.api.js
export const adminHallAPI = {
  getAll:  ()         => api.get('/admin/halls'),
  create:  (data)     => api.post('/admin/halls', data),
  update:  (id, data) => api.put(`/admin/halls/${id}`, data),
  remove:  (id)       => api.delete(`/admin/halls/${id}`),
};

// src/api/hall.api.js
export const hallAPI = {
  getHalls:        (params)      => api.get('/halls',                { params }),
  getNearbyHalls:  (lat, lng)    => api.get('/halls/nearby',         { params: { lat, lng } }),
  getPlacesNearby: (lat, lng)    => api.get('/halls/places-nearby',  { params: { lat, lng } }),
};

// src/api/superadmin.api.js
export const superadminAPI = {
  getStats:      ()        => api.get('/superadmin/stats'),
  getTenants:    ()        => api.get('/superadmin/tenants'),
  getTenant:     (id)      => api.get(`/superadmin/tenants/${id}`),
  createTenant:  (data)    => api.post('/superadmin/tenants', data),
  updateTenant:  (id, data)=> api.put(`/superadmin/tenants/${id}`, data),
  deleteTenant:  (id)      => api.delete(`/superadmin/tenants/${id}`),
  getTenantStats:(id)      => api.get(`/superadmin/tenants/${id}/stats`),
  getAllUsers:    (params)  => api.get('/superadmin/users', { params }),
};
