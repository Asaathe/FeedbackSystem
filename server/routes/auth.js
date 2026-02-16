// Authentication Routes
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// Public routes
router.post("/signup", authController.validateRegistration, authController.register);
router.post("/login", authController.validateLogin, authController.login);

// Token verification endpoint
router.get("/verify", verifyToken, authController.getProfile);

// Protected routes
router.get("/profile", verifyToken, authController.getProfile);
router.put("/profile", verifyToken, authController.updateProfile);
router.put("/change-password", verifyToken, authController.changePassword);

module.exports = router;
