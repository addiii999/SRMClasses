const ftp = require('basic-ftp');
const path = require('path');

// Helper to get public URL after upload
function getPublicUrl(fileName) {
  // Files are served from https://srmclasses.in/uploads/<fileName>
  return `https://srmclasses.in/uploads/${fileName}`;
}

/**
 * Upload a local file to the FTP server.
 * @param {string} localPath - Absolute path of the file on the local server.
 * @param {string} remoteFileName - Desired file name on the FTP server.
 * @returns {Promise<string>} - Public URL of the uploaded file.
 */
async function uploadFile(localPath, remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });
    
    // Switch to root to ensure path is absolute
    await client.cd('/');
    await client.ensureDir('public_html/uploads');
    
    // After ensureDir, we are inside /public_html/uploads/
    // So we just provide the filename, not the path.
    await client.uploadFrom(localPath, remoteFileName);
    
    return getPublicUrl(remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Delete a file from the FTP server.
 * @param {string} remoteFileName - Name of the file in the uploads folder.
 */
async function deleteFile(remoteFileName) {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });
    
    // Go to the target directory before removing
    await client.cd('/');
    await client.ensureDir('public_html/uploads');
    await client.remove(remoteFileName);
  } catch (err) {
    console.error('FTP delete error:', err);
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, deleteFile };
