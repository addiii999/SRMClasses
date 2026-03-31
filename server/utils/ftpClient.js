const ftp = require('basic-ftp');
const path = require('path');

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

const REMOTE_UPLOADS_DIR = 'domains/srmclasses.in/public_html/uploads';

/**
 * Upload a local file to FTP
 */
async function uploadFile(localPath, remoteFileName) {
  const client = await getClient();
  try {
    await client.ensureDir(REMOTE_UPLOADS_DIR);
    await client.uploadFrom(localPath, remoteFileName);
    return getPublicUrl(remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Combined Metadata + Stream Utility (Single Connection)
 * Consistently uses ensureDir for robust pathing on Hostinger
 */
async function streamWithMetadata(remoteFileName, response, setHeadersRaw) {
  const client = await getClient();
  try {
    // ensureDir is more robust than cd on some FTP servers
    await client.ensureDir(REMOTE_UPLOADS_DIR);
    
    // 1. Fetch size inside the same connection
    const list = await client.list();
    const fileInfo = list.find(f => f.name === remoteFileName);
    const size = fileInfo ? fileInfo.size : null;
    
    // 2. Invoke callback to set headers before streaming starts
    if (setHeadersRaw && size) {
      setHeadersRaw(size);
    }
    
    // 3. Stream content
    await client.downloadTo(response, remoteFileName);
    return true;
  } finally {
    client.close();
  }
}

/**
 * Delete a file from FTP
 */
async function deleteFile(remoteFileName) {
  const client = await getClient();
  try {
    await client.ensureDir(REMOTE_UPLOADS_DIR);
    await client.remove(remoteFileName);
  } catch (err) {
    if (err.code !== 550) {
      console.error('FTP delete error:', err);
    }
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, deleteFile, streamWithMetadata };
