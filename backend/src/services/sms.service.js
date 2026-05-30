// src/services/sms.service.js
const axios = require('axios');

/**
 * Send OTP via Fast2SMS (free tier available)
 * Sign up at https://www.fast2sms.com
 */
exports.sendOTP = async (phone, otp) => {
  const apiKey = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    return true;
  }

  try {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route:    'q',
        message:  `Your Pojjari OTP is: ${otp}. Valid for 10 minutes. Do not share with anyone.`,
        language: 'english',
        flash:    0,
        numbers:  phone,
      },
      {
        headers: {
          authorization: apiKey,
        },
      }
    );
    console.log(`📱 OTP sent to ${phone}:`, response.data);
    return !!response.data?.return;
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
    return false;
  }
};

/**
 * Send a transactional SMS via Fast2SMS quick route.
 * Falls back to console.log if FAST2SMS_API_KEY is not set.
 */
exports.sendSMS = async (phone, message) => {
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`\n💬 SMS to ${phone}: ${message}\n`);
    return true;
  }
  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message,
        language: 'unicode',
        flash: 0,
        numbers: phone,
      }),
    });
    const data = await res.json();
    if (!data.return) console.error('[SMS]', data.message);
    return !!data.return;
  } catch (err) {
    console.error('[SMS] Error:', err.message);
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
