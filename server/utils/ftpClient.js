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

// Common Hostinger FTP paths
const PATHS_TO_TRY = [
  'domains/srmclasses.in/public_html/uploads',
  'public_html/uploads',
  'uploads'
];

/**
 * Upload a local file to FTP (tries multiple common paths)
 */
async function uploadFile(localPath, remoteFileName) {
  const client = await getClient();
  try {
    let successPath = null;
    for (const p of PATHS_TO_TRY) {
      try {
        await client.cd('/');
        await client.ensureDir(p);
        successPath = p;
        break;
      } catch (e) { continue; }
    }
    
    if (!successPath) throw new Error("Could not locate or create uploads directory");
    
    await client.uploadFrom(localPath, remoteFileName);
    return getPublicUrl(remoteFileName);
  } finally {
    client.close();
  }
}

/**
 * Unified Metadata + Stream Utility (Single Connection)
 * Robustly tries multiple paths to find the file
 */
async function streamWithMetadata(remoteFileName, response, setHeadersRaw) {
  const client = await getClient();
  try {
    let fileInfo = null;
    let foundPath = null;

    // Search for the file in common paths
    for (const p of PATHS_TO_TRY) {
      try {
        await client.cd('/');
        await client.cd(p);
        const list = await client.list();
        fileInfo = list.find(f => f.name === remoteFileName);
        if (fileInfo) {
          foundPath = p;
          break;
        }
      } catch (e) { continue; }
    }

    if (!fileInfo) throw new Error("File not found on any known FTP path");

    // Invoke headers callback BEFORE streaming
    if (setHeadersRaw) {
      setHeadersRaw(fileInfo.size);
    }
    
    // Stream the content
    await client.downloadTo(response, remoteFileName);
    return true;
  } finally {
    client.close();
  }
}

async function deleteFile(remoteFileName) {
  const client = await getClient();
  try {
    for (const p of PATHS_TO_TRY) {
      try {
        await client.cd('/');
        await client.cd(p);
        await client.remove(remoteFileName);
        break;
      } catch (e) { continue; }
    }
  } catch (err) {
    if (err.code !== 550) console.error('FTP delete error:', err);
  } finally {
    client.close();
  }
}

module.exports = { uploadFile, deleteFile, streamWithMetadata };
