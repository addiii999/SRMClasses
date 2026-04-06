const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * Configure Nodemailer Transporter for Gmail
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'srmclasses01@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

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
 * Send OTP via Email using Gmail (Nodemailer)
 */
const sendOTPviaEmail = async (email, mobile, otp) => {
  const mailOptions = {
    from: `"SRM Classes" <${process.env.EMAIL_USER || 'srmclasses01@gmail.com'}>`,
    to: email,
    subject: `${otp} is your SRM Classes OTP`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 16px;">
        <h2 style="color: #2D274B; margin-bottom: 8px;">SRM Classes</h2>
        <p style="color: #666; margin-bottom: 24px;">Verify your phone number to create your account.</p>
        <div style="background: #F4F2FF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #9787F3; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
          <div style="font-size: 36px; font-weight: 900; color: #2D274B; letter-spacing: 8px;">${otp}</div>
        </div>
        <p style="color: #999; font-size: 12px;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px; color: #BBB; font-size: 11px;">
          Sent to verify mobile: +91 ${mobile.replace(/(.{2}).+(.{2})/, '$1******$2')}
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent via Gmail to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Gmail sendMail error:', error.message);
    throw new Error('Failed to send email. Please check Gmail configuration.');
  }
};

/**
 * Send OTP via SMS (placeholder - ready for integration)
 */
const sendOTPviaSMS = async (mobile, otp) => {
  const smsKey = process.env.FAST2SMS_API_KEY;
  if (!smsKey) return true; // fallback to email only
  // ... Fast2SMS implementation could go here
  return true;
};

module.exports = {
  generateOTP,
  validatePhone,
  hashOTP,
  sendOTPviaEmail,
  sendOTPviaSMS,
};
