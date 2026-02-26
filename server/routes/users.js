// User Routes
const express = require("express");
const router = express.Router();
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// Ensure upload directories exist
const uploadDirs = [
  'public/uploads/profiles/instructors',
  'public/uploads/profiles/students',
  'public/uploads/profiles/alumni',
  'public/uploads/profiles/employers'
];

// Create directories if they don't exist
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Custom multer config for profile images - dynamic destination based on role
// Use any() to parse both file and text fields together
const uploadProfileImage = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Get role from query parameter first (more reliable), then body
      const role = req.query.role || (req.body && req.body.role) || 'profiles';
      
      console.log('[UPLOAD] Role from request:', role);
      console.log('[UPLOAD] Query params:', req.query);
      console.log('[UPLOAD] Body:', req.body);
      
      // Map role to folder
      let folder = 'profiles';
      switch (role.toLowerCase()) {
        case 'instructor':
          folder = 'profiles/instructors';
          break;
        case 'student':
          folder = 'profiles/students';
          break;
        case 'alumni':
          folder = 'profiles/alumni';
          break;
        case 'employer':
          folder = 'profiles/employers';
          break;
        default:
          folder = 'profiles';
      }
      
      const uploadPath = path.join(__dirname, '../public/uploads', folder);
      
      // Ensure the directory exists before saving
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('[UPLOAD] Created directory:', uploadPath);
      }
      
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueId = crypto.randomUUID();
      cb(null, `${uniqueId}${ext}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// Protected routes
router.get("/filter", verifyToken, userController.getFilteredUsers);
router.get("/assigned-forms", verifyToken, userController.getAssignedForms);
router.get("/responses", verifyToken, userController.getUserResponses);
router.get("/", verifyToken, userController.getAllUsers);
router.post("/create", verifyToken, authController.register);
router.post("/upload-profile-image", verifyToken, uploadProfileImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded" });
  }
  console.log('[UPLOAD] File uploaded successfully:', req.file);
  
  // Get role from query parameter or body
  const role = req.query.role || req.body.role || 'profiles';
  
  // Map role to folder
  let folder = 'profiles';
  switch (role.toLowerCase()) {
    case 'instructor':
      folder = 'profiles/instructors';
      break;
    case 'student':
      folder = 'profiles/students';
      break;
    case 'alumni':
      folder = 'profiles/alumni';
      break;
    case 'employer':
      folder = 'profiles/employers';
      break;
    default:
      folder = 'profiles';
  }
  
  // Return the image URL path
  const imageUrl = `/uploads/${folder}/${req.file.filename}`;
  return res.status(200).json({ success: true, imageUrl });
}, (err, req, res, next) => {
  console.error('[UPLOAD ERROR]', err);
  return res.status(500).json({ success: false, message: err.message || "Upload failed" });
});
router.patch("/:id", verifyToken, userController.updateUser);
router.patch("/:id/approve", verifyToken, userController.approveUser);
router.patch("/:id/reject", verifyToken, userController.rejectUser);
router.put("/:id/status", verifyToken, userController.validateUserStatusUpdate, userController.updateUserStatus);
router.delete("/:id", verifyToken, userController.deleteUser);

module.exports = router;
