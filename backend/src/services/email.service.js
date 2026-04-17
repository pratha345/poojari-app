// src/services/email.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Send Booking Confirmation ─────────────────────────────────
exports.sendBookingConfirmation = async ({ to, userName, poojaName, bookingCode, bookingDate, bookingTime, address }) => {
  if (!process.env.EMAIL_USER) return; // Skip if not configured

  const mailOptions = {
    from:    `"पूजारी सेवा" <${process.env.EMAIL_USER}>`,
    to,
    subject: `✅ बुकिंग पुष्टी — ${bookingCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FDF6EC; padding: 20px; border-radius: 12px;">
        <div style="text-align: center; background: #E07B2A; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px;">🪔 पूजारी</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">बुकिंग पुष्टी</p>
        </div>
        <p>नमस्कार <strong>${userName}</strong>,</p>
        <p>आपली बुकिंग यशस्वीरित्या झाली आहे. 🙏</p>
        <div style="background: white; border: 1px solid #E8D0B0; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #8B2500; margin-top: 0;">बुकिंग तपशील</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #7A5533; font-size: 14px;">बुकिंग कोड:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #E07B2A; font-size: 18px;">${bookingCode}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A5533; font-size: 14px;">पूजेचे नाव:</td>
                <td style="padding: 8px 0; font-weight: bold;">${poojaName}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A5533; font-size: 14px;">तारीख:</td>
                <td style="padding: 8px 0;">${new Date(bookingDate).toLocaleDateString('mr-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A5533; font-size: 14px;">वेळ:</td>
                <td style="padding: 8px 0;">${bookingTime}</td></tr>
            <tr><td style="padding: 8px 0; color: #7A5533; font-size: 14px;">पत्ता:</td>
                <td style="padding: 8px 0;">${address}</td></tr>
          </table>
        </div>
        <p style="background: #F5E8D0; padding: 12px 16px; border-radius: 8px; font-size: 14px;">
          📞 आम्ही लवकरच आपल्या नंबरवर संपर्क करून पुजारी नियुक्त करू.
          WhatsApp वर माहिती मिळेल.
        </p>
        <p style="color: #7A5533; font-size: 13px;">
          सहाय्यासाठी: info@pojjari.com | 📞 ९३०७७२०४५९
        </p>
        <div style="text-align: center; margin-top: 24px; color: #7A5533; font-size: 12px;">
          © ${new Date().getFullYear()} पूजारी — भक्तीने बनवले ❤️
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Booking confirmation sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

// ── Send OTP Email (fallback) ─────────────────────────────────
exports.sendOTPEmail = async ({ to, otp }) => {
  if (!process.env.EMAIL_USER) return;

  await transporter.sendMail({
    from:    `"पूजारी" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 आपला OTP: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px;">
        <h2 style="color: #E07B2A;">🪔 पूजारी OTP</h2>
        <p>आपला One-Time Password:</p>
        <div style="font-size: 36px; font-weight: bold; color: #E07B2A; letter-spacing: 8px; padding: 20px; background: #FDF6EC; border-radius: 8px; display: inline-block;">
          ${otp}
        </div>
        <p style="color: #7A5533; font-size: 13px; margin-top: 20px;">हा OTP 10 मिनिटांत कालबाह्य होईल.</p>
      </div>
    `,
  });
};

// ── Send Pujari Approval Notification ────────────────────────
exports.sendPujariApproval = async ({ to, name, approved }) => {
  if (!process.env.EMAIL_USER) return;

  await transporter.sendMail({
    from:    `"पूजारी" <${process.env.EMAIL_USER}>`,
    to,
    subject: approved ? '✅ आपली नोंदणी मंजूर झाली!' : '❌ नोंदणी स्थिती',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #E07B2A; text-align: center;">🪔 पूजारी</h2>
        <p>नमस्कार <strong>${name}</strong>,</p>
        ${approved
          ? `<p style="color: #2E7D32;">✅ आपली पुजारी नोंदणी <strong>मंजूर</strong> झाली आहे! आता आपणास बुकिंग मिळण्यास सुरुवात होईल.</p>
             <p>आपल्या डॅशबोर्डवर जा: <a href="https://pojjari.com/pujari-dashboard">Dashboard</a></p>`
          : `<p style="color: #C62828;">❌ दुर्दैवाने, आपली नोंदणी मंजूर होऊ शकली नाही. अधिक माहितीसाठी आमच्याशी संपर्क साधा.</p>`
        }
        <p>सहाय्यासाठी: 📞 ९३०७७२०४५९</p>
      </div>
    `,
  });
};
