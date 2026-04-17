// src/utils/imageHelper.js
// Backend now returns full absolute image URLs in API responses.
// This helper just handles null/undefined gracefully.
const PLACEHOLDER = 'https://placehold.co/600x400/f5e6d3/c9a96e?text=Pooja';

export const getImageUrl = (image_url) => image_url || PLACEHOLDER;

export const POOJA_PLACEHOLDER = PLACEHOLDER;

// src/utils/formatPrice.js
export const formatPrice = (amount) =>
  new Intl.NumberFormat('mr-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount);

export const formatPriceSimple = (amount) =>
  `₹${Number(amount).toLocaleString('mr-IN')}`;

// src/utils/formatDate.js
export const formatDateMr = (dateStr) =>
  new Date(dateStr).toLocaleDateString('mr-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

export const formatDateShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString('mr-IN');

export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour   = parseInt(h);
  const suffix = hour < 12 ? 'पूर्वाह्न' : 'अपराह्न';
  const h12    = hour % 12 || 12;
  return `${h12}:${m} ${suffix}`;
};

// src/utils/statusHelpers.js
export const STATUS_MAP = {
  pending:     { label: 'प्रतीक्षेत',   badge: 'warning', icon: '⏳' },
  confirmed:   { label: 'पुष्टी झाली',  badge: 'success', icon: '✅' },
  in_progress: { label: 'सुरू आहे',     badge: 'info',    icon: '🔄' },
  completed:   { label: 'पूर्ण झाली',   badge: 'success', icon: '🪔' },
  cancelled:   { label: 'रद्द झाली',    badge: 'danger',  icon: '❌' },
};

export const PAYMENT_STATUS_MAP = {
  unpaid:   { label: 'देय आहे',     badge: 'warning' },
  paid:     { label: 'पेमेंट झाले', badge: 'success' },
  refunded: { label: 'परतावा',      badge: 'info'    },
};

export const getStatusInfo = (status) =>
  STATUS_MAP[status] || { label: status, badge: 'info', icon: '🔄' };
