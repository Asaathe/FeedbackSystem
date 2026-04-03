// User Routes
const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const { uploadSingleImage, handleUploadError, uploadToCloudinary } = require("../middleware/uploadMiddleware");
const cloudinaryService = require("../services/cloudinaryService");

router.post("/upload-profile-image", verifyToken, uploadSingleImage('image'), handleUploadError, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded" });
  }

  const role = req.query.role || req.body.role || 'profiles';

  try {
    const cloudinaryResult = await uploadToCloudinary(req.file, 'profiles', role);
    
    if (req.file) {
      const tempPath = path.join(__dirname, '../temp', req.file.filename);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    return res.status(200).json({ 
      success: true, 
      imageUrl: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// Protected routes
router.get("/filter", verifyToken, userController.getFilteredUsers);
router.get("/assigned-forms", verifyToken, userController.getAssignedForms);
router.get("/responses", verifyToken, userController.getUserResponses);
router.get("/", verifyToken, userController.getAllUsers);

// Employment routes for alumni
router.get("/employment", verifyToken, userController.getEmploymentInfo);
router.post("/employment", verifyToken, userController.updateEmploymentInfo);
router.post("/employment/confirm", verifyToken, userController.confirmEmploymentInfo);
router.post("/employment/send-update-request", verifyToken, userController.sendEmploymentUpdateRequest);
router.post("/employment/annual-notification", verifyToken, userController.sendAnnualUpdateNotification);
router.get("/alumni-data", verifyToken, userController.getAlumniData);
router.post("/create", verifyToken, authController.register);
router.post("/upload-profile-image", verifyToken, uploadSingleImage('image'), handleUploadError, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded" });
  }

  const role = req.query.role || req.body.role || 'profiles';

  try {
    const cloudinaryResult = await uploadToCloudinary(req.file, 'profiles', role);
    
    if (req.file) {
      const tempPath = path.join(__dirname, '../temp', req.file.filename);
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }

    return res.status(200).json({ 
      success: true, 
      imageUrl: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
});
router.patch("/:id", verifyToken, userController.updateUser);
router.patch("/:id/approve", verifyToken, userController.approveUser);
router.patch("/:id/reject", verifyToken, userController.rejectUser);
router.put("/:id/status", verifyToken, userController.validateUserStatusUpdate, userController.updateUserStatus);
router.delete("/:id", verifyToken, userController.deleteUser);

module.exports = router;
