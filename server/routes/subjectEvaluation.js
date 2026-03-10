// Subject Evaluation Routes
const express = require("express");
const router = express.Router();
const subjectEvaluationController = require("../controllers/subjectEvaluationController");
const courseController = require("../controllers/courseController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Course sections (from course controller)
router.get("/course-sections", verifyToken, courseController.getAllSections);
router.post("/course-sections", verifyToken, requireAdmin, courseController.createSection);
router.put("/course-sections/:id", verifyToken, requireAdmin, courseController.updateSection);
router.delete("/course-sections/:id", verifyToken, requireAdmin, courseController.deleteSection);

// Get all instructor courses
router.get("/instructor-courses", verifyToken, subjectEvaluationController.getInstructorCourses);

// Get all instructors with their subjects (for subject-evaluation.tsx)
router.get("/instructors", verifyToken, subjectEvaluationController.getAllInstructors);

// Get all subject-instructors (for EvaluationTargetSelector.tsx)
router.get("/subject-instructors", verifyToken, subjectEvaluationController.getSubjectInstructors);

// Get students by selected subject-instructor IDs (for recipient selection)
router.post("/students-by-targets", verifyToken, subjectEvaluationController.getStudentsByTargets);

// Assign form to subject (for evaluation form deployment)
router.put("/subjects/:id/assign-form", verifyToken, subjectEvaluationController.assignFormToSubject);

// Get subjects assigned to a specific instructor
router.get("/instructors/:instructorId/subjects", verifyToken, subjectEvaluationController.getInstructorSubjects);

// Assign instructor to subject
router.post("/instructor-courses", verifyToken, requireAdmin, subjectEvaluationController.assignInstructorToSubject);

// Remove instructor from subject
router.delete("/instructor-courses/:id", verifyToken, requireAdmin, subjectEvaluationController.removeInstructorFromSubject);

// Get all student enrollments
router.get("/student-enrollments", verifyToken, subjectEvaluationController.getStudentEnrollments);

// Enroll student in subject
router.post("/student-enrollments", verifyToken, requireAdmin, subjectEvaluationController.enrollStudent);

// Unenroll student from subject
router.delete("/student-enrollments/:id", verifyToken, requireAdmin, subjectEvaluationController.unenrollStudent);

// Get feedback for a subject (returns empty stats - feedback system not fully implemented)
router.get("/subjects/:subjectId/feedback", verifyToken, (req, res) => {
  // Return empty/default statistics - the feedback system needs more implementation
  res.status(200).json({
    success: true,
    statistics: {
      total_responses: 0,
      avg_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    }
  });
});

// Get subjects for the logged-in student (for student-subject-evaluation.tsx)
router.get("/my-subjects", verifyToken, subjectEvaluationController.getMySubjects);

// Get stats for instructor
router.get("/my-stats", verifyToken, subjectEvaluationController.getMyStats);

// Get evaluation forms assigned to student (for student dashboard)
router.get("/my-evaluations", verifyToken, (req, res) => {
  // Forward to evaluation forms controller
  const evaluationFormController = require('../controllers/evaluationFormController');
  evaluationFormController.getStudentEvaluationForms(req, res);
});

// NEW: Search subjects by code or name (for searchable dropdown)
router.get("/subjects/search", verifyToken, subjectEvaluationController.searchSubjects);

// NEW: Get instructor details with their subjects (for instructor evaluation)
router.get("/instructors/:instructorId/details", verifyToken, subjectEvaluationController.getInstructorDetails);

// NEW: Get students by selected subject (for subject evaluation)
router.post("/students-by-subject", verifyToken, subjectEvaluationController.getStudentsBySubject);

// NEW: Get students by instructor (for instructor evaluation)
router.post("/students-by-instructor", verifyToken, subjectEvaluationController.getStudentsByInstructor);

// Submit evaluation response (for student-subject-evaluation.tsx)
router.post("/evaluation-submissions", verifyToken, async (req, res) => {
  const evaluationFormController = require('../controllers/evaluationFormController');
  
  // Map the client's data format to what the controller expects
  const { form_id, subject_id, evaluation_form_id, responses } = req.body;
  
  // The evaluation_form_id is the ID from subject_evaluation_forms table
  const mappedBody = {
    evaluation_form_id: evaluation_form_id,
    responses
  };
  
  // Create a new request object with mapped data
  const mappedReq = {
    ...req,
    body: mappedBody,
    user: req.user
  };
  
  // Call the evaluation form controller's submit function
  evaluationFormController.submitEvaluationResponse(mappedReq, res);
});

module.exports = router;
