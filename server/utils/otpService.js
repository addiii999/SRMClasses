const axios = require('axios');
const crypto = require('crypto');

/**
 * Generate a secure 6-digit OTP
 * Rejects trivially invalid patterns (all same digits)
 */
const generateOTP = () => {
  let otp;
  do {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  } while (/^(\d)\1{5}$/.test(otp)); // reject 111111, 222222, etc.
  return otp;
};

/**
 * Validate phone number format
 * Must be 10 digits, Indian format, not all same
 */
const validatePhone = (mobile) => {
  if (!/^\d{10}$/.test(mobile)) return false;        // must be 10 digits
  if (/^(\d)\1{9}$/.test(mobile)) return false;       // reject 9999999999
  if (/^(0{10})$/.test(mobile)) return false;          // reject 0000000000
  return true;
};

/**
 * Hash OTP before storing in DB (never store raw OTP)
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Send OTP via Email using Brevo API
 * @param {string} email - recipient email
 * @param {string} mobile - just for display in email
 * @param {string} otp - raw OTP (before hashing)
 */
const sendOTPviaEmail = async (email, mobile, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    // In dev mode, just log the OTP
    console.log(`[OTP SERVICE] ⚠️  BREVO_API_KEY not set. OTP for ${mobile}: ${otp}`);
    return true;
  }

  await axios.post('https://api.brevo.com/v3/smtp/email', {
    sender: { name: 'SRM Classes', email: process.env.EMAIL_USER || 'srmclasses01@gmail.com' },
    to: [{ email }],
    subject: `${otp} is your SRM Classes OTP`,
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #2D274B; margin-bottom: 8px;">SRM Classes</h2>
        <p style="color: #666; margin-bottom: 24px;">Verify your phone number to create your account.</p>
        <div style="background: #F4F2FF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #9787F3; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
          <div style="font-size: 40px; font-weight: 900; color: #2D274B; letter-spacing: 12px;">${otp}</div>
        </div>
        <p style="color: #999; font-size: 13px;">⏱ Expires in <strong>5 minutes</strong>. Max <strong>3 attempts</strong> allowed.</p>
        <p style="color: #999; font-size: 13px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }, {
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return true;
};

/**
 * Send OTP via SMS (placeholder - plug in Fast2SMS/Twilio key when ready)
 * @param {string} mobile - 10-digit number
 * @param {string} otp - raw OTP
 */
const sendOTPviaSMS = async (mobile, otp) => {
  const smsKey = process.env.FAST2SMS_API_KEY;

  if (!smsKey) {
    console.log(`[OTP SERVICE] 📱 SMS not configured. OTP for +91${mobile}: ${otp}`);
    return true;
  }

  // Fast2SMS Integration (uncomment when you have API key)
  await axios.post('https://www.fast2sms.com/dev/bulkV2', {
    route: 'otp',
    variables_values: otp,
    numbers: mobile,
  }, {
    headers: { authorization: smsKey },
  });

  return true;
};

module.exports = {
  generateOTP,
  validatePhone,
  hashOTP,
  sendOTPviaEmail,
  sendOTPviaSMS,
};
