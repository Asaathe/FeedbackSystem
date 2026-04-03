// Cloudinary Upload Service
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const getFolderPath = (uploadType, role) => {
  const baseFolder = 'feedbacts';
  
  if (uploadType === 'profiles' && role) {
    return `${baseFolder}/profiles/${role.toLowerCase()}`;
  }
  
  return `${baseFolder}/${uploadType}`;
};

const uploadImage = async (file, uploadType = 'forms', role = null) => {
  const uniqueId = crypto.randomUUID();
  const ext = file.originalname.split('.').pop();
  const publicId = `${uniqueId}`;
  
  const folder = getFolderPath(uploadType, role);
  
  const result = await cloudinary.uploader.upload(file.path, {
    public_id: publicId,
    folder: folder,
    resource_type: 'image',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height
  };
};

const uploadImageFromBuffer = async (base64Data, uploadType = 'forms', role = null) => {
  const uniqueId = crypto.randomUUID();
  const folder = getFolderPath(uploadType, role);

  const result = await cloudinary.uploader.upload(base64Data, {
    public_id: uniqueId,
    folder: folder,
    resource_type: 'image',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    format: result.format,
    width: result.width,
    height: result.height
  };
};

const deleteImage = async (publicId) => {
  if (!publicId) return false;
  
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

const getImageUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  const transformations = [];
  
  if (options.width) transformations.push({ width: options.width });
  if (options.height) transformations.push({ height: options.height });
  if (options.crop) transformations.push({ crop: options.crop });
  
  return cloudinary.url(publicId, {
    secure: true,
    transformation: transformations.length > 0 ? transformations : undefined
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadImageFromBuffer,
  deleteImage,
  getImageUrl,
  getFolderPath
};