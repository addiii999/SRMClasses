const ftp = require("basic-ftp");
const fs = require("fs");

const uploadFileToHostinger = async (localFilePath, fileName) => {
  const client = new ftp.Client();
  // client.ftp.verbose = true; // Use when you need to debug FTP
  
  try {
    if (!process.env.FTP_HOST || !process.env.FTP_USER || !process.env.FTP_PASSWORD) {
       throw new Error("FTP credentials not set in environment variables");
    }

    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false // Standard FTP to Hostinger
    });

    // Go to the base directory of Hostinger where public_html is
    // Actually, Hostinger FTP lands you in the root. We just need to go inside public_html/uploads
    // Using ensureDir from the relative root.
    await client.ensureDir("public_html/uploads");
    await client.uploadFrom(localFilePath, fileName);
    
    // Return to root (optional)
    await client.cd("/");
    
    // Clean up local file from Render's ephemeral storage
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    
    return `https://srmclasses.in/uploads/${fileName}`;
  } catch (err) {
    console.error("FTP Bridge Error:", err);
    throw err;
  } finally {
    if (!client.closed) {
      client.close();
    }
  }
};

module.exports = { uploadFileToHostinger };
