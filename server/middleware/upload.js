const multer = require('multer');
const path = require('path');

// Use memory storage — files go to Cloudinary, not disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only PDF and image files are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
});

const facultyUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WebP) are allowed for faculty profiles'));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB strict
});

module.exports = { upload, facultyUpload };
