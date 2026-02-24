// User Routes
const express = require("express");
const router = express.Router();
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// Custom multer config for profile images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/profiles');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomUUID();
    cb(null, `${uniqueId}${ext}`);
  }
});

const profileImageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const uploadProfileImage = multer({
  storage: profileImageStorage,
  fileFilter: profileImageFilter,
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
  // Return the image URL path
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
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
