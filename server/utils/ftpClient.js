const ftp = require('basic-ftp');
const path = require('path');

function getPublicUrl(fileName) {
  return `${process.env.BACKEND_URL}/api/uploads/${fileName}`;
}

async function getClient() {
  const client = new ftp.Client();
  client.ftp.verbose = false; // Keep logs clean unless debugging
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: false,
  });
  return client;
}

/**
 * Upload a local file to FTP
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
 * Combined Metadata + Stream Utility (Single Connection)
 * This is crucial for stability on shared hosting (Hostinger)
 */
async function streamWithMetadata(remoteFileName, response, setHeadersRaw) {
  const client = await getClient();
  try {
    await client.cd('/');
    await client.cd('domains/srmclasses.in/public_html/uploads');
    
    // 1. Fetch size first inside the same connection
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
    await client.cd('/');
    await client.ensureDir('domains/srmclasses.in/public_html/uploads');
    await client.remove(remoteFileName);
  } catch (err) {
    // Silence errors where file doesn't exist (e.g., 550)
    if (err.code !== 550) {
      console.error('FTP delete error:', err);
    }
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, deleteFile, streamWithMetadata };
