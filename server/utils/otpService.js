const nodemailer = require('nodemailer');
const crypto = require('crypto');

/**
 * Configure Nodemailer Transporter for Gmail
 * Optimized with explicit host and port for reliability
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL
  family: 4, // Force IPv4 to prevent Render IPv6 ENETUNREACH issues
  auth: {
    user: process.env.EMAIL_USER || 'srmclasses01@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
  // Add timeout to prevent hanging
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * Verify transporter connection on startup
 */
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer Verification Failed:', error.message);
  } else {
    console.log('✅ Nodemailer is ready to send emails');
  }
});

/**
 * Generate a secure 6-digit OTP
 */
const generateOTP = () => {
  let otp;
  do {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  } while (/^(\d)\1{5}$/.test(otp));
  return otp;
};

/**
 * Validate phone number format
 */
const validatePhone = (mobile) => {
  if (!/^\d{10}$/.test(mobile)) return false;
  if (/^(\d)\1{9}$/.test(mobile)) return false;
  if (/^(0{10})$/.test(mobile)) return false;
  return true;
};

/**
 * Hash OTP before storing in DB
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Send OTP via Email using Gmail (Nodemailer)
 */
const sendOTPviaEmail = async (email, mobile, otp) => {
  if (!process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_PASS is missing in environment variables!');
    throw new Error('Email service not configured on server.');
  }

  const mailOptions = {
    from: `"SRM Classes" <${process.env.EMAIL_USER || 'srmclasses01@gmail.com'}>`,
    to: email,
    subject: `${otp} is your SRM Classes OTP`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #2D274B; margin-bottom: 8px;">SRM Classes</h2>
        <p style="color: #666; margin-bottom: 24px;">Verify your phone number to create your account.</p>
        <div style="background-color: #F4F2FF; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #9787F3; font-size: 13px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">Your OTP</p>
          <div style="font-size: 36px; font-weight: 900; color: #2D274B; letter-spacing: 8px;">${otp}</div>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">This OTP is valid for <strong>5 minutes</strong>.</p>
        <div style="border-top: 1px solid #eee; padding-top: 16px; margin-top: 16px; color: #BBB; font-size: 11px; text-align: center;">
          Sent to verify mobile: +91 ${mobile.replace(/(.{2}).+(.{2})/, '$1******$2')}
        </div>
      </div>
    `,
  };

  try {
    console.log(`📤 Attempting to send OTP to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully! MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Gmail sendMail error:', error.stack || error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

/**
 * Placeholder for future SMS integration
 */
const sendOTPviaSMS = async (mobile, otp) => {
  return true;
};

module.exports = {
  generateOTP,
  validatePhone,
  hashOTP,
  sendOTPviaEmail,
  sendOTPviaSMS,
};
