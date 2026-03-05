// Evaluation Form Routes
const express = require("express");
const router = express.Router();
const evaluationFormController = require("../controllers/evaluationFormController");
const { verifyToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

// Link evaluation form to subject (admin only)
router.post("/link", verifyToken, requireAdmin, evaluationFormController.linkEvaluationForm);

// Unlink evaluation form from subject (admin only)
router.delete("/unlink/:id", verifyToken, requireAdmin, evaluationFormController.unlinkEvaluationForm);

// Get evaluation forms for a subject
router.get("/subject/:subjectId", verifyToken, evaluationFormController.getSubjectEvaluationForms);

// Get evaluation forms for a student (to submit)
router.get("/my-evaluations", verifyToken, evaluationFormController.getStudentEvaluationForms);

// Submit evaluation response
router.post("/submit", verifyToken, evaluationFormController.submitEvaluationResponse);

// Get evaluation results for a subject
router.get("/results/:subjectId", verifyToken, evaluationFormController.getSubjectEvaluationResults);

// Get evaluation summary by section (admin dashboard)
router.get("/summary", verifyToken, evaluationFormController.getEvaluationSummaryBySection);

// Get evaluation results by section with question category averages (C1, C2, C3)
router.get("/results-by-section/:subjectId", verifyToken, evaluationFormController.getEvaluationResultsBySection);

// Get instructor evaluation results
router.get("/instructor/:instructorId", verifyToken, evaluationFormController.getInstructorEvaluationResults);

module.exports = router;
