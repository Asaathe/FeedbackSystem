// Employment Tracker Controller - Backend controller for Alumni Employment Update Tracker
const employmentTrackerService = require('../services/employmentTrackerService');

/**
 * Get all alumni employment tracker records (admin)
 */
const getAlumniEmploymentTracker = async (req, res) => {
  try {
    const { status, search, page, limit } = req.query;
    
    const result = await employmentTrackerService.getAlumniEmploymentTracker(
      { status, search },
      parseInt(page) || 1,
      parseInt(limit) || 20
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get alumni employment tracker controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      records: []
    });
  }
};

/**
 * Get a single alumni employment record (admin)
 */
const getAlumniEmploymentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await employmentTrackerService.getAlumniEmploymentRecord(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get alumni employment record controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Send employment update request email to an alumni (admin)
 */
const sendUpdateRequestEmail = async (req, res) => {
  try {
    const { alumniUserId } = req.body;

    if (!alumniUserId) {
      return res.status(400).json({
        success: false,
        message: 'Alumni user ID is required'
      });
    }

    const result = await employmentTrackerService.sendUpdateRequestEmail(alumniUserId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Send update request email controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Send bulk update request emails (admin)
 */
const sendBulkUpdateRequestEmails = async (req, res) => {
  try {
    const { alumniUserIds } = req.body;

    if (!alumniUserIds || !Array.isArray(alumniUserIds) || alumniUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of alumni user IDs is required'
      });
    }

    const result = await employmentTrackerService.sendBulkUpdateRequestEmails(alumniUserIds);

    return res.status(200).json({
      success: true,
      message: `Sent ${result.success} emails, ${result.failed} failed`,
      ...result
    });
  } catch (error) {
    console.error('Send bulk update request emails controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update employment tracking status manually (admin)
 */
const updateTrackingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await employmentTrackerService.updateTrackingStatus(id, status);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Update tracking status controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get dashboard statistics (admin)
 */
const getTrackerStatistics = async (req, res) => {
  try {
    const result = await employmentTrackerService.getTrackerStatistics();

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get tracker statistics controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      statistics: {}
    });
  }
};

module.exports = {
  getAlumniEmploymentTracker,
  getAlumniEmploymentRecord,
  sendUpdateRequestEmail,
  sendBulkUpdateRequestEmails,
  updateTrackingStatus,
  getTrackerStatistics
};
