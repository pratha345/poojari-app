// src/utils/response.util.js
const success = (res, data = {}, message = 'यशस्वी', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const error = (res, message = 'त्रुटी झाली', statusCode = 500) =>
  res.status(statusCode).json({ success: false, message });

module.exports = { success, error };
