const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    let credential;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Decode the base64 string
      const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      credential = admin.credential.cert(JSON.parse(decoded));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Direct file path (useful for local development)
      credential = admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    } else {
      throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH in environment.");
    }

    admin.initializeApp({
      credential: credential,
    });
    console.log("🔥 Firebase Admin Initialized");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error.message);
  }
}

module.exports = admin;
