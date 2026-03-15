// Subject Evaluation Routes
// Updated to work with the new controller that uses subject_offerings

const express = require("express");
const router = express.Router();
const subjectEvaluationController = require("../controllers/subjectEvaluationController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Get all instructors with their subjects (for subject-evaluation.tsx)
router.get("/instructors", verifyToken, subjectEvaluationController.getAllInstructors);

// Get all subjects with their instructors (for subject-evaluation.tsx - By Subjects view)
router.get("/subjects", verifyToken, subjectEvaluationController.getAllSubjects);

// Get subjects for the logged-in student (for student-subject-evaluation.tsx)
router.get("/my-subjects", verifyToken, subjectEvaluationController.getMySubjects);

// Search subjects by code or name (for searchable dropdown)
router.get("/subjects/search", verifyToken, subjectEvaluationController.searchSubjects);

// Get instructor details with their subjects (for instructor evaluation)
router.get("/instructors/:instructorId/details", verifyToken, subjectEvaluationController.getInstructorDetails);

// Get subjects for a specific instructor
router.get("/instructors/:instructorId/subjects", verifyToken, subjectEvaluationController.getInstructorSubjects);

// Get students for evaluation (selecting target students)
router.get("/evaluation-students", verifyToken, subjectEvaluationController.getEvaluationStudents);

// Get instructor dashboard stats
router.get("/my-stats", verifyToken, subjectEvaluationController.getInstructorDashboardStats);

// Feedback endpoint - returns empty stats (use Forms system for feedback)
router.get("/subjects/:subjectId/feedback", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    statistics: {
      total_responses: 0,
      avg_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  });
});

// Student evaluations - use Forms system instead
router.get("/my-evaluations", verifyToken, (req, res) => {
  res.status(410).json({
    success: false,
    message: "Use the Forms system for evaluations. This endpoint has been deprecated."
  });
});

// Evaluation submissions - use Forms system instead
router.post("/evaluation-submissions", verifyToken, (req, res) => {
  res.status(410).json({
    success: false,
    message: "Use the Forms system for submitting evaluations. This endpoint has been deprecated."
  });
});

module.exports = router;
