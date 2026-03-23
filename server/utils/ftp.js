const ftp = require("basic-ftp");
const fs = require("fs");

/**
 * Upload a local file to Hostinger via FTP and return the web-accessible URL
 * @param {string} localFilePath Path to the local file
 * @param {string} fileName Name of the file to save as
 * @returns {Promise<string>} The web-accessible URL of the uploaded image
 */
const uploadFileToHostinger = async (localFilePath, fileName) => {
  const client = new ftp.Client();
  
  try {
    if (!process.env.FTP_HOST || !process.env.FTP_USER || !process.env.FTP_PASSWORD) {
       throw new Error("FTP credentials not set in environment variables");
    }

    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false
    });

    // Upload to public_html/uploads
    await client.ensureDir("public_html/uploads");
    await client.uploadFrom(localFilePath, fileName);
    
    // Clean up local file from Render's ephemeral storage
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    // Use MEDIA_URL from env, fall back to the IP provided by user if not set
    const baseUrl = process.env.MEDIA_URL || "http://145.223.17.172";
    return `${baseUrl}/uploads/${fileName}`;
  } catch (err) {
    console.error("FTP Bridge Error:", err);
    // Cleanup even on error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    throw err;
  } finally {
    if (!client.closed) {
      client.close();
    }
  }
};

module.exports = { uploadFileToHostinger };
