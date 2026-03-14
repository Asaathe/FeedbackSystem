// Subject Management Routes
const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const subjectEvaluationController = require("../controllers/subjectEvaluationController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Get all subjects
router.get("/", verifyToken, subjectController.getAllSubjects);

// Get single subject
router.get("/:id", verifyToken, subjectController.getSubjectById);

// Create subject (admin only)
router.post("/", verifyToken, requireAdmin, subjectController.createSubject);

// Update subject (admin only)
router.put("/:id", verifyToken, requireAdmin, subjectController.updateSubject);

// Delete subject (admin only)
router.delete("/:id", verifyToken, requireAdmin, subjectController.deleteSubject);

// Get subject instructors
router.get("/:subjectId/instructors", verifyToken, subjectController.getSubjectInstructors);

// Assign instructor to subject (admin only)
router.post("/instructors", verifyToken, requireAdmin, subjectController.assignInstructorToSubject);

// Remove instructor from subject (admin only)
router.delete("/instructors/:id", verifyToken, requireAdmin, subjectController.removeInstructorFromSubject);

// Get subject students
router.get("/:subjectId/students", verifyToken, subjectController.getSubjectStudents);

// Enroll student in subject (admin only)
router.post("/students", verifyToken, requireAdmin, subjectController.enrollStudent);

// Unenroll student from subject (admin only)
router.delete("/students/:id", verifyToken, requireAdmin, subjectController.unenrollStudent);

// Get all enrolled students (for assignment)
router.get("/students/available", verifyToken, subjectController.getAllEnrolledStudents);

// Bulk enroll students by program (admin only)
router.post("/students/bulk", verifyToken, requireAdmin, subjectController.bulkEnrollStudents);

// Get students by program
router.get("/students/by-program/:programId", verifyToken, subjectController.getStudentsByProgram);

// Get all instructors (for assignment)
router.get("/instructors/available", verifyToken, subjectController.getAllInstructorsForAssignment);

// Assign form to subject (for evaluation form deployment) - also available at /api/subject-evaluation/subjects/:id/assign-form
router.put("/:id/assign-form", verifyToken, subjectEvaluationController.assignFormToSubject);

// ==================== Subject Offerings ====================

// Get all subject offerings
router.get("/offerings/all", verifyToken, subjectController.getAllSubjectOfferings);

// Create subject offering (admin only)
router.post("/offerings", verifyToken, requireAdmin, subjectController.createSubjectOffering);

// Update subject offering (admin only)
router.put("/offerings/:id", verifyToken, requireAdmin, subjectController.updateSubjectOffering);

// Delete subject offering (admin only)
router.delete("/offerings/:id", verifyToken, requireAdmin, subjectController.deleteSubjectOffering);

// Get students in a subject offering (auto-enrolled based on program/year/section)
router.get("/offerings/:offeringId/students", verifyToken, subjectController.getSubjectOfferingStudents);

module.exports = router;
