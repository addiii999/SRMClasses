const axios = require('axios');
const crypto = require('crypto');

/**
 * Send OTP via Brevo API (HTTP)
 * This is the ONLY way to send emails from Render Free Tier 
 * because Render blocks SMTP ports (465, 587).
 */
const sendOTPviaEmail = async (email, mobile, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY is missing!');
    throw new Error('Email service key not found.');
  }

  const data = {
    sender: { 
      name: 'SRM Classes Support', 
      email: 'srmclasses01@gmail.com' // Must be a verified sender in Brevo!
    },
    to: [{ email }],
    subject: `${otp} is your SRM Classes OTP`,
    htmlContent: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
           <h1 style="color: #4f46e5; margin: 0; font-size: 28px;">SRM Classes</h1>
           <p style="color: #6b7280; font-size: 14px; margin-top: 5px;">Secure Registration OTP</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.5;">Please use the following One-Time Password (OTP) to verify your phone number <b>+91 ${mobile.slice(-4).padStart(10, '*')}</b>.</p>
        
        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 15px; padding: 30px; text-align: center; margin: 30px 0; border: 1px solid #ddd6fe;">
          <span style="color: #7c3aed; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 10px;">Verification Code</span>
          <div style="font-size: 42px; font-weight: 800; color: #1e1b4b; letter-spacing: 10px; margin: 0;">${otp}</div>
        </div>
        
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 25px;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">⏱ This code will expire in <b>5 minutes</b>.</p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; border-top: 1px solid #f3f4f6; pt: 20px; margin-top: 20px;">
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    console.log(`📤 Sending Brevo API request to ${email}...`);
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`✅ Brevo API Success! Message ID: ${response.data.messageId}`);
    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Brevo API Error:', errorMsg);
    
    if (errorMsg.includes('sender')) {
      throw new Error('Sender email is not verified in Brevo dashboard.');
    }
    throw new Error(`Email delivery failed: ${errorMsg}`);
  }
};

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
  return true;
};

/**
 * Hash OTP before storing
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

module.exports = {
  generateOTP,
  validatePhone,
  hashOTP,
  sendOTPviaEmail,
  sendOTPviaSMS: async () => true // Placeholder
};
