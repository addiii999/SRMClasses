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
 * Get file size independently
 */
async function getFileSize(remoteFileName) {
  const client = await getClient();
  try {
    await client.cd('/');
    await client.cd('domains/srmclasses.in/public_html/uploads');
    const list = await client.list();
    const fileInfo = list.find(f => f.name === remoteFileName);
    return fileInfo ? fileInfo.size : null;
  } finally {
    client.close();
  }
}

/**
 * Stream the file content directly to the response
 */
async function streamFile(remoteFileName, response) {
  const client = await getClient();
  try {
    await client.cd('/');
    await client.cd('domains/srmclasses.in/public_html/uploads');
    // Using downloadTo directly since it's a writable stream
    await client.downloadTo(response, remoteFileName);
  } finally {
    client.close();
  }
}

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

module.exports = { uploadFile, deleteFile, getFileSize, streamFile };
