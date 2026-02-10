// Image Upload Middleware using Multer
// Handles file uploads with validation and unique naming

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate unique filename using UUID
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename with extension
 */
const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const uniqueId = crypto.randomUUID();
  return `${uniqueId}${ext}`;
};

/**
 * Multer storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on upload type
    const uploadType = req.body.uploadType || 'forms';
    const uploadPath = path.join(__dirname, '../public/uploads', uploadType);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  }
});

/**
 * File filter to validate image types
 */
const imageFileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  // Check MIME type
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

/**
 * Multer upload configuration
 */
const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 500 * 1024, // 500KB max file size
    files: 1 // Single file upload
  }
});

/**
 * Middleware for single image upload
 * @param {string} fieldName - Name of the form field containing the file
 * @returns {Function} Express middleware
 */
const uploadSingleImage = (fieldName = 'image') => {
  return upload.single(fieldName);
};

/**
 * Middleware for multiple image uploads
 * @param {string} fieldName - Name of the form field containing the files
 * @param {number} maxCount - Maximum number of files (default: 5)
 * @returns {Function} Express middleware
 */
const uploadMultipleImages = (fieldName = 'images', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

/**
 * Error handler middleware for Multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 500KB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  } else if (err) {
    // Other errors (e.g., file filter errors)
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.'
    });
  }
  next();
};

/**
 * Get file URL from uploaded file
 * @param {Object} file - Multer file object
 * @param {string} uploadType - Type of upload (forms, users, etc.)
 * @returns {string} File URL path
 */
const getFileUrl = (file, uploadType = 'forms') => {
  if (!file) return null;
  return `/uploads/${uploadType}/${file.filename}`;
};

/**
 * Delete uploaded file
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<boolean>} True if deleted successfully
 */
const deleteUploadedFile = async (filePath) => {
  const fs = require('fs').promises;
  try {
    const fullPath = path.join(__dirname, '../public', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadError,
  getFileUrl,
  deleteUploadedFile,
  generateUniqueFilename
};
