const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary with optional transformations
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} folder - Cloudinary folder (e.g. 'gallery', 'faculty')
 * @param {string} publicId - Clean public ID (no extension)
 * @param {string} resourceType - 'image' or 'raw' (for PDFs)
 * @param {Object} options - Additional cloudinary options (transformations etc)
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadToCloudinary(buffer, folder, publicId, resourceType = 'auto', options = {}) {
  return new Promise((resolve, reject) => {
    // Default image optimizations (safe, non-breaking)
    const imageDefaults = resourceType === 'image' ? {
      // Auto-convert to WebP (25-35% smaller than JPEG, 50-70% smaller than PNG)
      // Browsers that don't support WebP get original format automatically via f_auto
      transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    } : {};

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `srmclasses/${folder}`,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: true,
        ...imageDefaults,
        ...options, // options (e.g. face crop for faculty) override defaults
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Full Cloudinary public ID (e.g. 'srmclasses/gallery/img_123')
 * @param {string} resourceType - 'image' or 'raw'
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
