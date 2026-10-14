// src/api/auth.api.js
import api from './axios';
export const authAPI = {
  register:        (data)  => api.post('/auth/register', data),
  login:           (data)  => api.post('/auth/login', data),
  sendOtp:         (phone) => api.post('/auth/send-otp', { phone }),
  verifyOtp:       (data)  => api.post('/auth/verify-otp', data),
  forgotPassword:  (phone) => api.post('/auth/forgot-password', { phone }),
  resetPassword:   (data)  => api.post('/auth/reset-password', data),
  googleAuth:      (credential) => api.post('/auth/google', { credential }),
  getMe:           ()      => api.get('/auth/me'),
};

// src/api/pooja.api.js
export const poojaAPI = {
  getCategories: () => api.get('/poojas/categories'),
  getPoojas:     (params) => api.get('/poojas', { params }),
  getPoojaBySlug:(slug) => api.get(`/poojas/${slug}`),
  // final price on this site, optionally for a chosen pujari
  getPrice:      (id, pujariId) => api.get(`/poojas/price/${id}`, { params: pujariId ? { pujari_id: pujariId } : {} }),
  createPooja:   (data) => api.post('/poojas', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePooja:   (id, data) => api.put(`/poojas/${id}`, data),
  uploadPoojaImage: (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.put(`/poojas/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  deletePooja:      (id) => api.delete(`/poojas/${id}`),
  generateSteps:    (name_mr, name_en) => api.post('/admin/pooja/generate-steps', { name_mr, name_en }),
};

// src/api/pujari.api.js
export const pujariAPI = {
  register:        (data) => api.post('/pujari/register', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyProfile:    () => api.get('/pujari/profile'),
  updateProfile:   (data) => api.put('/pujari/profile', data),
  setAvailability: (dates) => api.post('/pujari/availability', { dates }),
  getMyBookings:          (params) => api.get('/pujari/bookings', { params }),
  respondBooking:         (id, data) => api.put(`/pujari/bookings/${id}/respond`, data),
  getWhatsappRequests:    () => api.get('/pujari/whatsapp-requests'),
  acceptWhatsappBooking:  (id) => api.put(`/pujari/whatsapp-requests/${id}/accept`),
  getMyServices:     () => api.get('/pujari/my-services'),
  saveMyServices:    (services) => api.post('/pujari/my-services', { services }),
  getNearbyPujaris:(params) => api.get('/pujari/nearby', { params }),
  getTopReviews:   (limit) => api.get('/pujari/top-reviews', { params: { limit } }),
  getPublicProfile:(id) => api.get(`/pujari/${id}`),
  getPublicReviews:(id) => api.get(`/pujari/${id}/reviews`),
};

// src/api/booking.api.js
export const bookingAPI = {
  create:        (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings/my', { params }),
  getByCode:     (code) => api.get(`/bookings/${code}`),
  cancel:        (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  submitReview:  (data) => api.post('/bookings/review', data),
  createPayment:    (booking_id) => api.post('/bookings/payment/create', { booking_id }),
  verifyPayment:    (data)       => api.post('/bookings/payment/verify', data),
  chooseCash:       (booking_id) => api.post('/bookings/payment/cash', { booking_id }),
  markCashReceived: (id)         => api.put(`/bookings/${id}/cash-received`),
};

// src/api/admin.api.js
export const adminAPI = {
  getStats:          () => api.get('/admin/stats'),
  getAllPoojas:       () => api.get('/admin/all-poojas'),
  getReport:         (params) => api.get('/admin/report', { params }),
  getPendingPujaris: () => api.get('/admin/pujaris/pending'),
  getApprovedPujaris:(params) => api.get('/admin/pujaris', { params }),
  respondPujari:     (id, data) => api.put(`/admin/pujaris/${id}/respond`, data),
  updatePujari:      (id, data) => api.put(`/admin/pujaris/${id}`, data),
  getAllBookings:  (params) => api.get('/admin/bookings', { params }),
  assignPujari:      (id, pujari_id) => api.put(`/admin/bookings/${id}/assign-pujari`, { pujari_id }),
  markComplete:      (id)           => api.put(`/admin/bookings/${id}/complete`),
  getReviews:        (status) => api.get('/admin/reviews', { params: { status } }),
  approveReview:     (id)  => api.put(`/admin/reviews/${id}/approve`),
  bulkApproveReviews:(ids) => api.put('/admin/reviews/bulk-approve', { ids }),
  deleteReview:      (id)  => api.delete(`/admin/reviews/${id}`),
  getAllUsers:      () => api.get('/admin/users'),
  getPushVapidKey:  () => api.get('/admin/push/vapid-key'),
  subscribePush:    (sub) => api.post('/admin/push/subscribe', sub),
  markCashReceived: (id, data) => api.put(`/bookings/${id}/cash-received`, data),
  getAbhyasakUsers: ()     => api.get('/admin/abhyasak'),
  createAbhyasak:   (data) => api.post('/admin/abhyasak', data),
  deleteAbhyasak:   (id)   => api.delete(`/admin/abhyasak/${id}`),
  getConsultations:             (params) => api.get('/admin/consultations', { params }),
  updateConsultationNote:       (id, note) => api.put(`/admin/consultations/${id}/note`, { note }),
  getConsultationServices:      ()         => api.get('/admin/consultation-services'),
  createConsultationService:    (data)     => api.post('/admin/consultation-services', data),
  updateConsultationService:    (id, data) => api.put(`/admin/consultation-services/${id}`, data),
  toggleConsultationService:    (id)       => api.patch(`/admin/consultation-services/${id}/toggle`),
};

// src/api/contact.api.js
export const contactAPI = {
  send: (data) => api.post('/contact', data),
};

// src/api/panchang.api.js
export const panchangAPI = {
  get:       (params)                  => api.get ('/panchang',        { params }),
  rate:      (date, is_helpful, sid)   => api.post('/panchang/rate',   { date, is_helpful, session_id: sid }),
  getRating: (date, session_id)        => api.get ('/panchang/rating', { params: { date, session_id } }),
  // sidereal graha + lagna longitudes sampled over time (Rashi Chakra)
  chakra:    (params)                  => api.get ('/panchang/chakra', { params }),
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
  get:              ()                        => api.get('/theme'),
  update:           (data)                    => api.post('/theme/admin', data),
  getFestivals:     ()                        => api.get('/theme/admin/festivals'),
  addFestival:      (data)                    => api.post('/theme/admin/festivals', data),
  updateFestival:   (id, d)                   => api.put(`/theme/admin/festivals/${id}`, d),
  deleteFestival:   (id)                      => api.delete(`/theme/admin/festivals/${id}`),
  autoUpdate:       (year)                    => api.post(`/theme/admin/festivals/auto-update?year=${year}`),
  uploadImage:      (id, file)                => { const fd = new FormData(); fd.append('image', file); return api.post(`/theme/admin/festivals/${id}/upload-image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); },
  generateImage:    (id, type, style, variant)=> api.post(`/theme/admin/festivals/${id}/generate`, { type, style, variant }),
  generateMulti:    (id, type, style, count)  => api.post(`/theme/admin/festivals/${id}/generate-multi`, { type, style, count }),
  getCaption:       (id, occasion)            => api.post(`/theme/admin/festivals/${id}/whatsapp-caption`, { occasion }),
};

// src/api/gallery.api.js
export const galleryAPI = {
  list:          (params) => api.get('/gallery',        { params }),
  adminList:     (params) => api.get('/gallery/admin',  { params }),
  stats:         ()       => api.get('/gallery/stats'),
  get:           (id)     => api.get(`/gallery/${id}`),
  select:        (id)     => api.patch(`/gallery/${id}/select`),
  togglePublish: (id)     => api.patch(`/gallery/${id}/publish`),
  delete:        (id)     => api.delete(`/gallery/${id}`),
  deleteByFest:  (slug)   => api.delete(`/gallery/festival/${slug}`),
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
  getByPooja:       (poojaId)           => api.get(`/admin/samagri/${poojaId}`),
  create:           (data)              => api.post('/admin/samagri', data),
  bulkCreate:       (pooja_id, items)   => api.post('/admin/samagri/bulk', { pooja_id, items }),
  update:           (id, data)          => api.put(`/admin/samagri/${id}`, data),
  reorder:          (items)             => api.put('/admin/samagri/reorder', { items }),
  remove:           (id)                => api.delete(`/admin/samagri/${id}`),
  deleteAllByPooja: (poojaId)           => api.delete(`/admin/samagri/pooja/${poojaId}`),
  ocr:              (imageFile)         => {
    const fd = new FormData();
    fd.append('image', imageFile);
    return api.post('/admin/samagri/ocr', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
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

// src/api/cities.api.js
export const citiesAPI = {
  list:    ()     => api.get('/cities'),
  getCity: (slug) => api.get(`/cities/${slug}`),
};

// src/api/blog.api.js
const BLOG_MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };
export const blogAPI = {
  list:          (params)            => api.get('/blog',                   { params }),
  getBySlug:     (slug, session_id)  => api.get(`/blog/${slug}`,           { params: { session_id } }),
  categories:    ()                  => api.get('/blog/categories'),
  rateBlog:      (slug, rating, sid) => api.post(`/blog/${slug}/rate`,     { rating, session_id: sid }),
  // admin
  adminList:     ()       => api.get('/blog/admin/all'),
  create:        (data)   => api.post('/blog/admin', data, BLOG_MULTIPART),
  update:        (id, d)  => api.put(`/blog/admin/${id}`, d, BLOG_MULTIPART),
  uploadImage:   (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.put(`/blog/admin/${id}`, fd, BLOG_MULTIPART);
  },
  togglePublish: (id)     => api.patch(`/blog/admin/${id}/publish`),
  remove:        (id)     => api.delete(`/blog/admin/${id}`),
};

// src/api/aarti.api.js
export const aartiAPI = {
  list:          (params)  => api.get('/aarti',            { params }),
  getBySlug:     (slug)    => api.get(`/aarti/${slug}`),
  categories:    ()        => api.get('/aarti/categories'),
  recommended:   ()        => api.get('/aarti/recommended'),
  // admin
  adminList:     ()        => api.get('/aarti/admin/all'),
  ocr:           (fd)      => api.post('/aarti/admin/ocr', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }),
  cleanText:     (raw_text)=> api.post('/aarti/admin/clean-text', { raw_text }, { timeout: 60000 }),
  create:        (fd)      => api.post('/aarti/admin', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:        (id, fd)  => api.put(`/aarti/admin/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  uploadImage:   (id, file) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.patch(`/aarti/admin/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  togglePublish: (id)      => api.patch(`/aarti/admin/${id}/publish`),
  toggleFeatured:(id)      => api.patch(`/aarti/admin/${id}/featured`),
  updatePriority:(id, priority) => api.patch(`/aarti/admin/${id}/priority`, { priority }),
  reorder:       (items) => api.patch(`/aarti/admin/reorder`, { items }),
  remove:        (id)      => api.delete(`/aarti/admin/${id}`),
};

// src/api/rashifal.api.js
export const rashifalAPI = {
  getTomorrow: (rashiId) => api.get(`/rashifal/tomorrow/${rashiId}`),
  getWeekly:   (rashiId) => api.get(`/rashifal/weekly/${rashiId}`),
  getGochar:   (rashiId, period) => api.get(`/rashifal/gochar/${rashiId}`, { params: { period } }),
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
  updatePlan:    (id, data)=> api.patch(`/superadmin/tenants/${id}/plan`, data),
  getPricingPolicy:    (id)       => api.get(`/superadmin/tenants/${id}/pricing-policy`),
  updatePricingPolicy: (id, data) => api.put(`/superadmin/tenants/${id}/pricing-policy`, data),
  getAllUsers:    (params)  => api.get('/superadmin/users', { params }),
  getRevenue:    (params)  => api.get('/superadmin/revenue', { params }),
};

// ── Subscription API ──────────────────────────────────────────
export const subscriptionAPI = {
  getPlans:        ()      => api.get('/subscription/plans'),
  createOrder:     (data)  => api.post('/subscription/create-order', data),
  verifyPayment:   (data)  => api.post('/subscription/verify', data),
  submitRequest:   (data)  => api.post('/subscription/request', data),
  getPlanRequests: (params)=> api.get('/subscription/plan-requests', { params }),
  approveRequest:  (id, action) => api.put(`/subscription/plan-requests/${id}/approve`, { action }),
};

export const chatAPI = {
  send: (message, history) => api.post('/chat', { message, history }),
};

// ── Tenant Config API (franchise admin) ───────────────────────
export const tenantConfigAPI = {
  // Features
  getFeatures:      ()              => api.get('/tenant-config/features'),
  // Dashboard
  getDashboard:     ()              => api.get('/tenant-config/dashboard'),
  // Puja config
  getPujaConfig:    ()              => api.get('/tenant-config/puja'),
  upsertPujaConfig: (poojaId, data) => api.put(`/tenant-config/puja/${poojaId}`, data),
  deletePujaConfig: (poojaId)       => api.delete(`/tenant-config/puja/${poojaId}`),
  // Samagri config
  getSamagriConfig: (poojaId)       => api.get(`/tenant-config/samagri/${poojaId}`),
  saveSamagriConfig:(poojaId, items)=> api.put(`/tenant-config/samagri/${poojaId}`, { items }),
  resetSamagriConfig:(poojaId)      => api.delete(`/tenant-config/samagri/${poojaId}`),
  // Pujaris
  getPujaris:       ()              => api.get('/tenant-config/pujaris'),
  createPujari:     (data)          => api.post('/tenant-config/pujaris/create', data),
  assignPujari:     (pujari_id)     => api.post('/tenant-config/pujaris', { pujari_id }),
  removePujari:     (pujariId)      => api.delete(`/tenant-config/pujaris/${pujariId}`),
};

// ── Ticket API ────────────────────────────────────────────────
export const ticketAPI = {
  create:       (data)         => api.post('/tickets', data),
  getMyTickets: ()             => api.get('/tickets/my'),
  getOpenCount: ()             => api.get('/tickets/open-count'),
  getTicket:    (id)           => api.get(`/tickets/${id}`),
  reply:        (id, message)  => api.post(`/tickets/${id}/reply`, { message }),
  // admin
  adminGetAll:  (params)       => api.get('/tickets', { params }),
  adminReply:   (id, message)  => api.post(`/tickets/${id}/admin-reply`, { message }),
  assignTicket: (id, assigned_to) => api.put(`/tickets/${id}/assign`, { assigned_to }),
  updateStatus: (id, data)     => api.put(`/tickets/${id}/status`, data),
  getAdmins:    ()             => api.get('/tickets/admins/list'),
};
