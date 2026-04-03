// Image Upload Middleware using Multer + Cloudinary
// Handles file uploads with validation and uploads to Cloudinary

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const cloudinaryService = require('../services/cloudinaryService');

const generateUniqueFilename = (originalName) => {
  const ext = path.extname(originalName);
  const uniqueId = crypto.randomUUID();
  return `${uniqueId}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../temp'));
  },
  filename: (req, file, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  }
});

const uploadSingleImage = (fieldName = 'image') => {
  return upload.single(fieldName);
};

const uploadMultipleImages = (fieldName = 'images', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 2MB.'
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
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.'
    });
  }
  next();
};

const uploadToCloudinary = async (file, uploadType = 'forms', role = null) => {
  try {
    const result = await cloudinaryService.uploadImage(file, uploadType, role);
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const getFileUrl = (cloudinaryResult) => {
  if (!cloudinaryResult) return null;
  return cloudinaryResult.url;
};

const deleteUploadedFile = async (filePath) => {
  const fs = require('fs').promises;
  try {
    const fullPath = path.join(__dirname, '../temp', filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting temp file:', error);
    return false;
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadError,
  getFileUrl,
  deleteUploadedFile,
  uploadToCloudinary,
  generateUniqueFilename
};