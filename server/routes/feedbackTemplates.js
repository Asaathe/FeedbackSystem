// Feedback Template Routes
const express = require('express');
const router = express.Router();
const feedbackTemplateController = require('../controllers/feedbackTemplateController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.verifyToken);

// ============================================
// FEEDBACK TEMPLATE CATEGORIES
// ============================================

// Get all categories (accessible by all authenticated users)
router.get('/categories', feedbackTemplateController.getCategories);

// Add new category (admin only)
router.post('/categories', auth.verifyAdmin, feedbackTemplateController.addCategory);

// Update category (admin only)
router.put('/categories/:id', auth.verifyAdmin, feedbackTemplateController.updateCategory);

// Delete category (admin only)
router.delete('/categories/:id', auth.verifyAdmin, feedbackTemplateController.deleteCategory);

// Reorder categories (admin only)
router.post('/categories/reorder', auth.verifyAdmin, feedbackTemplateController.reorderCategories);

// ============================================
// EVALUATION PERIODS
// ============================================

// Get all evaluation periods (admin only)
router.get('/periods', auth.verifyAdmin, feedbackTemplateController.getEvaluationPeriods);

// Get active evaluation period (for checking if feedback is active)
router.get('/periods/active', feedbackTemplateController.getActiveEvaluationPeriod);

// Create evaluation period (admin only)
router.post('/periods', auth.verifyAdmin, feedbackTemplateController.createEvaluationPeriod);

// Update evaluation period (admin only)
router.put('/periods/:id', auth.verifyAdmin, feedbackTemplateController.updateEvaluationPeriod);

// Delete evaluation period (admin only)
router.delete('/periods/:id', auth.verifyAdmin, feedbackTemplateController.deleteEvaluationPeriod);

// Toggle evaluation period active status (admin only)
router.patch('/periods/:id/toggle', auth.verifyAdmin, feedbackTemplateController.toggleEvaluationPeriod);

// ============================================
// STUDENT FEEDBACK
// ============================================

// Get student's enrolled subjects (for feedback)
router.get('/student/subjects', feedbackTemplateController.getStudentEnrolledSubjects);

// Submit subject feedback
router.post('/subject-feedback', feedbackTemplateController.submitSubjectFeedback);

// Submit instructor feedback
router.post('/instructor-feedback', feedbackTemplateController.submitInstructorFeedback);

// Submit feedback (general endpoint that handles both subject and instructor)
router.post('/submit', feedbackTemplateController.submitFeedback);

// Get student's feedback status
router.get('/student/feedback-status', feedbackTemplateController.getStudentFeedbackStatus);

// ============================================
// ANALYTICS
// ============================================

// Get feedback analytics (admin only)
router.get('/analytics', auth.verifyAdmin, feedbackTemplateController.getFeedbackAnalytics);

module.exports = router;
