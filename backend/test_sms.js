require('dotenv').config();
const smsService = require('./src/services/sms.service');

async function test() {
  console.log("Testing SMS with FAST2SMS...");
  console.log("API Key present:", !!process.env.FAST2SMS_API_KEY);
  
  // Test sendOTP (uses axios)
  try {
    const otpResult = await smsService.sendOTP('9561903219', '123456');
    console.log("OTP send result:", otpResult);
  } catch (e) {
    console.error("OTP Error:", e);
  }
  
  // Test sendSMS (uses fetch)
  try {
    const smsResult = await smsService.sendSMS('9561903219', 'Pojjari Test SMS: Hello from Pujari App! Your booking is confirmed.');
    console.log("SMS send result:", smsResult);
  } catch (e) {
    console.error("SMS Error:", e);
  }
}

test();
