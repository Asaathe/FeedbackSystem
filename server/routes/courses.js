// Course Sections Routes
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Public route - get all course sections
router.get("/sections", courseController.getAllSections);

// Admin routes
router.post("/sections", verifyToken, requireAdmin, courseController.createSection);
router.patch("/sections/:id/toggle", verifyToken, requireAdmin, courseController.toggleSectionStatus);
router.put("/sections/:id", verifyToken, requireAdmin, courseController.updateSection);
router.delete("/sections/:id", verifyToken, requireAdmin, courseController.deleteSection);

// Assign student to section
router.post("/sections/:id/students", verifyToken, requireAdmin, courseController.assignStudentToSection);

// Remove student from section
router.delete("/sections/:id/students/:studentId", verifyToken, requireAdmin, courseController.removeStudentFromSection);

// Get students in a section
router.get("/sections/:id/students", verifyToken, courseController.getSectionStudents);

module.exports = router;
