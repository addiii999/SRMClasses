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
    if (!localFilePath) return;
    
    const resolvedPath = path.resolve(localFilePath);
    
    // Check if the path is within the trusted uploads directory
    if (resolvedPath.startsWith(TRUSTED_UPLOADS_DIR + path.sep) || resolvedPath === TRUSTED_UPLOADS_DIR) {
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

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up local file securely
    safeDeleteLocalFile(localFilePath);

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // Even on error, try to clean up local file securely
    safeDeleteLocalFile(localFilePath);
    throw error;
  }
};

module.exports = { uploadToCloudinary };
