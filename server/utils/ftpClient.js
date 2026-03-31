const ftp = require('basic-ftp');
const path = require('path');

// Helper to get public URL after upload (Now pointing to our internal API)
function getPublicUrl(fileName) {
  return `${process.env.BACKEND_URL}/api/uploads/${fileName}`;
}

/**
 * Upload a local file to the FTP server.
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
    
    await client.cd('/');
    await client.ensureDir('domains/srmclasses.in/public_html/uploads');
    await client.uploadFrom(localPath, remoteFileName);
    
    return getPublicUrl(remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Get a readable stream for a file from FTP.
 */
async function downloadFileStream(remoteFileName, response) {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });
    
    await client.cd('/domains/srmclasses.in/public_html/uploads');
    await client.downloadToStream(response, remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Delete a file from the FTP server.
 */
async function deleteFile(remoteFileName) {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: false,
    });
    
    await client.cd('/');
    await client.ensureDir('domains/srmclasses.in/public_html/uploads');
    await client.remove(remoteFileName);
  } catch (err) {
    console.error('FTP delete error:', err);
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, deleteFile, downloadFileStream };
