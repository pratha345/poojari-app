// src/services/sms.service.js
const axios = require('axios');

/**
 * Send OTP via Fast2SMS (free tier available)
 * Sign up at https://www.fast2sms.com
 */
exports.sendOTP = async (phone, otp) => {
  if (!process.env.SMS_API_KEY) {
    // Development fallback — log to console
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    return true;
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route:    'otp',
        variables_values: otp,
        numbers:  phone,
      },
      {
        headers: {
          authorization: process.env.SMS_API_KEY,
        },
      }
    );
    console.log(`📱 OTP sent to ${phone}:`, response.data);
    return true;
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
    // Don't throw — fallback gracefully
    return false;
  }
};

/**
 * Send booking notification via WhatsApp (Twilio or similar)
 */
exports.sendBookingNotification = async (phone, message) => {
  // TODO: Integrate Twilio WhatsApp API
  console.log(`💬 WhatsApp to ${phone}: ${message}`);
};
