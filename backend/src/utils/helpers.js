// src/utils/bookingCode.util.js
/**
 * Generate a unique booking code like POJ-A3F9K2
 */
const generateBookingCode = () => {
  const chars  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 (confusion)
  const random = Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `POJ-${random}`;
};

module.exports = { generateBookingCode };

// src/utils/formatters.js
/**
 * Format price in Indian locale
 */
const formatPrice = (amount) =>
  new Intl.NumberFormat('mr-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/**
 * Format date in Marathi
 */
const formatDateMr = (dateStr) =>
  new Date(dateStr).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Platform fee calculation (5%)
 */
const calculateFees = (totalAmount) => {
  const platform_fee  = Math.round(totalAmount * 0.05);
  const pujari_amount = totalAmount - platform_fee;
  return { platform_fee, pujari_amount };
};

module.exports = { formatPrice, formatDateMr, calculateFees };
