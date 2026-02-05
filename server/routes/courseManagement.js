// Course Management Routes
const express = require("express");
const router = express.Router();
const courseManagementController = require("../controllers/courseManagementController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Public route - get all programs
router.get("/", courseManagementController.getAllPrograms);

// Admin routes
router.post("/", verifyToken, requireAdmin, courseManagementController.createProgram);
router.patch("/:id/toggle", verifyToken, requireAdmin, courseManagementController.toggleProgramStatus);
router.put("/:id", verifyToken, requireAdmin, courseManagementController.updateProgram);
router.delete("/:id", verifyToken, requireAdmin, courseManagementController.deleteProgram);

module.exports = router;
