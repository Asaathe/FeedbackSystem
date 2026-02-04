// User Routes
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

// Protected routes
router.get("/filter", verifyToken, userController.getFilteredUsers);
router.get("/assigned-forms", verifyToken, userController.getAssignedForms);
router.get("/responses", verifyToken, userController.getUserResponses);
router.get("/", verifyToken, userController.getAllUsers);
router.post("/create", verifyToken, authController.register);
router.patch("/:id", verifyToken, userController.updateUser);
router.patch("/:id/approve", verifyToken, userController.approveUser);
router.patch("/:id/reject", verifyToken, userController.rejectUser);
router.put("/:id/status", verifyToken, userController.validateUserStatusUpdate, userController.updateUserStatus);
router.delete("/:id", verifyToken, userController.deleteUser);

module.exports = router;
