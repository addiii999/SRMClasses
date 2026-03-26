const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Security: Only allow deletion within the trusted uploads directory
const TRUSTED_UPLOADS_DIR = path.resolve(__dirname, '..', 'uploads');

const safeDeleteLocalFile = (localFilePath) => {
  try {
    if (!localFilePath || typeof localFilePath !== 'string') return;
    
    // Normalize and resolve the path
    const normalizedPath = path.normalize(localFilePath);
    const resolvedPath = path.resolve(normalizedPath);
    
    // Safety: ensure the resolved path is actually within the trusted uploads directory
    const relativePath = path.relative(TRUSTED_UPLOADS_DIR, resolvedPath);
    const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);

    if (isSafe || resolvedPath === TRUSTED_UPLOADS_DIR) {
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
    } else {
      console.warn(`Security Warning: Prevented deletion of file outside trusted directory: ${resolvedPath}`);
    }
  } catch (error) {
    console.error('Error during safe file deletion:', error.message);
  }
};

/**
 * Upload a local file to Cloudinary
 * @param {string} localFilePath Path to the local file
 * @param {string} folder Optional folder name in Cloudinary
 * @returns {Promise<string>} The secure URL of the uploaded image
 */
const uploadToCloudinary = async (localFilePath, folder = 'srmclasses/gallery') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are not set in environment variables');
    }

    // Security: Validate the path before uploading to satisfy static analysis (Taint-Killing)
    if (!localFilePath || typeof localFilePath !== 'string') {
      throw new Error('Invalid file path: must be a string');
    }
    const resolvedPath = path.resolve(localFilePath);
    const relativePath = path.relative(TRUSTED_UPLOADS_DIR, resolvedPath);
    const isSafe = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);

    if (!isSafe && resolvedPath !== TRUSTED_UPLOADS_DIR) {
      throw new Error(`Security Exception: Unauthorized file path for upload: ${resolvedPath}`);
    }

    // Use the resolved, validated path
    const result = await cloudinary.uploader.upload(resolvedPath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up local file securely
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // Try safe cleanup if it was a valid-looking path
    if (typeof localFilePath === 'string') {
       safeDeleteLocalFile(localFilePath);
    }
    throw error;
  }
};

module.exports = { uploadToCloudinary };
