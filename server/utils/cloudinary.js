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
 * @returns {Promise<{url: string, public_id: string}>} The secure URL and public_id of the uploaded image
 */
const uploadToCloudinary = async (localFilePath, folder = 'srmclasses/gallery') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are not set in environment variables');
    }

    if (!localFilePath || typeof localFilePath !== 'string') {
      throw new Error('Invalid file path: must be a string');
    }

    // Taint-Killing: Resolve only the filename and join it with our TRUSTED_UPLOADS_DIR
    // This ensures CodeQL sees the resulting path as anchored to a trusted root.
    const filename = path.basename(localFilePath);
    const sanitizedPath = path.join(TRUSTED_UPLOADS_DIR, filename);

    // Final safety check
    if (!fs.existsSync(sanitizedPath)) {
      throw new Error(`Security Exception: File not found in trusted directory: ${sanitizedPath}`);
    }

    // Use the sanitized, trusted path
    const result = await cloudinary.uploader.upload(sanitizedPath, {
      folder: folder,
      resource_type: 'auto',
    });

    // Clean up local file securely
    if (fs.existsSync(sanitizedPath)) {
      fs.unlinkSync(sanitizedPath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    // On error, attempt safe cleanup of the original path if it exists
    if (typeof localFilePath === 'string') {
       const filename = path.basename(localFilePath);
       const sanitizedPath = path.join(TRUSTED_UPLOADS_DIR, filename);
       if (fs.existsSync(sanitizedPath)) {
         fs.unlinkSync(sanitizedPath);
       }
    }
    throw error;
  }
};

/**
 * PDFs are uploaded as 'raw' resource type for reliable public access.
 * Display is handled via Google Docs Viewer on the frontend.
 * @param {string} localFilePath Path to the local PDF file
 * @param {string} folder Optional folder name in Cloudinary
 * @returns {Promise<{url: string, public_id: string}>} The secure URL and public_id of the uploaded PDF
 */
const uploadPdfToCloudinary = async (localFilePath, folder = 'srmclasses/syllabus') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are not set in environment variables');
    }

    if (!localFilePath || typeof localFilePath !== 'string') {
      throw new Error('Invalid file path: must be a string');
    }

    const filename = path.basename(localFilePath);
    const sanitizedPath = path.join(TRUSTED_UPLOADS_DIR, filename);

    if (!fs.existsSync(sanitizedPath)) {
      throw new Error(`Security Exception: File not found in trusted directory: ${sanitizedPath}`);
    }

    // Use resource_type 'raw' for PDFs — raw files are publicly accessible
    // Display is handled via Google Docs Viewer on the frontend
    const result = await cloudinary.uploader.upload(sanitizedPath, {
      folder: folder,
      resource_type: 'raw',
      access_mode: 'public',
    });

    // Clean up local file
    if (fs.existsSync(sanitizedPath)) {
      fs.unlinkSync(sanitizedPath);
    }

    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary PDF Upload Error:', error);
    if (typeof localFilePath === 'string') {
      const filename = path.basename(localFilePath);
      const sanitizedPath = path.join(TRUSTED_UPLOADS_DIR, filename);
      if (fs.existsSync(sanitizedPath)) {
        fs.unlinkSync(sanitizedPath);
      }
    }
    throw error;
  }
};

/**
 * Delete a file from Cloudinary by its public_id
 * @param {string} publicId The public_id of the file to delete
 * @param {string} resourceType 'raw' for PDFs, 'image' for images, 'auto' for auto-detect
 */
const deleteFromCloudinary = async (publicId, resourceType = 'raw') => {
  try {
    if (!publicId || typeof publicId !== 'string') return;
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log(`Cloudinary delete result for ${publicId}:`, result);
    return result;
  } catch (error) {
    // Non-fatal: log but don't throw — deletion failure shouldn't break the main flow
    console.error('Cloudinary Delete Error:', error.message);
  }
};

module.exports = { uploadToCloudinary, uploadPdfToCloudinary, deleteFromCloudinary };
