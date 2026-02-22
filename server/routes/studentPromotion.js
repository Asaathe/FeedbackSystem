// Student Promotion Routes
const express = require('express');
const router = express.Router();
const studentPromotionController = require('../controllers/studentPromotionController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

/**
 * All routes require admin authentication
 */
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /api/students/eligible
 * Get students eligible for promotion
 */
router.get('/eligible', studentPromotionController.getEligibleStudents);

/**
 * GET /api/students/programs
 * Get all programs for admin selection
 */
router.get('/programs', studentPromotionController.getAllPrograms);

/**
 * GET /api/students/target-programs/:programId
 * Get target programs for promotion based on current program
 */
router.get('/target-programs/:programId', studentPromotionController.getTargetPrograms);

/**
 * POST /api/students/promote
 * Promote students to new program/year
 */
router.post('/promote', studentPromotionController.promoteStudents);

/**
 * POST /api/students/graduate
 * Graduate students (convert to alumni)
 */
router.post('/graduate', studentPromotionController.graduateStudents);

/**
 * GET /api/students/promotion-history
 * Get promotion history
 */
router.get('/promotion-history', studentPromotionController.getPromotionHistory);

module.exports = router;
