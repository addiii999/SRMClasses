const multer = require('multer');
const path = require('path');

// Use memory storage — Excel files are read from buffer, not disk.
// This is required for production environments (Render/Vercel) where
// the local filesystem is ephemeral or read-only outside /tmp.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExts = /\.xlsx$|\.xls$/i;
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const extOk = allowedExts.test(path.extname(file.originalname));
  const mimeOk = allowedMimes.includes(file.mimetype);
  if (extOk && mimeOk) {
    return cb(null, true);
  }
  cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
};

const excelUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — marks Excel files never exceed 1-2MB realistically
});

module.exports = excelUpload;
