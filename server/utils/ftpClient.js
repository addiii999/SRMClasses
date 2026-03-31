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
 * Navigate to the site's uploads directory.
 */
async function goToUploads(client) {
    await client.cd('/');
    // Step-by-step navigation is more resilient on Hostinger
    await client.cd('domains');
    await client.cd('srmclasses.in');
    await client.cd('public_html');
    await client.cd('uploads');
}

/**
 * Upload a local file to the FTP server.
 */
async function uploadFile(localPath, remoteFileName) {
  const client = await getClient();
  try {
    await goToUploads(client);
    await client.uploadFrom(localPath, remoteFileName);
    return getPublicUrl(remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Get file size from FTP.
 */
async function getFileSize(remoteFileName) {
  const client = await getClient();
  try {
    await goToUploads(client);
    const list = await client.list();
    const fileInfo = list.find(f => f.name === remoteFileName);
    return fileInfo ? fileInfo.size : null;
  } catch (err) {
    console.error(`[STORAGE] Size fetch failed: ${remoteFileName}`, err.message);
    return null;
  } finally {
    client.close();
  }
}

/**
 * Download a file from FTP directly to a writable stream.
 */
async function downloadFileStream(remoteFileName, response) {
  const client = await getClient();
  try {
    await goToUploads(client);
    await client.downloadTo(response, remoteFileName);
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
    await goToUploads(client);
    await client.remove(remoteFileName);
  } catch (err) {
    console.error('FTP delete error:', err);
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, deleteFile, downloadFileStream, getFileSize };
