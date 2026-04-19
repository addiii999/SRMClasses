const axios = require('axios');
const crypto = require('crypto');

/**
 * Send OTP via Resend API (HTTP)
 * Resend is incredibly fast and reliable for modern transactional emails.
 */
const sendOTPviaEmail = async (email, mobile, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY is missing!');
    throw new Error('Email service key not found.');
  }

  // The email content (using Brevo's payload structure)
  const data = {
    sender: { name: 'SRM Classes', email: process.env.ADMIN_EMAIL || 'srmclasses01@gmail.com' },
    to: [{ email: email }],
    subject: `${otp} is your SRM Classes OTP`,
    htmlContent: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 40px auto; padding: 40px; border-radius: 24px; background-color: #ffffff; border: 1px solid #f0f0f0; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
        <div style="text-align: center; margin-bottom: 40px;">
           <span style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); width: 64px; height: 64px; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 800; margin-bottom: 20px;">S</span>
           <h1 style="color: #111827; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SRM Classes</h1>
           <p style="color: #6b7280; font-size: 15px; margin-top: 4px;">Account Verification</p>
        </div>
        
        <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center;">Hello,</p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 40px;">You're just one step away from joining SRM Classes. Use the 6-digit code below to verify your phone number <b>+91 ${mobile.slice(-4).padStart(10, '*')}</b>.</p>
        
        <div style="background: #f9fafb; border-radius: 20px; padding: 40px; text-align: center; margin: 0 0 32px 0; border: 2px dashed #e5e7eb;">
          <span style="color: #4f46e5; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 12px;">OTP Code</span>
          <div style="font-size: 48px; font-weight: 900; color: #111827; letter-spacing: 12px; margin: 0; font-family: monospace;">${otp}</div>
        </div>
        
        <div style="text-align: center;">
          <p style="color: #ef4444; font-size: 13px; margin: 0; font-weight: 600;">⏱ Expires in 5 minutes</p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; padding-top: 32px; border-top: 1px solid #f3f4f6;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📤 Sending Brevo API request to ${email}...`);
    }
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Brevo API Success! Message ID: ${response.data.messageId}`);
    }
    return true;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('❌ Brevo API Error:', errorMsg);
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

/**
 * Send OTP via real SMS using Fast2SMS
 * - Retries ONCE on failure (1.5s delay)
 * - No fallback. No fake success. Missing key = hard throw.
 */
const sendOTPviaSMS = async (mobile, otp) => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    throw new Error(
      'FAST2SMS_API_KEY is not configured. Add it to .env to enable SMS OTP. No fallback available.',
    );
  }

  const message = `Your SRM Classes OTP is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

  const attempt = async () => {
    const response = await axios.post(
      'https://www.fast2sms.com/dev/bulkV2',
      {
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: mobile,
      },
      {
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10s hard timeout
      },
    );

    // Fast2SMS returns { return: true } on success
    if (!response.data?.return) {
      throw new Error(
        response.data?.message || 'Fast2SMS returned an unexpected failure response.',
      );
    }

    return response.data;
  };

  try {
    return await attempt();
  } catch (firstError) {
    console.error('[SMS] First attempt failed:', firstError.message, '— Retrying in 1.5s...');
    // One retry — hard fail if this also throws
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return attempt();
  }
};

module.exports = {
  generateOTP,
  validatePhone,
  hashOTP,
  sendOTPviaEmail,
  sendOTPviaSMS,
};
