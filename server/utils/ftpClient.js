const ftp = require('basic-ftp');
const path = require('path');

// Helper to get public URL after upload
function getPublicUrl(fileName) {
  return `${process.env.BACKEND_URL}/api/uploads/${fileName}`;
}

async function getClient() {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: false,
  });
  return client;
}

/**
 * Upload a local file to the FTP server.
 */
async function uploadFile(localPath, remoteFileName) {
  const client = await getClient();
  try {
    await client.cd('/');
    await client.ensureDir('domains/srmclasses.in/public_html/uploads');
    await client.uploadFrom(localPath, remoteFileName);
    return getPublicUrl(remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Get a readable stream for a file from FTP along with its size.
 */
async function downloadFileStream(remoteFileName, response) {
  const client = await getClient();
  try {
    await client.cd('/');
    await client.cd('domains/srmclasses.in/public_html/uploads');
    
    // Attempt to get file size for Content-Length header
    const list = await client.list();
    const fileInfo = list.find(f => f.name === remoteFileName);
    const size = fileInfo ? fileInfo.size : null;
    
    // Stream the file
    await client.downloadToStream(response, remoteFileName);
    return size;
  } finally {
    client.close();
  }
}

/**
 * Delete a file from the FTP server.
 */
async function deleteFile(remoteFileName) {
  const client = await getClient();
  try {
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
