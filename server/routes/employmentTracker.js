// Employment Tracker Routes - API routes for Alumni Employment Update Tracker
const express = require('express');
const router = express.Router();
const employmentTrackerController = require('../controllers/employmentTrackerController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth.verifyToken);

// All routes require admin role
router.use(auth.requireAdmin);

/**
 * GET /api/employment-tracker
 * Get all alumni employment tracker records
 * Query params: status, search, page, limit
 */
router.get('/', employmentTrackerController.getAlumniEmploymentTracker);

/**
 * GET /api/employment-tracker/statistics
 * Get dashboard statistics
 */
router.get('/statistics', employmentTrackerController.getTrackerStatistics);

/**
 * GET /api/employment-tracker/:id
 * Get a single alumni employment record
 */
router.get('/:id', employmentTrackerController.getAlumniEmploymentRecord);

/**
 * POST /api/employment-tracker/send-request
 * Send employment update request email to an alumni
 * Body: { alumniUserId }
 */
router.post('/send-request', employmentTrackerController.sendUpdateRequestEmail);

/**
 * POST /api/employment-tracker/bulk-send
 * Send bulk employment update request emails
 * Body: { alumniUserIds: [] }
 */
router.post('/bulk-send', employmentTrackerController.sendBulkUpdateRequestEmails);

/**
 * PATCH /api/employment-tracker/:id/status
 * Update employment tracking status manually
 * Body: { status }
 */
router.patch('/:id/status', employmentTrackerController.updateTrackingStatus);

module.exports = router;
